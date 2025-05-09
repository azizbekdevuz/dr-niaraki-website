import React from "react";
import { Video } from "lucide-react";
import textSystem from "@/theme/textSystem";

interface VideoProps {
  darkMode: boolean;
}

const VideoS: React.FC<VideoProps> = ({ darkMode }) => (
  <div className="video-intro mt-12 flex flex-col items-center justify-center">
    <h3
      className={`flex items-center text-2xl font-semibold mb-6 ${
        darkMode ? textSystem.dark.primary : textSystem.light.primary
      }`}
    >
      <Video
        size={24}
        className={`mr-2 ${darkMode ? "text-blue-400" : "text-blue-600"}`}
      />
      Meet Dr. Sadeghi-Niaraki
    </h3>

    {/* Video Container with Modern Border - Fixed Width */}
    <div className="relative w-[560px] h-[315px] group">
      {/* Animated Background Gradient */}
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 rounded-xl blur-sm opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-gradient-xy"></div>

      {/* Main Container */}
      <div className="relative p-1 bg-gray-900 rounded-xl ring-1 ring-gray-800/50 backdrop-blur-xl h-full">
        {/* Inner Border with Glow */}
        <div
          className={`relative rounded-lg overflow-hidden h-full
            ${
              darkMode
                ? "shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                : "shadow-[0_0_15px_rgba(37,99,235,0.3)]"
            }
          `}
        >
          {/* Corner Accents */}
          <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-blue-500"></div>
          <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-blue-500"></div>
          <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-blue-500"></div>
          <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-blue-500"></div>

          {/* Video Player - Fixed Size */}
          <iframe
            width="560"
            height="315"
            src="https://www.youtube.com/embed/kZPm9YIDlk8"
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
      </div>

      {/* Tech Lines Decoration */}
      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>
      <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-24 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent"></div>
    </div>
  </div>
);

export default VideoS;
