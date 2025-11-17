import React from "react";
import { cn } from "../../utils/cn";
import { usePlayersVisibility } from "../../context/PlayersVisibilityContext";

interface GameLayoutProps {
  playersContent?: React.ReactNode;
  groundContent?: React.ReactNode;
  messagesContent?: React.ReactNode;
  playersClassName?: string;
  groundClassName?: string;
  messagesClassName?: string;
}

const GameLayout: React.FC<GameLayoutProps> = ({
  playersContent,
  groundContent,
  messagesContent,
  playersClassName,
  groundClassName,
  messagesClassName,
}) => {
  const { isPlayersHidden } = usePlayersVisibility();

  return (
    <div className="flex flex-col lg:flex-row w-full h-screen">
      {/* Ground */}
      <div className={cn(" w-full lg:w-2/3 h-1/2 lg:h-full", groundClassName)}>
        {groundContent}
      </div>

      {/* Side Panel */}
      <div className="flex lg:flex-col w-full lg:w-1/3 h-1/2 lg:h-full">
        {/* Players */}
        <div
          className={cn(
            " transition-all duration-300 overflow-hidden",
            isPlayersHidden ? "w-0 p-0 h-0" : "w-full h-full",
            playersClassName
          )}
        >
          {!isPlayersHidden && playersContent}
        </div>

        {/* Messages */}
        <div className={cn(" w-full h-full ", messagesClassName)}>
          {messagesContent}
        </div>
      </div>
    </div>
  );
};

export default GameLayout;
