import React, { useEffect, useState } from "react";
import SocketManager from "../../utils/socket";
import { RoomData } from "../../pages/Home";

interface JoinRoomFormProps {
  roomData: RoomData | null;
  setRoomData: React.Dispatch<React.SetStateAction<RoomData | null>>;
}

const JoinRoomForm = ({ roomData, setRoomData }: JoinRoomFormProps) => {
  const socket = SocketManager.getInstance();
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    socket.on("connect", () => {
      setConnected(true);
      console.log("Connected to socket:", socket.id);
    });

    socket.on("disconnect", () => {
      setConnected(false);
      console.log("Disconnected");
    });
    socket.on("room-update", (data) => {
      console.log(roomData?.roomId);
      setRoomData(data);
      console.log("Joined room:", data);
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
    };
  }, []);

  function joinRoom() {
    console.log("join room called");
    if (socket) {
      socket.emit("join-room", {
        roomId: null,
        name: `Param${(Math.random() * 100).toFixed(2)}`,
      });
    }
  }
  return (
    <div>
      <h1>Socket Singleton Test</h1>
      <p>{connected ? "Connected" : "Disconnected"}</p>
      <button onClick={joinRoom}>Join room</button>
    </div>
  );
};

export default JoinRoomForm;
