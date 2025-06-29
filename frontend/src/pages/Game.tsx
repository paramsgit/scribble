import React, { useCallback, useEffect, useState } from "react";
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
  time?: number;
  word_length: number;
  word_number?: number;
}

const Game = ({ roomData }) => {
  const socket = SocketManager.getInstance();
  const [turnInfo, setTurnInfo] = useState<TurnInfo>({
    drawerId: "",
    word_length: 0,
    time: 0,
    word_number: 0,
  });

  useEffect(() => {
    const wordHandler = (data) => {
      setTurnInfo({
        drawerId: data.drawer,
        word_length: data.word_length,
        word_number: data?.word_number,
      });
    };
    const correctGuessHandler = (data) => {
      setTurnInfo((prev) => ({ ...prev, word: data.word }));
    };
    const receivedWord = (data) => {
      setTurnInfo((prev) => ({ ...prev, word: data.word }));
    };
    const updateCurrentGameDetails = (data) => {
      console.log("get details", data);
      setTurnInfo(data);
    };
    socket.on("word-update", wordHandler);
    socket.on("draw-word", receivedWord);
    socket.on("game-details", updateCurrentGameDetails);
    socket.on("correct-guess", correctGuessHandler);
    return () => {
      socket.off("word-update", wordHandler);
      socket.off("correct-guess", correctGuessHandler);
      socket.off("game-details", updateCurrentGameDetails);
    };
  }, []);

  return (
    <PlayersVisibilityProvider>
      <GameLayout
        playersContent={
          <Players drawer={turnInfo.drawerId} data={roomData?.players} />
        }
        groundContent={<GroundContainer turnInfo={turnInfo} />}
        messagesContent={<ChatContainer players={roomData?.players} />}
        groundClassName="p-4 lg:pr-2"
        playersClassName="p-4 pr-2 lg:pr-4 lg:pb-2"
        messagesClassName="p-4 pl-2 lg:pl-4 lg:pt-2"
      />
    </PlayersVisibilityProvider>
  );
};

export default Game;
