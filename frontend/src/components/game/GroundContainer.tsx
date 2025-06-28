import React from "react";
import GameHeader from "./Ground/GameHeader";
import DrawingBoard from "./Ground/DrawingBoard";
import { TurnInfo } from "../../pages/Game";

const GroundContainer = ({ turnInfo }: { turnInfo: TurnInfo }) => {
  return (
    <div className=" h-[95%]">
      <GameHeader word={turnInfo.word} />
      <DrawingBoard drawer={turnInfo.drawerId} />
    </div>
  );
};

export default GroundContainer;
