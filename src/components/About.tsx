import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "react-intersection-observer";
import VideoS from "./VideoS";
import textSystem from "./textSystem";
import {
  GraduationCap,
  Building,
  Calendar,
  Briefcase,
  ChevronDown,
  ChevronRight,
  Book,
  Award,
  Star,
  Sparkles,
  BookOpen,
  Network,
  LucideProps,
} from "lucide-react";

// Type definitions
interface AboutProps {
  darkMode: boolean;
}

interface ScrollRevealProps {
  children: React.ReactNode;
}

interface ParallaxHeaderProps {
  darkMode: boolean;
}

interface TimelineItem {
  title: string;
  institution: string;
  year: string;
  details: string;
  icon: React.FC<LucideProps>;
}

interface Experience {
  position: string;
  institution: string;
  duration: string;
  details: string;
  achievements: string[];
  projects: string[];
}

interface Award {
  award: string;
  organization: string;
  year: string;
  details: string;
  impact: string;
  color: string;
}

// Utility Components
const ScrollReveal: React.FC<ScrollRevealProps> = ({ children }) => {
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

const ParallaxHeader: React.FC<ParallaxHeaderProps> = ({ darkMode }) => {
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

const About: React.FC<AboutProps> = ({ darkMode }) => {
  const [expandedExp, setExpandedExp] = useState<number | null>(null);
  const [selectedJourney, setSelectedJourney] = useState<number>(0);
  const [hoveredAward, setHoveredAward] = useState<number | null>(null);

  const academicJourney: TimelineItem[] = [
    {
      title: "Ph.D. in Geo-Informatics Engineering",
      institution: "INHA University, South Korea",
      year: "Ph.D. Completed",
      details:
        "Specialized in advanced Geo-AI applications and spatial analysis",
      icon: GraduationCap,
    },
    {
      title: "Post-doctoral Research",
      institution: "University of Melbourne, Australia",
      year: "Post-Doc",
      details:
        "Focused on integrating XR technologies with geographical information systems",
      icon: Building,
    },
    {
      title: "M.Sc. in GIS Engineering",
      institution: "K.N. Toosi University of Technology, Iran",
      year: "Master's Degree",
      details: "Research focused on GIS applications in urban planning",
      icon: GraduationCap,
    },
    {
      title: "B.Sc. in Geomatics-Civil Engineering",
      institution: "K.N. Toosi University of Technology, Iran",
      year: "Bachelor's Degree",
      details: "Foundation in geospatial technologies and civil engineering",
      icon: GraduationCap,
    },
  ];

  const experiences: Experience[] = [
    {
      position: "Associate Professor",
      institution: "Sejong University, South Korea",
      duration: "2017 - Present",
      details: "Leading research in Geo-AI and XR technologies",
      achievements: [
        "Published 30+ research papers",
        "Supervised 15+ graduate students",
        "Secured major research grants",
      ],
      projects: [
        "Smart City Development",
        "AI-Enhanced GIS",
        "XR Navigation Systems",
      ],
    },
    {
      position: "Research Consultant",
      institution: "Various International Projects",
      duration: "2010 - Present",
      details: "Providing expert consultation on GIS implementation",
      achievements: [
        "Led 10+ international projects",
        "Developed innovative GIS solutions",
        "Collaborated with global teams",
      ],
      projects: [
        "Urban Planning Systems",
        "Environmental Monitoring",
        "Transportation Analytics",
      ],
    },
  ];

  const awards: Award[] = [
    {
      award: "Best Research Paper Award",
      organization: "GIS International Conference",
      year: "2020",
      details: "Recognition for innovative work in Geo-AI integration",
      impact: "Cited by 100+ researchers worldwide",
      color: "from-blue-500 to-purple-500",
    },
    {
      award: "Outstanding Educator Award",
      organization: "Sejong University",
      year: "2019",
      details: "Acknowledged for excellence in teaching and mentorship",
      impact: "Improved student satisfaction rates by 40%",
      color: "from-green-500 to-blue-500",
    },
  ];

  return (
    <>
      <div className="min-h-screen w-full overflow-x-hidden">
        <div className="relative w-full">
          {/* Mobile and Tablet Layout */}
          <div className="block lg:hidden">
            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="relative min-h-screen overflow-hidden px-4 sm:px-6"
            >
              <div className="py-8">
                <ParallaxHeader darkMode={darkMode} />
              </div>

              {/* Mobile Content */}
              <div className="space-y-12">
                <ScrollReveal>
                  <div className="space-y-6">
                    <div className="w-full">
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        className={`p-6 rounded-2xl backdrop-blur-sm ${
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
                              className={
                                darkMode ? "text-blue-400" : "text-blue-600"
                              }
                              size={24}
                            />
                          </div>
                          <div>
                            <h3
                              className={`text-xl font-bold ${
                                darkMode
                                  ? textSystem.dark.primary
                                  : textSystem.light.primary
                              }`}
                            >
                              About Dr. Sadeghi-Niaraki
                            </h3>
                            <p
                              className={`mt-2 ${
                                darkMode
                                  ? textSystem.dark.tertiary
                                  : textSystem.light.tertiary
                              }`}
                            >
                              An Iranian scholar and researcher, Associate
                              Professor at Sejong University
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
                                  darkMode
                                    ? textSystem.dark.primary
                                    : textSystem.light.primary
                                }`}
                              >
                                {stat.value}
                              </div>
                              <div
                                className={`text-sm ${
                                  darkMode
                                    ? textSystem.dark.tertiary
                                    : textSystem.light.tertiary
                                }`}
                              >
                                {stat.label}
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    </div>
                    <div className="w-full">
                      <VideoS darkMode={darkMode} />
                    </div>
                  </div>
                </ScrollReveal>

                {/* Academic Journey Section */}
                <ScrollReveal>
                  <div className="relative mb-24">
                    <motion.div className="flex items-center justify-center gap-3 mb-12">
                      <Calendar
                        className={darkMode ? "text-blue-400" : "text-blue-600"}
                        size={32}
                      />
                      <h3
                        className={`text-3xl font-bold ${
                          darkMode
                            ? textSystem.dark.primary
                            : textSystem.light.primary
                        }`}
                      >
                        Academic Journey
                      </h3>
                    </motion.div>

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

                      <div className="relative flex flex-col space-y-12">
                        {academicJourney.map((item, index) => (
                          <motion.div
                            key={index}
                            onClick={() => setSelectedJourney(index)}
                            initial={{
                              opacity: 0,
                              x: index % 2 === 0 ? -50 : 50,
                            }}
                            animate={{ opacity: 1, x: 0 }}
                            whileHover={{ scale: 1.02 }}
                            className={`flex flex-col sm:flex-row items-center ${
                              index % 2 === 0
                                ? "sm:flex-row"
                                : "sm:flex-row-reverse"
                            } gap-8`}
                          >
                            <div
                              className={`flex-1 ${index % 2 === 0 ? "sm:text-right" : "sm:text-left"}`}
                            >
                              <motion.div
                                className={`inline-block p-6 rounded-xl backdrop-blur-sm 
                                ${
                                  selectedJourney === index
                                    ? `shadow-2xl ${
                                        darkMode
                                          ? "bg-gray-700/50 ring-2 ring-blue-500/50"
                                          : "bg-white/60 ring-2 ring-blue-400/50"
                                      }`
                                    : `shadow-lg ${
                                        darkMode
                                          ? "bg-gray-800/40"
                                          : "bg-white/40"
                                      }`
                                }`}
                              >
                                <h4
                                  className={`text-xl font-bold ${
                                    darkMode
                                      ? textSystem.dark.primary
                                      : textSystem.light.primary
                                  }`}
                                >
                                  {item.title}
                                </h4>
                                <p
                                  className={
                                    darkMode
                                      ? textSystem.dark.secondary
                                      : textSystem.light.secondary
                                  }
                                >
                                  {item.institution}
                                </p>
                                <p
                                  className={`text-sm mt-2 ${darkMode ? "text-blue-400" : "text-blue-600"}`}
                                >
                                  {item.year}
                                </p>

                                <AnimatePresence>
                                  {selectedJourney === index && (
                                    <motion.p
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: "auto" }}
                                      exit={{ opacity: 0, height: 0 }}
                                      className={`mt-4 ${
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
                              animate={{
                                rotateY: selectedJourney === index ? 180 : 0,
                              }}
                            >
                              <div
                                className={`
                              w-16 h-16 rounded-full 
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
                                  className={`w-8 h-8 ${
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
                  </div>
                </ScrollReveal>

                {/* Professional Experience Section */}
                <ScrollReveal>
                  <div className="mb-24">
                    <motion.div className="flex items-center justify-center gap-3 mb-12">
                      <Briefcase
                        className={darkMode ? "text-blue-400" : "text-blue-600"}
                        size={32}
                      />
                      <h3
                        className={`text-3xl font-bold ${
                          darkMode
                            ? textSystem.dark.primary
                            : textSystem.light.primary
                        }`}
                      >
                        Professional Experience
                      </h3>
                    </motion.div>

                    <div className="space-y-6">
                      {experiences.map((exp, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          whileHover={{ scale: 1.01 }}
                          className={`rounded-xl overflow-hidden ${
                            darkMode ? "bg-gray-800/40" : "bg-white/40"
                          } border ${darkMode ? "border-gray-700/50" : "border-gray-200/50"}`}
                        >
                          <motion.div
                            className="p-6 cursor-pointer"
                            onClick={() =>
                              setExpandedExp(
                                expandedExp === index ? null : index,
                              )
                            }
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-start gap-4">
                                  <div
                                    className={`p-3 rounded-lg ${
                                      darkMode
                                        ? "bg-gray-700/50"
                                        : "bg-gray-100/50"
                                    }`}
                                  >
                                    <Network
                                      className={
                                        darkMode
                                          ? "text-blue-400"
                                          : "text-blue-600"
                                      }
                                      size={24}
                                    />
                                  </div>
                                  <div>
                                    <h4
                                      className={`text-xl font-bold ${
                                        darkMode
                                          ? textSystem.dark.primary
                                          : textSystem.light.primary
                                      }`}
                                    >
                                      {exp.position}
                                    </h4>
                                    <p
                                      className={
                                        darkMode
                                          ? textSystem.dark.secondary
                                          : textSystem.light.secondary
                                      }
                                    >
                                      {exp.institution}
                                    </p>
                                    <p
                                      className={`text-sm ${darkMode ? "text-blue-400" : "text-blue-600"}`}
                                    >
                                      {exp.duration}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <motion.div
                                animate={{
                                  rotate: expandedExp === index ? 180 : 0,
                                }}
                                transition={{ duration: 0.3 }}
                              >
                                <ChevronDown
                                  className={
                                    darkMode ? "text-blue-400" : "text-blue-600"
                                  }
                                />
                              </motion.div>
                            </div>

                            <AnimatePresence>
                              {expandedExp === index && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="mt-6 space-y-6"
                                >
                                  <p
                                    className={
                                      darkMode
                                        ? textSystem.dark.tertiary
                                        : textSystem.light.tertiary
                                    }
                                  >
                                    {exp.details}
                                  </p>

                                  <div className="space-y-4">
                                    <h5
                                      className={`font-semibold ${
                                        darkMode
                                          ? textSystem.dark.primary
                                          : textSystem.light.primary
                                      }`}
                                    >
                                      Key Projects
                                    </h5>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                      {exp.projects.map((project, i) => (
                                        <motion.div
                                          key={`project-${index}-${i}`}
                                          initial={{ opacity: 0, y: 20 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          transition={{ delay: 0.1 * i }}
                                          className={`p-4 rounded-lg ${
                                            darkMode
                                              ? "bg-gray-700/50"
                                              : "bg-white/60"
                                          } backdrop-blur-sm`}
                                        >
                                          <div className="flex items-center gap-2">
                                            <Star
                                              className={
                                                darkMode
                                                  ? "text-blue-400"
                                                  : "text-blue-600"
                                              }
                                              size={16}
                                            />
                                            <span>{project}</span>
                                          </div>
                                        </motion.div>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="space-y-4">
                                    <h5
                                      className={`font-semibold ${
                                        darkMode
                                          ? textSystem.dark.secondary
                                          : textSystem.light.secondary
                                      }`}
                                    >
                                      Achievements
                                    </h5>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                      {exp.achievements.map(
                                        (achievement, i) => (
                                          <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.1 * i }}
                                            className={`p-4 rounded-lg ${
                                              darkMode
                                                ? "bg-gray-700/50"
                                                : "bg-white/60"
                                            } backdrop-blur-sm`}
                                          >
                                            <div className="flex items-center gap-2">
                                              <ChevronRight
                                                className={
                                                  darkMode
                                                    ? "text-blue-400"
                                                    : "text-blue-600"
                                                }
                                              />
                                              <span>{achievement}</span>
                                            </div>
                                          </motion.div>
                                        ),
                                      )}
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </ScrollReveal>

                {/* Awards Section */}
                <ScrollReveal>
                  <div className="mb-24">
                    <motion.div className="flex items-center justify-center gap-3 mb-12">
                      <Award
                        className={darkMode ? "text-blue-400" : "text-blue-600"}
                        size={32}
                      />
                      <h3
                        className={`text-3xl font-bold ${
                          darkMode
                            ? textSystem.dark.primary
                            : textSystem.light.primary
                        }`}
                      >
                        Awards and Recognition
                      </h3>
                    </motion.div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {awards.map((award, index) => (
                        <motion.div
                          key={index}
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
                            className={`relative p-8 rounded-xl backdrop-blur-sm ${
                              darkMode ? "bg-gray-800/40" : "bg-white/40"
                            } border ${
                              darkMode
                                ? "border-gray-700/50"
                                : "border-gray-200/50"
                            } transition-all duration-300 transform hover:scale-105`}
                          >
                            <div className="flex items-start gap-4">
                              <div className="flex-1">
                                <Star
                                  className={`w-8 h-8 mb-4 ${
                                    hoveredAward === index
                                      ? "text-yellow-400"
                                      : darkMode
                                        ? textSystem.dark.accent
                                        : textSystem.light.accent
                                  } transition-colors duration-300`}
                                />

                                <h4
                                  className={`text-xl font-bold mb-2 ${
                                    darkMode
                                      ? textSystem.dark.primary
                                      : textSystem.light.primary
                                  }`}
                                >
                                  {award.award}
                                </h4>

                                <p
                                  className={`mb-2 ${
                                    darkMode
                                      ? textSystem.dark.secondary
                                      : textSystem.light.secondary
                                  }`}
                                >
                                  {award.organization}
                                </p>

                                <p
                                  className={`text-sm ${
                                    darkMode
                                      ? textSystem.dark.tertiary
                                      : textSystem.light.tertiary
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
                                  transition={{
                                    duration: 0.3,
                                    ease: "easeOut",
                                  }}
                                  className={`mt-4 pt-4 border-t ${
                                    darkMode
                                      ? "border-gray-700/30"
                                      : "border-gray-200/30"
                                  }`}
                                >
                                  <p
                                    className={`mb-3 ${
                                      darkMode
                                        ? textSystem.dark.tertiary
                                        : textSystem.light.tertiary
                                    }`}
                                  >
                                    {award.details}
                                  </p>

                                  <div
                                    className={`inline-block px-4 py-2 rounded-full text-sm ${
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
                      ))}
                    </div>
                  </div>
                </ScrollReveal>
              </div>
              {/* Navigation Button - Mobile */}
              <div className="flex justify-center mb-8">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`
                    px-6 py-3 rounded-xl
                    bg-gradient-to-r from-blue-500 to-purple-500
                    text-white font-bold
                    shadow-lg hover:shadow-xl
                    transition-shadow duration-300
                    flex items-center gap-2
                    backdrop-blur-sm
                    ${darkMode ? "hover:bg-opacity-90" : "hover:bg-opacity-95"}
                  `}
                  onClick={() => (window.location.href = "/about")}
                >
                  <Book className="w-4 h-4" />
                  <span>Explore Full Story</span>
                  <ChevronRight className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.section>
          </div>

          {/* Fixed Desktop Layout */}
          <div className="hidden lg:block">
            <motion.section
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="relative min-h-screen px-8 py-12"
            >
              <div className="max-w-7xl mx-auto space-y-24">
                {/* Parallax Header */}
                <ParallaxHeader darkMode={darkMode} />

                {/* Introduction Section */}
                <ScrollReveal>
                  <div className="grid grid-cols-2 gap-12 items-start">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className={`p-8 rounded-2xl backdrop-blur-sm ${
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
                            className={
                              darkMode ? "text-blue-400" : "text-blue-600"
                            }
                            size={24}
                          />
                        </div>
                        <div>
                          <h3
                            className={`text-xl font-bold ${
                              darkMode
                                ? textSystem.dark.primary
                                : textSystem.light.primary
                            }`}
                          >
                            About Dr. Sadeghi-Niaraki
                          </h3>
                          <p
                            className={`mt-2 ${
                              darkMode
                                ? textSystem.dark.tertiary
                                : textSystem.light.tertiary
                            }`}
                          >
                            An Iranian scholar and researcher, Associate
                            Professor at Sejong University
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
                                darkMode
                                  ? textSystem.dark.primary
                                  : textSystem.light.primary
                              }`}
                            >
                              {stat.value}
                            </div>
                            <div
                              className={`text-sm ${
                                darkMode
                                  ? textSystem.dark.tertiary
                                  : textSystem.light.tertiary
                              }`}
                            >
                              {stat.label}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                    <div className="h-full">
                      <VideoS darkMode={darkMode} />
                    </div>
                  </div>
                </ScrollReveal>

                {/* Academic Journey Section */}
                <ScrollReveal>
                  <div className="mb-32">
                    <motion.div className="flex items-center justify-center gap-3 mb-16">
                      <Calendar
                        className={darkMode ? "text-blue-400" : "text-blue-600"}
                        size={40}
                      />
                      <h3
                        className={`text-4xl font-bold ${
                          darkMode
                            ? textSystem.dark.primary
                            : textSystem.light.primary
                        }`}
                      >
                        Academic Journey
                      </h3>
                    </motion.div>

                    <div className="relative max-w-5xl mx-auto">
                      {/* Timeline line */}
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
                      <div className="relative flex flex-col space-y-16">
                        {academicJourney.map((item, index) => (
                          <motion.div
                            key={index}
                            onClick={() => setSelectedJourney(index)}
                            initial={{
                              opacity: 0,
                              x: index % 2 === 0 ? -50 : 50,
                            }}
                            animate={{ opacity: 1, x: 0 }}
                            whileHover={{ scale: 1.02 }}
                            className={`flex items-center ${
                              index % 2 === 0 ? "flex-row" : "flex-row-reverse"
                            } gap-12`}
                          >
                            <div
                              className={`flex-1 ${index % 2 === 0 ? "text-right" : "text-left"}`}
                            >
                              <motion.div
                                className={`inline-block p-8 rounded-xl backdrop-blur-sm 
                                    ${
                                      selectedJourney === index
                                        ? `shadow-2xl ${
                                            darkMode
                                              ? "bg-gray-700/50 ring-2 ring-blue-500/50"
                                              : "bg-white/60 ring-2 ring-blue-400/50"
                                          }`
                                        : `shadow-lg ${
                                            darkMode
                                              ? "bg-gray-800/40"
                                              : "bg-white/40"
                                          }`
                                    }`}
                              >
                                <h4
                                  className={`text-2xl font-bold ${
                                    darkMode
                                      ? textSystem.dark.primary
                                      : textSystem.light.primary
                                  }`}
                                >
                                  {item.title}
                                </h4>
                                <p
                                  className={`text-lg mt-2 ${darkMode ? textSystem.dark.secondary : textSystem.light.secondary}`}
                                >
                                  {item.institution}
                                </p>
                                <p
                                  className={`text-base mt-2 ${darkMode ? "text-blue-400" : "text-blue-600"}`}
                                >
                                  {item.year}
                                </p>

                                <AnimatePresence>
                                  {selectedJourney === index && (
                                    <motion.p
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: "auto" }}
                                      exit={{ opacity: 0, height: 0 }}
                                      className={`mt-6 text-lg leading-relaxed ${
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
                              animate={{
                                rotateY: selectedJourney === index ? 180 : 0,
                              }}
                            >
                              <div
                                className={`
                                  w-20 h-20 rounded-full 
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
                                  className={`w-10 h-10 ${
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
                  </div>
                </ScrollReveal>

                {/* Professional Experience Section */}
                <ScrollReveal>
                  <div className="mb-32">
                    <motion.div className="flex items-center justify-center gap-3 mb-16">
                      <Briefcase
                        className={darkMode ? "text-blue-400" : "text-blue-600"}
                        size={40}
                      />
                      <h3
                        className={`text-4xl font-bold ${
                          darkMode
                            ? textSystem.dark.primary
                            : textSystem.light.primary
                        }`}
                      >
                        Professional Experience
                      </h3>
                    </motion.div>

                    <div className="space-y-8">
                      {experiences.map((exp, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          whileHover={{ scale: 1.01 }}
                          className={`rounded-xl overflow-hidden ${
                            darkMode ? "bg-gray-800/40" : "bg-white/40"
                          } border ${darkMode ? "border-gray-700/50" : "border-gray-200/50"}`}
                        >
                          <motion.div
                            className="p-8 cursor-pointer"
                            onClick={() =>
                              setExpandedExp(
                                expandedExp === index ? null : index,
                              )
                            }
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="flex items-start gap-6">
                                  <div
                                    className={`p-4 rounded-lg ${
                                      darkMode
                                        ? "bg-gray-700/50"
                                        : "bg-gray-100/50"
                                    }`}
                                  >
                                    <Network
                                      className={
                                        darkMode
                                          ? "text-blue-400"
                                          : "text-blue-600"
                                      }
                                      size={32}
                                    />
                                  </div>
                                  <div>
                                    <h4
                                      className={`text-2xl font-bold ${
                                        darkMode
                                          ? textSystem.dark.primary
                                          : textSystem.light.primary
                                      }`}
                                    >
                                      {exp.position}
                                    </h4>
                                    <p
                                      className={`text-lg mt-2 ${darkMode ? textSystem.dark.secondary : textSystem.light.secondary}`}
                                    >
                                      {exp.institution}
                                    </p>
                                    <p
                                      className={`text-base mt-1 ${darkMode ? "text-blue-400" : "text-blue-600"}`}
                                    >
                                      {exp.duration}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <motion.div
                                animate={{
                                  rotate: expandedExp === index ? 180 : 0,
                                }}
                                transition={{ duration: 0.3 }}
                              >
                                <ChevronDown
                                  className={
                                    darkMode ? "text-blue-400" : "text-blue-600"
                                  }
                                  size={32}
                                />
                              </motion.div>
                            </div>

                            <AnimatePresence>
                              {expandedExp === index && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="mt-8 space-y-8"
                                >
                                  <p
                                    className={`text-lg leading-relaxed ${
                                      darkMode
                                        ? textSystem.dark.tertiary
                                        : textSystem.light.tertiary
                                    }`}
                                  >
                                    {exp.details}
                                  </p>

                                  <div className="space-y-6">
                                    <h5
                                      className={`text-xl font-semibold ${
                                        darkMode
                                          ? textSystem.dark.primary
                                          : textSystem.light.primary
                                      }`}
                                    >
                                      Key Projects
                                    </h5>
                                    <div className="grid grid-cols-3 gap-6">
                                      {exp.projects.map((project, i) => (
                                        <motion.div
                                          key={`project-${index}-${i}`}
                                          initial={{ opacity: 0, y: 20 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          transition={{ delay: 0.1 * i }}
                                          className={`p-6 rounded-lg ${
                                            darkMode
                                              ? "bg-gray-700/50"
                                              : "bg-white/60"
                                          } backdrop-blur-sm`}
                                        >
                                          <div className="flex items-center gap-3">
                                            <Star
                                              className={
                                                darkMode
                                                  ? "text-blue-400"
                                                  : "text-blue-600"
                                              }
                                              size={20}
                                            />
                                            <span className="text-lg">
                                              {project}
                                            </span>
                                          </div>
                                        </motion.div>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="space-y-6">
                                    <h5
                                      className={`text-xl font-semibold ${
                                        darkMode
                                          ? textSystem.dark.secondary
                                          : textSystem.light.secondary
                                      }`}
                                    >
                                      Achievements
                                    </h5>
                                    <div className="grid grid-cols-2 gap-6">
                                      {exp.achievements.map(
                                        (achievement, i) => (
                                          <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.1 * i }}
                                            className={`p-6 rounded-lg ${
                                              darkMode
                                                ? "bg-gray-700/50"
                                                : "bg-white/60"
                                            } backdrop-blur-sm`}
                                          >
                                            <div className="flex items-center gap-3">
                                              <ChevronRight
                                                className={
                                                  darkMode
                                                    ? "text-blue-400"
                                                    : "text-blue-600"
                                                }
                                                size={20}
                                              />
                                              <span className="text-lg">
                                                {achievement}
                                              </span>
                                            </div>
                                          </motion.div>
                                        ),
                                      )}
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </ScrollReveal>

                {/* Awards Section */}
                <ScrollReveal>
                  <div className="mb-32">
                    <motion.div className="flex items-center justify-center gap-3 mb-16">
                      <Award
                        className={darkMode ? "text-blue-400" : "text-blue-600"}
                        size={40}
                      />
                      <h3
                        className={`text-4xl font-bold ${
                          darkMode
                            ? textSystem.dark.primary
                            : textSystem.light.primary
                        }`}
                      >
                        Awards and Recognition
                      </h3>
                    </motion.div>

                    <div className="grid grid-cols-3 gap-8">
                      {awards.map((award, index) => (
                        <motion.div
                          key={index}
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
                            className={`relative p-8 rounded-xl backdrop-blur-sm ${
                              darkMode ? "bg-gray-800/40" : "bg-white/40"
                            } border ${
                              darkMode
                                ? "border-gray-700/50"
                                : "border-gray-200/50"
                            } transition-all duration-300 transform hover:scale-105`}
                          >
                            <div className="flex items-start gap-4">
                              <div className="flex-1">
                                <Star
                                  className={`w-10 h-10 mb-6 ${
                                    hoveredAward === index
                                      ? "text-yellow-400"
                                      : darkMode
                                        ? textSystem.dark.accent
                                        : textSystem.light.accent
                                  } transition-colors duration-300`}
                                />

                                <h4
                                  className={`text-2xl font-bold mb-3 ${
                                    darkMode
                                      ? textSystem.dark.primary
                                      : textSystem.light.primary
                                  }`}
                                >
                                  {award.award}
                                </h4>

                                <p
                                  className={`text-lg mb-2 ${
                                    darkMode
                                      ? textSystem.dark.secondary
                                      : textSystem.light.secondary
                                  }`}
                                >
                                  {award.organization}
                                </p>

                                <p
                                  className={`text-base ${
                                    darkMode
                                      ? textSystem.dark.tertiary
                                      : textSystem.light.tertiary
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
                                  transition={{
                                    duration: 0.3,
                                    ease: "easeOut",
                                  }}
                                  className={`mt-6 pt-6 border-t ${
                                    darkMode
                                      ? "border-gray-700/30"
                                      : "border-gray-200/30"
                                  }`}
                                >
                                  <p
                                    className={`text-lg leading-relaxed mb-4 ${
                                      darkMode
                                        ? textSystem.dark.tertiary
                                        : textSystem.light.tertiary
                                    }`}
                                  >
                                    {award.details}
                                  </p>

                                  <div
                                    className={`inline-block px-6 py-3 rounded-full text-base ${
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
                      ))}
                    </div>
                  </div>
                </ScrollReveal>
              </div>
              {/* Navigation Button - Desktop */}
              <div className="flex justify-center mb-8">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`
                    px-8 py-4 rounded-xl
                    bg-gradient-to-r from-blue-500 to-purple-500
                    text-white font-bold text-lg
                    shadow-lg hover:shadow-xl
                    transition-shadow duration-300
                    flex items-center gap-3
                    backdrop-blur-sm
                    ${darkMode ? "hover:bg-opacity-90" : "hover:bg-opacity-95"}
                  `}
                  onClick={() => (window.location.href = "/about")}
                >
                  <Book className="w-5 h-5" />
                  <span>Explore Full Story</span>
                  <ChevronRight className="w-5 h-5" />
                </motion.button>
              </div>
            </motion.section>
          </div>

          {/* Floating scroll indicator */}
          <div className="fixed bottom-8 right-8 lg:hidden">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                darkMode ? "bg-blue-500" : "bg-blue-600"
              } text-white shadow-lg`}
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            >
              <ChevronDown className="w-6 h-6 transform rotate-180" />
            </motion.button>
          </div>
        </div>
      </div>
    </>
  );
};

export default About;
