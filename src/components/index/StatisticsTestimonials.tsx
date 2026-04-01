import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import textSystem from "@/theme/textSystem";
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
} from "lucide-react";
import useDeviceDetect from "@/hooks/useDeviceDetect";

const StatisticsTestimonials: React.FC<{ darkMode: boolean }> = ({ darkMode }) => {
  const { isMobile } = useDeviceDetect();
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [activeAward, setActiveAward] = useState<number | null>(null);

  const statistics = [
    {
      number: "100+",
      label: "Peer-reviewed publications",
      icon: ChartArea,
      details: "Contributing to leading journals and conferences",
    },
    {
      number: "10",
      label: "US & Domestic Patents",
      icon: Lightbulb,
      details: "Innovative solutions in GIS and AI",
    },
    {
      number: "20+",
      label: "Years experience",
      icon: Trophy,
      details: "Research & teaching excellence",
    },
  ];

  const awards = [
    {
      title: "Australian Endeavour Research Fellowship",
      org: "Government of Australia",
      icon: Medal,
    },
    {
      title: "Best Presented Paper Award",
      org: "2012 International Conference on GIS Engineering",
      icon: Trophy,
    },
    {
      title: "National Distinguished Researcher Award",
      org: "Awarded by the Iranian President",
      icon: Award,
    },
    {
      title: "Senior Member",
      org: "International Engineering and Technology Institute (IETI), 2015",
      icon: Star,
    },
  ];

  const testimonials = [
    {
      quote:
        "Dr. Sadeghi-Niaraki's work in Geo-AI has revolutionized how we approach spatial data, enabling innovative applications in disaster management and urban planning.",
      author: "ETRI Research Team",
      position: "Research Partner",
    },
    {
      quote:
        "His research excellence and mentoring skills have made a profound impact on the academic community, fostering collaborations worldwide.",
      author: "Professor Kim",
      position: "KAIST",
    },
  ];

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative min-h-screen py-12 sm:py-20 overflow-hidden"
    >
      {/* Background Gradient Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className={`absolute -top-1/4 -right-1/4 w-72 h-72 sm:w-96 sm:h-96 rounded-full ${darkMode ? "bg-blue-500/20" : "bg-blue-200/20"} blur-3xl`}
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear", delay: 1 }}
          className={`absolute -bottom-1/4 -left-1/4 w-72 h-72 sm:w-96 sm:h-96 rounded-full ${darkMode ? "bg-purple-500/20" : "bg-purple-200/20"} blur-3xl`}
        />
      </div>

      <div className="max-w-3xl sm:max-w-7xl mx-auto px-4 md:px-8 relative">
        {/* Main Title */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`text-3xl sm:text-4xl md:text-5xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r ${darkMode ? textSystem.dark.gradient : textSystem.light.gradient} mb-10 sm:mb-24`}
        >
          Statistics & Testimonials
        </motion.h2>

        {/* Statistics Cards */}
        <div className={`${isMobile ? "flex flex-col gap-4 mb-10" : "grid grid-cols-3 gap-8 mb-24"}`}>
          {statistics.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex flex-col items-center p-5 sm:p-8 rounded-2xl border backdrop-blur-sm transition-all ${
                  darkMode
                    ? "border-gray-700/50 bg-slate-800/70"
                    : "border-gray-200/50 bg-white/70"
                }`}
              >
                <Icon size={isMobile ? 32 : 40} className={darkMode ? "text-blue-400" : "text-blue-600"} />
                <h3 className={`mt-3 text-3xl sm:text-5xl font-bold ${darkMode ? textSystem.dark.primary : textSystem.light.primary}`}>{stat.number}</h3>
                <p className={`mt-2 text-center text-base sm:text-lg ${darkMode ? textSystem.dark.tertiary : textSystem.light.tertiary}`}>{stat.label}</p>
                {isMobile && (
                  <p className={`mt-2 text-xs text-center ${darkMode ? "text-slate-400" : "text-slate-500"}`}>{stat.details}</p>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Awards Section */}
        <div className={`${isMobile ? "mb-10" : "mb-24"}`}>
          <h3 className={`text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-12 ${darkMode ? textSystem.dark.primary : textSystem.light.primary}`}>Awards & Recognition</h3>
          <div className={`${isMobile ? "flex flex-col gap-4" : "flex flex-wrap justify-center gap-6"}`}>
            {awards.map((award, index) => {
              const Icon = award.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => isMobile && setActiveAward(activeAward === index ? null : index)}
                  className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                    darkMode
                      ? activeAward === index && isMobile
                        ? "border-blue-400 bg-slate-800/90"
                        : "border-gray-700/50 bg-slate-800/70"
                      : activeAward === index && isMobile
                        ? "border-blue-500 bg-white"
                        : "border-gray-200/50 bg-white/70"
                  } ${isMobile ? "flex-col items-start" : "w-full sm:w-[calc(50%-1.5rem)]"}`}
                >
                  <div className={`p-3 rounded-lg ${darkMode ? "bg-blue-500/20" : "bg-blue-100"}`}>
                    <Icon className={darkMode ? "text-blue-400" : "text-blue-600"} size={isMobile ? 20 : 24} />
                  </div>
                  <div>
                    <h4 className={`font-bold ${darkMode ? textSystem.dark.primary : textSystem.light.primary}`}>{award.title}</h4>
                    <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{award.org}</p>
                  </div>
                  {isMobile && activeAward === index && (
                    <div className="mt-2 text-xs text-blue-400">Tap again to collapse</div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Testimonials Slider */}
        <div className={`relative ${isMobile ? "px-0" : "px-12"}`}>
          <div className={`p-5 sm:p-8 rounded-2xl border backdrop-blur-sm transition-all ${darkMode ? "border-gray-700/50 bg-slate-800/70" : "border-gray-200/50 bg-white/70"}`}>
            <div className="relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTestimonial}
                  initial={{ opacity: 0, x: isMobile ? 30 : 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: isMobile ? -30 : -50 }}
                  className="text-center px-2 sm:px-8"
                >
                  <Quote size={isMobile ? 28 : 40} className={`mx-auto mb-4 sm:mb-6 ${darkMode ? "text-blue-400" : "text-blue-600"}`} />
                  <p className={`text-base sm:text-xl italic mb-4 sm:mb-6 ${darkMode ? textSystem.dark.tertiary : textSystem.light.tertiary}`}>{testimonials[activeTestimonial].quote}</p>
                  <div>
                    <p className={`font-bold ${darkMode ? textSystem.dark.primary : textSystem.light.primary}`}>{testimonials[activeTestimonial].author}</p>
                    <p className={`text-xs sm:text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{testimonials[activeTestimonial].position}</p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
            {/* Navigation Buttons */}
            <div className="flex justify-center gap-6 mt-4">
              <button
                onClick={() => setActiveTestimonial((prev) => prev === 0 ? testimonials.length - 1 : prev - 1)}
                className={`p-2 sm:p-3 rounded-full transition-all ${darkMode ? "bg-slate-700 hover:bg-blue-500/30" : "bg-white hover:bg-blue-100"} shadow-lg`}
                aria-label="Previous testimonial"
              >
                <ChevronLeft size={isMobile ? 20 : 24} />
              </button>
              <button
                onClick={() => setActiveTestimonial((prev) => prev === testimonials.length - 1 ? 0 : prev + 1)}
                className={`p-2 sm:p-3 rounded-full transition-all ${darkMode ? "bg-slate-700 hover:bg-blue-500/30" : "bg-white hover:bg-blue-100"} shadow-lg`}
                aria-label="Next testimonial"
              >
                <ChevronRight size={isMobile ? 20 : 24} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default StatisticsTestimonials;
