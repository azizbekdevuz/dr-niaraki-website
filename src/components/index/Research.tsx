import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import textSystem from "@/theme/textSystem";
import {
  Book,
  Globe,
  Brain,
  HeartPulse,
  Network,
  CircuitBoard,
  Sparkles,
  Activity,
  Clock,
  ArrowRight,
  X,
  ExternalLink,
} from "lucide-react";
import useDeviceDetect from "@/hooks/useDeviceDetect";

const Research: React.FC<{ darkMode: boolean }> = ({ darkMode }) => {
  const { isMobile, isTablet } = useDeviceDetect();
  const [showModal, setShowModal] = useState<
    (typeof researchProjects)[0] | null
  >(null);
  const [, setHoveredProject] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState("all");

  const categories = [
    { id: "all", label: "All Research", icon: Book },
    { id: "xr", label: "XR & Metaverse", icon: Globe },
    { id: "ai", label: "AI & Computing", icon: Brain },
    { id: "health", label: "Healthcare", icon: HeartPulse },
  ];

  const researchProjects = [
    {
      title: "Super-Realistic XR Technology for the Metaverse",
      description:
        "Exploring interconnected immersive environments for XR and Metaverse applications, funded by the Ministry of Science, South Korea.",
      duration: "2022 - 2030",
      details:
        "This project aims to create a super-realistic Metaverse experience using advanced XR technologies. The research focuses on immersive environments, leveraging cutting-edge graphics and AI to enhance user interaction and experience.",
      category: "xr",
      icon: Network,
      stats: {
        publications: 12,
        citations: 145,
        collaborators: 8,
      },
      status: "active",
    },
    {
      title: "Mobile Virtual Reality Research Center",
      description:
        "Innovative VR solutions for mobile platforms under the Korean Ministry of Science and ICT.",
      duration: "2017 - 2021",
      details:
        "The Mobile VR Research Center pioneered VR solutions for mobile devices, advancing accessible immersive experiences.",
      category: "xr",
      icon: CircuitBoard,
      stats: {
        publications: 25,
        citations: 320,
        collaborators: 15,
      },
      status: "completed",
    },
    {
      title: "Geo-AI and Disaster Management",
      description:
        "Geo-AI applications for mapping natural hazards and supporting decision-making processes.",
      duration: "Ongoing",
      details:
        "Geo-AI and Disaster Management integrates AI in geographic information systems to predict and manage natural hazards.",
      category: "ai",
      icon: Brain,
      stats: {
        publications: 8,
        citations: 95,
        collaborators: 6,
      },
      status: "active",
    },
    {
      title: "Healthcare and Telemedicine Projects",
      description:
        "Advancing healthcare accessibility with GIS-based telemedicine solutions in partnership with the UN and other agencies.",
      duration: "Completed",
      details:
        "This initiative improved telemedicine by integrating GIS to enhance healthcare accessibility in remote areas.",
      category: "health",
      icon: HeartPulse,
      stats: {
        publications: 15,
        citations: 180,
        collaborators: 12,
      },
      status: "completed",
    },
    {
      title: "International Research Collaborations",
      description:
        "Collaborative projects with ETRI, KAIST, and other global institutions on Geo-AI and ICT development.",
      duration: "Ongoing",
      details:
        "Engaging with institutions like ETRI and KAIST, this project explores global research initiatives in Geo-AI and ICT.",
      category: "ai",
      icon: Globe,
      stats: {
        publications: 18,
        citations: 210,
        collaborators: 20,
      },
      status: "active",
    },
  ];

  const filteredProjects =
    activeFilter === "all"
      ? researchProjects
      : researchProjects.filter((project) => project.category === activeFilter);

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="relative min-h-screen"
    >
      <div className="max-w-3xl sm:max-w-5xl md:max-w-7xl mx-auto px-2 sm:px-4 md:px-8 py-8 sm:py-12 md:py-16">
        {/* Title with Floating Elements */}
        <div className="relative mb-8 sm:mb-12 md:mb-16">
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.1 }}
          >
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className={`absolute ${
                  darkMode ? "text-blue-400" : "text-blue-600"
                }`}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{
                  opacity: [0.3, 0.6, 0.3],
                  scale: [1, 1.2, 1],
                  x: Math.sin(i) * 100,
                  y: Math.cos(i) * 100,
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              >
                <Sparkles size={isMobile ? 16 : 24} />
              </motion.div>
            ))}
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r ${
              darkMode ? textSystem.dark.gradient : textSystem.light.gradient
            } relative z-10`}
          >
            Research Highlights
          </motion.h2>
        </div>

        {/* Category Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${isMobile ? "flex overflow-x-auto gap-2 mb-6 pb-2 no-scrollbar" : "flex flex-wrap justify-center gap-4 mb-12"}`}
        >
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <motion.button
                key={category.id}
                onClick={() => setActiveFilter(category.id)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center gap-2 ${isMobile ? "px-4 py-2 text-sm" : "px-6 py-3"} rounded-full transition-all duration-300 whitespace-nowrap ${
                  activeFilter === category.id
                    ? darkMode
                      ? "bg-blue-500/20 text-blue-300"
                      : "bg-blue-100 text-blue-800"
                    : darkMode
                      ? "bg-gray-800/40 hover:bg-gray-700/50"
                      : "bg-white/40 hover:bg-white/60"
                }`}
                aria-label={category.label}
              >
                <Icon size={isMobile ? 16 : 20} />
                {category.label}
              </motion.button>
            );
          })}
        </motion.div>

        {/* Research Grid with Staggered Animation */}
        <div className="flex flex-col justify-center w-full">
          <div className="w-full" style={{ maxWidth: isMobile ? "100%" : isTablet ? "700px" : "1200px" }}>
            <motion.div
              className={`${isMobile ? "flex flex-col gap-4" : isTablet ? "grid grid-cols-2 gap-6" : "grid grid-cols-3 gap-8"}`}
              style={isMobile ? {} : undefined}
            >
              <AnimatePresence mode="popLayout">
                {filteredProjects.map((project, index) => {
                  const Icon = project.icon;
                  return (
                    <motion.div
                      key={project.title}
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      onHoverStart={() => setHoveredProject(project.title || null)}
                      onHoverEnd={() => setHoveredProject(null)}
                      className={`relative group w-full rounded-xl ${
                        darkMode ? "bg-gray-800/40" : "bg-white/40"
                      } backdrop-blur-sm border ${
                        darkMode ? "border-gray-700/50" : "border-gray-200/50"
                      } ${isMobile ? "p-4" : "p-8"}`}
                    >
                      {/* Status Indicator */}
                      <div
                        className={`absolute top-2 right-2 flex items-center gap-2 px-2 py-1 rounded-full text-xs ${
                          project.status === "active"
                            ? darkMode
                              ? "bg-green-500/20 text-green-300"
                              : "bg-green-100 text-green-800"
                            : darkMode
                              ? "bg-gray-500/20 text-gray-300"
                              : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        <Activity size={isMobile ? 10 : 14} />
                        {project.status === "active" ? "Active" : "Completed"}
                      </div>

                      <div className="h-full flex flex-col">
                        {/* Icon and Title Section */}
                        <div className="flex items-start gap-3 mb-2">
                          <div
                            className={`p-2 rounded-lg ${
                              darkMode ? "bg-gray-700/50" : "bg-gray-100/50"
                            }`}
                          >
                            <Icon
                              size={isMobile ? 16 : 24}
                              className={darkMode ? "text-blue-400" : "text-blue-600"}
                            />
                          </div>
                          <div className="flex-1">
                            <h3
                              className={`font-bold ${isMobile ? "text-base" : "text-xl"} ${
                                darkMode ? textSystem.dark.primary : textSystem.light.primary
                              }`}
                            >
                              {project.title}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Clock
                                size={isMobile ? 10 : 14}
                                className={darkMode ? "text-gray-400" : "text-gray-600"}
                              />
                              <span className="text-xs sm:text-sm">
                                {project.duration}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Description with flex-grow to push stats to bottom */}
                        <div className="flex-grow">
                          <p
                            className={`mb-4 ${
                              darkMode ? textSystem.dark.tertiary : textSystem.light.tertiary
                            } ${isMobile ? "text-xs" : "text-base"}`}
                          >
                            {project.description}
                          </p>
                        </div>

                        {/* Stats and Button Section - Always at Bottom */}
                        <div className="mt-auto">
                          {/* Stats Grid */}
                          <div className={`grid ${isMobile ? "grid-cols-1 gap-2 mb-3" : "grid-cols-3 gap-4 mb-6"}`}>
                            {Object.entries(project.stats).map(
                              ([key, value]) => (
                                <div key={key} className="text-center">
                                  <div
                                    className={`font-bold ${isMobile ? "text-base" : "text-lg"} ${
                                      darkMode ? textSystem.dark.primary : textSystem.light.primary
                                    }`}
                                  >
                                    {value}
                                  </div>
                                  <div
                                    className={`text-xs ${
                                      darkMode ? textSystem.dark.tertiary : textSystem.light.tertiary
                                    }`}
                                  >
                                    {key}
                                  </div>
                                </div>
                              ),
                            )}
                          </div>

                          {/* Learn More Button */}
                          <motion.button
                            whileHover={isMobile ? undefined : { x: 5 }}
                            onClick={() => setShowModal(project)}
                            className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg ${
                              darkMode
                                ? "bg-blue-500/20 text-blue-300 hover:bg-blue-500/30"
                                : "bg-blue-100 text-blue-800 hover:bg-blue-200"
                            } transition-colors duration-300 text-xs sm:text-sm`}
                            aria-label={`Learn more about ${project.title}`}
                          >
                            Learn more
                            <ArrowRight size={isMobile ? 12 : 16} />
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>

        {/* Enhanced Modal */}
        <AnimatePresence>
          {showModal && (
            <div className="fixed inset-0 flex items-center justify-center z-50">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => setShowModal(null)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className={`relative w-full max-w-xs sm:max-w-md md:max-w-2xl p-4 sm:p-6 md:p-8 rounded-xl ${
                  darkMode ? "bg-gray-900" : "bg-white"
                } shadow-xl overflow-y-auto max-h-[90vh]`}
              >
                <div className="mb-4 sm:mb-6">
                  <h3
                    className={`font-bold ${isMobile ? "text-lg" : "text-2xl"} mb-2 ${
                      darkMode ? textSystem.dark.primary : textSystem.light.primary
                    }`}
                  >
                    {showModal.title}
                  </h3>
                  <p
                    className={`mb-2 sm:mb-4 ${
                      darkMode ? textSystem.dark.secondary : textSystem.light.secondary
                    } ${isMobile ? "text-xs" : "text-base"}`}
                  >
                    {showModal.details}
                  </p>

                  {/* Stats in Modal */}
                  <div className={`grid ${isMobile ? "grid-cols-1 gap-2 mt-2" : "grid-cols-3 gap-6 mt-6"}`}>
                    {Object.entries(showModal.stats).map(([key, value]) => (
                      <div
                        key={key}
                        className={`p-2 sm:p-4 rounded-lg ${
                          darkMode ? "bg-gray-800/50" : "bg-gray-100/50"
                        }`}
                      >
                        <div
                          className={`font-bold ${isMobile ? "text-base" : "text-2xl"} mb-1 ${
                            darkMode ? textSystem.dark.primary : textSystem.light.primary
                          }`}
                        >
                          {value}
                        </div>
                        <div
                          className={`text-xs ${
                            darkMode ? textSystem.dark.tertiary : textSystem.light.tertiary
                          }`}
                        >
                          {key}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  className={`flex items-center justify-between border-t pt-2 sm:pt-4 ${
                    darkMode ? "border-gray-700" : "border-gray-200"
                  }`}
                >
                  <div
                    className={`flex items-center gap-2 ${
                      darkMode ? "text-gray-400" : "text-gray-600"
                    } text-xs sm:text-sm`}
                  >
                    <Clock size={isMobile ? 10 : 16} />
                    <span>{showModal.duration}</span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowModal(null)}
                    className={`p-2 rounded-full ${
                      darkMode
                        ? "bg-gray-800 hover:bg-gray-700"
                        : "bg-gray-100 hover:bg-gray-200"
                    } ml-2`}
                    aria-label="Close modal"
                  >
                    <X size={isMobile ? 16 : 20} />
                  </motion.button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
      {/* New Research Page Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex justify-center mt-6 sm:mt-8 md:mt-12 relative z-20"
      >
        <motion.a
          href="/research"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`flex items-center gap-2 px-4 py-3 sm:px-8 sm:py-4 rounded-xl text-base sm:text-lg font-semibold shadow-lg transition-all duration-300 ${
            darkMode
              ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white"
              : "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 text-white"
          }`}
        >
          Explore All Research
          <ExternalLink size={isMobile ? 16 : 20} />
        </motion.a>
      </motion.div>
    </motion.section>
  );
};

export default Research;
