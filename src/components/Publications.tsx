import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import textSystem from './textSystem';
import {
    Quote,
    Calendar,
    BookOpen,
    ExternalLink,
}
from 'lucide-react';

const Publications: React.FC<{ darkMode: boolean }> = ({ darkMode }) => {
    const [hoveredPub, setHoveredPub] = useState<string | null>(null);
    const [activeYear, setActiveYear] = useState('2024');
  
    const publications = [
      {
        title: "Enhancing Flood-Prone Area Mapping",
        description: "Fine-tuning KNN algorithm for flood susceptibility mapping in natural hazards research.",
        journal: "International Journal of Digital Earth",
        year: "2024",
        type: "research"
      },
      {
        title: "AI and Plant Disease Detection",
        description: "Pioneering methods for early-stage plant disease detection using advanced AI.",
        journal: "Frontiers in Plant Science",
        year: "2024",
        type: "article"
      },
      {
        title: "GeoAI in Urban Environments",
        description: "Exploring multi-pollution variability with geospatial AI-driven modeling.",
        journal: "International Journal of Digital Earth",
        year: "2024",
        type: "research"
      },
      {
        title: "Tumor Detection with AI",
        description: "Deep learning advancements for multimodality imaging in tumor diagnosis.",
        journal: "Journal of X-Ray Science and Technology",
        year: "2024",
        type: "article"
      },
      {
        title: "Virtual Reality and Education",
        description: "Developing immersive VR games for education using GIS and AR.",
        journal: "Sustainability",
        year: "2021",
        type: "research"
      },
      {
        title: "Flood Susceptibility Optimization",
        description: "Combining ensemble machine learning with evolutionary algorithms.",
        journal: "Environmental Pollution",
        year: "2023",
        type: "article"
      }
    ];
  
    const years = [...new Set(publications.map(pub => pub.year))].sort((a, b) => Number(b) - Number(a));
    const filteredPublications = publications.filter(pub => pub.year === activeYear);
  
    return (
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative min-h-screen py-20"
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          {/* Title with floating quotes */}
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
                  <Quote size={24} />
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
              Publications
            </motion.h2>
          </div>
  
          {/* Year Navigation Tabs */}
          <div className="flex justify-center mb-12">
            <div className={`inline-flex rounded-xl p-1 ${
              darkMode ? 'bg-gray-800/40' : 'bg-white/40'
            } backdrop-blur-sm`}>
              {years.map((year) => (
                <motion.button
                  key={year}
                  onClick={() => setActiveYear(year)}
                  className={`relative px-6 py-2 rounded-lg text-lg font-semibold transition-colors duration-300 ${
                    activeYear === year
                      ? (darkMode ? 'text-blue-300' : 'text-blue-800')
                      : (darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800')
                  }`}
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <Calendar size={16} />
                    {year}
                  </span>
                  {activeYear === year && (
                    <motion.div
                      layoutId="activeTab"
                      className={`absolute inset-0 rounded-lg ${
                        darkMode ? 'bg-blue-500/20' : 'bg-blue-100'
                      }`}
                      transition={{ type: "spring", duration: 0.6 }}
                    />
                  )}
                </motion.button>
              ))}
            </div>
          </div>
  
          {/* Publications Grid with Animation */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeYear}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center"
            >
              {filteredPublications.map((pub, index) => (
                <motion.div
                  key={`${pub.year}-${index}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  onHoverStart={() => setHoveredPub(`${pub.year}-${index}`)}
                  onHoverEnd={() => setHoveredPub(null)}
                  className="w-full max-w-[360px]"
                >
                  <div className={`h-full p-6 rounded-xl border backdrop-blur-sm transition-all duration-300 ${
                    darkMode 
                      ? `border-gray-700/50 ${hoveredPub === `${pub.year}-${index}` ? 'bg-gray-800/60' : 'bg-gray-800/40'}` 
                      : `border-gray-200/50 ${hoveredPub === `${pub.year}-${index}` ? 'bg-white/60' : 'bg-white/40'}`
                  }`}>
                    <div className="flex flex-col h-full">
                      <div className="flex items-start gap-4 mb-4">
                        <div className={`p-3 rounded-lg ${
                          darkMode ? 'bg-gray-700/50' : 'bg-gray-100/50'
                        }`}>
                          <BookOpen className={darkMode ? 'text-blue-400' : 'text-blue-600'} size={24} />
                        </div>
                        <h3 className={`text-xl font-bold ${
                          darkMode ? textSystem.dark.primary : textSystem.light.primary
                        }`}>{pub.title}</h3>
                      </div>
  
                      <p className={`mb-6 flex-grow ${
                        darkMode ? textSystem.dark.tertiary : textSystem.light.tertiary
                      }`}>{pub.description}</p>
  
                      <div className={`flex items-center justify-between pt-4 border-t ${
                        darkMode ? 'border-gray-700/30' : 'border-gray-200/30'
                      }`}>
                        <span className={`text-sm ${
                          darkMode ? 'text-blue-400' : 'text-blue-600'
                        }`}>{pub.journal}</span>
                        
                        <motion.button
                          whileHover={{ x: 5 }}
                          className={`flex items-center gap-2 text-sm ${
                            darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                          }`}
                        >
                          View paper
                          <ExternalLink size={16} />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.section>
    );
  };

export default Publications;