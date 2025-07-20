import React, { useEffect, useState } from "react";
import JoinRoomForm from "../components/composed/JoinRoomForm";
import Game from "./Game";
import SocketManager from "../utils/socket";
import bgImage from "../assets/bg.png";
import { useRoom } from "../context/RoomDataContext";

const Home = () => {
  const socket = SocketManager.getInstance();
  const { roomData, setRoomData } = useRoom();

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
