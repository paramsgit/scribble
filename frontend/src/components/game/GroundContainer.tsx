import React, { useState } from "react";
import GameHeader from "./Ground/Header/Index";
import DrawingBoard from "./Ground/DrawingBoard";
import { TurnInfo } from "../../pages/Game";

const GroundContainer = ({ turnInfo }: { turnInfo: TurnInfo }) => {
  const [seconds, setSeconds] = useState(turnInfo?.time ?? 0);

  return (
    <div className=" h-[95%]">
      <GameHeader
        wordLength={turnInfo.word_length}
        word={turnInfo.word}
        wordNumber={turnInfo?.word_number}
        seconds={seconds}
        setSeconds={setSeconds}
      />
      <DrawingBoard drawer={turnInfo.drawerId} />
    </div>
  );
};

export default GroundContainer;
