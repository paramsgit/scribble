import React from "react";
import { getAvatarUrl } from "../../utils/helper";
const AvatarSelector = ({ name, setVariant, variant }) => {
  return (
    <div className=" flex flex-1 justify-between items-center bg-white py-4 rounded-lg">
      <button
        onClick={() => setVariant((variant) => variant - 1)}
        className="text-black px-1 py-4 bg-black/60 text-white rounded-r-lg cursor-pointer"
      >
        &lt;
      </button>
      <img
        className="w-[70%]"
        src={getAvatarUrl({ name, variant })}
        alt="player_icon"
      />
      <button
        onClick={() => setVariant((variant) => variant + 1)}
        className="text-black px-1 py-4 bg-black/60 text-white rounded-l-lg cursor-pointer"
      >
        &gt;
      </button>
    </div>
  );
};

export default AvatarSelector;
