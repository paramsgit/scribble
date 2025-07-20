import React, { useEffect, useState } from "react";
import JoinRoomForm from "../components/composed/JoinRoomForm";
import Game from "./Game";
import SocketManager from "../utils/socket";
import bgImage from "../assets/bg.png";

export interface Player {
  id: string;
  name: string;
  gender: "male" | "female";
  avatarVariant?: number;
  score?: number;
}
export interface RoomData {
  roomId: string;
  players: Player[];
}

const Home = () => {
  const socket = SocketManager.getInstance();
  const [roomData, setRoomData] = useState<RoomData | null>(null);

  useEffect(() => {
    if (roomData?.roomId) {
      socket.emit("request-game-details", { roomId: roomData.roomId });
    }
  }, [roomData?.roomId]);
  return (
    <div
      className="bg-repeat h-screen text-white"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      {roomData ? (
        <Game roomData={roomData} />
      ) : (
        <JoinRoomForm roomData={roomData} setRoomData={setRoomData} />
      )}
    </div>
  );
};

export default Home;
