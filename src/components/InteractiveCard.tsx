import React from 'react';
import { motion } from 'framer-motion';
import textSystem from './textSystem';
import { ArrowRight } from 'lucide-react';

const InteractiveCard: React.FC<{
    icon: React.ElementType;
    title: string;
    description: string;
    delay: number;
    darkMode: boolean;
  }> = ({ icon: Icon, title, description, delay, darkMode }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ scale: 1.05 }}
      className={`p-4 md:p-6 rounded-xl ${
        darkMode
          ? "bg-gray-800/30 hover:bg-gray-800/50"
          : "bg-white/30 hover:bg-white/50"
      } backdrop-blur-sm border ${
        darkMode ? "border-gray-700/50" : "border-gray-200/50"
      }`}
    >
      <Icon
        className={`w-6 h-6 md:w-8 md:h-8 mb-3 md:mb-4 ${
          darkMode
            ? "text-blue-400 group-hover:text-blue-300"
            : "text-blue-600 group-hover:text-blue-500"
        } transition-colors`}
      />
      <h3
        className={`text-lg md:text-xl font-semibold mb-2 ${
        darkMode ? textSystem.dark.primary : textSystem.light.primary
      }`}
      >
        {title}
      </h3>
      <p
        className={`text-sm md:text-base ${
        darkMode ? textSystem.dark.tertiary : textSystem.light.tertiary
      } opacity-80 group-hover:opacity-100 transition-opacity`}
      >
        {description}
      </p>
      <motion.div
        className={`mt-3 md:mt-4 flex items-center ${
          darkMode
            ? "text-blue-400 group-hover:text-blue-300"
            : "text-blue-600 group-hover:text-blue-500"
        }`}
        whileHover={{ x: 10 }}
      >
        <span className="text-sm md:text-base">Learn more</span>
        <ArrowRight className="ml-2 w-4 h-4" />
      </motion.div>
    </motion.div>
  );

export default InteractiveCard;