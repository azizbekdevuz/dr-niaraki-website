import React, { useState } from "react";
import { motion } from "framer-motion";
import VideoS from "./inner/VideoS";
import textSystem from "@/theme/textSystem";
import { Calendar, Briefcase, ChevronDown, Award } from "lucide-react";
import { experiences, awards } from "./aboutSection/dataComponents";
import {
  ScrollReveal,
  ParallaxHeader,
  PersonalInfo,
  AcademicTimeline,
  ExperienceItem,
  AwardItem,
  NavigationButton,
} from "./aboutSection/Components";

// Type definitions
interface AboutProps {
  darkMode: boolean;
}

// Main component
const About: React.FC<AboutProps> = ({ darkMode }) => {
  const [expandedExp, setExpandedExp] = useState<number | null>(null);
  const [selectedJourney, setSelectedJourney] = useState<number>(0);
  const [hoveredAward, setHoveredAward] = useState<number | null>(null);

  return (
    <div className="min-h-screen w-full overflow-x-hidden">
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative px-4 sm:px-6 lg:px-8 py-8 lg:py-12"
      >
        <div className="max-w-7xl mx-auto space-y-16 lg:space-y-24">
          {/* Parallax Header */}
          <ParallaxHeader darkMode={darkMode} />

          {/* Introduction Section */}
          <ScrollReveal>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 items-start">
              <PersonalInfo darkMode={darkMode} />
              <div className="w-full h-full">
                <VideoS darkMode={darkMode} />
              </div>
            </div>
          </ScrollReveal>

          {/* Academic Journey Section */}
          <ScrollReveal>
            <div className="mb-16 lg:mb-32">
              <motion.div className="flex items-center justify-center gap-3 mb-12 lg:mb-16">
                <Calendar
                  className={darkMode ? "text-blue-400" : "text-blue-600"}
                  size={32}
                />
                <h3
                  className={`text-3xl lg:text-4xl font-bold ${
                    darkMode
                      ? textSystem.dark.primary
                      : textSystem.light.primary
                  }`}
                >
                  Academic Journey
                </h3>
              </motion.div>

              <div className="relative max-w-5xl mx-auto">
                <AcademicTimeline
                  darkMode={darkMode}
                  selectedJourney={selectedJourney}
                  setSelectedJourney={setSelectedJourney}
                />
              </div>
            </div>
          </ScrollReveal>

          {/* Professional Experience Section */}
          <ScrollReveal>
            <div className="mb-16 lg:mb-32">
              <motion.div className="flex items-center justify-center gap-3 mb-12 lg:mb-16">
                <Briefcase
                  className={darkMode ? "text-blue-400" : "text-blue-600"}
                  size={32}
                />
                <h3
                  className={`text-3xl lg:text-4xl font-bold ${
                    darkMode
                      ? textSystem.dark.primary
                      : textSystem.light.primary
                  }`}
                >
                  Professional Experience
                </h3>
              </motion.div>

              <div className="space-y-6 lg:space-y-8">
                {experiences.map((exp, index) => (
                  <ExperienceItem
                    key={index}
                    exp={exp}
                    index={index}
                    expandedExp={expandedExp}
                    setExpandedExp={setExpandedExp}
                    darkMode={darkMode}
                  />
                ))}
              </div>
            </div>
          </ScrollReveal>

          {/* Awards Section */}
          <ScrollReveal>
            <div className="mb-16 lg:mb-32">
              <motion.div className="flex items-center justify-center gap-3 mb-12 lg:mb-16">
                <Award
                  className={darkMode ? "text-blue-400" : "text-blue-600"}
                  size={32}
                />
                <h3
                  className={`text-3xl lg:text-4xl font-bold ${
                    darkMode
                      ? textSystem.dark.primary
                      : textSystem.light.primary
                  }`}
                >
                  Awards and Recognition
                </h3>
              </motion.div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                {awards.map((award, index) => (
                  <AwardItem
                    key={index}
                    award={award}
                    index={index}
                    hoveredAward={hoveredAward}
                    setHoveredAward={setHoveredAward}
                    darkMode={darkMode}
                  />
                ))}
              </div>
            </div>
          </ScrollReveal>

          {/* Navigation Button */}
          <div className="flex justify-center mb-8">
            <NavigationButton darkMode={darkMode} />
          </div>
        </div>

        {/* Floating scroll indicator - Mobile only */}
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
      </motion.section>
    </div>
  );
};

export default About;
