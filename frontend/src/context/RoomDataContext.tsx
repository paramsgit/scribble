import React, { createContext, useContext, useState } from "react";

// 1. Define your interfaces
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

// 2. Context type
interface RoomContextType {
  roomData: RoomData | null;
  setRoomData: React.Dispatch<React.SetStateAction<RoomData | null>>;
  updateScores: (updatedPlayers: Partial<Player>[]) => void;
}

// 3. Create Context
const RoomContext = createContext<RoomContextType | undefined>(undefined);

// 4. Provider component
export const RoomProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  // ✅ Function to update scores from incoming array
  const updateScores = (updatedPlayers: Partial<Player>[]) => {
    setRoomData((prevRoomData) => {
      if (!prevRoomData) return null;

      const updatedPlayerMap = new Map(
        updatedPlayers.map((p) => [p.id, p.score])
      );

      const newPlayers = prevRoomData.players.map((player) => ({
        ...player,
        score: updatedPlayerMap.has(player.id)
          ? updatedPlayerMap.get(player.id)
          : player.score,
      }));

      return { ...prevRoomData, players: newPlayers };
    });
  };
  return (
    <RoomContext.Provider value={{ roomData, setRoomData, updateScores }}>
      {children}
    </RoomContext.Provider>
  );
};

// 5. Custom hook to access the context
export const useRoom = (): RoomContextType => {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error("useRoom must be used within a RoomProvider");
  }
  return context;
};
