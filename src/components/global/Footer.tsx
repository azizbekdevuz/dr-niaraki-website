import React, { useState, useEffect, useRef, memo } from "react";
import { motion, useAnimation, useInView } from "framer-motion";
import {
  Briefcase,
  Github,
  Linkedin,
  Mail,
  ChevronUp,
  Network,
  Code,
  Cpu,
  Terminal,
  Database,
} from "lucide-react";

interface FooterProps {
  darkMode: boolean;
}

// Memo-ized Grid Cell component for performance
const GridCell = memo(({ darkMode }: { darkMode: boolean }) => {
  return (
    <div
      className={`h-4 w-4 rounded-sm ${
        Math.random() > 0.85
          ? darkMode
            ? "bg-blue-800/30"
            : "bg-blue-200/50"
          : "bg-transparent"
      }`}
    />
  );
});

GridCell.displayName = "GridCell";

// Optimized matrix background with virtualization
const MatrixBackground = ({ darkMode }: { darkMode: boolean }) => {
  // Limited grid size for performance
  const columns = 12;
  const rows = 6;

  // Pre-generate random indices for cells that will animate
  const animatedCells = useRef(
    Array.from({ length: 8 }, () => ({
      col: Math.floor(Math.random() * columns),
      row: Math.floor(Math.random() * rows),
    })),
  ).current;

  return (
    <div className="absolute inset-0 overflow-hidden opacity-30 pointer-events-none">
      <div className="grid grid-cols-12 gap-4 p-8">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <React.Fragment key={`row-${rowIndex}`}>
            {Array.from({ length: columns }).map((_, colIndex) => {
              const isAnimated = animatedCells.some(
                (cell) => cell.col === colIndex && cell.row === rowIndex,
              );

              return isAnimated ? (
                <motion.div
                  key={`cell-${rowIndex}-${colIndex}`}
                  initial={{ opacity: 0.3 }}
                  animate={{
                    opacity: [0.3, 1, 0.3],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration: 2 + Math.random() * 3,
                    repeat: Infinity,
                    repeatType: "reverse",
                    delay: Math.random() * 2,
                  }}
                  className={`h-4 w-4 rounded-sm ${
                    darkMode ? "bg-blue-600/40" : "bg-blue-400/40"
                  }`}
                />
              ) : (
                <GridCell
                  darkMode={darkMode}
                  key={`cell-${rowIndex}-${colIndex}`}
                />
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

// Main Footer component
const Footer: React.FC<FooterProps> = ({ darkMode }) => {
  const [isVisible, setIsVisible] = useState(false);
  const backToTopControls = useAnimation();
  const footerRef = useRef(null);
  const isInView = useInView(footerRef, { once: true });

  // Performance optimization: Use passive event listener for scroll
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      if (scrollY > 500) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Only animate when needed
  useEffect(() => {
    if (isVisible) {
      backToTopControls.start({ opacity: 1, y: 0 });
    } else {
      backToTopControls.start({ opacity: 0, y: 20 });
    }
  }, [isVisible, backToTopControls]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Generate current year for copyright
  const currentYear = new Date().getFullYear();

  // Animation variants for staggered animations
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <footer
      ref={footerRef}
      className={`relative mt-24 overflow-hidden ${
        darkMode
          ? "bg-gradient-to-b from-gray-900 to-gray-950"
          : "bg-gradient-to-b from-gray-50 to-gray-100"
      }`}
    >
      {/* Back to top button - optimized with motion.button */}
      <motion.button
        onClick={scrollToTop}
        animate={backToTopControls}
        initial={{ opacity: 0, y: 20 }}
        className={`fixed bottom-24 right-6 p-3 rounded-full z-30 shadow-lg backdrop-blur-sm ${
          darkMode
            ? "bg-blue-600/90 text-white hover:bg-blue-500"
            : "bg-blue-500/90 text-white hover:bg-blue-600"
        } transition-colors duration-300`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <ChevronUp className="h-5 w-5" />
      </motion.button>

      {/* High-tech backgrounds with optimized rendering */}
      <MatrixBackground darkMode={darkMode} />

      {/* Scan line effect (lightweight css) */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className={`absolute w-full h-[1px] scan-line ${
            darkMode ? "bg-blue-500/20" : "bg-blue-400/10"
          }`}
        />
      </div>

      <div className="relative container mx-auto px-4 md:px-8">
        {/* Interactive tech circles */}
        <div className="absolute top-10 right-10 opacity-20 pointer-events-none">
          <svg width="80" height="80" viewBox="0 0 100 100">
            <motion.circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={darkMode ? "#3B82F6" : "#60A5FA"}
              strokeWidth="1"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, repeat: Infinity, repeatType: "loop" }}
            />
            <motion.circle
              cx="50"
              cy="50"
              r="30"
              fill="none"
              stroke={darkMode ? "#3B82F6" : "#60A5FA"}
              strokeWidth="1"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{
                duration: 3,
                repeat: Infinity,
                repeatType: "loop",
                delay: 0.5,
              }}
            />
          </svg>
        </div>

        {/* Main footer content with optimized animations */}
        <motion.div
          className="pt-16 pb-12"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Column 1: Basic Professor Info */}
            <motion.div variants={itemVariants}>
              <div
                className={`p-6 rounded-xl backdrop-blur-sm ${
                  darkMode
                    ? "bg-gray-800/40 border border-gray-700/50"
                    : "bg-white/80 border border-gray-200"
                }`}
              >
                <h3
                  className={`text-xl font-bold mb-4 flex items-center gap-2 ${
                    darkMode ? "text-white" : "text-gray-800"
                  }`}
                >
                  <Cpu
                    className={`h-5 w-5 ${darkMode ? "text-blue-400" : "text-blue-500"}`}
                  />
                  Dr. Abolghasem Sadeghi-Niaraki
                </h3>
                <p
                  className={`${
                    darkMode ? "text-gray-300" : "text-gray-600"
                  } mb-4`}
                >
                  Associate Professor
                  <br />
                  Dept. of Computer Science & Engineering
                  <br />
                  Sejong University
                </p>
                <div className="flex items-center gap-3 mt-4">
                  <motion.a
                    href="mailto:a.sadeghi@sejong.ac.kr"
                    className={`p-2 rounded-full transition-colors ${
                      darkMode
                        ? "bg-gray-700/70 text-gray-300 hover:bg-blue-700/40 hover:text-blue-400"
                        : "bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-600"
                    }`}
                    aria-label="Email"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Mail className="h-5 w-5" />
                  </motion.a>
                  <motion.a
                    href="https://www.linkedin.com/in/abolghasemsadeghi-n"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`p-2 rounded-full transition-colors ${
                      darkMode
                        ? "bg-gray-700/70 text-gray-300 hover:bg-blue-700/40 hover:text-blue-400"
                        : "bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-600"
                    }`}
                    aria-label="LinkedIn"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Linkedin className="h-5 w-5" />
                  </motion.a>
                </div>
              </div>
            </motion.div>

            {/* Column 2: Research Focus with tech effect */}
            <motion.div variants={itemVariants}>
              <div
                className={`p-6 rounded-xl backdrop-blur-sm h-full ${
                  darkMode
                    ? "bg-gray-800/40 border border-gray-700/50"
                    : "bg-white/80 border border-gray-200"
                }`}
              >
                <h3
                  className={`text-xl font-bold mb-4 flex items-center gap-2 ${
                    darkMode ? "text-white" : "text-gray-800"
                  }`}
                >
                  <Database
                    className={`h-5 w-5 ${darkMode ? "text-blue-400" : "text-blue-500"}`}
                  />
                  Research Focus
                </h3>
                <ul
                  className={`space-y-3 ${
                    darkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  {[
                    "Geo-AI & Spatial Computing",
                    "Extended Reality (XR) Technologies",
                    "AI & Machine Learning",
                  ].map((item, index) => (
                    <motion.li
                      key={index}
                      className="flex items-center gap-3"
                      whileHover={{ x: 5 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <div
                        className={`p-1.5 rounded-md ${
                          darkMode ? "bg-blue-900/30" : "bg-blue-50"
                        }`}
                      >
                        <Network
                          className={`h-4 w-4 ${
                            darkMode ? "text-blue-400" : "text-blue-600"
                          }`}
                        />
                      </div>
                      <span>{item}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </motion.div>

            {/* Column 3: Developer Attribution with a modern tech card */}
            <motion.div variants={itemVariants}>
              <div
                className={`p-6 rounded-xl backdrop-blur-sm h-full relative overflow-hidden ${
                  darkMode
                    ? "bg-gray-800/40 border border-gray-700/50"
                    : "bg-white/80 border border-gray-200"
                }`}
              >
                {/* Decorative diagonal line */}
                <div className="absolute right-0 top-0 w-32 h-32 overflow-hidden pointer-events-none">
                  <div
                    className={`absolute -right-4 -top-4 w-16 h-16 rotate-45 transform origin-bottom-left ${
                      darkMode ? "bg-blue-900/20" : "bg-blue-100"
                    }`}
                  />
                </div>

                <h3
                  className={`text-xl font-bold mb-4 flex items-center gap-2 ${
                    darkMode ? "text-white" : "text-gray-800"
                  }`}
                >
                  <Terminal
                    className={`h-5 w-5 ${darkMode ? "text-blue-400" : "text-blue-500"}`}
                  />
                  Website
                </h3>
                <div
                  className={`mb-4 flex items-center ${
                    darkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  <Code
                    className={`h-5 w-5 mr-2 inline-block ${
                      darkMode ? "text-blue-400" : "text-blue-500"
                    }`}
                  />
                  <span className="font-medium">
                    Designed & Developed & Published by
                  </span>
                </div>

                {/* Developer bio with tech glow effect */}
                <div
                  className={`p-4 rounded-lg relative ${
                    darkMode
                      ? "bg-gray-900/70 border border-gray-700/80"
                      : "bg-gray-50 border border-gray-200/80"
                  }`}
                >
                  {/* Subtle glow effect */}
                  <div
                    className={`absolute -inset-px rounded-lg blur-sm ${
                      darkMode ? "bg-blue-900/30" : "bg-blue-200/30"
                    }`}
                  />

                  {/* Content */}
                  <div className="relative">
                    <p
                      className={`text-lg font-medium mb-2 ${
                        darkMode ? "text-blue-300" : "text-blue-700"
                      }`}
                    >
                      Azizbek Arzikulov
                    </p>
                    <p
                      className={`text-sm mb-3 ${
                        darkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      Full-Stack Developer
                    </p>

                    {/* Social links with hover effects */}
                    <div className="flex items-center space-x-3">
                      <motion.a
                        href="https://portfolio-next-silk-two.vercel.app/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`p-2 rounded-lg transition ${
                          darkMode
                            ? "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-blue-400"
                            : "bg-white text-gray-600 hover:bg-gray-100 hover:text-blue-600"
                        }`}
                        aria-label="Portfolio"
                        whileHover={{ scale: 1.1, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Briefcase className="h-4 w-4" />
                      </motion.a>
                      <motion.a
                        href="https://github.com/azizbekdevuz"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`p-2 rounded-lg transition ${
                          darkMode
                            ? "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-blue-400"
                            : "bg-white text-gray-600 hover:bg-gray-100 hover:text-blue-600"
                        }`}
                        aria-label="GitHub"
                        whileHover={{ scale: 1.1, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Github className="h-4 w-4" />
                      </motion.a>
                      <motion.a
                        href="https://kr.linkedin.com/in/azizbek-arzikulov"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`p-2 rounded-lg transition ${
                          darkMode
                            ? "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-blue-400"
                            : "bg-white text-gray-600 hover:bg-gray-100 hover:text-blue-600"
                        }`}
                        aria-label="LinkedIn"
                        whileHover={{ scale: 1.1, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Linkedin className="h-4 w-4" />
                      </motion.a>
                      <motion.a
                        href="mailto:azizbek.dev.ac@gmail.com"
                        className={`p-2 rounded-lg transition ${
                          darkMode
                            ? "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-blue-400"
                            : "bg-white text-gray-600 hover:bg-gray-100 hover:text-blue-600"
                        }`}
                        aria-label="Email"
                        whileHover={{ scale: 1.1, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Mail className="h-4 w-4" />
                      </motion.a>
                      <span
                        className={`text-xs ml-2 ${
                          darkMode ? "text-gray-500" : "text-gray-400"
                        }`}
                      >
                        © {currentYear}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Bottom bar with tech line animation */}
        <div
          className={`py-4 text-center text-sm relative ${
            darkMode ? "text-gray-500" : "text-gray-500"
          } border-t ${darkMode ? "border-gray-800" : "border-gray-200"}`}
        >
          <div className="absolute left-0 right-0 top-0 h-px overflow-hidden">
            <motion.div
              className={`h-px ${darkMode ? "bg-blue-500/30" : "bg-blue-300/30"}`}
              animate={{
                width: ["0%", "100%", "0%"],
                left: ["0%", "0%", "100%"],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </div>
          <p>
            © {currentYear} Dr. Abolghasem Sadeghi-Niaraki. All rights
            reserved.
          </p>
        </div>
      </div>

      {/* Add the scanline animation to your global CSS */}
      <style jsx global>{`
        @keyframes scanline {
          0% {
            transform: translateY(0%);
            opacity: 0.5;
          }
          50% {
            opacity: 0.1;
          }
          100% {
            transform: translateY(100vh);
            opacity: 0.5;
          }
        }
        .scan-line {
          animation: scanline 8s linear infinite;
        }
      `}</style>
    </footer>
  );
};

export default Footer;
