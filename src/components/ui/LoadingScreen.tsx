import React, { memo, useEffect, useState } from "react";

interface LoadingScreenProps {
  progress?: number;
}

// Simple, optimized loading animation component
const LoadingAnimation: React.FC<LoadingScreenProps> = memo(
  ({ progress = 0 }) => {
    return (
      <div className="relative w-64 h-64">
        {/* Simple container */}
        <div className="absolute inset-8 bg-gray-900 border-2 border-cyan-400 rounded-md overflow-hidden">
          {/* Animated grid - CSS only for better performance */}
          <div className="absolute inset-0 grid grid-cols-5 grid-rows-5">
            {Array.from({ length: 25 }).map((_, i) => (
              <div
                key={`cell-${i}`}
                className="border border-cyan-400/20"
                style={{
                  animation: `pulse 2s ease-in-out ${i * 0.1}s infinite`,
                }}
              />
            ))}
          </div>

          {/* CPU cores - simplified */}
          <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-4 p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={`core-${i}`}
                className="bg-gray-800 border border-cyan-400 rounded-sm"
                style={{
                  animation: `fadeIn 0.5s ease-in-out ${0.5 + i * 0.2}s forwards`,
                  opacity: 0,
                }}
              />
            ))}
          </div>

          {/* Data flow light - simplified */}
          <div
            className="absolute h-2 w-2 bg-cyan-400 rounded-full shadow-glow"
            style={{
              animation: "dataFlow 4s linear infinite",
              boxShadow: "0 0 10px 2px #00FFFF",
            }}
          />
        </div>

        {/* Progress bar */}
        {progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-2 bg-gray-800 border border-cyan-400/50">
            <div
              className="h-full bg-cyan-400 transition-all duration-300 ease-out"
              style={{ width: `${Math.min(progress * 100, 100)}%` }}
            />
          </div>
        )}
      </div>
    );
  },
);

LoadingAnimation.displayName = "LoadingAnimation";

// Main loading screen component
const LoadingScreen: React.FC<LoadingScreenProps> = ({ progress = 0 }) => {
  const [messageIndex, setMessageIndex] = useState(0);
  const messages = [
    "Initializing...",
    "Loading data...",
    "Preparing interface...",
    "Almost ready...",
  ];

  // Cycle through loading messages with reduced frequency
  useEffect(() => {
    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 3000);

    return () => clearInterval(messageInterval);
  }, [messages.length]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black"
      role="alert"
      aria-live="polite"
      aria-busy="true"
    >
      <h2 className="text-cyan-400 text-xl mb-8 animate-pulse">
        {messages[messageIndex]}
      </h2>

      <LoadingAnimation progress={progress} />

      {/* Screen reader only progress indicator */}
      <div className="sr-only">
        Loading {Math.round(progress * 100)}% complete
      </div>
      <h2 className="text-cyan-400 text-xl mb-8 animate-pulse">
        {messages[messageIndex]} ({Math.round(progress * 100)}%)
      </h2>
    </div>
  );
};

LoadingScreen.displayName = "LoadingScreen";

export default memo(LoadingScreen);
