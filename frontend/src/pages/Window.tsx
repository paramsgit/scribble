import React, { useRef, useEffect, useState, useCallback } from "react";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { convertToModelMessages, generateText } from "ai";

import {
  CommandHistoryItem,
  CommandManager,
  DrawLineCommand,
} from "../context/CommandManager";
import { debounce } from "../utils/debounce";
import { debounceDelay, sketchColors } from "../config";
import { cn } from "../utils/cn";
import { useRoom } from "../context/RoomDataContext";
import WaitCard from "../components/game/Ground/WaitCard";
import OpenAI from "openai";
import MessageWindow, { Message } from "./Experiment/MessageWindow";

export interface DrawingBoardProps {
  drawer: string;
  stopTimer: () => void;
}
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
  message?: string;
  scores?: UpdatedScores[];
}

const DrawingBoard = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [lineWidth, setLineWidth] = useState(5);
  const [isEraser, setIsEraser] = useState(false);
  const commandManagerRef = useRef<CommandManager>(new CommandManager());
  const [isUndoBtnDisabled, setIsUndoBtnDisabled] = useState(true);
  const commandArrayRef = useRef<CommandHistoryItem[]>([]);
  const drawCommandHistoryArrayRef = useRef<DrawCommandHistoryItem[]>([]);
  const [waitModalData, setWaitModalData] = useState<WaitModalData | null>(
    null
  );
  const { roomData, setRoomData, updateScores } = useRoom();
  const lastPos = useRef<{ x: number; y: number } | null>(null);
  const [input, setInput] = useState("");
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isNewMessageLoading, setIsNewMessageLoading] =
    useState<boolean>(false);

  //   Testing
  const google = createGoogleGenerativeAI({
    apiKey: "AIzaSyDaJ9bSYuvEbrd_CkpETXY__NF1gDr-Q_I",
  });

  async function drawWordOnCanvas(word: string, width: number) {
    const model = google("gemini-2.5-flash");

    const systemPrompt = `
You are a drawing command generator.
I will give you a word and a canvas width.
Your task is to output JSON containing an array of sequential drawing commands to render that word on the canvas.
Dont write word, try to create drawing of that word
Rules:
- Output only valid JSON with a top-level object containing "commands".
- Each command object must have:
  - "id": a unique identifier string
  - "command": object with x1, y1, x2, y2 (integers), color hex, width stroke
  - "index": sequence number starting from 0
- The drawing should represent the given word letter by letter within the provided canvas width.
- Do not include explanations, only return the JSON.
`;

    const userPrompt = `Word: "${word}"\nWidth: ${width}`;

    const result = await generateText({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0,
    });

    // result.text contains the raw JSON string
    console.log("Gemini Response:", result.text);

    // If you want an object instead of string:
    let commands;
    try {
      commands = JSON.parse(result.text);
    } catch (err) {
      console.error("Invalid JSON:", err);
    }

    return commands;
  }

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
      if (true) {
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
          message: data?.message,
        });
        updateScores(data.players);
      }
    };

    const finishedUpdateHandler = (data) => {
      setWaitModalData((prev) => ({
        ...prev,
        previousWord: undefined,
        message: "Game finished",
      }));
    };

    // +
    // ") => {
    //   newDrawHandler({
    //     commands: [
    //       {
    //         id: "square_line_top_8a3f",
    //         command: {
    //           x1: 100,
    //           y1: 100,
    //           x2: 400,
    //           y2: 100,
    //           color: "#000000",
    //           strokeWidth: 5,
    //         },
    //         index: 0,
    //       },
    //       {
    //         id: "square_line_right_2b9c",
    //         command: {
    //           x1: 400,
    //           y1: 100,
    //           x2: 400,
    //           y2: 400,
    //           color: "#000000",
    //           strokeWidth: 5,
    //         },
    //         index: 1,
    //       },
    //       {
    //         id: "square_line_bottom_7d4e",
    //         command: {
    //           x1: 400,
    //           y1: 400,
    //           x2: 100,
    //           y2: 400,
    //           color: "#000000",
    //           strokeWidth: 5,
    //         },
    //         index: 2,
    //       },
    //       {
    //         id: "square_line_left_1f5g",
    //         command: {
    //           x1: 100,
    //           y1: 400,
    //           x2: 100,
    //           y2: 100,
    //           color: "#000000",
    //           strokeWidth: 5,
    //         },
    //         index: 3,
    //       },
    //     ],
    //     drawer: "",
    //   });
    // }, 5000);
  }, []);

  useEffect(() => {
    const handleMouseUp = () => stopDrawing();
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, []);

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
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent) => {
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
    console.log({ commands });
    // socket.emit("draw-command", { commands });
    // const drawCommandHistoryArray = drawCommandHistoryArrayRef.current;
    // let startIndex = 0;
    // if (drawCommandHistoryArray?.length) {
    //   startIndex =
    //     1 +
    //     (drawCommandHistoryArray[drawCommandHistoryArray?.length - 1]
    //       ?.lastIndex ?? 0); //TODO, Maybe need to fix type
    // }
    // const lastIndex = commands[commands.length - 1]?.index;
    // drawCommandHistoryArray.push({
    //   commands,
    //   startIndex,
    //   lastIndex,
    // });
    // setIsUndoBtnDisabled(drawCommandHistoryArrayRef.current.length == 0); //will be true

    // commandArrayRef.current.length = 0;
  }, debounceDelay);

  const stopDrawing = () => {
    setIsDrawing(false);
    // debouncedSend();
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

  const sendCanvasImage = async () => {
    if (!canvasRef.current) return;

    // Create a temporary canvas with white background to ensure proper capture
    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");
    const originalCanvas = canvasRef.current;

    if (!tempCtx) return;

    // Set the same dimensions
    tempCanvas.width = originalCanvas.width;
    tempCanvas.height = originalCanvas.height;

    // Fill with white background first
    tempCtx.fillStyle = "#ffffff";
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    // Draw the original canvas content on top
    tempCtx.drawImage(originalCanvas, 0, 0);

    // Convert to Blob with proper white background
    tempCanvas.toBlob(async (blob) => {
      if (!blob) return;

      // Send to API
      const formData = new FormData();
      formData.append("image", blob, "canvas.png");

      try {
        setIsNewMessageLoading(true);
        const res = await fetch("http://localhost:5000/api/guess", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        setIsNewMessageLoading(false);
        console.log("Server response:", data);
        if (data?.message) {
          setMessages((prev) => [...prev, data]);
        }
      } catch (err) {
        console.error("Upload failed:", err);
      }
    }, "image/png");
  };

  const debouncedSend = useCallback(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      sendCanvasImage();
    }, 2000);
  }, []);

  return (
    <div className="flex flex-col h-full w-full relative pb-2 bg-white">
      <input
        value={input}
        onChange={(e) => {
          setInput(e.target.value);
        }}
        className="border p-4 text-black font-semibold"
      />

      <canvas
        ref={canvasRef}
        className="flex-1 bg-white  border-gray-300 w-2/3"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        // onMouseOut={stopDrawing}
      />

      <button
        className="bg-gray-200 p-2 rounded-lg text-black w-24  absolute right-4 top-20"
        onClick={clearCanvas}
      >
        Clear
      </button>
      {(messages?.length || isNewMessageLoading) && (
        <MessageWindow messages={messages} isLoading={isNewMessageLoading} />
      )}
    </div>
  );
};

export default DrawingBoard;
