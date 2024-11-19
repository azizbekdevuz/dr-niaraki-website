import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExperienceData } from "../components/datasets/ExperienceDataInterface";
import useDeviceDetect from "../components/useDeviceDetect";
import ProgressBar from "../components/ProgressBar";
import {
    Briefcase,
    Calendar,
    ChevronRight,
}
from "lucide-react";

interface ExperienceCardProps { //properties of ExperienceCard
    data: ExperienceData;
    index: number;
    isActive: boolean;
    onClick: () => void;
  }
  
  const ExperienceCard: React.FC<ExperienceCardProps> = ({ //a card component to showcase necessary information from the active section
    data,
    index,
    isActive,
    onClick,
  }) => {
    const device = useDeviceDetect(); //first detect device
  
    const mobileCard = ( //use mobileCard for mobile optimized
      <motion.div
        className={`relative ${isActive ? "z-10" : "z-0"}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.2 }}
      >
        <motion.div
          className={`p-4 md:p-5 rounded-lg border transition-all duration-300 ${
            isActive
              ? "bg-gray-800/95 border-blue-500/50 shadow-lg shadow-blue-500/20"
              : "bg-gray-800/90 border-gray-700/30"
          }`}
          whileHover={{ scale: 1.01 }}
          onClick={onClick}
        >
          <div className="flex flex-col space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <motion.div
                  className={`w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center ${
                    isActive
                      ? "bg-gradient-to-r from-blue-500 to-purple-500"
                      : "bg-gray-700"
                  }`}
                >
                  <Briefcase className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </motion.div>
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-white">
                    {data.title || data.role}
                  </h3>
                  <p className="text-sm text-blue-400">{data.institution}</p>
                </div>
              </div>
            </div>
  
            {/* Period - Moved below header */}
            <div className="flex items-center space-x-2 text-gray-400 text-sm">
              <Calendar className="w-4 h-4" />
              <span>{data.period}</span>
            </div>
  
            {/* Progress Bar */}
            <ProgressBar progress={data.progressPercentage ?? 0} />
  
            {/* Expandable Content */}
            <AnimatePresence>
              {isActive && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-2 pt-3"
                >
                  {data.highlights?.map((highlight, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ x: -10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-start space-x-2"
                    >
                      <ChevronRight className="w-4 h-4 text-blue-400 mt-1 flex-shrink-0" />
                      <span className="text-sm text-gray-300">{highlight}</span>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    );
    return device.isDesktop ? ( //use desktop version if device is desktop
      <motion.div
        className={`relative ${isActive ? "z-10" : "z-0"}`}
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.2 }}
      >
        <motion.div
          className={`p-6 rounded-xl border transition-all duration-300 ${
            isActive
              ? "bg-gray-800/95 border-blue-500/50 shadow-lg shadow-blue-500/20 border-opacity-50"
              : "bg-gray-800/90 border-gray-700/30 hover:bg-gray-800/95 hover:border-gray-700/50"
          }`}
          whileHover={{ scale: 1.02 }}
          onClick={onClick}
        >
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <motion.div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    isActive
                      ? "bg-gradient-to-r from-blue-500 to-purple-500"
                      : "bg-gray-700"
                  }`}
                  animate={{ rotate: isActive ? 360 : 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Briefcase className="w-6 h-6 text-white" />
                </motion.div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {data.title || data.role}
                  </h3>
                  <p className="text-blue-400">{data.institution}</p>
                  {data.location && (
                    <p className="text-sm text-gray-400">{data.location}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2 text-gray-400">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">{data.period}</span>
              </div>
            </div>
  
            {/* Additional Information */}
            <div className="text-gray-300 text-sm">
              {data.additionalInformation || data.details}
            </div>
  
            <ProgressBar progress={data.progressPercentage ?? 0} />
  
            <AnimatePresence>
              {isActive && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-3 pt-4"
                >
                  {data.highlights?.map((highlight, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-center space-x-2"
                    >
                      <ChevronRight className="w-4 h-4 text-blue-400" />
                      <span className="text-gray-300">{highlight}</span>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    ) : (
      mobileCard
    );
  };

export default ExperienceCard;