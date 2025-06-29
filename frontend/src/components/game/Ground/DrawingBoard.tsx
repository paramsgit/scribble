import React, { useRef, useEffect, useState } from "react";
import {
  CommandManager,
  DrawLineCommand,
} from "../../../context/CommandManager";
import SocketManager from "../../../utils/socket";
import { debounce } from "../../../utils/debounce";
import { debounceDelay } from "../../../config";
const DrawingBoard = ({ drawer }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#ffffff");
  const [lineWidth, setLineWidth] = useState(5);
  const [isEraser, setIsEraser] = useState(false);
  const commandManagerRef = useRef<CommandManager>(new CommandManager());
  const socket = SocketManager.getInstance();
  let commandArray: DrawLineCommand[] = [];

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
        commands?.forEach((command) => {
          const commandArray: [number, number, number, number, string, number] =
            [
              command.x1,
              command.y1,
              command.x2,
              command.y2,
              command.color,
              command.width,
            ];
          const cmd = new DrawLineCommand(...commandArray);
          cmd.execute(context);
        });
      }
    };

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
  }, [drawer]);

  const getCanvasPos = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    return {
      x: e.clientX - canvas.offsetLeft,
      y: e.clientY - canvas.offsetTop,
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

    commandManagerRef.current.executeCommand(command, context);
    lastPos.current = currentPos;

    // socket.emit("draw-command", { commands: [command] });
    commandArray.push(command);
    EmitWithDebounce(commandArray);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.clearRect(0, 0, canvas.width, canvas.height);
  };

  const EmitWithDebounce = debounce((commands) => {
    socket.emit("draw-command", { commands });
    commandArray = [];
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
    console.log("undoing");
    commandManagerRef.current.undoLast(context);
  };

  return (
    <div className="flex flex-col h-full w-full bg-gray-100 dark:bg-white">
      <canvas
        ref={canvasRef}
        className="flex-1 bg-white dark:bg-neutral-900 border border-gray-300 dark:border-gray-700"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        // onMouseOut={stopDrawing}
      />

      <div className="flex items-center justify-between p-2 bg-gray-200 dark:bg-neutral-800 border-t border-gray-300 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-900 dark:text-gray-100">
            Color:
          </label>
          <input
            type="color"
            value={color}
            onChange={(e) => {
              setColor(e.target.value);
              setIsEraser(false);
            }}
            className="w-8 h-8"
          />
        </div>

        <div className="space-x-2">
          <button
            onClick={() => undoLast()}
            className={`px-3 py-1 rounded text-sm font-medium ${
              isEraser
                ? "bg-red-500 text-white"
                : "bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-gray-100"
            }`}
          >
            Undo
          </button>
          <button
            onClick={() => setIsEraser(!isEraser)}
            className={`px-3 py-1 rounded text-sm font-medium ${
              isEraser
                ? "bg-red-500 text-white"
                : "bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-gray-100"
            }`}
          >
            {isEraser ? "Drawing" : "Eraser"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DrawingBoard;
