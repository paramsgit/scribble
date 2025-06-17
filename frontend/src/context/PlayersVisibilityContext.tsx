import React, { createContext, useContext, useState, ReactNode } from "react";

interface PlayersVisibilityContextProps {
  isPlayersHidden: boolean;
  togglePlayers: () => void;
}

const PlayersVisibilityContext = createContext<
  PlayersVisibilityContextProps | undefined
>(undefined);

export const usePlayersVisibility = () => {
  const context = useContext(PlayersVisibilityContext);
  if (!context) {
    throw new Error(
      "usePlayersVisibility must be used within PlayersVisibilityProvider"
    );
  }
  return context;
};

export const PlayersVisibilityProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [isPlayersHidden, setIsPlayersHidden] = useState(false);

  const togglePlayers = () => setIsPlayersHidden((prev) => !prev);

  return (
    <PlayersVisibilityContext.Provider
      value={{ isPlayersHidden, togglePlayers }}
    >
      {children}
    </PlayersVisibilityContext.Provider>
  );
};
