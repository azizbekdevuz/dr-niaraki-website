import React, { useState } from 'react';
import { motion } from 'framer-motion';
import textSystem from './textSystem';
import {
    Mail,
    Phone,
    Map,
    MessageSquare,
    CheckCircle,
    Copy,
    Send,
    Clock,
    Building,
    Globe,
}
from 'lucide-react';

const Contact: React.FC<{ darkMode: boolean }> = ({ darkMode }) => {
    const [activeMethod, setActiveMethod] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
  
    const contactMethods = [
      {
        type: 'email',
        icon: Mail,
        title: 'Email',
        value: 'a.sadeghi.ni@sejong.ac.kr',
        action: 'Copy'
      },
      {
        type: 'phone',
        icon: Phone,
        title: 'Phone',
        value: '+82-2-6935-2474',
        action: 'Call'
      },
      {
        type: 'location',
        icon: Map,
        title: 'Location',
        value: 'Seoul, South Korea',
        action: 'View'
      }
    ];
  
    const timeZones = [
      { city: 'Seoul', offset: '+9', current: true },
      { city: 'Tehran', offset: '+3:30', current: false },
      { city: 'UTC', offset: '+0', current: false }
    ];

    const handleCopy = (text: string) => { {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }};
  
    return (
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative min-h-screen py-20 overflow-hidden"
      >
        {/* Interactive Background */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            animate={{
              backgroundPosition: ['0% 0%', '100% 100%'],
              opacity: [0.03, 0.07]
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              repeatType: 'reverse'
            }}
            className={`absolute inset-0 ${
              darkMode 
                ? 'bg-gradient-to-br from-blue-500/10 to-purple-500/10' 
                : 'bg-gradient-to-br from-blue-200/20 to-purple-200/20'
            }`}
            style={{
              backgroundSize: '400% 400%'
            }}
          />
        </div>
  
        <div className="max-w-7xl mx-auto px-4 md:px-8 relative">
          {/* Title with 3D effect */}
          <div className="relative mb-16">
            <motion.div
              className="absolute inset-0 flex items-center justify-center opacity-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.1 }}
            >
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className={`absolute ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}
                  animate={{ 
                    scale: [1, 1.2, 1],
                    rotate: [0, 180, 360],
                    opacity: [0.3, 0.6, 0.3]
                  }}
                  transition={{
                    duration: 10,
                    repeat: Infinity,
                    delay: i * 0.2
                  }}
                >
                  <MessageSquare size={40} />
                </motion.div>
              ))}
            </motion.div>
  
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`text-4xl md:text-5xl lg:text-6xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r ${
                darkMode ? textSystem.dark.gradient : textSystem.light.gradient
              } relative z-10 mb-4`}
            >
              Get in Touch
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`text-center text-lg ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              How about collaborating on innovative research and projects?
            </motion.p>
          </div>
  
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start">
            {/* Contact Methods */}
            <div className="lg:col-span-3 space-y-6">
              {contactMethods.map((method, index) => {
                const Icon = method.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onMouseEnter={() => setActiveMethod(method.type)}
                    onMouseLeave={() => setActiveMethod(null)}
                    className={`relative group p-6 rounded-xl border backdrop-blur-sm transition-all duration-300 ${
                      darkMode 
                        ? 'border-gray-700/50 hover:bg-gray-800/60' 
                        : 'border-gray-200/50 hover:bg-white/60'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${
                        darkMode ? 'bg-gray-700/50' : 'bg-gray-100/50'
                      }`}>
                        <Icon className={
                          activeMethod === method.type
                            ? 'text-blue-400'
                            : (darkMode ? 'text-gray-400' : 'text-gray-600')
                        } size={24} />
                      </div>
                      <div className="flex-1">
                        <h3 className={`text-xl font-bold mb-1 ${
                          darkMode ? textSystem.dark.primary : textSystem.light.primary
                        }`}>{method.title}</h3>
                        <p className={`${
                          darkMode ? textSystem.dark.tertiary : textSystem.light.tertiary
                        }`}>{method.value}</p>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => method.type === 'email' && handleCopy(method.value)}
                        className={`px-4 py-2 rounded-lg ${
                          darkMode 
                            ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30' 
                            : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                        }`}
                      >
                        {method.type === 'email' ? (
                          <>
                            {copied ? (
                              <div className="flex items-center gap-2">
                                <CheckCircle size={16} />
                                Copied!
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Copy size={16} />
                                Copy
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Send size={16} />
                            {method.action}
                          </div>
                        )}
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
  
            {/* Time Zones and Location */}
            <div className="lg:col-span-2 space-y-6">
              {/* Current Time */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-6 rounded-xl border backdrop-blur-sm ${
                  darkMode ? 'border-gray-700/50 bg-gray-800/40' : 'border-gray-200/50 bg-white/40'
                }`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <Clock className={darkMode ? 'text-blue-400' : 'text-blue-600'} size={24} />
                  <h3 className={`text-xl font-bold ${
                    darkMode ? textSystem.dark.primary : textSystem.light.primary
                  }`}>Time Zones</h3>
                </div>
                <div className="space-y-4">
                  {timeZones.map((zone, index) => (
                    <div
                      key={index}
                      className={`flex justify-between items-center ${
                        zone.current ? 'opacity-100' : 'opacity-70'
                      }`}
                    >
                      <span className={darkMode ? textSystem.dark.secondary : textSystem.light.secondary}>
                        {zone.city}
                      </span>
                      <span className={`${
                        darkMode ? 'text-blue-400' : 'text-blue-600'
                      } font-mono`}>
                        UTC{zone.offset}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
  
              {/* Office Location */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-6 rounded-xl border backdrop-blur-sm ${
                  darkMode ? 'border-gray-700/50 bg-gray-800/40' : 'border-gray-200/50 bg-white/40'
                }`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <Building className={darkMode ? 'text-blue-400' : 'text-blue-600'} size={24} />
                  <h3 className={`text-xl font-bold ${
                    darkMode ? textSystem.dark.primary : textSystem.light.primary
                  }`}>Office Location</h3>
                </div>
                <p className={`mb-2 ${
                  darkMode ? textSystem.dark.secondary : textSystem.light.secondary
                }`}>
                  Department of Computer Science & Engineering
                </p>
                <p className={`mb-4 ${
                  darkMode ? textSystem.dark.tertiary : textSystem.light.tertiary
                }`}>
                  Sejong University, Seoul, South Korea
                </p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg ${
                    darkMode 
                      ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30' 
                      : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                  }`}
                >
                  <Globe size={16} />
                  View on Map
                </motion.button>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.section>
    );
  };

export default Contact;