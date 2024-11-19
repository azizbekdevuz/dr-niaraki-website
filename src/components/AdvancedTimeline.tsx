import React, { Dispatch, SetStateAction } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useDeviceDetect from "../components/useDeviceDetect";

interface AdvancedTimelineProps { //properties of AdvancedTimeline component
    activeIndex: number;
    setActiveIndex: Dispatch<SetStateAction<number>>;
    data: {
      title?: string;
      role?: string;
      institution?: string;
      location?: string;
      organization?: string;
      period: string;
      details?: string;
      additionalInformation?: string;
      highlights: string[];
      progressPercentage?: number;
    }[];
  }
  
  const AdvancedTimeline: React.FC<AdvancedTimelineProps> = ({ //a responsive and styled timeline element showcasing timeline (years/period)
    activeIndex,
    setActiveIndex,
    data,
  }) => {
    const device = useDeviceDetect();
  
    if (device.isMobile || device.isTablet) {
      return (
        <div className="relative w-full py-8 md:py-12">
          {/* Mobile/Tablet Timeline Bar */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-700">
            <motion.div
              className="absolute top-0 w-full bg-gradient-to-b from-blue-500 to-purple-500"
              style={{
                height: `${(activeIndex / (data.length - 1)) * 100}%`,
              }}
              transition={{ duration: 0.5 }}
            />
          </div>
  
          {/* Vertical Timeline Points */}
          <div className="relative pl-8 space-y-8 md:space-y-12">
            {data.map((exp, idx) => (
              <motion.div
                key={idx}
                className="relative"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: idx * 0.1 }}
              >
                {/* Connection Line */}
                <motion.div
                  className="absolute left-0 top-1/2 w-8 h-px bg-gradient-to-r from-blue-500/50 to-blue-500"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: idx * 0.1 + 0.2 }}
                />
  
                {/* Timeline Point with Year */}
                <motion.button
                  className="relative group flex items-center"
                  onClick={() => setActiveIndex(idx)}
                  whileHover={{ x: 4 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  {/* Point Circle */}
                  <motion.div
                    className={`w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center 
                      ${
                        idx === activeIndex
                          ? "bg-gradient-to-r from-blue-500 to-purple-500"
                          : "bg-gray-700 hover:bg-gray-600"
                      }`}
                    animate={{
                      scale: idx === activeIndex ? [1, 1.2, 1] : 1,
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
  
                  {/* Year Label - Now Beside Point */}
                  <motion.div
                    className={`ml-4 text-sm md:text-base font-medium
                      ${idx === activeIndex ? "text-blue-400" : "text-gray-500"}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 + 0.3 }}
                  >
                    {exp.period}
                  </motion.div>
  
                  {/* Mobile Info Preview */}
                  {idx === activeIndex && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="ml-4 text-sm text-blue-400 hidden md:block"
                    >
                      {exp.role}
                    </motion.div>
                  )}
                </motion.button>
  
                {/* Progress Indicator - Simplified for Mobile */}
                {idx === activeIndex && (
                  <motion.div
                    className="absolute left-[-4px] top-1/2 transform -translate-y-1/2"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  >
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      );
    }
  
    return (
      <div className="relative w-full py-16">
        {/* Timeline Bar */}
        <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gray-700 transform -translate-y-1/2">
          <motion.div
            className="absolute left-0 h-full bg-gradient-to-r from-blue-500 to-purple-500"
            style={{
              width: `${(activeIndex / (data.length - 1)) * 100}%`,
            }}
            transition={{ duration: 0.5 }}
          />
        </div>
  
        {/* Timeline Points */}
        <div className="relative flex justify-between mx-8">
          {data.map((exp, idx) => (
            <motion.div
              key={idx}
              className="relative"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: idx * 0.1 }}
            >
              {/* Connection Line */}
              <motion.div
                className="absolute left-1/2 bottom-full mb-4 w-px h-8 bg-gradient-to-b from-transparent via-blue-500/50 to-blue-500"
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: idx * 0.1 + 0.2 }}
              />
  
              {/* Timeline Point */}
              <motion.button
                className="relative group"
                onClick={() => setActiveIndex(idx)}
                whileHover={{ scale: 1.2 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                {/* Outer Ring */}
                <motion.div
                  className={`absolute -inset-4 rounded-full ${
                    idx === activeIndex
                      ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20"
                      : "bg-transparent"
                  }`}
                  animate={{
                    scale: idx === activeIndex ? [1, 1.2, 1] : 1,
                    opacity: idx === activeIndex ? [0.5, 0.8, 0.5] : 0,
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
  
                {/* Main Point */}
                <motion.div
                  className={`relative w-6 h-6 rounded-full flex items-center justify-center ${
                    idx === activeIndex
                      ? "bg-gradient-to-r from-blue-500 to-purple-500"
                      : "bg-gray-700 hover:bg-gray-600"
                  }`}
                >
                  <motion.div
                    className="absolute inset-0 rounded-full bg-blue-500"
                    initial={false}
                    animate={{
                      scale: idx === activeIndex ? [0.8, 1.2, 0.8] : 0.8,
                      opacity: idx === activeIndex ? 1 : 0.5,
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                </motion.div>
  
                {/* Year Label */}
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                  <motion.div
                    className={`text-sm font-medium ${
                      idx === activeIndex ? "text-blue-400" : "text-gray-500"
                    }`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 + 0.3 }}
                  >
                    {exp.period}
                  </motion.div>
                </div>
  
                {/* Hover Card */}
                <div className="absolute bottom-full mb-16 left-1/2 transform -translate-x-1/2 pointer-events-none">
                  <AnimatePresence>
                    {idx === activeIndex && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-3 shadow-xl"
                      >
                        <div className="text-white font-medium">{exp.role}</div>
                        <div className="text-blue-400 text-sm">
                          {exp.organization}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.button>
  
              {/* Progress Indicator */}
              <motion.div
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                initial={false}
                animate={{
                  scale: idx === activeIndex ? [1, 1.2, 1] : 1,
                  opacity: idx === activeIndex ? 1 : 0.3,
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <svg className="w-12 h-12" viewBox="0 0 50 50">
                  <circle
                    cx="25"
                    cy="25"
                    r="20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray={`${exp.progressPercentage ?? 0} 126`}
                    className={`transform -rotate-90 ${
                      idx === activeIndex ? "text-blue-500" : "text-gray-700"
                    }`}
                  />
                </svg>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

export default AdvancedTimeline;