import React, { useRef, useState } from "react";
import GameHeader, { GameTimerRef } from "./Ground/Header/Index";
import DrawingBoard from "./Ground/DrawingBoard";
import { TurnInfo } from "../../pages/Game";

const GroundContainer = ({ turnInfo }: { turnInfo: TurnInfo }) => {
  const timerRef = useRef<GameTimerRef>(null);
  const handleStopTimer = () => {
    timerRef.current?.stopTimer();
  };
  return (
    <div className=" h-[95%]">
      <GameHeader
        wordLength={turnInfo.word_length}
        word={turnInfo.word}
        wordNumber={turnInfo?.word_number}
        time={turnInfo.time ?? 0}
        ref={timerRef}
      />
      <DrawingBoard stopTimer={handleStopTimer} drawer={turnInfo.drawerId} />
    </div>
  );
};

export default GroundContainer;
