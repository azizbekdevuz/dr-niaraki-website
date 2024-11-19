import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import textSystem from './textSystem';
import {
    ChartArea,
    Lightbulb,
    Trophy,
    Medal,
    Award,
    Star,
    Quote,
    ChevronLeft,
    ChevronRight,
}
from 'lucide-react';

const StatisticsTestimonials: React.FC<{ darkMode: boolean }> = ({ darkMode }) => {
    const [activeTestimonial, setActiveTestimonial] = useState(0);
    const [isHoveringStats, setIsHoveringStats] = useState(false);
  
    const statistics = [
      {
        number: "100+",
        label: "Peer-reviewed publications",
        icon: ChartArea,
        details: "Contributing to leading journals and conferences"
      },
      {
        number: "10",
        label: "US & Domestic Patents",
        icon: Lightbulb,
        details: "Innovative solutions in GIS and AI"
      },
      {
        number: "20+",
        label: "Years experience",
        icon: Trophy,
        details: "Research & teaching excellence"
      }
    ];
  
    const awards = [
      {
        title: "Australian Endeavour Research Fellowship",
        org: "Government of Australia",
        icon: Medal
      },
      {
        title: "Best Presented Paper Award",
        org: "2012 International Conference on GIS Engineering",
        icon: Trophy
      },
      {
        title: "National Distinguished Researcher Award",
        org: "Awarded by the Iranian President",
        icon: Award
      },
      {
        title: "Senior Member",
        org: "International Engineering and Technology Institute (IETI), 2015",
        icon: Star
      }
    ];
  
    const testimonials = [
      {
        quote: "Dr. Sadeghi-Niaraki's work in Geo-AI has revolutionized how we approach spatial data, enabling innovative applications in disaster management and urban planning.",
        author: "ETRI Research Team",
        position: "Research Partner"
      },
      {
        quote: "His research excellence and mentoring skills have made a profound impact on the academic community, fostering collaborations worldwide.",
        author: "Professor Kim",
        position: "KAIST"
      }
    ];
  
    return (
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative min-h-screen py-20 overflow-hidden"
      >
        {/* Background Gradient Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "linear"
            }}
            className={`absolute -top-1/4 -right-1/4 w-96 h-96 rounded-full ${
              darkMode ? 'bg-blue-500/20' : 'bg-blue-200/20'
            } blur-3xl`}
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "linear",
              delay: 1
            }}
            className={`absolute -bottom-1/4 -left-1/4 w-96 h-96 rounded-full ${
              darkMode ? 'bg-purple-500/20' : 'bg-purple-200/20'
            } blur-3xl`}
          />
        </div>
  
        <div className="max-w-7xl mx-auto px-4 md:px-8 relative">
          {/* Main Title */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-4xl md:text-5xl lg:text-6xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r ${
              darkMode ? textSystem.dark.gradient : textSystem.light.gradient
            } mb-24`}
          >
            Statistics & Testimonials
          </motion.h2>
  
          {/* Interactive Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
            {statistics.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onHoverStart={() => setIsHoveringStats(true)}
                  onHoverEnd={() => setIsHoveringStats(false)}
                  className={`relative group p-8 rounded-2xl border backdrop-blur-sm ${
                    darkMode 
                      ? 'border-gray-700/50 hover:bg-gray-800/60' 
                      : 'border-gray-200/50 hover:bg-white/60'
                  }`}
                >
                  <motion.div
                    animate={{
                      rotateY: isHoveringStats ? 180 : 0
                    }}
                    transition={{ duration: 0.6 }}
                    className="flex flex-col items-center backface-hidden"
                  >
                    <Icon size={40} className={darkMode ? 'text-blue-400' : 'text-blue-600'} />
                    <h3 className={`text-5xl font-bold mt-4 ${
                      darkMode ? textSystem.dark.primary : textSystem.light.primary
                    }`}>{stat.number}</h3>
                    <p className={`mt-2 text-center ${
                      darkMode ? textSystem.dark.tertiary : textSystem.light.tertiary
                    }`}>{stat.label}</p>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
  
          {/* Awards Carousel */}
          <div className="mb-24">
            <h3 className={`text-3xl font-bold text-center mb-12 ${
              darkMode ? textSystem.dark.primary : textSystem.light.primary
            }`}>Awards & Recognition</h3>
            
            <div className="flex flex-wrap justify-center gap-6">
              {awards.map((award, index) => {
                const Icon = award.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex items-center gap-4 p-4 rounded-xl border ${
                      darkMode 
                        ? 'border-gray-700/50 bg-gray-800/40' 
                        : 'border-gray-200/50 bg-white/40'
                    } backdrop-blur-sm w-full md:w-[calc(50%-1.5rem)]`}
                  >
                    <div className={`p-3 rounded-lg ${
                      darkMode ? 'bg-blue-500/20' : 'bg-blue-100'
                    }`}>
                      <Icon className={darkMode ? 'text-blue-400' : 'text-blue-600'} size={24} />
                    </div>
                    <div>
                      <h4 className={`font-bold ${
                        darkMode ? textSystem.dark.primary : textSystem.light.primary
                      }`}>{award.title}</h4>
                      <p className={`text-sm ${
                        darkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>{award.org}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
  
          {/* Testimonials Slider */}
          <div className="relative px-12">
            <div className={`p-8 rounded-2xl border ${
              darkMode 
                ? 'border-gray-700/50 bg-gray-800/40' 
                : 'border-gray-200/50 bg-white/40'
            } backdrop-blur-sm`}>
              <div className="relative">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTestimonial}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    className="text-center px-8"
                  >
                    <Quote 
                      size={40} 
                      className={`mx-auto mb-6 ${
                        darkMode ? 'text-blue-400' : 'text-blue-600'
                      }`} 
                    />
                    <p className={`text-xl italic mb-6 ${
                      darkMode ? textSystem.dark.tertiary : textSystem.light.tertiary
                    }`}>
                      {testimonials[activeTestimonial].quote}
                    </p>
                    <div>
                      <p className={`font-bold ${
                        darkMode ? textSystem.dark.primary : textSystem.light.primary
                      }`}>
                        {testimonials[activeTestimonial].author}
                      </p>
                      <p className={`text-sm ${
                        darkMode ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        {testimonials[activeTestimonial].position}
                      </p>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
  
              {/* Navigation Buttons */}
              <div className="absolute top-1/2 -translate-y-1/2 w-full left-0 flex justify-between pointer-events-none">
                <button
                  onClick={() => setActiveTestimonial(prev => 
                    prev === 0 ? testimonials.length - 1 : prev - 1
                  )}
                  className={`pointer-events-auto p-2 rounded-full ${
                    darkMode 
                      ? 'bg-gray-700 hover:bg-gray-600' 
                      : 'bg-white hover:bg-gray-100'
                  } shadow-lg transform -translate-x-1/2`}
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={() => setActiveTestimonial(prev => 
                    prev === testimonials.length - 1 ? 0 : prev + 1
                  )}
                  className={`pointer-events-auto p-2 rounded-full ${
                    darkMode 
                      ? 'bg-gray-700 hover:bg-gray-600' 
                      : 'bg-white hover:bg-gray-100'
                  } shadow-lg transform translate-x-1/2`}
                >
                  <ChevronRight size={24} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.section>
    );
  };

export default StatisticsTestimonials;