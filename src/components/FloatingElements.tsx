import React from "react";
import { motion } from "framer-motion";

const FloatingElements: React.FC = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {Array.from({ length: 20 }).map((_, i) => (
      <motion.div
        key={i}
        className="absolute bg-blue-500/20 rounded-full blur-2xl"
        style={{
          width: `${Math.random() * 80 + 20}px`,
          height: `${Math.random() * 80 + 20}px`,
          top: `${Math.random() * 100}%`,
          left: `${Math.random() * 100}%`,
        }}
        animate={{
          x: [0, Math.random() * 100 - 50],
          y: [0, Math.random() * 100 - 50],
          scale: [1, Math.random() + 0.5],
          opacity: [0.4, 0.7],
        }}
        transition={{
          duration: Math.random() * 15 + 10,
          repeat: Infinity,
          repeatType: "reverse",
        }}
      />
    ))}
  </div>
);

export default FloatingElements;
