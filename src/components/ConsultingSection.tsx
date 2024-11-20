import React, { useEffect } from "react";
import { motion } from "framer-motion";
import AdvancedTimeline from "../components/AdvancedTimeline";
import ExperienceCard from "../components/ExperienceCard";
import { consultingData } from "../components/datasets/consultingData";

interface ConsultingSectionProps {
  //describe properties of consulting section
  activeConsultingIndex: number;
  setActiveConsultingIndex: React.Dispatch<React.SetStateAction<number>>; //function to update the active section value, enabling navigation between sections
}

const ConsultingSection: React.FC<ConsultingSectionProps> = ({
  //a styled, responsive section showcasing consulting & collaboration data
  activeConsultingIndex,
  setActiveConsultingIndex,
}) => {
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveConsultingIndex((prev) => (prev + 1) % consultingData.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [setActiveConsultingIndex]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <AdvancedTimeline
        activeIndex={activeConsultingIndex}
        setActiveIndex={setActiveConsultingIndex}
        data={consultingData} //use dataset: consultingData here
      />
      <div className="space-y-6">
        {consultingData.map((exp, idx) => (
          <ExperienceCard
            key={idx}
            data={exp}
            index={idx}
            isActive={idx === activeConsultingIndex}
            onClick={() => setActiveConsultingIndex(idx)}
          />
        ))}
      </div>
    </motion.div>
  );
};

export default ConsultingSection;
