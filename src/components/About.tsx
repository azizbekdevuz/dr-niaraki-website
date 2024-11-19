import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import VideoS from './VideoS';
import textSystem from './textSystem';
import {
    GraduationCap,
    Building,
    Calendar,
    Briefcase,
    ChevronDown,
    ChevronRight,
    Award,
    Star,
}
from 'lucide-react';

interface AboutProps {
  darkMode: boolean;
}

const About: React.FC<AboutProps> = ({ darkMode }) => {
    const [expandedExp, setExpandedExp] = useState<number | null>(null);
    const [selectedJourney, setSelectedJourney] = useState(0);
    const [hoveredAward, setHoveredAward] = useState<number | null>(null);
  
    // First part of the component remains exactly the same until Academic Journey
    const academicJourney = [
      {
        title: "Ph.D. in Geo-Informatics Engineering",
        institution: "INHA University, South Korea",
        year: "Ph.D. Completed",
        details: "Specialized in advanced Geo-AI applications and spatial analysis",
        icon: GraduationCap
      },
      {
        title: "Post-doctoral Research",
        institution: "University of Melbourne, Australia",
        year: "Post-Doc",
        details: "Focused on integrating XR technologies with geographical information systems",
        icon: Building
      },
      {
        title: "M.Sc. in GIS Engineering",
        institution: "K.N. Toosi University of Technology, Iran",
        year: "Master's Degree",
        details: "Research focused on GIS applications in urban planning",
        icon: GraduationCap
      },
      {
        title: "B.Sc. in Geomatics-Civil Engineering",
        institution: "K.N. Toosi University of Technology, Iran",
        year: "Bachelor's Degree",
        details: "Foundation in geospatial technologies and civil engineering",
        icon: GraduationCap
      }
    ];
  
    const experiences = [
      {
        position: "Associate Professor",
        institution: "Sejong University, South Korea",
        duration: "2017 - Present",
        details: "Leading research in Geo-AI and XR technologies",
        achievements: ["Published 30+ research papers", "Supervised 15+ graduate students", "Secured major research grants"],
        projects: ["Smart City Development", "AI-Enhanced GIS", "XR Navigation Systems"]
      },
      {
        position: "Research Consultant",
        institution: "Various International Projects",
        duration: "2010 - Present",
        details: "Providing expert consultation on GIS implementation",
        achievements: ["Led 10+ international projects", "Developed innovative GIS solutions", "Collaborated with global teams"],
        projects: ["Urban Planning Systems", "Environmental Monitoring", "Transportation Analytics"]
      }
    ];
  
    const awards = [
      {
        award: "Best Research Paper Award",
        organization: "GIS International Conference",
        year: "2020",
        details: "Recognition for innovative work in Geo-AI integration",
        impact: "Cited by 100+ researchers worldwide",
        color: "from-blue-500 to-purple-500"
      },
      {
        award: "Outstanding Educator Award",
        organization: "Sejong University",
        year: "2019",
        details: "Acknowledged for excellence in teaching and mentorship",
        impact: "Improved student satisfaction rates by 40%",
        color: "from-green-500 to-blue-500"
      }
    ];
  
    return (
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative min-h-screen"
      >
        {/* Keep existing main container and title section exactly the same */}
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-16">
          {/* Title Section */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-4xl md:text-5xl lg:text-6xl font-bold mb-16 text-center bg-clip-text text-transparent bg-gradient-to-r ${
              darkMode ? textSystem.dark.gradient : textSystem.light.gradient
            }`}
          >
            About Dr. Sadeghi-Niaraki
          </motion.h2>
  
          {/* Updated Two-Column Layout with centered text */}
          <div className="grid md:grid-cols-2 gap-12 mb-16 items-center"> {/* Added items-center for vertical alignment */}
            {/* Introduction Column - Now vertically centered */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className={`p-8 rounded-2xl backdrop-blur-sm flex items-center ${
                darkMode ? 'bg-gray-900/30' : 'bg-white/30'
              }`}
            >
              <p className={`text-xl md:text-2xl ${
                darkMode ? textSystem.dark.tertiary : textSystem.light.tertiary
              }`}>
                Dr. Abolghasem Sadeghi-Niaraki, an Iranian scholar and researcher, is an Associate Professor at Sejong University, specializing in Geo-AI, XR, and GIS. His journey in academia and industry spans over 15 years, driven by a commitment to advancing technology and education.
              </p>
            </motion.div>
  
            {/* Video Section remains the same */ }
            
            <VideoS darkMode={darkMode} />
          </div>
  
          {/* Academic Journey - Interactive Timeline Slider */}
          <div className="mb-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center gap-3 mb-12"
            >
              <Calendar className={darkMode ? "text-blue-400" : "text-blue-600"} size={32} />
              <h3 className={`text-3xl font-bold ${
                darkMode ? textSystem.dark.primary : textSystem.light.primary
              }`}>
                Academic Journey
              </h3>
            </motion.div>
            
            <div className="relative">
              {/* Timeline Line */}
              <div className={`absolute top-0 left-1/2 w-1 h-full transform -translate-x-1/2 ${
                darkMode ? 'bg-blue-500/20' : 'bg-blue-600/20'
              }`} />
              
              {/* Journey Steps */}
              <div className="relative flex flex-col space-y-8">
                {academicJourney.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className={`flex items-center ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'} gap-8`}
                      onMouseEnter={() => setSelectedJourney(index)}
                    >
                      {/* Content Card */}
                      <div className={`flex-1 ${index % 2 === 0 ? 'text-right' : 'text-left'}`}>
                        <motion.div
                          className={`inline-block p-6 rounded-xl backdrop-blur-sm transition-all duration-300 ${
                            selectedJourney === index 
                              ? (darkMode ? 'bg-gray-700/50 scale-105' : 'bg-white/60 scale-105')
                              : (darkMode ? 'bg-gray-800/40' : 'bg-white/40')
                          }`}
                        >
                          <h4 className={`text-xl font-bold ${
                            darkMode ? textSystem.dark.primary : textSystem.light.primary
                          }`}>{item.title}</h4>
                          <p className={`${
                            darkMode ? textSystem.dark.secondary : textSystem.light.secondary
                          }`}>{item.institution}</p>
                          <p className={`text-sm mt-2 ${
                            darkMode ? 'text-blue-400' : 'text-blue-600'
                          }`}>{item.year}</p>
                          
                          <AnimatePresence>
                            {selectedJourney === index && (
                              <motion.p
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                className={`mt-4 ${
                                  darkMode ? textSystem.dark.tertiary : textSystem.light.tertiary
                                }`}
                              >
                                {item.details}
                              </motion.p>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      </div>
  
                      {/* Timeline Node */}
                      <div className="relative">
                        <motion.div
                          animate={{
                            scale: selectedJourney === index ? 1.2 : 1,
                            backgroundColor: selectedJourney === index 
                              ? (darkMode ? '#60A5FA' : '#2563EB')
                              : (darkMode ? '#1F2937' : '#ffffff')
                          }}
                          className={`w-12 h-12 rounded-full flex items-center justify-center ${
                            darkMode ? 'bg-gray-800' : 'bg-white'
                          } shadow-lg`}
                        >
                          <Icon className={`w-6 h-6 ${
                            selectedJourney === index
                              ? 'text-white'
                              : (darkMode ? 'text-blue-400' : 'text-blue-600')
                          }`} />
                        </motion.div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
  
          {/* Professional Experience - Accordion with Progress Bars */}
          <div className="mb-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center gap-3 mb-12"
            >
              <Briefcase className={darkMode ? "text-blue-400" : "text-blue-600"} size={32} />
              <h3 className={`text-3xl font-bold ${
                darkMode ? textSystem.dark.primary : textSystem.light.primary
              }`}>
                Professional Experience
              </h3>
            </motion.div>
  
            <div className="space-y-6">
              {experiences.map((exp, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 * index }}
                  className={`rounded-xl overflow-hidden ${
                    darkMode ? 'bg-gray-800/40' : 'bg-white/40'
                  }`}
                >
                  <motion.div
                    className="p-6 cursor-pointer"
                    onClick={() => setExpandedExp(expandedExp === index ? null : index)}
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className={`text-xl font-bold ${
                          darkMode ? textSystem.dark.primary : textSystem.light.primary
                        }`}>{exp.position}</h4>
                        <p className={`${
                          darkMode ? textSystem.dark.secondary : textSystem.light.secondary
                        }`}>{exp.institution}</p>
                        <p className={`text-sm ${
                          darkMode ? 'text-blue-400' : 'text-blue-600'
                        }`}>{exp.duration}</p>
                      </div>
                      <motion.div
                        animate={{ rotate: expandedExp === index ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ChevronDown className={darkMode ? "text-blue-400" : "text-blue-600"} />
                      </motion.div>
                    </div>
  
                    {/* Expandable Content */}
                    <AnimatePresence>
                      {expandedExp === index && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ 
                            height: "auto", 
                            opacity: 1,
                            transition: { duration: 0.5, ease: [0.04, 0.62, 0.23, 0.98] }
                          }}
                          exit={{ 
                            height: 0, 
                            opacity: 0,
                            transition: { duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }
                          }}
                        >
                          <div className="mt-6 space-y-6">
                            {/* Details */}
                            <p className={`${
                              darkMode ? textSystem.dark.tertiary : textSystem.light.tertiary
                            }`}>{exp.details}</p>
  
                            {/* Projects */}
                            <div className="space-y-4">
                              <h5 className={`font-semibold ${
                                darkMode ? textSystem.dark.primary : textSystem.light.primary
                              }`}>Key Projects</h5>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {exp.projects.map((project, i) => (
                                  <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 * i }}
                                    className={`p-4 rounded-lg ${
                                      darkMode ? 'bg-gray-700/50' : 'bg-white/60'
                                    }`}
                                  >
                                    {project}
                                  </motion.div>
                                ))}
                              </div>
                            </div>
  
                            {/* Achievements */}
                            <div className="space-y-4">
                              <h5 className={`font-semibold ${
                                darkMode ? textSystem.dark.primary : textSystem.light.primary
                              }`}>Achievements</h5>
                              <div className="space-y-2">
                                {exp.achievements.map((achievement, i) => (
                                  <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.1 * i }}
                                    className="flex items-center gap-2"
                                  >
                                    <ChevronRight className={
                                      darkMode ? "text-blue-400" : "text-blue-600"
                                    } />
                                    <span>{achievement}</span>
                                  </motion.div>
                                ))}
                              </div>
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
  
          {/* Awards and Recognition - Interactive Cards with Gradients */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center gap-3 mb-12"
            >
              <Award className={darkMode ? "text-blue-400" : "text-blue-600"} size={32} />
              <h3 className={`text-3xl font-bold ${
                darkMode ? textSystem.dark.primary : textSystem.light.primary
              }`}>
                Awards and Recognition
              </h3>
            </motion.div>
  
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {awards.map((award, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 * index }}
                  onMouseEnter={() => setHoveredAward(index)}
                  onMouseLeave={() => setHoveredAward(null)}
                  className="relative group"
                >
                  <motion.div
                    className={`absolute inset-0 rounded-xl bg-gradient-to-r ${award.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                  />
                
                <div className={`relative p-8 rounded-xl backdrop-blur-sm ${
                    darkMode ? 'bg-gray-800/40' : 'bg-white/40'
                  } transition-all duration-300 transform hover:scale-105`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <Star 
                          className={`w-8 h-8 mb-4 ${
                            hoveredAward === index 
                              ? 'text-yellow-400'
                              : (darkMode ? 'text-blue-400' : 'text-blue-600')
                          } transition-colors duration-300`}
                        />
                        <h4 className={`text-xl font-bold mb-2 ${
                          darkMode ? textSystem.dark.primary : textSystem.light.primary
                        }`}>{award.award}</h4>
                        <p className={`mb-2 ${
                          darkMode ? textSystem.dark.secondary : textSystem.light.secondary
                        }`}>{award.organization}</p>
                        <p className={`text-sm ${
                          darkMode ? 'text-blue-400' : 'text-blue-600'
                        }`}>{award.year}</p>
                      </div>
                    </div>
  
                    <AnimatePresence>
                      {hoveredAward === index && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ 
                            opacity: 1, 
                            y: 0,
                            transition: { 
                              duration: 0.3,
                              ease: "easeOut"
                            }
                          }}
                          exit={{ 
                            opacity: 0, 
                            y: 10,
                            transition: { 
                              duration: 0.2,
                              ease: "easeIn"
                            }
                          }}
                          className="mt-4 pt-4 border-t border-gray-600/20"
                        >
                          <p className={`mb-3 ${
                            darkMode ? textSystem.dark.tertiary : textSystem.light.tertiary
                          }`}>{award.details}</p>
                          <div className={`inline-block px-4 py-2 rounded-full text-sm ${
                            darkMode ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-800'
                          }`}>
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
        </div>
      </motion.section>
    );
  };

export default About;