import React, { useEffect, useState } from "react";
import GameLayout from "../components/game/GameLayout";
import { PlayersVisibilityProvider } from "../context/PlayersVisibilityContext";
import TogglePlayersButton from "../components/game/TogglePlayerContainer";
import Players from "../components/game/Players";
import ChatContainer from "../components/game/ChatContainer";
const Game = ({ roomData }) => {
  useEffect(() => {
    console.log(roomData);
  }, [roomData]);

  const getPlayerDetails = (socketId: string) => {
    const players = roomData?.players;
    if (!players) {
      return null;
    }
    const player = players?.find((player) => player.id === socketId);
    return player;
  };

  return (
    <PlayersVisibilityProvider>
      <GameLayout
        playersContent={<Players data={roomData?.players} />}
        groundContent={<div>main</div>}
        messagesContent={<ChatContainer getPlayerDetails={getPlayerDetails} />}
        playersClassName=""
        groundClassName="p-8"
        messagesClassName="p-4"
      />
    </PlayersVisibilityProvider>
  );
};

export default Game;
