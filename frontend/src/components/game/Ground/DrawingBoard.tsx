import React, { useRef, useEffect, useState } from "react";
import {
  CommandHistoryItem,
  CommandManager,
  DrawLineCommand,
} from "../../../context/CommandManager";
import SocketManager from "../../../utils/socket";
import { debounce } from "../../../utils/debounce";
import { debounceDelay, sketchColors } from "../../../config";
import { cn } from "../../../utils/cn";
import WaitCard from "./WaitCard";
import { useRoom } from "../../../context/RoomDataContext";
interface DrawCommandHistoryItem {
  commands: CommandHistoryItem[];
  startIndex: number;
  lastIndex: number | undefined;
}
export interface UpdatedScores {
  name: string;
  value: number;
  id: string;
}
interface WaitModalData {
  waitTime?: number;
  previousWord?: string;
  scores?: UpdatedScores[];
}

const DrawingBoard = ({ drawer }: { drawer: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [lineWidth, setLineWidth] = useState(5);
  const [isEraser, setIsEraser] = useState(false);
  const commandManagerRef = useRef<CommandManager>(new CommandManager());
  const socket = SocketManager.getInstance();
  const [isUndoBtnDisabled, setIsUndoBtnDisabled] = useState(true);
  const commandArrayRef = useRef<CommandHistoryItem[]>([]);
  const drawCommandHistoryArrayRef = useRef<DrawCommandHistoryItem[]>([]);
  const [waitModalData, setWaitModalData] = useState<WaitModalData | null>(
    null
  );
  const { roomData, setRoomData, updateScores } = useRoom();
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    if (context) {
      context.lineCap = "round";
      context.lineJoin = "round";
    }

    return () => window.removeEventListener("resize", resizeCanvas);
  }, []);

  // Get draw events and draw
  useEffect(() => {
    const newDrawHandler = ({
      commands,
      drawer,
    }: {
      commands: any;
      drawer: string;
    }) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const context = canvas.getContext("2d");
      if (!context) return;
      if (drawer != socket.id) {
        commands?.forEach((item: any) => {
          const commandArray: [number, number, number, number, string, number] =
            [
              item.command.x1,
              item.command.y1,
              item.command.x2,
              item.command.y2,
              item.command.color,
              item.command.width,
            ];
          const cmd = new DrawLineCommand(...commandArray);
          cmd.execute(context);
        });
      }
    };
    const waitUpdateHandler = (data) => {
      setWaitModalData(data);

      if (data?.players) {
        const newScores = calculateScoreDifferences(
          roomData?.players,
          data.players
        );
        setWaitModalData({
          waitTime: data.waitTime,
          previousWord: data.previousWord,
          scores: newScores,
        });
        updateScores(data.players);
      }
    };

    socket.on("wait-update", waitUpdateHandler);
    socket.on("draw-command", newDrawHandler);
    return () => {
      socket.off("message", newDrawHandler);
    };
  }, []);

  useEffect(() => {
    const handleMouseUp = () => stopDrawing();
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, []);

  useEffect(() => {
    clearCanvas();
    setWaitModalData(null);
  }, [drawer]);

  function calculateScoreDifferences(currentData, newData) {
    const map1 = new Map();

    currentData.forEach((user) => {
      map1.set(user.id, user.score || 0);
    });

    const result = newData.map((user) => {
      const score1 = map1.get(user.id) || 0;
      const score2 = user.score || 0;
      return {
        id: user.id,
        name: user.name,
        value: score2 - score1,
      };
    });

    return result;
  }

  const getCanvasPos = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    return {
      x: e.clientX - canvas.offsetLeft - 16,
      y: e.clientY - canvas.offsetTop - 64,
    };
  };

  const startDrawing = (e: React.MouseEvent) => {
    console.log(drawer, socket.id);
    if (drawer !== socket.id) return;
    const pos = getCanvasPos(e);
    lastPos.current = pos;
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing || !lastPos.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const currentPos = getCanvasPos(e);

    const command = new DrawLineCommand(
      lastPos.current.x,
      lastPos.current.y,
      currentPos.x,
      currentPos.y,
      isEraser ? "#ffffff" : color,
      lineWidth
    );

    const newCommand = commandManagerRef.current.executeCommand(
      command,
      context
    );
    lastPos.current = currentPos;
    commandArrayRef.current.push(newCommand);
    EmitWithDebounce(commandArrayRef.current);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
  };

  const EmitWithDebounce = debounce((commands: CommandHistoryItem[]) => {
    socket.emit("draw-command", { commands });
    const drawCommandHistoryArray = drawCommandHistoryArrayRef.current;
    let startIndex = 0;
    if (drawCommandHistoryArray?.length) {
      startIndex =
        1 +
        (drawCommandHistoryArray[drawCommandHistoryArray?.length - 1]
          ?.lastIndex ?? 0); //TODO, Maybe need to fix type
    }
    const lastIndex = commands[commands.length - 1]?.index;
    drawCommandHistoryArray.push({
      commands,
      startIndex,
      lastIndex,
    });
    setIsUndoBtnDisabled(drawCommandHistoryArrayRef.current.length == 0); //will be true

    commandArrayRef.current.length = 0;
  }, debounceDelay);

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPos.current = null;
  };

  const undoLast = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;
    const lastCommands = drawCommandHistoryArrayRef.current.pop();
    setIsUndoBtnDisabled(drawCommandHistoryArrayRef.current.length == 0);

    if (lastCommands) {
      if (!lastCommands.lastIndex) {
        return;
      }
      commandManagerRef.current.undoRange(
        lastCommands.startIndex,
        lastCommands.lastIndex,
        context
      );
    }
  };

  return (
    <div className="flex flex-col h-full w-full relative pb-2">
      {waitModalData && (
        <WaitCard
          waitTime={waitModalData.waitTime}
          previousWord={waitModalData.previousWord}
          scores={waitModalData.scores}
          drawer={drawer}
        />
      )}
      <canvas
        ref={canvasRef}
        className="flex-1 bg-white border border-gray-300 "
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        // onMouseOut={stopDrawing}
      />

      {drawer === socket.id ? (
        <div className="flex items-center justify-between p-2 bg-gray-200 text-black border-t border-gray-300 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <label className="text-sm ">Color:</label>
            <input
              type="color"
              value={color}
              onChange={(e) => {
                setColor(e.target.value);
                setIsEraser(false);
              }}
              className="w-8 h-8 md:hidden"
            />
            {sketchColors.map((col) => (
              <div
                key={col}
                className={`w-8 h-8 hidden md:block rounded-md cursor-pointer border-2 ${
                  col === color ? "border-black w-9 h-9" : "border-gray-300"
                }`}
                style={{ backgroundColor: col }}
                onClick={() => {
                  console.log(col);
                  setColor(col);
                }}
              />
            ))}
          </div>

          <div className="space-x-2">
            <button
              onClick={() => undoLast()}
              className={cn(
                `px-3 py-1 rounded text-sm font-medium bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-gray-100`,
                isUndoBtnDisabled && "disabled"
              )}
            >
              Undo
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center p-2 bg-gray-200 text-black ">
          <h1 className="h-9">Skribble</h1>
        </div>
      )}
    </div>
  );
};

export default DrawingBoard;
