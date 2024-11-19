import React, {useEffect} from "react";
import { motion } from "framer-motion";
import AdvancedTimeline from "../components/AdvancedTimeline";
import { industryExperienceData } from "../components/datasets/industryExperienceData";
import ExperienceCard from "../components/ExperienceCard";

interface IndustrySectionProps { //describe properties of industry section
    activeIndustryIndex: number;
    setActiveIndustryIndex: React.Dispatch<React.SetStateAction<number>>; //function to update the active section value, enabling navigation between sections
  }
  
  const IndustrySection: React.FC<IndustrySectionProps> = ({ //a styled, responsive section showcasing industry experience
    activeIndustryIndex,
    setActiveIndustryIndex,
  }) => {
    useEffect(() => {
      const interval = setInterval(() => {
        setActiveIndustryIndex(
          (prev) => (prev + 1) % industryExperienceData.length,
        );
      }, 3000);
  
      return () => clearInterval(interval);
    }, [setActiveIndustryIndex]);
  
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
      >
        <AdvancedTimeline //use AdvancedTimeline component here
          activeIndex={activeIndustryIndex}
          setActiveIndex={setActiveIndustryIndex}
          data={industryExperienceData} //get data from dataset: industryExperienceData
        />
        <div className="space-y-6">
          {industryExperienceData.map((exp, idx) => (
            <ExperienceCard
              key={idx}
              data={exp}
              index={idx}
              isActive={idx === activeIndustryIndex}
              onClick={() => setActiveIndustryIndex(idx)}
            />
          ))}
        </div>
      </motion.div>
    );
  };

export default IndustrySection;