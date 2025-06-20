import React from "react";
import { cn } from "../utils/cn";

const UnderScoreLogo = ({ className = "" }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 4"
      width="22"
      height="4"
      fill="#e5e5e5"
      className={cn("mt-5", className)}
    >
      <rect x="0" y="2" width="20" height="2" fill="#a3a3a3" />
    </svg>
  );
};

export default UnderScoreLogo;
