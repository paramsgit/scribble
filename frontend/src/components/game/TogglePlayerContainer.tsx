import React from "react";
import { usePlayersVisibility } from "../../context/PlayersVisibilityContext";

const TogglePlayersButton = () => {
  const { isPlayersHidden, togglePlayers } = usePlayersVisibility();

  return (
    <button
      onClick={togglePlayers}
      className="absolute z-50 top-2 left-2 bg-black text-white px-3 py-1 rounded"
    >
      {isPlayersHidden ? "Show Players" : "Hide Players"}
    </button>
  );
};

export default TogglePlayersButton;
