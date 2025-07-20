import React from "react";
import { UpdatedScores } from "./DrawingBoard";
import { PencilSvg } from "../../../config";

interface Scores {
  name: string;
  value: number;
  id: string;
}

interface WaitCardProps {
  waitTime: number | undefined;
  previousWord: string | null | undefined;
  scores: Scores[] | null | undefined;
  drawer?: string;
}

export default function WaitCard({
  waitTime = 0,
  previousWord = null,
  scores = null,
  drawer = "",
}: WaitCardProps) {
  const [timeLeft, setTimeLeft] = React.useState(waitTime);

  React.useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  return (
    <div className="absolute w-full h-full flex justify-center items-center">
      <div className="w-full md:max-w-md mx-auto bg-gray-100 text-gray-800 rounded-xl shadow-md p-6 m-4 transform transition duration-300 md:top-1/3 md:left-1/3">
        <h2 className="text-2xl font-extrabold text-center mb-2 text-gray-600 animate-pulse">
          Waiting {timeLeft ? <span>{timeLeft}s </span> : ""}
        </h2>
        {previousWord && (
          <div className="mb-4 w-full flex justify-center">
            <p className="text-lg text-gray-600">
              The word was{" "}
              <span className="font-semibold text-green-500">
                {previousWord}
              </span>
            </p>
          </div>
        )}
        {scores && (
          <div>
            <h3 className="text-lg font-bold mb-2 text-gray-700">
              Player Scores
            </h3>
            <ul className="bg-black/80 text-white rounded-lg p-4 space-y-1">
              {scores?.map((score: UpdatedScores) => (
                <li
                  key={score.id}
                  className="flex justify-between items-center text-white px-3 rounded-lg transition duration-200"
                >
                  <span className="font-bold ">{score.name}</span>
                  {score.id == drawer ? (
                    <img className={"w-6"} src={PencilSvg} alt="Pencil" />
                  ) : (
                    <span className="text-green-600 font-bold">
                      +{score.value}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
