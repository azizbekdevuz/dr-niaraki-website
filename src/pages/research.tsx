import React, { useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
} from "framer-motion";
import {
  ChevronRight,
  Award,
  Book,
  Brain,
  Microscope,
  Globe,
  Sparkles,
} from "lucide-react";
import { HeroExperience } from "../components/research/HeroExperience";
import useDeviceDetect from "@/hooks/useDeviceDetect";
import { researchProjectsData } from "../datasets/research/researchProjectsData";
import { academicInitiativesData } from "../datasets/research/academicInitiativesData";
import { researchLeadershipData } from "../datasets/research/researchLeadershipData";
import ExperienceShowcase from "../components/research/ExperienceShowcase";

const RotatingAtomCursor = dynamic(
  () => import("../components/global/RotatingAtomCursor"),
  { ssr: false },
);

// Enhanced interfaces with strict typing
interface Tab {
  id: string;
  label: string;
  icon: React.ElementType;
  data: ResearchItem[];
}

interface ResearchItem {
  title: string;
  duration?: string;
  period?: string;
  achievements?: string[];
  description?: string;
}

interface ResearchCardProps {
  data: ResearchItem;
  index: number;
  type: string;
  isActive: boolean;
  darkMode: boolean;
}

interface InteractiveCardProps {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
  isHovered: boolean;
  isActive?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

// Performance optimization - Memoized card components
const InteractiveCard = React.memo<InteractiveCardProps>(
  ({
    children,
    onClick,
    className = "",
    isHovered,
    isActive = false,
    onMouseEnter,
    onMouseLeave,
  }) => {
    if (!children) return null;

    return (
      <motion.div
        className={`relative ${className} backdrop-blur-lg rounded-xl overflow-hidden transition-all duration-300`}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{
          scale: isHovered ? 1.02 : 1,
          opacity: 1,
          rotateX: isHovered ? 5 : 0,
          rotateY: isHovered ? 5 : 0,
          boxShadow: isHovered
            ? "0 20px 40px rgba(0,0,100,0.3)"
            : isActive
              ? "0 15px 30px rgba(0,0,100,0.2)"
              : "0 10px 20px rgba(0,0,100,0.1)",
        }}
        whileHover={{ scale: 1.02 }}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        style={{
          transformStyle: "preserve-3d",
          perspective: "1000px",
        }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    );
  },
);

InteractiveCard.displayName = "InteractiveCard";

const ResearchCard = React.memo<ResearchCardProps>(
  ({ data, isActive, darkMode }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const toggleExpand = useCallback(() => {
      setIsExpanded((prev) => !prev);
    }, []);

    return (
      <InteractiveCard
        isHovered={isHovered}
        isActive={isActive}
        onClick={toggleExpand}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`${darkMode ? "bg-blue-900/20" : "bg-blue-100/80"} p-6 mb-4 transition-all`}
      >
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <motion.h3
              className="text-xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              {data.title}
            </motion.h3>
            <div className="flex items-center gap-2 text-sm opacity-80">
              <Globe className="w-4 h-4" />
              <span>{data.duration || data.period}</span>
            </div>
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <Sparkles
              className={`w-6 h-6 ${isHovered ? "text-blue-400" : ""}`}
            />
          </motion.div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-6 space-y-4"
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {data.achievements && (
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="p-4 rounded-lg bg-white/5"
                >
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Award className="w-4 h-4 text-blue-400" />
                    Achievements
                  </h4>
                  <ul className="space-y-2">
                    {data.achievements.map((achievement, idx) => (
                      <motion.li
                        key={idx}
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        className="flex items-start gap-2 text-sm opacity-80"
                      >
                        <ChevronRight className="w-4 h-4 mt-1 flex-shrink-0 text-purple-400" />
                        <span>{achievement}</span>
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </InteractiveCard>
    );
  },
);

ResearchCard.displayName = "ResearchCard";

const Research = ({ darkMode = true }: { darkMode?: boolean }) => {
  const [activeTab, setActiveTab] = useState("projects");
  const [hoveredCard] = useState<string | null>(null);
  const device = useDeviceDetect();

  const { scrollYProgress } = useScroll();
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  const tabs: Tab[] = useMemo(
    () => [
      {
        id: "projects",
        label: "Research Projects",
        icon: Microscope,
        data: researchProjectsData,
      },
      {
        id: "leadership",
        label: "Research Leadership",
        icon: Brain,
        data: researchLeadershipData,
      },
      {
        id: "initiatives",
        label: "Academic Initiatives",
        icon: Book,
        data: academicInitiativesData,
      },
    ],
    [],
  );

  const safeRenderData = useCallback(
    <T,>(data: T, render: (data: T) => React.ReactNode) => {
      try {
        return render(data);
      } catch (error) {
        console.error("Error rendering data:", error);
        return null;
      }
    },
    [],
  );

  const ResearchDashboard = useCallback(
    () => (
      <motion.div
        className="mb-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-300 ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                  : "bg-white/5 hover:bg-white/10 backdrop-blur-lg"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label={tab.label}
            >
              <tab.icon className="w-5 h-5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </motion.button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid gap-6"
          >
            {tabs
              .find((t) => t.id === activeTab)
              ?.data.map((item, idx) => (
                <ResearchCard
                  key={idx}
                  data={item}
                  index={idx}
                  type={activeTab}
                  isActive={hoveredCard === `${activeTab}-${idx}`}
                  darkMode={darkMode}
                />
              ))}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    ),
    [activeTab, hoveredCard, tabs, darkMode],
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <motion.div
        className="fixed inset-0 bg-[url('/grid.svg')] opacity-20 pointer-events-none"
        style={{ y: backgroundY }}
      />

      <div className="relative max-w-7xl mx-auto px-4 py-20">
        <HeroExperience />

        <motion.h1
          className="text-4xl md:text-5xl font-bold text-center mb-12 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.5,
            ease: "easeOut",
          }}
        >
          Research & Experience
        </motion.h1>

        <div className="space-y-20">
          <AnimatePresence mode="wait">
            {safeRenderData(tabs, () => (
              <motion.div
                key="research-dashboard"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <ResearchDashboard />
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Replace the old components with ExperienceShowcase */}
          <AnimatePresence mode="wait">
            <motion.div
              key="experience-showcase"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <ExperienceShowcase />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {device.isDesktop && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <RotatingAtomCursor />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

Research.displayName = "Research";

export default React.memo(Research);
