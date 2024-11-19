import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import textSystem from './textSystem';
import {
    School,
    GraduationCap,
    Award,
    Sparkles,
    Clock,
    ChevronRight,
    Book,
    Target,
}
from 'lucide-react';

const TeachingExperience: React.FC<{ darkMode: boolean }> = ({ darkMode }) => {
  const [activeRole, setActiveRole] = useState<number | null>(null);
  const [hoveredCourse, setHoveredCourse] = useState<number | null>(null);
  
    const teachingRoles = [
      {
        title: "Associate Professor",
        institution: "Sejong University",
        department: "Department of Computer Science & Engineering",
        period: "March 2017 - Present",
        description: "Teaching various courses in Virtual Reality, AI, Geo-informatics, supervising multiple graduate students, and contributing to interdisciplinary academic research.",
        icon: School,
        stats: {
          students: "200+",
          projects: "45+",
          years: "6+"
        }
      },
      {
        title: "Assistant Professor",
        institution: "INHA University",
        department: "Department of Geo-Informatics Engineering",
        period: "March 2009 - February 2017",
        description: "Taught and developed curriculum in spatial analysis and GIS, supervising both Master's and Ph.D. students in advanced geo-informatics.",
        icon: GraduationCap,
        stats: {
          students: "150+",
          projects: "30+",
          years: "8"
        }
      },
      {
        title: "Invited Lecturer",
        institution: "KNTU & University of Tehran",
        department: "Departments of Surveying & Geomatics Engineering",
        period: "Summer Semesters",
        description: "Summer semesters focused on advanced GIS and spatial technologies.",
        icon: Award,
        stats: {
          students: "50+",
          projects: "10+",
          years: "2"
        }
      }
    ];
  
    const courses = [
      { name: 'Artificial Intelligence and Big Data', category: 'AI' },
      { name: 'Human-Computer Interaction (HCI)', category: 'CS' },
      { name: 'Advanced Spatial Analysis', category: 'GIS' },
      { name: 'Special Topics in IoT', category: 'IoT' },
      { name: 'Web Programming', category: 'CS' },
      { name: 'Operating Systems', category: 'CS' },
      { name: 'GIS Programming', category: 'GIS' },
      { name: 'Data Structures', category: 'CS' },
      { name: 'Introduction to Computer Science', category: 'CS' },
      { name: 'Advanced C Programming', category: 'CS' }
    ];
  
    return (
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative min-h-screen py-20"
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          {/* Title with Sparkles */}
          <div className="relative mb-16">
            <motion.div className="absolute inset-0 flex items-center justify-center">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className={`absolute ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}
                  animate={{ 
                    opacity: [0.3, 0.6, 0.3],
                    scale: [1, 1.2, 1],
                    x: Math.sin(i * 2) * 50,
                    y: Math.cos(i * 2) * 50
                  }}
                  transition={{ duration: 3, repeat: Infinity, delay: i * 0.2 }}
                >
                  <Sparkles size={24} />
                </motion.div>
              ))}
            </motion.div>
            
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`text-4xl md:text-5xl lg:text-6xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r ${
                darkMode ? textSystem.dark.gradient : textSystem.light.gradient
              } relative z-10`}
            >
              Teaching Experience
            </motion.h2>
          </div>
  
          {/* Teaching Roles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {teachingRoles.map((role, index) => {
              const Icon = role.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setActiveRole(activeRole === index ? null : index)}
                  className={`relative group cursor-pointer transition-all duration-300 ${
                    activeRole === index ? 'scale-[1.02]' : ''
                  }`}
                >
                  <div className={`p-6 rounded-xl border backdrop-blur-sm ${
                    darkMode 
                      ? `border-gray-700/50 ${activeRole === index ? 'bg-gray-800/60' : 'bg-gray-800/40'}` 
                      : `border-gray-200/50 ${activeRole === index ? 'bg-white/60' : 'bg-white/40'}`
                  }`}>
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`p-3 rounded-lg ${
                        darkMode ? 'bg-gray-700/50' : 'bg-gray-100/50'
                      }`}>
                        <Icon className={darkMode ? 'text-blue-400' : 'text-blue-600'} size={24} />
                      </div>
                      <div>
                        <h3 className={`text-xl font-bold ${
                          darkMode ? textSystem.dark.primary : textSystem.light.primary
                        }`}>{role.title}</h3>
                        <p className={`text-sm ${
                          darkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>{role.institution}</p>
                      </div>
                    </div>
  
                    <div className={`flex items-center gap-2 mb-4 text-sm ${
                      darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      <Clock size={16} />
                      {role.period}
                    </div>
  
                    <AnimatePresence>
                      {activeRole === index && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <p className={`mb-4 text-sm ${
                            darkMode ? textSystem.dark.tertiary : textSystem.light.tertiary
                          }`}>{role.description}</p>
                          
                          <div className="grid grid-cols-3 gap-4">
                            {Object.entries(role.stats).map(([key, value]) => (
                              <div key={key} className="text-center">
                                <div className={`text-lg font-bold ${
                                  darkMode ? textSystem.dark.primary : textSystem.light.primary
                                }`}>{value}</div>
                                <div className={`text-xs ${
                                  darkMode ? 'text-gray-400' : 'text-gray-600'
                                }`}>{key}</div>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
  
                    <motion.div
                      initial={false}
                      animate={{ rotate: activeRole === index ? 180 : 0 }}
                      className="absolute top-6 right-6"
                    >
                      <ChevronRight className={
                        darkMode ? 'text-blue-400' : 'text-blue-600'
                      } size={20} />
                    </motion.div>
                  </div>
                </motion.div>
              );
            })}
          </div>
  
          {/* Courses Section */}
          <div className="mt-16">
            <div className="text-center mb-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center gap-3 mb-2"
              >
                <Book className={darkMode ? "text-blue-400" : "text-blue-600"} size={32} />
                <h3 className={`text-3xl font-bold ${
                  darkMode ? textSystem.dark.primary : textSystem.light.primary
                }`}>
                  Courses Taught
                </h3>
              </motion.div>
              <p className={`text-sm ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Comprehensive curriculum spanning multiple disciplines</p>
            </div>
  
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map((course, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onHoverStart={() => setHoveredCourse(index)}
                  onHoverEnd={() => setHoveredCourse(null)}
                  className={`group relative p-4 rounded-xl border transition-all duration-300 ${
                    darkMode 
                      ? 'border-gray-700/50 hover:bg-gray-800/60' 
                      : 'border-gray-200/50 hover:bg-white/60'
                  } backdrop-blur-sm`}
                >
                  <motion.div
                    animate={{
                      scale: hoveredCourse === index ? 1.05 : 1
                    }}
                    className="flex items-center gap-3"
                  >
                    <Target className={`${
                      darkMode ? 'text-blue-400' : 'text-blue-600'
                    } ${
                      hoveredCourse === index ? 'rotate-90' : ''
                    } transition-transform duration-300`} size={16} />
                    <span className={`${
                      darkMode ? textSystem.dark.primary : textSystem.light.primary
                    }`}>{course.name}</span>
                  </motion.div>
                  
                  <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs ${
                    darkMode ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {course.category}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.section>
    );
  };

export default TeachingExperience;