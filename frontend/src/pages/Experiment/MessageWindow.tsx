import React, { useEffect, useRef } from "react";
import MessageLoader from "./MessageLoader";

export interface Message {
  message: string;
}

interface MessageWindowProps {
  messages: Message[];
  isLoading?: boolean;
}

const MessageWindow: React.FC<MessageWindowProps> = ({
  messages,
  isLoading,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return (
    <div className="fixed bottom-4 right-4 w-100 max-h-64 overflow-y-auto rounded-xl shadow-lg border border-gray-200 p-3 text-sm bg-gray-300 ">
      <ul className="flex flex-col gap-2">
        {messages.map((msg, idx) => (
          <li className="p-2 rounded-md bg-gray-50 text-gray-800" key={idx}>
            {msg.message}
          </li>
        ))}
        {isLoading && <MessageLoader />}
      </ul>
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageWindow;
