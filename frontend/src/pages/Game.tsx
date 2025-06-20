import React, { useEffect, useState } from "react";
import GameLayout from "../components/game/GameLayout";
import { PlayersVisibilityProvider } from "../context/PlayersVisibilityContext";
import TogglePlayersButton from "../components/game/TogglePlayerContainer";
import Players from "../components/game/Players";
import ChatContainer from "../components/game/ChatContainer";
import SocketManager from "../utils/socket";
import GroundContainer from "../components/game/GroundContainer";
const Game = ({ roomData }) => {
  const socket = SocketManager.getInstance();
  const [turnInfo, setTurnInfo] = useState({ drawerId: "", word: "" });
  useEffect(() => {
    const wordHandler = (data) => {
      console.log("got a message:", data);
      setTurnInfo({ drawerId: data.drawer, word: data.word });
    };
    socket.on("word-update", wordHandler);
    return () => {
      socket.off("word-update", wordHandler);
    };
  }, []);

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
        playersContent={
          <Players drawer={turnInfo.drawerId} data={roomData?.players} />
        }
        groundContent={<GroundContainer />}
        messagesContent={<ChatContainer getPlayerDetails={getPlayerDetails} />}
        groundClassName="p-4 lg:pr-2"
        playersClassName="p-4 pr-2 lg:pr-4 lg:pb-2"
        messagesClassName="p-4 pl-2 lg:pl-4 lg:pt-2"
      />
    </PlayersVisibilityProvider>
  );
};

export default Game;
