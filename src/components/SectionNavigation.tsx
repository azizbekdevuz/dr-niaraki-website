import React from "react";
import { motion } from "framer-motion";

interface SectionNavigationProps {
  //describe properties of navigation section
  activeSection: number;
  setActiveSection: React.Dispatch<React.SetStateAction<number>>; //function to update the activeSection value, enabling navigation between sections
}

const SectionNavigation: React.FC<SectionNavigationProps> = ({
  //a styled, responsive navigation menu for switching between sections
  activeSection,
  setActiveSection,
}) => {
  return (
    <div className="flex justify-center gap-4 mb-16">
      {[
        "Professional Journey",
        "Industry Experience",
        "Consulting & Collaboration",
      ].map((section, idx) => (
        <motion.button
          key={idx}
          onClick={() => setActiveSection(idx)}
          className={`${
            activeSection === idx
              ? "text-blue-500 font-semibold"
              : "text-gray-500"
          } transition-colors duration-300`}
        >
          {section}
        </motion.button>
      ))}
    </div>
  );
};

export default SectionNavigation;
