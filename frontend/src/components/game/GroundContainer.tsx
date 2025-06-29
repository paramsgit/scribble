import React from "react";
import GameHeader from "./Ground/Header/Index";
import DrawingBoard from "./Ground/DrawingBoard";
import { TurnInfo } from "../../pages/Game";

const GroundContainer = ({ turnInfo }: { turnInfo: TurnInfo }) => {
  return (
    <div className=" h-[95%]">
      <GameHeader
        wordLength={turnInfo.word_length}
        word={turnInfo.word}
        time={turnInfo?.time}
      />
      <DrawingBoard drawer={turnInfo.drawerId} />
    </div>
  );
};

export default GroundContainer;
