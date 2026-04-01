import React, { useState } from "react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import {
  BookOpen,
  Calendar,
  GraduationCap,
  Award,
  ChevronRight,
  Star,
  MapPin
} from "lucide-react";
import { academicJourney, Experience, Awards } from "./dataComponents";
import useDeviceDetect from "@/hooks/useDeviceDetect";

// Efficient fade-in animation for elements
export const FadeIn: React.FC<{
  children: React.ReactNode;
  delay?: number;
}> = ({ children, delay = 0 }) => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });
  const { isMobile } = useDeviceDetect();

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: isMobile ? 10 : 20 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: isMobile ? 10 : 20 }}
      transition={{ duration: isMobile ? 0.3 : 0.5, delay: isMobile ? delay * 0.05 : delay }}
    >
      {children}
    </motion.div>
  );
};

// Clean, modern header with simple animation
export const AboutHeader: React.FC<{ darkMode: boolean }> = ({ darkMode }) => {
  const { isMobile } = useDeviceDetect();

  return (
    <motion.div
      className={`${isMobile ? 'mb-8' : 'mb-12'} text-center ${
        darkMode ? "text-white" : "text-slate-800"
      }`}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <h2 className={`${isMobile ? 'text-3xl' : 'text-4xl sm:text-5xl'} font-bold mb-4`}>
        About Dr. Sadeghi-Niaraki
      </h2>
      
      <div className="w-24 h-1 bg-blue-500 mx-auto mb-6"></div>
      
      <p className={`${isMobile ? 'text-lg' : 'text-xl'} ${darkMode ? "text-blue-300" : "text-blue-600"}`}>
        XR, Geo-AI, Urban Analytics, and more
      </p>
    </motion.div>
  );
};

// Personal info card with backdrop blur for integration with site background
export const PersonalInfo: React.FC<{ darkMode: boolean }> = ({ darkMode }) => {
  const { isMobile } = useDeviceDetect();

  return (
    <div
      className={`${isMobile ? 'p-4' : 'p-6'} rounded-xl shadow-md backdrop-blur-sm ${
        darkMode ? "bg-slate-800/80" : "bg-white/80"
      }`}
    >
      <div className={`flex ${isMobile ? 'flex-col items-center text-center' : 'items-start space-x-4'} mb-6`}>
        <div
          className={`${isMobile ? 'mb-3' : ''} p-3 rounded-lg ${
            darkMode ? "bg-slate-700" : "bg-slate-100"
          }`}
        >
          <BookOpen
            className={darkMode ? "text-blue-300" : "text-blue-600"}
            size={isMobile ? 20 : 24}
          />
        </div>
        
        <div>
          <h3
            className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold ${
              darkMode ? "text-white" : "text-slate-800"
            }`}
          >
            About Dr. Sadeghi-Niaraki
          </h3>
          <p
            className={`mt-1 ${isMobile ? 'text-sm' : ''} ${
              darkMode ? "text-slate-300" : "text-slate-600"
            }`}
          >
            An Iranian scholar and researcher, Associate Professor at Sejong University
          </p>
        </div>
      </div>
      
      <div 
        className={`grid grid-cols-3 gap-4 ${isMobile ? 'p-3' : 'p-4'} rounded-lg ${
          darkMode ? "bg-slate-700/80" : "bg-slate-100/80"
        }`}
      >
        {[
          { label: "Publications", value: "100+" },
          { label: "Experience", value: "15+ Years" },
          { label: "Projects", value: "30+" },
        ].map((stat, index) => (
          <div key={index} className="text-center">
            <div
              className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold ${
                darkMode ? "text-blue-300" : "text-blue-600"
              }`}
            >
              {stat.value}
            </div>
            <div
              className={`${isMobile ? 'text-xs' : 'text-sm'} ${
                darkMode ? "text-slate-400" : "text-slate-500"
              }`}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Academic Timeline with cleaner visualization
export const AcademicTimeline: React.FC<{
  darkMode: boolean;
}> = ({ darkMode }) => {
  const [expandedItem, setExpandedItem] = useState<number | null>(0);
  const { isMobile } = useDeviceDetect();

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <Calendar 
          className={darkMode ? "text-blue-300" : "text-blue-600"}
          size={isMobile ? 20 : 24}
        />
        <h2 
          className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold ${
            darkMode ? "text-white" : "text-slate-800"
          }`}
        >
          Academic Journey
        </h2>
      </div>
      
      <div className={`${isMobile ? 'space-y-4' : 'grid grid-cols-1 md:grid-cols-2 gap-4'}`}>
        {academicJourney.map((item, index) => (
          <FadeIn key={index} delay={index * 0.1}>
            <div
              onClick={() => setExpandedItem(expandedItem === index ? null : index)}
              className={`cursor-pointer ${isMobile ? 'p-4' : 'p-5'} rounded-lg transition-all backdrop-blur-sm ${
                darkMode ? "bg-slate-800/80 hover:bg-slate-700/80" : "bg-white/80 hover:bg-slate-50/80"
              } shadow-sm border ${
                expandedItem === index 
                  ? darkMode ? "border-blue-400" : "border-blue-500" 
                  : darkMode ? "border-slate-700/50" : "border-slate-200/50"
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex space-x-4">
                  <div className={`mt-1 ${darkMode ? "text-blue-300" : "text-blue-600"}`}>
                    <GraduationCap size={isMobile ? 18 : 20} />
                  </div>
                  
                  <div>
                    <h3 
                      className={`font-semibold ${isMobile ? 'text-base' : 'text-lg'} ${
                        darkMode ? "text-white" : "text-slate-800"
                      }`}
                    >
                      {item.title}
                    </h3>
                    <p 
                      className={`${isMobile ? 'text-xs' : ''} ${
                        darkMode ? "text-blue-300" : "text-blue-600"
                      }`}
                    >
                      {item.institution}
                    </p>
                    <p 
                      className={`${isMobile ? 'text-xs' : 'text-sm'} ${
                        darkMode ? "text-slate-400" : "text-slate-500"
                      }`}
                    >
                      {item.year}
                    </p>
                  </div>
                </div>
                
                <ChevronRight 
                  className={`transition-transform ${expandedItem === index ? "rotate-90" : ""} 
                  ${darkMode ? "text-blue-300" : "text-blue-600"}`}
                  size={isMobile ? 16 : 20} 
                />
              </div>
              
              {expandedItem === index && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className={`mt-4 ${isMobile ? 'p-3' : 'p-4'} rounded ${
                    darkMode ? "bg-slate-700/50" : "bg-slate-100"
                  }`}
                >
                  <p className={`${isMobile ? 'text-sm' : ''} ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                    {item.details}
                  </p>
                </motion.div>
              )}
            </div>
          </FadeIn>
        ))}
      </div>
    </div>
  );
};

// Experience Item with cleaner design
export const ExperienceItem: React.FC<{
  exp: Experience;
  index: number;
  darkMode: boolean;
}> = ({ exp, index, darkMode }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { isMobile } = useDeviceDetect();
  
  return (
    <FadeIn delay={index * 0.1}>
      <div
        className={`rounded-lg shadow-sm backdrop-blur-sm ${
          darkMode ? "bg-slate-800/80" : "bg-white/80"
        } border ${
          isExpanded
            ? darkMode ? "border-blue-400" : "border-blue-500"
            : darkMode ? "border-slate-700/50" : "border-slate-200/50"
        }`}
      >
        <div
          className={`${isMobile ? 'p-4' : 'p-5'} cursor-pointer`}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex justify-between items-start">
            <div>
              <h3
                className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold ${
                  darkMode ? "text-white" : "text-slate-800"
                }`}
              >
                {exp.position}
              </h3>
              <p
                className={`${isMobile ? 'text-xs' : ''} ${
                  darkMode ? "text-blue-300" : "text-blue-600"
                }`}
              >
                {exp.institution}
              </p>
              <p
                className={`${isMobile ? 'text-xs' : 'text-sm'} ${
                  darkMode ? "text-slate-400" : "text-slate-500"
                }`}
              >
                {exp.duration}
              </p>
            </div>
            
            <ChevronRight
              className={`transition-transform ${isExpanded ? "rotate-90" : ""} 
              ${darkMode ? "text-blue-300" : "text-blue-600"}`}
              size={isMobile ? 16 : 20}
            />
          </div>

          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="mt-4 space-y-4"
            >
              <p
                className={`${isMobile ? 'text-sm' : ''} ${
                  darkMode ? "text-slate-300" : "text-slate-600"
                }`}
              >
                {exp.details}
              </p>

              <div className="space-y-2">
                <h4
                  className={`font-semibold ${
                    darkMode ? "text-blue-300" : "text-blue-600"
                  }`}
                >
                  Key Projects
                </h4>
                <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'} gap-2`}>
                  {exp.projects.map((project, i) => (
                    <div
                      key={i}
                      className={`${isMobile ? 'p-2' : 'p-3'} rounded flex items-center space-x-2 ${
                        darkMode ? "bg-slate-700" : "bg-slate-100"
                      }`}
                    >
                      <Star
                        className={darkMode ? "text-blue-300" : "text-blue-600"}
                        size={isMobile ? 12 : 14}
                      />
                      <span className={`${isMobile ? 'text-xs' : 'text-sm'} ${
                        darkMode ? "text-slate-300" : "text-slate-600"
                      }`}>
                        {project}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h4
                  className={`font-semibold ${
                    darkMode ? "text-blue-300" : "text-blue-600"
                  }`}
                >
                  Achievements
                </h4>
                <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'} gap-2`}>
                  {exp.achievements.map((achievement, i) => (
                    <div
                      key={i}
                      className={`${isMobile ? 'p-2' : 'p-3'} rounded flex items-center space-x-2 ${
                        darkMode ? "bg-slate-700" : "bg-slate-100"
                      }`}
                    >
                      <ChevronRight
                        className={darkMode ? "text-blue-300" : "text-blue-600"}
                        size={isMobile ? 12 : 14}
                      />
                      <span className={`${isMobile ? 'text-xs' : 'text-sm'} ${
                        darkMode ? "text-slate-300" : "text-slate-600"
                      }`}>
                        {achievement}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </FadeIn>
  );
};

// Award Item with subtle hover effect
export const AwardItem: React.FC<{
  award: Awards;
  index: number;
  darkMode: boolean;
}> = ({ award, index, darkMode }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { isMobile } = useDeviceDetect();

  return (
    <FadeIn delay={index * 0.1}>
      <div
        className={`rounded-lg shadow-sm backdrop-blur-sm ${
          darkMode ? "bg-slate-800/80" : "bg-white/80"
        } border ${
          isExpanded
            ? darkMode ? "border-blue-400" : "border-blue-500"
            : darkMode ? "border-slate-700/50" : "border-slate-200/50"
        } transition-all`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className={`${isMobile ? 'p-4' : 'p-5'} cursor-pointer`}>
          <div className="flex justify-between items-start">
            <div className="flex space-x-4">
              <Award
                className={isExpanded 
                  ? "text-yellow-400" 
                  : darkMode ? "text-blue-300" : "text-blue-600"}
                size={isMobile ? 20 : 24}
              />
              
              <div>
                <h3
                  className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold ${
                    darkMode ? "text-white" : "text-slate-800"
                  }`}
                >
                  {award.award}
                </h3>
                <p
                  className={`${isMobile ? 'text-xs' : ''} ${
                    darkMode ? "text-blue-300" : "text-blue-600"
                  }`}
                >
                  {award.organization}
                </p>
                <p
                  className={`${isMobile ? 'text-xs' : 'text-sm'} ${
                    darkMode ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  {award.year}
                </p>
              </div>
            </div>
            
            <ChevronRight
              className={`transition-transform ${isExpanded ? "rotate-90" : ""} 
              ${darkMode ? "text-blue-300" : "text-blue-600"}`}
              size={isMobile ? 16 : 20}
            />
          </div>

          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              transition={{ duration: 0.3 }}
              className={`mt-4 pt-4 border-t ${
                darkMode ? "border-slate-700/50" : "border-slate-200/50"
              }`}
            >
              <p
                className={`mb-3 ${isMobile ? 'text-sm' : ''} ${
                  darkMode ? "text-slate-300" : "text-slate-600"
                }`}
              >
                {award.details}
              </p>

              <div
                className={`inline-block px-4 py-2 rounded-full ${isMobile ? 'text-xs' : 'text-sm'} ${
                  darkMode
                    ? "bg-blue-500/20 text-blue-300"
                    : "bg-blue-100 text-blue-700"
                }`}
              >
                {award.impact}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </FadeIn>
  );
};

// Clean, focused navigation button
export const NavigationButton: React.FC<{ darkMode: boolean }> = ({
  darkMode,
}) => {
  const { isMobile } = useDeviceDetect();
  
  return (
    <div className="flex justify-center mt-10">
      <button
        className={`${isMobile ? 'px-6 py-2 text-base' : 'px-8 py-3 text-lg'} rounded-lg font-medium flex items-center space-x-2
          ${darkMode 
            ? "bg-blue-600 hover:bg-blue-700 text-white" 
            : "bg-blue-600 hover:bg-blue-700 text-white"
          } shadow-md transition-colors duration-200`}
        onClick={() => (window.location.href = "/about")}
      >
        <span>Explore Full Story</span>
        <ChevronRight size={isMobile ? 16 : 18} />
      </button>
    </div>
  );
};

// Simple component that shows highlighted location
export const LocationDisplay: React.FC<{ 
  darkMode: boolean;
  location: string;
}> = ({ darkMode, location }) => {
  const { isMobile } = useDeviceDetect();
  
  return (
    <div className={`flex items-center space-x-2 ${
      darkMode ? "text-slate-400" : "text-slate-500"
    }`}>
      <MapPin size={isMobile ? 14 : 16} />
      <span className={`${isMobile ? 'text-xs' : 'text-sm'}`}>{location}</span>
    </div>
  );
};