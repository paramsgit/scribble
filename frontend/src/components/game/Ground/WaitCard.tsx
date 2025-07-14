import React from "react";

interface Scores {
  playerName: string;
  score: number;
}

interface WaitCardProps {
  waitTime: number | undefined;
  previousWord: string | null | undefined;
  scores: Scores[] | null | undefined;
}

export default function WaitCard({
  waitTime = 0,
  previousWord = null,
  scores = null,
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
      <div className="w-full md:max-w-md mx-auto bg-gray-100 text-gray-800 rounded-xl shadow-md p-8 m-4 transform transition duration-300 md:top-1/3 md:left-1/3">
        <h2 className="text-4xl font-extrabold text-center mb-6 text-gray-600 animate-pulse">
          Waiting {timeLeft ? <span>{timeLeft}s </span> : ""}
        </h2>
        {previousWord && (
          <div className="mb-6 w-full flex justify-center">
            <p className="text-xl text-gray-600">
              The word was{" "}
              <span className="font-semibold text-green-500">
                {previousWord}
              </span>
            </p>
          </div>
        )}
        {scores && (
          <div>
            <h3 className="text-2xl font-bold mb-4 text-gray-700">
              Player Scores
            </h3>
            <ul className="space-y-3">
              {scores?.map((score, index) => (
                <li
                  key={index}
                  className="flex justify-between items-center bg-gray-100 p-3 rounded-lg shadow-sm hover:bg-blue-50 transition duration-200"
                >
                  <span className="font-medium text-gray-800">
                    {score.playerName}
                  </span>
                  <span className="text-blue-600 font-semibold">
                    {score.score}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
