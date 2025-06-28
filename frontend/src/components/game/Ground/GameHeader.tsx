import React, { useEffect, useState } from "react";
import NetworkLogo from "../../../assets/NetworkLogo";
import { cn } from "../../../utils/cn";
import TimerLogo from "../../../assets/TimerLogo";
import UnderScoreLogo from "../../../assets/UnderScoreLogo";

const GameHeader = ({ word }) => {
  const [seconds, setSeconds] = useState(0);

  const formatTime = (totalSeconds) => {
    const mins = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const secs = String(totalSeconds % 60).padStart(2, "0");
    return `${mins}:${secs}`;
  };

  useEffect(() => {
    if (word) {
      setSeconds(5);
      const interval = setInterval(() => {
        setSeconds((prev) => Math.max(prev - 1, 0));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [word]);

  return (
    <div className="w-full bg-zinc-900 text-white py-2 px-4 flex items-center justify-between relative">
      <div className="flex items-center space-x-3">
        <span className="text-lg hidden sm:inline">
          <TimerLogo className={"w-8 text-gray-100!"} />
        </span>

        <span className="text-sm">{formatTime(seconds)}</span>
      </div>

      <div className="absolute left-1/2 transform -translate-x-1/2 text-base font-semibold whitespace-nowrap flex ">
        <RenderEmptyWord word={word} />
      </div>

      <div className="text-lg hidden ">
        <NetworkLogo classNames={cn("w-8")} />
      </div>
    </div>
  );
};

const RenderEmptyWord = ({ word }) => {
  return (
    <div className="flex">
      {word
        .split("")
        .map((char, index) =>
          char === " " ? (
            <div key={index} className="w-6" />
          ) : (
            <UnderScoreLogo key={index} className={"w-6"} />
          )
        )}
    </div>
  );
};

export default GameHeader;
