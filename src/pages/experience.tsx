//import all necessaries
import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { HeroExperience } from "../components/HeroExperience";
import { experienceData } from "../components//datasets/experienceData";
import SectionNavigation from "../components/SectionNavigation";
import useDeviceDetect from "../components/useDeviceDetect";
import AdvancedTimeline from "../components/AdvancedTimeline";
import ExperienceCard from "../components/ExperienceCard";
import IndustrySection from "../components/IndustrySection";
import ConsultingSection from "../components/ConsultingSection";

//dynamically importing the cursor
const RotatingAtomCursor = dynamic(
  () => import("../components/RotatingAtomCursor"),
  { ssr: false },
);

export default function Experience() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeIndustryIndex, setActiveIndustryIndex] = useState(0);
  const [activeConsultingIndex, setActiveConsultingIndex] = useState(0);
  const [activeSection, setActiveSection] = useState(0);
  const device = useDeviceDetect();

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % experienceData.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="relative max-w-7xl mx-auto px-4 py-20">
        {/* Added Hero Section */}
        <HeroExperience />
        <motion.h1
          className="text-4xl md:text-5xl font-bold text-center mb-12 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Professional Experience
        </motion.h1>

        <SectionNavigation
          activeSection={activeSection}
          setActiveSection={setActiveSection}
        />

        <AnimatePresence mode="wait">
          {activeSection === 0 && (
            <motion.div
              key="professional"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <motion.h2 className="text-3xl font-bold text-center mb-8 text-blue-400">
                Professional Journey
              </motion.h2>
              <AdvancedTimeline
                activeIndex={activeIndex}
                setActiveIndex={setActiveIndex}
                data={experienceData.map((exp) => ({
                  ...exp,
                  progressPercentage: exp.progressPercentage ?? 0,
                }))}
              />
              <div className="space-y-6">
                {experienceData.map((exp, idx) => (
                  <ExperienceCard
                    key={idx}
                    data={exp}
                    index={idx}
                    isActive={idx === activeIndex}
                    onClick={() => setActiveIndex(idx)}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {activeSection === 1 && (
            <motion.div
              key="industry"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <motion.h2 className="text-3xl font-bold text-center mb-8 text-blue-400">
                Industry Experience
              </motion.h2>
              <IndustrySection
                activeIndustryIndex={activeIndustryIndex}
                setActiveIndustryIndex={setActiveIndustryIndex}
              />
            </motion.div>
          )}

          {activeSection === 2 && (
            <motion.div
              key="consulting"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <motion.h2 className="text-3xl font-bold text-center mb-8 text-blue-400">
                Consulting & Collaboration
              </motion.h2>
              <ConsultingSection
                activeConsultingIndex={activeConsultingIndex}
                setActiveConsultingIndex={setActiveConsultingIndex}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {/* Use custom cursor only with desktop */}
      {device.isDesktop && <RotatingAtomCursor />}
    </div>
  );
}
