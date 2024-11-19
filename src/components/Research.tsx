import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import textSystem from './textSystem';
import {
    Book,
    Globe,
    Brain,
    HeartPulse,
    Network,
    CircuitBoard,
    Sparkles,
    Activity,
    Clock,
    ArrowRight,
    X,
}
from 'lucide-react';

const Research: React.FC<{ darkMode: boolean }> = ({ darkMode }) => {
    const [showModal, setShowModal] = useState<typeof researchProjects[0] | null>(null);
    const [, setHoveredProject] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState('all');
  
    const categories = [
      { id: 'all', label: 'All Research', icon: Book },
      { id: 'xr', label: 'XR & Metaverse', icon: Globe },
      { id: 'ai', label: 'AI & Computing', icon: Brain },
      { id: 'health', label: 'Healthcare', icon: HeartPulse },
    ];
  
    const researchProjects = [
      {
        title: "Super-Realistic XR Technology for the Metaverse",
        description: "Exploring interconnected immersive environments for XR and Metaverse applications, funded by the Ministry of Science, South Korea.",
        duration: "2022 - 2030",
        details: "This project aims to create a super-realistic Metaverse experience using advanced XR technologies. The research focuses on immersive environments, leveraging cutting-edge graphics and AI to enhance user interaction and experience.",
        category: 'xr',
        icon: Network,
        stats: {
          publications: 12,
          citations: 145,
          collaborators: 8
        },
        status: 'active'
      },
      {
        title: "Mobile Virtual Reality Research Center",
        description: "Innovative VR solutions for mobile platforms under the Korean Ministry of Science and ICT.",
        duration: "2017 - 2021",
        details: "The Mobile VR Research Center pioneered VR solutions for mobile devices, advancing accessible immersive experiences.",
        category: 'xr',
        icon: CircuitBoard,
        stats: {
          publications: 25,
          citations: 320,
          collaborators: 15
        },
        status: 'completed'
      },
      {
        title: "Geo-AI and Disaster Management",
        description: "Geo-AI applications for mapping natural hazards and supporting decision-making processes.",
        duration: "Ongoing",
        details: "Geo-AI and Disaster Management integrates AI in geographic information systems to predict and manage natural hazards.",
        category: 'ai',
        icon: Brain,
        stats: {
          publications: 8,
          citations: 95,
          collaborators: 6
        },
        status: 'active'
      },
      {
        title: "Healthcare and Telemedicine Projects",
        description: "Advancing healthcare accessibility with GIS-based telemedicine solutions in partnership with the UN and other agencies.",
        duration: "Completed",
        details: "This initiative improved telemedicine by integrating GIS to enhance healthcare accessibility in remote areas.",
        category: 'health',
        icon: HeartPulse,
        stats: {
          publications: 15,
          citations: 180,
          collaborators: 12
        },
        status: 'completed'
      },
      {
        title: "International Research Collaborations",
        description: "Collaborative projects with ETRI, KAIST, and other global institutions on Geo-AI and ICT development.",
        duration: "Ongoing",
        details: "Engaging with institutions like ETRI and KAIST, this project explores global research initiatives in Geo-AI and ICT.",
        category: 'ai',
        icon: Globe,
        stats: {
          publications: 18,
          citations: 210,
          collaborators: 20
        },
        status: 'active'
      }
    ];
  
    const filteredProjects = activeFilter === 'all' 
      ? researchProjects 
      : researchProjects.filter(project => project.category === activeFilter);
  
    return (
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative min-h-screen"
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-16">
          {/* Title with Floating Elements */}
          <div className="relative mb-16">
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.1 }}
            >
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className={`absolute ${
                    darkMode ? 'text-blue-400' : 'text-blue-600'
                  }`}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ 
                    opacity: [0.3, 0.6, 0.3],
                    scale: [1, 1.2, 1],
                    x: Math.sin(i) * 100,
                    y: Math.cos(i) * 100,
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
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
              Research Highlights
            </motion.h2>
          </div>
  
          {/* Category Filters */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap justify-center gap-4 mb-12"
          >
            {categories.map(category => {
              const Icon = category.icon;
              return (
                <motion.button
                  key={category.id}
                  onClick={() => setActiveFilter(category.id)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full transition-all duration-300 ${
                    activeFilter === category.id
                      ? (darkMode ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-800')
                      : (darkMode ? 'bg-gray-800/40 hover:bg-gray-700/50' : 'bg-white/40 hover:bg-white/60')
                  }`}
                >
                  <Icon size={20} />
                  {category.label}
                </motion.button>
              );
            })}
          </motion.div>
  
          {/* Research Grid with Staggered Animation */}
          <div className="flex flex-col justify-center w-full">
            <div className="w-full" style={{ maxWidth: '1200px' }}>
              <motion.div 
                className="grid gap-8"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, 360px)',
                  justifyContent: 'center',
                  width: '100%'
                }}
              >
                <AnimatePresence mode="popLayout">
                  {filteredProjects.map((project, index) => {
                    const Icon = project.icon;
                    return (
                      <motion.div
                        key={project.title}
                        layout
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                        onHoverStart={() => setHoveredProject(project.title || null)}
                        onHoverEnd={() => setHoveredProject(null)}
                        className={`relative group w-full rounded-xl ${
                          darkMode ? 'bg-gray-800/40' : 'bg-white/40'
                        } backdrop-blur-sm border ${
                          darkMode ? 'border-gray-700/50' : 'border-gray-200/50'
                        }`}
                      >
                        {/* Status Indicator */}
                        <div className={`absolute top-4 right-4 flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                          project.status === 'active'
                            ? (darkMode ? 'bg-green-500/20 text-green-300' : 'bg-green-100 text-green-800')
                            : (darkMode ? 'bg-gray-500/20 text-gray-300' : 'bg-gray-100 text-gray-800')
                        }`}>
                          <Activity size={14} />
                          {project.status === 'active' ? 'Active' : 'Completed'}
                        </div>
  
                        <div className="p-8 h-full flex flex-col">
                          {/* Icon and Title Section */}
                          <div className="flex items-start gap-4 mb-4">
                            <div className={`p-3 rounded-lg ${
                              darkMode ? 'bg-gray-700/50' : 'bg-gray-100/50'
                            }`}>
                              <Icon size={24} className={
                                darkMode ? 'text-blue-400' : 'text-blue-600'
                              } />
                            </div>
                            <div className="flex-1">
                              <h3 className={`text-xl font-bold ${
                                darkMode ? textSystem.dark.primary : textSystem.light.primary
                              }`}>{project.title}</h3>
                              <div className="flex items-center gap-2 mt-2">
                                <Clock size={14} className={
                                  darkMode ? 'text-gray-400' : 'text-gray-600'
                                } />
                                <span className="text-sm">{project.duration}</span>
                              </div>
                            </div>
                          </div>
  
                          {/* Description with flex-grow to push stats to bottom */}
                          <div className="flex-grow">
                            <p className={`mb-6 ${
                              darkMode ? textSystem.dark.tertiary : textSystem.light.tertiary
                            }`}>{project.description}</p>
                          </div>
  
                          {/* Stats and Button Section - Always at Bottom */}
                          <div className="mt-auto">
                            {/* Stats Grid */}
                            <div className="grid grid-cols-3 gap-4 mb-6">
                              {Object.entries(project.stats).map(([key, value]) => (
                                <div key={key} className="text-center">
                                  <div className={`text-lg font-bold ${
                                    darkMode ? textSystem.dark.primary : textSystem.light.primary
                                  }`}>{value}</div>
                                  <div className={`text-sm ${
                                    darkMode ? textSystem.dark.tertiary : textSystem.light.tertiary
                                  }`}>{key}</div>
                                </div>
                              ))}
                            </div>
  
                            {/* Learn More Button */}
                            <motion.button
                              whileHover={{ x: 5 }}
                              onClick={() => setShowModal(project)}
                              className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg ${
                                darkMode 
                                  ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30' 
                                  : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                              } transition-colors duration-300`}
                            >
                              Learn more
                              <ArrowRight size={16} />
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </motion.div>
            </div>
          </div>
          
          {/* Enhanced Modal */}
          <AnimatePresence>
            {showModal && (
              <div className="fixed inset-0 flex items-center justify-center z-50">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                  onClick={() => setShowModal(null)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className={`relative w-11/12 max-w-2xl p-8 rounded-xl ${
                    darkMode ? "bg-gray-900" : "bg-white"
                  } shadow-xl`}
                >
                  <div className="mb-6">
                    <h3 className={`text-2xl font-bold mb-4 ${
                      darkMode ? textSystem.dark.primary : textSystem.light.primary
                    }`}>{showModal.title}</h3>
                    <p className={`mb-4 ${
                      darkMode ? textSystem.dark.secondary : textSystem.light.secondary
                    }`}>{showModal.details}</p>
                    
                    {/* Stats in Modal */}
                    <div className="grid grid-cols-3 gap-6 mt-6">
                      {Object.entries(showModal.stats).map(([key, value]) => (
                        <div key={key} className={`p-4 rounded-lg ${
                          darkMode ? 'bg-gray-800/50' : 'bg-gray-100/50'
                        }`}>
                          <div className={`text-2xl font-bold mb-1 ${
                            darkMode ? textSystem.dark.primary : textSystem.light.primary
                          }`}>{value}</div>
                          <div className={`text-sm ${
                            darkMode ? textSystem.dark.tertiary : textSystem.light.tertiary
                          }`}>{key}</div>
                        </div>
                      ))}
                    </div>
                  </div>
  
                  <div className={`flex items-center justify-between ${
                    darkMode ? 'border-t border-gray-700' : 'border-t border-gray-200'
                  } pt-4`}>
                    <div className={`flex items-center gap-2 ${
                      darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      <Clock size={16} />
                      <span>{showModal.duration}</span>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setShowModal(null)}
                      className={`p-2 rounded-full ${
                        darkMode ? "bg-gray-800 hover:bg-gray-700" : "bg-gray-100 hover:bg-gray-200"
                      }`}
                    >
                      <X size={20} />
                    </motion.button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </motion.section>
    );
  };

export default Research;