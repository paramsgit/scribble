import React, { useEffect, useState } from "react";
import NetworkLogo from "../../../../assets/NetworkLogo";
import { cn } from "../../../../utils/cn";
import TimerLogo from "../../../../assets/TimerLogo";
import UnderScoreLogo from "../../../../assets/UnderScoreLogo";
import RenderEmptyWord from "./RenderEmptyWord";
import { gameTime } from "../../../../config";

interface GameHeaderProps {
  wordLength: number;
  wordNumber: number | undefined;
  word: string | undefined;
  seconds: number | undefined;
  setSeconds: React.Dispatch<React.SetStateAction<number>>;
}

const GameHeader = ({
  wordLength,
  wordNumber,
  word,
  seconds = 0,
  setSeconds,
}: GameHeaderProps) => {
  const formatTime = (totalSeconds: number) => {
    const mins = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const secs = String(totalSeconds % 60).padStart(2, "0");
    return `${mins}:${secs}`;
  };

  useEffect(() => {
    if (wordLength) {
      setSeconds(gameTime);
      const interval = setInterval(() => {
        setSeconds((prev) => Math.max(prev - 1, 0));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [wordNumber]);

  return (
    <div className="w-full bg-gray-100 text-black py-2 px-4 flex items-center justify-between relative">
      <div className="flex items-center space-x-3">
        <span className="text-lg hidden sm:inline">
          <TimerLogo className={"w-8 text-gray-100!"} />
        </span>

        <span className="text-sm">{formatTime(seconds)}</span>
      </div>

      <div className="absolute left-1/2 transform -translate-x-1/2 text-base font-semibold whitespace-nowrap flex ">
        <RenderEmptyWord length={wordLength} word={word} />
      </div>

      <div className="text-lg hidden ">
        <NetworkLogo classNames={cn("w-8")} />
      </div>
    </div>
  );
};

export default GameHeader;
