import React, { useEffect } from "react";
const RenderEmptyWord = ({ length, word }) => {
  useEffect(() => {
    console.log(word);
  }, [word]);

  if (length <= 0 || !Number.isInteger(length)) return null;

  return (
    <div className="flex justify-center items-center gap-1 p-4">
      {Array.from({ length }).map((_, index) => {
        const char =
          word && index < word.length ? word[index].toUpperCase() : "";
        return (
          <span
            key={index}
            className="w-9 h-9 flex justify-center items-center border-b-2 border-indigo-500 text-2xl font-bold text-gray-600  relative overflow-hidden"
          >
            <span
              className={`transition-all duration-300 ease-out ${
                char
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 -translate-y-full"
              }`}
              style={{ transitionDelay: char ? `${index * 75}ms` : "0ms" }}
            >
              {char}
            </span>
          </span>
        );
      })}
    </div>
  );
};

export default RenderEmptyWord;
