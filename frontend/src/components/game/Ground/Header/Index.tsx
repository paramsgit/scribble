import React, { useEffect, useState } from "react";
import NetworkLogo from "../../../../assets/NetworkLogo";
import { cn } from "../../../../utils/cn";
import TimerLogo from "../../../../assets/TimerLogo";
import UnderScoreLogo from "../../../../assets/UnderScoreLogo";
import RenderEmptyWord from "./RenderEmptyWord";

const GameHeader = ({ wordLength, word, time = 0 }) => {
  const [seconds, setSeconds] = useState(time);

  const formatTime = (totalSeconds) => {
    const mins = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const secs = String(totalSeconds % 60).padStart(2, "0");
    return `${mins}:${secs}`;
  };

  useEffect(() => {
    if (wordLength) {
      setSeconds(10);
      const interval = setInterval(() => {
        setSeconds((prev) => Math.max(prev - 1, 0));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [wordLength]);

  return (
    <div className="w-full bg-zinc-900 text-white py-2 px-4 flex items-center justify-between relative">
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
