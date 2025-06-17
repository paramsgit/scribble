import React, { useEffect, useState } from "react";
import SocketManager from "../../utils/socket";

const JoinRoomForm = ({ setRoomData }) => {
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
        name: `Param${Math.random() * 100}`,
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
