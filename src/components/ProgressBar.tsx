import React from "react";
import { motion } from "framer-motion";

const ProgressBar = (
  { progress }: { progress: number }, //a progress bar for overall page
) => (
  <div className="relative w-full h-2 bg-gray-800 rounded-full overflow-hidden">
    <motion.div
      className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-purple-500"
      style={{ width: `${progress}%` }}
      initial={{ width: 0 }}
      animate={{ width: `${progress}%` }}
      transition={{ duration: 1.5, ease: "easeOut" }}
    />
  </div>
);

export default ProgressBar;
