import React from "react";
import { cn } from "../../utils/cn";
import { PencilSvg } from "../../config";
import SocketManager from "../../utils/socket";
import { Player } from "../../context/RoomDataContext";
import { getAvatarUrl } from "../../utils/helper";

interface PlayersSectionProps {
  data: Player[];
  drawer: string;
}

const Players: React.FC<PlayersSectionProps> = ({ data, drawer }) => {
  const socket = SocketManager.getInstance();
  return (
    <div className="bg-white p-2 overflow-hidden h-full">
      <div className="overflow-y-auto h-full flex flex-col ">
        {data?.map((item, index) => {
          return (
            <PlayerTile
              key={`${item.name}+${index}`}
              name={item?.name}
              avatarVariant={item?.avatarVariant}
              score={item?.score ?? 0}
              isDrawing={drawer === item.id}
              isCurrentPlayer={socket.id === item.id}
            />
          );
        })}
      </div>
    </div>
  );
};

export default Players;

interface PlayerTileProps {
  name: string;
  avatarVariant?: number;
  score: number;
  isCurrentPlayer: boolean;
  isDrawing: boolean;
}

const PlayerTile: React.FC<PlayerTileProps> = ({
  name,
  avatarVariant,
  score,
  isCurrentPlayer,
  isDrawing,
}) => {
  return (
    <div
      className={cn(
        "flex items-center justify-between w-full px-4 py-2 bg-gray-100 rounded-lg shadow-md",
        ""
      )}
    >
      <div className="w-8 h-8 rounded-full text-white font-semibold flex items-center justify-center">
        <img
          className="w-8 h-8"
          src={getAvatarUrl({ name, variant: avatarVariant })}
          alt="player_icon"
        />
      </div>

      <div className="ml-4 text-center overflow-hidden">
        <div className="text-md font-semibold text-gray-900 truncate flex items-center gap-1">
          {name}
          {isCurrentPlayer && (
            <span className="font-semibold text-sm text-neutral-500">
              {" "}
              (You)
            </span>
          )}
          <img
            className={cn("w-6", isDrawing ? "block" : "hidden")}
            src={PencilSvg}
            alt="Pencil"
          />
        </div>
      </div>
      <div className="text-xs text-gray-600  flex items-center">
        Score: <span className="font-semibold text-lg">{score}</span>
      </div>
    </div>
  );
};
