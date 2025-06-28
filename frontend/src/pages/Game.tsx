import React, { useEffect, useState } from "react";
import GameLayout from "../components/game/GameLayout";
import { PlayersVisibilityProvider } from "../context/PlayersVisibilityContext";
import TogglePlayersButton from "../components/game/TogglePlayerContainer";
import Players from "../components/game/Players";
import ChatContainer from "../components/game/ChatContainer";
import SocketManager from "../utils/socket";
import GroundContainer from "../components/game/GroundContainer";
export interface TurnInfo {
  drawerId: string;
  word?: string;
  word_length: number;
}

const Game = ({ roomData }) => {
  const socket = SocketManager.getInstance();
  const [turnInfo, setTurnInfo] = useState<TurnInfo>({
    drawerId: "",
    word_length: 0,
  });
  useEffect(() => {
    const wordHandler = (data) => {
      setTurnInfo({ drawerId: data.drawer, word_length: data.word_length });
    };
    const correctGuessHandler = (data) => {
      setTurnInfo((prev) => ({ ...prev, word: data.word }));
    };
    socket.on("word-update", wordHandler);
    socket.on("correct-guess", correctGuessHandler);
    return () => {
      socket.off("word-update", wordHandler);
      socket.off("correct-guess", correctGuessHandler);
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
        groundContent={<GroundContainer turnInfo={turnInfo} />}
        messagesContent={<ChatContainer getPlayerDetails={getPlayerDetails} />}
        groundClassName="p-4 lg:pr-2"
        playersClassName="p-4 pr-2 lg:pr-4 lg:pb-2"
        messagesClassName="p-4 pl-2 lg:pl-4 lg:pt-2"
      />
    </PlayersVisibilityProvider>
  );
};

export default Game;
