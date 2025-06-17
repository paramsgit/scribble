import React from "react";

const ChatContainer = () => {
  return (
    <div className="bg-neutral-900">
      <ChatComponent />
    </div>
  );
};

export default ChatContainer;

const ChatMessage = ({ message, isSent }) => {
  return (
    <div className={`flex ${isSent ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-xs md:max-w-md lg:max-w-lg p-1 rounded-lg ${
          isSent ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800"
        }`}
      >
        <p>{message.text}</p>
      </div>
    </div>
  );
};

const ChatComponent = () => {
  const [messages, setMessages] = React.useState([
    {
      id: 1,
      text: "Hello! How can I help you?",
      isSent: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = React.useState("");

  const handleSendMessage = () => {
    if (inputText.trim() === "") return;

    const newMessage = {
      id: messages.length + 1,
      text: inputText,
      isSent: true,
      timestamp: new Date(),
    };

    setMessages([...messages, newMessage]);
    setInputText("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col  max-w-md mx-auto ">
      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            isSent={message.isSent}
          />
        ))}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 p-2 border bg-neutral-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Type a message..."
          />
          <button
            onClick={handleSendMessage}
            className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};
