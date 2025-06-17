import React from "react";

const Players = ({ data }) => {
  return (
    <div className="flex flex-col">
      {data?.map((item) => {
        return <p key={item?.name}>{item?.name}</p>;
      })}
    </div>
  );
};

export default Players;
