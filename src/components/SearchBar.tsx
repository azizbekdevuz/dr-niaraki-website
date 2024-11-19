import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';

const SearchBar: React.FC<{ darkMode: boolean }> = ({ darkMode }) => {
    const [isExpanded, setIsExpanded] = useState(false);
  
    return (
      <motion.div
        className="relative"
        animate={{ width: isExpanded ? "100%" : 40 }}
      >
        <motion.input
          type="text"
          placeholder="Search research..."
          className={`w-full h-8 md:h-10 px-8 md:px-10 text-sm md:text-base rounded-full ${darkMode ? "bg-gray-800/10" : "bg-white/10"} backdrop-blur-sm border border-white/20 focus:outline-none focus:border-blue-400 ${isExpanded ? "opacity-100" : "opacity-1"}`}
          animate={{ opacity: isExpanded ? 1 : 0 }}
        />
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="absolute left-0 top-0 h-8 md:h-10 w-8 md:w-10 flex items-center justify-center"
        >
          <Search className="w-4 h-4 md:w-5 md:h-5" />
        </button>
      </motion.div>
    );
  };

export default SearchBar;