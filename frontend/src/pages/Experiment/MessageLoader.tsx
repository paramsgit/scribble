import React from "react";
import { cn } from "../../utils/cn";

const MessageLoader = () => {
  return (
    <div>
      <div
        className={cn(
          " rounded-md px-3 py-2 text-sm leading-relaxed",
          "bg-gray-50 text-foreground border border-border flex items-center"
        )}
        role="status"
      >
        <div className="flex space-x-2 items-center">
          <div className="w-2 h-2 bg-gray-400 rounded-full custom-bounce"></div>
          <div
            className="w-2 h-2 bg-gray-400 rounded-full custom-bounce"
            style={{ animationDelay: "0.2s" }}
          ></div>
          <div
            className="w-2 h-2 bg-gray-400 rounded-full custom-bounce"
            style={{ animationDelay: "0.4s" }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default MessageLoader;
