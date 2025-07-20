import React, { useEffect, useState } from "react";
import SocketManager from "../../utils/socket";
import { RoomData } from "../../pages/Home";
import { cn } from "../../utils/cn";
import AvatarSelector from "./AvatarSelector";

interface JoinRoomFormProps {
  roomData: RoomData | null;
  setRoomData: React.Dispatch<React.SetStateAction<RoomData | null>>;
}

const JoinRoomForm = ({ roomData, setRoomData }: JoinRoomFormProps) => {
  const socket = SocketManager.getInstance();
  const [name, setName] = useState("");
  const [avatarVariant, setAvatarVariant] = useState(0);
  const [gender, setGender] = useState<"male" | "female">("male");
  const [showNameError, setShowNameError] = useState(false);
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

  useEffect(() => {
    console.log("gender is ", gender);
  }, [gender]);

  function joinRoom() {
    console.log("join room called");
    if (!name) {
      setShowNameError(true);
      return;
    }
    if (socket) {
      socket.emit("join-room", {
        roomId: null,
        name: name,
        avatarVariant,
      });
    }
  }
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="rounded-md p-4 bg-blue-800/80 space-y-4 max-w-80">
        <div className=" w-full ">
          <label className="text-xl text-white font-bold" htmlFor="name">
            Name
          </label>
          <input
            className="w-full px-2 py-1 bg-white text-gray-800 rounded "
            type="text"
            id="name"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setShowNameError(false);
            }}
          />
          <span
            className={cn(showNameError ? "block" : "hidden", "text-red-600")}
          >
            Name is required
          </span>{" "}
        </div>

        <div className="flex gap-4">
          <AvatarSelector
            name={name}
            variant={avatarVariant}
            setVariant={setAvatarVariant}
          />
        </div>

        <button
          className="w-full px-4 py-2 bg-green-500 text-lg font-bold rounded"
          onClick={joinRoom}
        >
          Join room
        </button>
      </div>
    </div>
  );
};

export default JoinRoomForm;
