import React, { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Briefcase, Award, ChevronRight, GraduationCap } from "lucide-react";
import { experiences, awards, academicJourney } from "./aboutSection/dataComponents";
import VideoS from "./inner/VideoS";
import useDeviceDetect from "@/hooks/useDeviceDetect";

interface AboutProps {
  darkMode: boolean;
}

const About: React.FC<AboutProps> = ({ darkMode }) => {
  const { isMobile } = useDeviceDetect();
  const [expandedExp, setExpandedExp] = useState<number | null>(null);
  const [expandedJourney, setExpandedJourney] = useState<number | null>(0);
  const [expandedAward, setExpandedAward] = useState<number | null>(null);

  // Animation variants
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, delay: i * 0.1 }
    })
  };

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="relative min-h-screen"
    >
      <div className={`mx-auto ${isMobile ? 'px-4 py-10' : 'max-w-7xl px-4 md:px-8 py-16'}`}>
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-center ${isMobile ? 'mb-8' : 'mb-16'}`}
        >
          <h2 className={`${isMobile ? 'text-3xl' : 'text-4xl md:text-5xl'} font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
            About Dr. Sadeghi-Niaraki
          </h2>
          <p className={`mt-4 ${isMobile ? 'text-lg' : 'text-xl'} ${darkMode ? 'text-blue-300' : 'text-blue-600'}`}>
            XR, Geo-AI, Urban Analytics, and more
          </p>
        </motion.div>
        
        {/* Video + Personal Info */}
        <div className={`${isMobile ? 'flex flex-col space-y-6' : 'grid grid-cols-1 lg:grid-cols-2 gap-8'} mb-16`}>
          <motion.div 
            initial={{ opacity: 0, x: isMobile ? 0 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex justify-center"
          >
            <div className="aspect-video w-full rounded-xl overflow-hidden shadow-md border border-slate-200 dark:border-slate-700 bg-black">
              <VideoS darkMode={darkMode} />
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: isMobile ? 0 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className={`rounded-xl ${isMobile ? 'p-5' : 'p-8'} ${darkMode ? 'bg-slate-800/80' : 'bg-white/80'} backdrop-blur-sm shadow-md`}
          >
            <div className={`flex ${isMobile ? 'flex-col items-center text-center' : 'items-center space-x-6'} mb-6`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src="/assets/images/contact-image.png" 
                alt="Dr. Sadeghi-Niaraki" 
                className={`${isMobile ? 'w-16 h-16 mb-4' : 'w-20 h-20'} rounded-full object-cover border-2 border-blue-400`} 
              />
              <div>
                <h3 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                  Dr. Sadeghi-Niaraki
                </h3>
                <p className={`${isMobile ? 'text-base' : 'text-lg'} ${darkMode ? 'text-blue-300' : 'text-blue-600'}`}>
                  Associate Professor
                </p>
                <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  XR, Geo-AI, Urban Analytics
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className={`text-center ${isMobile ? 'p-3' : 'p-4'} rounded-lg ${darkMode ? 'bg-slate-700/80' : 'bg-slate-100/80'}`}>
                <p className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold ${darkMode ? 'text-blue-300' : 'text-blue-600'}`}>100+</p>
                <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Publications</p>
              </div>
              <div className={`text-center ${isMobile ? 'p-3' : 'p-4'} rounded-lg ${darkMode ? 'bg-slate-700/80' : 'bg-slate-100/80'}`}>
                <p className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold ${darkMode ? 'text-blue-300' : 'text-blue-600'}`}>15+</p>
                <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Years</p>
              </div>
              <div className={`text-center ${isMobile ? 'p-3' : 'p-4'} rounded-lg ${darkMode ? 'bg-slate-700/80' : 'bg-slate-100/80'}`}>
                <p className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold ${darkMode ? 'text-blue-300' : 'text-blue-600'}`}>30+</p>
                <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Projects</p>
              </div>
            </div>
            
            <p className={`text-base ${darkMode ? 'text-slate-300' : 'text-slate-600'} ${isMobile ? 'text-center' : ''}`}>
              Iranian scholar and researcher, Associate Professor at Sejong University.
            </p>
          </motion.div>
        </div>
        
        {/* Academic Journey */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`${isMobile ? 'mb-10' : 'mb-16'}`}
        >
          <div className="flex items-center space-x-3 mb-6">
            <Calendar className={`${darkMode ? 'text-blue-300' : 'text-blue-600'}`} size={isMobile ? 20 : 24} />
            <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
              Academic Journey
            </h2>
          </div>
          
          <div className={`${isMobile ? 'space-y-4' : 'grid grid-cols-1 md:grid-cols-2 gap-4'}`}>
            {academicJourney.map((item, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => setExpandedJourney(expandedJourney === idx ? null : idx)}
                className={`cursor-pointer rounded-lg ${isMobile ? 'p-4' : 'p-6'} transition backdrop-blur-sm ${
                  darkMode ? 'bg-slate-800/80 hover:bg-slate-700/80' : 'bg-white/80 hover:bg-slate-50/80'
                } shadow-sm border ${
                  expandedJourney === idx 
                    ? darkMode ? 'border-blue-400' : 'border-blue-500' 
                    : darkMode ? 'border-slate-700' : 'border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <GraduationCap className={`${darkMode ? 'text-blue-300' : 'text-blue-600'}`} size={isMobile ? 18 : 20} />
                    <div>
                      <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                        {item.title}
                      </h3>
                      <p className={`${isMobile ? 'text-xs' : 'text-sm'} ${darkMode ? 'text-blue-300' : 'text-blue-600'}`}>
                        {item.institution}
                      </p>
                      <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        {item.year}
                      </p>
                    </div>
                  </div>
                  <ChevronRight 
                    className={`transition transform ${expandedJourney === idx ? 'rotate-90' : ''} 
                    ${darkMode ? 'text-blue-300' : 'text-blue-600'}`} 
                    size={isMobile ? 16 : 20} 
                  />
                </div>
                
                {expandedJourney === idx && (
                  <div className={`mt-4 ${isMobile ? 'p-3' : 'p-4'} rounded ${darkMode ? 'bg-slate-700/50' : 'bg-slate-100'}`}>
                    <p className={`${isMobile ? 'text-sm' : ''} ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                      {item.details}
                    </p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.section>
        
        {/* Professional Experience */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`${isMobile ? 'mb-10' : 'mb-16'}`}
        >
          <div className="flex items-center space-x-3 mb-6">
            <Briefcase className={`${darkMode ? 'text-blue-300' : 'text-blue-600'}`} size={isMobile ? 20 : 24} />
            <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
              Professional Experience
            </h2>
          </div>
          
          <div className="space-y-4">
            {experiences.map((exp, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => setExpandedExp(expandedExp === idx ? null : idx)}
                className={`cursor-pointer rounded-lg ${isMobile ? 'p-4' : 'p-6'} transition backdrop-blur-sm ${
                  darkMode ? 'bg-slate-800/80 hover:bg-slate-700/80' : 'bg-white/80 hover:bg-slate-50/80'
                } shadow-sm border ${
                  expandedExp === idx 
                    ? darkMode ? 'border-blue-400' : 'border-blue-500' 
                    : darkMode ? 'border-slate-700' : 'border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                      {exp.position}
                    </h3>
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} ${darkMode ? 'text-blue-300' : 'text-blue-600'}`}>
                      {exp.institution}
                    </p>
                    <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {exp.duration}
                    </p>
                  </div>
                  <ChevronRight 
                    className={`transition transform ${expandedExp === idx ? 'rotate-90' : ''} 
                    ${darkMode ? 'text-blue-300' : 'text-blue-600'}`} 
                    size={isMobile ? 16 : 20} 
                  />
                </div>
                
                {expandedExp === idx && (
                  <div className={`mt-4 space-y-4 ${darkMode ? 'text-slate-300' : 'text-slate-600'} ${isMobile ? 'text-sm' : ''}`}>
                    <p>{exp.details}</p>
                    
                    <div>
                      <h4 className={`font-semibold mb-2 ${darkMode ? 'text-blue-300' : 'text-blue-600'}`}>
                        Key Projects
                      </h4>
                      <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'} gap-2`}>
                        {exp.projects.map((project, i) => (
                          <div 
                            key={i} 
                            className={`${isMobile ? 'p-2 text-xs' : 'p-3 text-sm'} rounded ${darkMode ? 'bg-slate-700' : 'bg-slate-100'}`}
                          >
                            {project}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className={`font-semibold mb-2 ${darkMode ? 'text-blue-300' : 'text-blue-600'}`}>
                        Achievements
                      </h4>
                      <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'} gap-2`}>
                        {exp.achievements.map((achievement, i) => (
                          <div 
                            key={i} 
                            className={`${isMobile ? 'p-2 text-xs' : 'p-3 text-sm'} rounded ${darkMode ? 'bg-slate-700' : 'bg-slate-100'}`}
                          >
                            {achievement}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.section>
        
        {/* Awards */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className={`${isMobile ? 'mb-10' : 'mb-16'}`}
        >
          <div className="flex items-center space-x-3 mb-6">
            <Award className={`${darkMode ? 'text-blue-300' : 'text-blue-600'}`} size={isMobile ? 20 : 24} />
            <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
              Awards & Recognition
            </h2>
          </div>
          
          <div className={`${isMobile ? 'space-y-4' : 'grid grid-cols-1 md:grid-cols-2 gap-4'}`}>
            {awards.map((award, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => setExpandedAward(expandedAward === idx ? null : idx)}
                className={`cursor-pointer rounded-lg ${isMobile ? 'p-4' : 'p-6'} transition backdrop-blur-sm ${
                  darkMode ? 'bg-slate-800/80 hover:bg-slate-700/80' : 'bg-white/80 hover:bg-slate-50/80'
                } shadow-sm border ${
                  expandedAward === idx 
                    ? darkMode ? 'border-blue-400' : 'border-blue-500' 
                    : darkMode ? 'border-slate-700' : 'border-slate-200'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                      {award.award}
                    </h3>
                    <p className={`${isMobile ? 'text-xs' : 'text-sm'} ${darkMode ? 'text-blue-300' : 'text-blue-600'}`}>
                      {award.organization}
                    </p>
                    <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {award.year}
                    </p>
                  </div>
                  <ChevronRight 
                    className={`transition transform ${expandedAward === idx ? 'rotate-90' : ''} 
                    ${darkMode ? 'text-blue-300' : 'text-blue-600'}`} 
                    size={isMobile ? 16 : 20} 
                  />
                </div>
                
                {expandedAward === idx && (
                  <div className={`mt-4 space-y-2 ${darkMode ? 'text-slate-300' : 'text-slate-600'} ${isMobile ? 'text-sm' : ''}`}>
                    <p>{award.details}</p>
                    <div className={`inline-block px-4 py-2 mt-2 rounded-full ${isMobile ? 'text-xs' : 'text-sm'} 
                      ${darkMode ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                      {award.impact}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.section>
        
        {/* Navigation Button */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex justify-center"
        >
          <button 
            className={`${isMobile ? 'px-6 py-3 text-base' : 'px-8 py-4 text-lg'} rounded-lg font-semibold transition-all 
              ${darkMode 
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white' 
                : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white'
              } shadow-lg`}
            onClick={() => window.location.href = '/about'}
          >
            Explore Full Story
          </button>
        </motion.div>
      </div>
    </motion.section>
  );
};

export default About;