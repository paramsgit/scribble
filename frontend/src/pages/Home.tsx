import React, { useEffect, useState } from "react";
import JoinRoomForm from "../components/app/JoinRoomForm";
import Game from "./Game";
import SocketManager from "../utils/socket";
export interface Player {
  id: string;
  name: string;
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
    console.log("this use is called");
    if (roomData?.roomId) {
      socket.emit("request-game-details", { roomId: roomData.roomId });
    }
  }, [roomData?.roomId]);
  return (
    <div>
      {/* <h1 className="py-6">{roomData?.roomId}</h1> */}
      {roomData ? (
        <Game roomData={roomData} />
      ) : (
        <JoinRoomForm roomData={roomData} setRoomData={setRoomData} />
      )}
    </div>
  );
};

export default Home;
