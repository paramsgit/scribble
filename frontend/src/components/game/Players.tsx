import React from "react";
import { cn } from "../../utils/cn";
import { PencilSvg } from "../../config";

const Players = ({ data, drawer }) => {
  return (
    <div className="bg-neutral-900 p-2 overflow-hidden h-full">
      <div className="overflow-y-auto h-full flex flex-col ">
        {data?.map((item, index) => {
          return (
            <PlayerTile
              key={`${item.name}+${index}`}
              name={item?.name}
              score={item?.score}
              isDrawing={drawer === item.id}
              isCurrentPlayer={true}
            />
          );
        })}
      </div>
    </div>
  );
};

export default Players;

const PlayerTile = ({ name, score, isCurrentPlayer, isDrawing }) => {
  return (
    <div
      className={cn(
        "flex items-center justify-between w-full px-4 py-2 shadow-md",
        ""
      )}
    >
      <div className="w-10 h-10 rounded-full bg-blue-600 dark:bg-blue-500 text-white font-semibold flex items-center justify-center">
        {name.charAt(0).toUpperCase()}
      </div>

      <div className="ml-4 flex-1 overflow-hidden">
        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
          {name}
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-400">
          Score: <span className="font-semibold">{score}</span>
        </div>
      </div>

      {isDrawing && <img className="w-7" src={PencilSvg} alt="Pencil" />}

      {isCurrentPlayer && (
        <span className="ml-2 text-[10px] px-2 py-0.5 bg-green-100 dark:bg-green-700 text-green-800 dark:text-green-200 rounded-full font-semibold">
          YOU
        </span>
      )}
    </div>
  );
};
