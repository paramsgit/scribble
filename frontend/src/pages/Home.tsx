import React, { useState } from "react";
import JoinRoomForm from "../components/app/JoinRoomForm";
import Game from "./Game";

const Home = () => {
  const [roomData, setRoomData] = useState<any>(null);
  return (
    <div>
      {/* <h1 className="py-6">{roomData?.roomId}</h1> */}
      {roomData ? (
        <Game roomData={roomData} />
      ) : (
        <JoinRoomForm setRoomData={setRoomData} />
      )}
    </div>
  );
};

export default Home;
