import React from "react";
import { motion } from "framer-motion";

const CPUAnimation = () => (
  <svg width="300" height="300" viewBox="0 0 300 300">
    {/* CPU die */}
    <motion.rect
      x="50"
      y="50"
      width="200"
      height="200"
      fill="#1a1a1a"
      stroke="#00FFFF"
      strokeWidth="2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    />

    {/* CPU pins */}
    {[...Array(20)].map((_, i) => (
      <motion.rect
        key={`pin-${i}`}
        x={55 + i * 10}
        y="250"
        width="6"
        height="20"
        fill="#808080"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.5, delay: i * 0.05 }}
      />
    ))}

    {/* Circuitry */}
    <g stroke="#00FFFF" strokeWidth="1" fill="none">
      {/* Horizontal lines */}
      {[...Array(10)].map((_, i) => (
        <motion.line
          key={`h-${i}`}
          x1="60"
          y1={70 + i * 20}
          x2="240"
          y2={70 + i * 20}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, delay: 1 + i * 0.1 }}
        />
      ))}
      {/* Vertical lines */}
      {[...Array(10)].map((_, i) => (
        <motion.line
          key={`v-${i}`}
          x1={70 + i * 20}
          y1="60"
          x2={70 + i * 20}
          y2="240"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2, delay: 1 + i * 0.1 }}
        />
      ))}
    </g>

    {/* CPU cores */}
    {[
      [70, 70],
      [170, 70],
      [70, 170],
      [170, 170],
    ].map(([x, y], i) => (
      <motion.rect
        key={`core-${i}`}
        x={x}
        y={y}
        width="60"
        height="60"
        fill="#2a2a2a"
        stroke="#00FFFF"
        strokeWidth="2"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, delay: 3 + i * 0.2 }}
      />
    ))}

    {/* Animated data flow */}
    <motion.circle
      r="3"
      fill="#00FFFF"
      filter="url(#glow)"
      initial={{ opacity: 0 }}
      animate={{
        opacity: [0, 1, 1, 0],
        x: [60, 240, 240, 60, 60],
        y: [60, 60, 240, 240, 60],
      }}
      transition={{
        duration: 4,
        times: [0, 0.1, 0.5, 0.9, 1],
        repeat: Infinity,
        repeatType: "loop",
      }}
    />

    {/* Glow filter */}
    <defs>
      <filter id="glow">
        <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  </svg>
);

const LoadingScreen = () => {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.h2
        className="text-cyan-400 text-3xl mb-8"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        Initializing future visions, please stand by...
      </motion.h2>
      <CPUAnimation />
    </motion.div>
  );
};

export default LoadingScreen;
