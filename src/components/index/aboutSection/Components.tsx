import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "react-intersection-observer";
import {
  Sparkles,
  BookOpen,
  Network,
  ChevronDown,
  Star,
  ChevronRight,
  Book,
} from "lucide-react";
import textSystem from "@/theme/textSystem";
import { academicJourney, Experience, Awards } from "./dataComponents";

interface ScrollRevealProps {
  children: React.ReactNode;
}

// Utility Components
export const ScrollReveal: React.FC<ScrollRevealProps> = ({ children }) => {
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
};

export const ParallaxHeader: React.FC<{ darkMode: boolean }> = ({
  darkMode,
}) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  return (
    <motion.div
      className="relative h-[40vh] overflow-hidden rounded-2xl mb-16"
      onMouseMove={(e: React.MouseEvent<HTMLDivElement>) => {
        const { clientX, clientY } = e;
        const { innerWidth, innerHeight } = window;
        setMousePosition({
          x: (clientX - innerWidth / 2) / 100,
          y: (clientY - innerHeight / 2) / 100,
        });
      }}
    >
      <motion.div
        className={`absolute inset-0 bg-gradient-to-br ${darkMode ? "from-blue-600/20 to-purple-600/20" : "from-blue-400/20 to-purple-400/20"}`}
        style={{
          x: mousePosition.x * -15,
          y: mousePosition.y * -15,
        }}
      />

      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{
            opacity: [0.3, 0.6, 0.3],
            scale: [1, 1.2, 1],
            x: `${25 + Math.sin(i) * 15}%`,
            y: `${25 + Math.cos(i) * 15}%`,
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        >
          <Sparkles
            className={`w-6 h-6 ${darkMode ? "text-blue-400/30" : "text-blue-600/30"}`}
          />
        </motion.div>
      ))}

      <motion.div
        className="relative z-10 flex flex-col items-center justify-center h-full"
        style={{
          x: mousePosition.x * 10,
          y: mousePosition.y * 10,
        }}
      >
        <motion.h2
          className={`text-4xl md:text-5xl lg:text-6xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r ${
            darkMode ? textSystem.dark.gradient : textSystem.light.gradient
          }`}
        >
          About Dr. Sadeghi-Niaraki
        </motion.h2>
      </motion.div>
    </motion.div>
  );
};

// Component for displaying personal information
export const PersonalInfo: React.FC<{ darkMode: boolean }> = ({ darkMode }) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className={`p-6 lg:p-8 rounded-2xl backdrop-blur-sm ${
      darkMode ? "bg-gray-800/40" : "bg-white/40"
    } border ${darkMode ? "border-gray-700/50" : "border-gray-200/50"}`}
  >
    <div className="flex items-start gap-4 mb-6">
      <div
        className={`p-3 rounded-lg ${
          darkMode ? "bg-gray-700/50" : "bg-gray-100/50"
        }`}
      >
        <BookOpen
          className={darkMode ? "text-blue-400" : "text-blue-600"}
          size={24}
        />
      </div>
      <div>
        <h3
          className={`text-xl font-bold ${
            darkMode ? textSystem.dark.primary : textSystem.light.primary
          }`}
        >
          About Dr. Sadeghi-Niaraki
        </h3>
        <p
          className={`mt-2 ${
            darkMode ? textSystem.dark.tertiary : textSystem.light.tertiary
          }`}
        >
          An Iranian scholar and researcher, Associate Professor at Sejong
          University
        </p>
      </div>
    </div>
    <div
      className={`grid grid-cols-3 gap-4 mt-6 p-4 rounded-lg ${
        darkMode ? "bg-gray-700/30" : "bg-gray-100/30"
      }`}
    >
      {[
        { label: "Publications", value: "100+" },
        { label: "Experience", value: "15+ Years" },
        { label: "Projects", value: "30+" },
      ].map((stat, index) => (
        <div key={index} className="text-center">
          <div
            className={`text-lg font-bold ${
              darkMode ? textSystem.dark.primary : textSystem.light.primary
            }`}
          >
            {stat.value}
          </div>
          <div
            className={`text-sm ${
              darkMode ? textSystem.dark.tertiary : textSystem.light.tertiary
            }`}
          >
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  </motion.div>
);

// Component for Academic Timeline
export const AcademicTimeline: React.FC<{
  darkMode: boolean;
  selectedJourney: number;
  setSelectedJourney: (index: number) => void;
}> = ({ darkMode, selectedJourney, setSelectedJourney }) => (
  <div className="relative">
    <motion.div
      initial={{ scaleY: 0 }}
      animate={{ scaleY: 1 }}
      transition={{ duration: 1.5 }}
      className={`absolute top-0 left-1/2 w-1 h-full transform -translate-x-1/2 
        bg-gradient-to-b ${
          darkMode
            ? "from-blue-500 via-purple-500 to-blue-500"
            : "from-blue-400 via-purple-400 to-blue-400"
        }`}
    />

    <div className="relative flex flex-col space-y-12 lg:space-y-16">
      {academicJourney.map((item, index) => (
        <motion.div
          key={index}
          onClick={() => setSelectedJourney(index)}
          initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ scale: 1.02 }}
          className={`flex items-center ${
            index % 2 === 0
              ? "flex-col sm:flex-row"
              : "flex-col sm:flex-row-reverse"
          } gap-8 lg:gap-12`}
        >
          <div
            className={`flex-1 ${
              index % 2 === 0 ? "text-left sm:text-right" : "text-left"
            }`}
          >
            <motion.div
              className={`inline-block p-6 lg:p-8 rounded-xl backdrop-blur-sm 
                  ${
                    selectedJourney === index
                      ? `shadow-2xl ${
                          darkMode
                            ? "bg-gray-700/50 ring-2 ring-blue-500/50"
                            : "bg-white/60 ring-2 ring-blue-400/50"
                        }`
                      : `shadow-lg ${
                          darkMode ? "bg-gray-800/40" : "bg-white/40"
                        }`
                  }`}
            >
              <h4
                className={`text-xl lg:text-2xl font-bold ${
                  darkMode ? textSystem.dark.primary : textSystem.light.primary
                }`}
              >
                {item.title}
              </h4>
              <p
                className={`mt-2 ${
                  darkMode
                    ? textSystem.dark.secondary
                    : textSystem.light.secondary
                }`}
              >
                {item.institution}
              </p>
              <p
                className={`text-sm lg:text-base mt-2 ${
                  darkMode ? "text-blue-400" : "text-blue-600"
                }`}
              >
                {item.year}
              </p>

              <AnimatePresence>
                {selectedJourney === index && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`mt-4 lg:mt-6 lg:text-lg lg:leading-relaxed ${
                      darkMode
                        ? textSystem.dark.tertiary
                        : textSystem.light.tertiary
                    }`}
                  >
                    {item.details}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          <motion.div
            className="relative z-10"
            whileHover={{ scale: 1.2 }}
            animate={{ rotateY: selectedJourney === index ? 180 : 0 }}
          >
            <div
              className={`
                  w-16 h-16 lg:w-20 lg:h-20 rounded-full 
                  flex items-center justify-center 
                  shadow-lg backdrop-blur-md
                  ${
                    darkMode
                      ? "bg-gradient-to-br from-blue-500/20 to-purple-500/20"
                      : "bg-gradient-to-br from-blue-400/20 to-purple-400/20"
                  }
                `}
            >
              <item.icon
                className={`w-8 h-8 lg:w-10 lg:h-10 ${
                  selectedJourney === index
                    ? "text-white"
                    : darkMode
                      ? "text-blue-400"
                      : "text-blue-600"
                }`}
              />
            </div>
          </motion.div>
        </motion.div>
      ))}
    </div>
  </div>
);

// Component for Experience Item
export const ExperienceItem: React.FC<{
  exp: Experience;
  index: number;
  expandedExp: number | null;
  setExpandedExp: (index: number | null) => void;
  darkMode: boolean;
}> = ({ exp, index, expandedExp, setExpandedExp, darkMode }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    whileHover={{ scale: 1.01 }}
    className={`rounded-xl overflow-hidden ${
      darkMode ? "bg-gray-800/40" : "bg-white/40"
    } border ${darkMode ? "border-gray-700/50" : "border-gray-200/50"}`}
  >
    <motion.div
      className="p-6 lg:p-8 cursor-pointer"
      onClick={() => setExpandedExp(expandedExp === index ? null : index)}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-start gap-4 lg:gap-6">
            <div
              className={`p-3 lg:p-4 rounded-lg ${
                darkMode ? "bg-gray-700/50" : "bg-gray-100/50"
              }`}
            >
              <Network
                className={darkMode ? "text-blue-400" : "text-blue-600"}
                size={24}
              />
            </div>
            <div>
              <h4
                className={`text-xl lg:text-2xl font-bold ${
                  darkMode ? textSystem.dark.primary : textSystem.light.primary
                }`}
              >
                {exp.position}
              </h4>
              <p
                className={`mt-2 ${
                  darkMode
                    ? textSystem.dark.secondary
                    : textSystem.light.secondary
                }`}
              >
                {exp.institution}
              </p>
              <p
                className={`text-sm lg:text-base mt-1 ${
                  darkMode ? "text-blue-400" : "text-blue-600"
                }`}
              >
                {exp.duration}
              </p>
            </div>
          </div>
        </div>
        <motion.div
          animate={{ rotate: expandedExp === index ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown
            className={darkMode ? "text-blue-400" : "text-blue-600"}
            size={24}
          />
        </motion.div>
      </div>

      <AnimatePresence>
        {expandedExp === index && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mt-6 lg:mt-8 space-y-6 lg:space-y-8"
          >
            <p
              className={`lg:text-lg lg:leading-relaxed ${
                darkMode ? textSystem.dark.tertiary : textSystem.light.tertiary
              }`}
            >
              {exp.details}
            </p>

            <div className="space-y-4 lg:space-y-6">
              <h5
                className={`font-semibold lg:text-xl ${
                  darkMode ? textSystem.dark.primary : textSystem.light.primary
                }`}
              >
                Key Projects
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                {exp.projects.map((project, i) => (
                  <motion.div
                    key={`project-${index}-${i}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * i }}
                    className={`p-4 lg:p-6 rounded-lg ${
                      darkMode ? "bg-gray-700/50" : "bg-white/60"
                    } backdrop-blur-sm`}
                  >
                    <div className="flex items-center gap-2 lg:gap-3">
                      <Star
                        className={darkMode ? "text-blue-400" : "text-blue-600"}
                        size={16}
                      />
                      <span className="lg:text-lg">{project}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="space-y-4 lg:space-y-6">
              <h5
                className={`font-semibold lg:text-xl ${
                  darkMode
                    ? textSystem.dark.secondary
                    : textSystem.light.secondary
                }`}
              >
                Achievements
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                {exp.achievements.map((achievement, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * i }}
                    className={`p-4 lg:p-6 rounded-lg ${
                      darkMode ? "bg-gray-700/50" : "bg-white/60"
                    } backdrop-blur-sm`}
                  >
                    <div className="flex items-center gap-2 lg:gap-3">
                      <ChevronRight
                        className={darkMode ? "text-blue-400" : "text-blue-600"}
                      />
                      <span className="lg:text-lg">{achievement}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  </motion.div>
);

// Component for Award Item
export const AwardItem: React.FC<{
  award: Awards;
  index: number;
  hoveredAward: number | null;
  setHoveredAward: (index: number | null) => void;
  darkMode: boolean;
}> = ({ award, index, hoveredAward, setHoveredAward, darkMode }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: 0.2 * index }}
    onHoverStart={() => setHoveredAward(index)}
    onHoverEnd={() => setHoveredAward(null)}
    className="group relative"
  >
    <motion.div
      className={`absolute inset-0 rounded-xl bg-gradient-to-r ${award.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
    />

    <div
      className={`relative p-6 lg:p-8 rounded-xl backdrop-blur-sm ${
        darkMode ? "bg-gray-800/40" : "bg-white/40"
      } border ${
        darkMode ? "border-gray-700/50" : "border-gray-200/50"
      } transition-all duration-300 transform hover:scale-105`}
    >
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <Star
            className={`w-8 h-8 lg:w-10 lg:h-10 mb-4 lg:mb-6 ${
              hoveredAward === index
                ? "text-yellow-400"
                : darkMode
                  ? textSystem.dark.accent
                  : textSystem.light.accent
            } transition-colors duration-300`}
          />

          <h4
            className={`text-xl lg:text-2xl font-bold mb-2 lg:mb-3 ${
              darkMode ? textSystem.dark.primary : textSystem.light.primary
            }`}
          >
            {award.award}
          </h4>

          <p
            className={`mb-2 ${
              darkMode ? textSystem.dark.secondary : textSystem.light.secondary
            }`}
          >
            {award.organization}
          </p>

          <p
            className={`text-sm lg:text-base ${
              darkMode ? textSystem.dark.tertiary : textSystem.light.tertiary
            }`}
          >
            {award.year}
          </p>
        </div>
      </div>

      <AnimatePresence>
        {hoveredAward === index && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={`mt-4 lg:mt-6 pt-4 lg:pt-6 border-t ${
              darkMode ? "border-gray-700/30" : "border-gray-200/30"
            }`}
          >
            <p
              className={`mb-3 lg:mb-4 lg:text-lg lg:leading-relaxed ${
                darkMode ? textSystem.dark.tertiary : textSystem.light.tertiary
              }`}
            >
              {award.details}
            </p>

            <div
              className={`inline-block px-4 py-2 lg:px-6 lg:py-3 rounded-full text-sm lg:text-base ${
                darkMode
                  ? "bg-blue-500/20 text-blue-300"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              {award.impact}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  </motion.div>
);

// Component for Navigation Button
export const NavigationButton: React.FC<{ darkMode: boolean }> = ({
  darkMode,
}) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    className={`
        px-6 py-3 lg:px-8 lg:py-4 rounded-xl
        bg-gradient-to-r from-blue-500 to-purple-500
        text-white font-bold lg:text-lg
        shadow-lg hover:shadow-xl
        transition-shadow duration-300
        flex items-center gap-2 lg:gap-3
        backdrop-blur-sm
        ${darkMode ? "hover:bg-opacity-90" : "hover:bg-opacity-95"}
      `}
    onClick={() => (window.location.href = "/about")}
  >
    <Book className="w-4 h-4 lg:w-5 lg:h-5" />
    <span>Explore Full Story</span>
    <ChevronRight className="w-4 h-4 lg:w-5 lg:h-5" />
  </motion.button>
);
