import React, { useEffect } from "react";
import SocketManager from "../../utils/socket";
import { cn } from "../../utils/cn";

interface Message {
  id?: number;
  message: string;
  isCorrect?: boolean;
  timeStamp?: Date;
  player?: string;
}

const ChatContainer = ({ players }) => {
  const socket = SocketManager.getInstance();
  const playersRef = React.useRef(players);
  const [messages, setMessages] = React.useState<Message[]>([]);

  useEffect(() => {
    const messageHandler = (data: Message) => {
      console.log("got a message:", data);
      handleNewMessage(data);
    };
    socket.on("message", messageHandler);
    return () => {
      socket.off("message", messageHandler);
    };
  }, []);

  useEffect(() => {
    playersRef.current = players;
  }, [players]);

  const getPlayerDetails = (socketId: string | undefined) => {
    if (!playersRef.current) return null;
    console.log("players", playersRef.current);
    return playersRef.current.find((player) => player.id === socketId);
  };

  const handleNewMessage = (data: Message) => {
    const player = getPlayerDetails(data.player);
    setMessages((mess) => {
      const newMessage: Message = {
        id: mess.length + 1,
        message: data.message,
        isCorrect: data?.isCorrect ?? false,
        timeStamp: new Date(),
        player: player?.name ?? "Player",
      };
      return [...mess, newMessage];
    });
  };
  return (
    <div className="bg-white h-full rounded-lg">
      <ChatComponent socket={socket} messages={messages} />
    </div>
  );
};

export default ChatContainer;

const ChatComponent = ({ socket, messages }) => {
  const [inputText, setInputText] = React.useState("");

  const handleSendMessage = () => {
    if (inputText.trim() === "") return;
    socket.emit("guess", {
      message: inputText,
    });
    setInputText("");
  };

  return (
    <div className="flex flex-col h-full ">
      {/* Message List */}
      <div className="flex-1 overflow-y-auto py-2 ">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        {messages?.length === 0 && (
          <ChatMessage
            key={"message.id"}
            message={{ message: "Chat messages will appear here" }}
          />
        )}
      </div>

      {/* Input Area */}
      <div className="p-2 border-t border-gray-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center space-x-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 p-2 bg-gray-200/70 text-black placeholder-gray-600 rounded-lg focus:outline-none focus:ring-0"
            placeholder="Type a message..."
          />
        </form>
      </div>
    </div>
  );
};

const ChatMessage = ({ message }) => {
  return (
    <div className={`flex`}>
      <div
        className={cn(
          `w-full flex gap-2 py-2 px-2 bg-gray-100 text-gray-800 `,
          message.id % 2 && "bg-gray-200",
          message.isCorrect && "font-bold text-green-500"
        )}
      >
        <span>{message.player}: </span>
        <span>{message.message}</span>
      </div>
    </div>
  );
};
