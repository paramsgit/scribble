import React, { useEffect, useState } from "react";
import SocketManager from "../../utils/socket";
import { cn } from "../../utils/cn";

interface Message {
  id?: number;
  message: string;
  isCorrect?: boolean;
  timeStamp?: Date;
  senderName?: string;
}

const ChatContainer = () => {
  const socket = SocketManager.getInstance();
  const [messages, setMessages] = React.useState<Message[]>([
    {
      id: 1,
      message: "Hello! How can I help you?",
      isCorrect: false,
      timeStamp: new Date(),
    },
  ]);
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
  const handleNewMessage = (data: Message) => {
    setMessages((mess) => {
      const newMessage: Message = {
        id: mess.length + 1,
        message: data.message,
        isCorrect: data?.isCorrect ?? false,
        timeStamp: new Date(),
        senderName: "Rohan",
      };
      return [...mess, newMessage];
    });
  };
  return (
    <div className="bg-neutral-900 h-full">
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
    <div className="flex flex-col h-full max-w-md mx-auto ">
      {/* Message List */}
      <div className="flex-1 overflow-y-auto py-2 ">
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            isSent={message.isSent}
          />
        ))}
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
            className="flex-1 p-2 bg-neutral-800 rounded-lg focus:outline-none focus:ring-0"
            placeholder="Type a message..."
          />
        </form>
      </div>
    </div>
  );
};

const ChatMessage = ({ message, isSent }) => {
  return (
    <div className={`flex`}>
      <div
        className={cn(
          `w-full py-2 px-2 text-gray-200 `,
          message.id % 2 && "bg-zinc-800"
        )}
      >
        <p>{message.message}</p>
      </div>
    </div>
  );
};
