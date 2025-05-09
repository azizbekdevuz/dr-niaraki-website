import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import textSystem from "@/theme/textSystem";
import {
  BookOpen,
  Edit,
  Users,
  ScrollText,
  Award,
  Star,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

interface Role {
  role: string;
  journal: string;
  location?: string;
  period?: string;
  icon: React.ComponentType;
  type: string;
}

const EditorialPeerReview: React.FC<{ darkMode: boolean }> = ({ darkMode }) => {
  const [activeRole, setActiveRole] = useState("editorial");
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);

  const editorialRoles: Role[] = [
    {
      role: "Editorial Board Member",
      journal: "Journal of Geodesy and Geomatics Engineering",
      location: "USA",
      period: "Since 2014",
      icon: BookOpen,
      type: "Journal",
    },
    {
      role: "Associate Editor for East Asia and Pacific",
      journal: "International Journal of Geosensing and Geocomputing",
      location: "",
      period: "",
      icon: Edit,
      type: "Journal",
    },
    {
      role: "Scientific Committee Member",
      journal: "SMPR2013, SMPR2015",
      location: "",
      period: "",
      icon: Users,
      type: "Conference",
    },
  ];

  const peerReviewRoles: Role[] = [
    {
      role: "Reviewer",
      journal: "Journal of Spatial Science",
      location: "",
      period: "",
      icon: ScrollText,
      type: "Journal",
    },
    {
      role: "Peer Review Board Member",
      journal: "GSDI 12 and GSDI 13 Conferences",
      location: "",
      period: "",
      icon: Users,
      type: "Conference",
    },
    {
      role: "Review Committee Member",
      journal:
        "IEEE 3rd International Conference on ICT: From Theory to Application",
      location: "",
      period: "",
      icon: Award,
      type: "Conference",
    },
    {
      role: "Reviewer",
      journal: "Engineering Journal of Geospatial Information Technology",
      location: "",
      period: "",
      icon: ScrollText,
      type: "Journal",
    },
  ];

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="relative min-h-screen py-20"
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        {/* Title with Floating Elements */}
        <div className="relative mb-16">
          <motion.div className="absolute inset-0 flex items-center justify-center">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className={`absolute ${darkMode ? "text-blue-400" : "text-blue-600"}`}
                animate={{
                  opacity: [0.3, 0.6, 0.3],
                  scale: [1, 1.2, 1],
                  x: Math.sin(i * 2) * 50,
                  y: Math.cos(i * 2) * 50,
                }}
                transition={{ duration: 3, repeat: Infinity, delay: i * 0.2 }}
              >
                <Star size={24} />
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
            Editorial & Peer Review
          </motion.h2>
        </div>

        {/* Role Selection Tabs */}
        <div className="flex justify-center mb-12">
          <div
            className={`inline-flex rounded-xl p-1 ${
              darkMode ? "bg-gray-800/40" : "bg-white/40"
            } backdrop-blur-sm`}
          >
            {[
              { id: "editorial", label: "Editorial Board", icon: Edit },
              { id: "peer", label: "Peer Review", icon: Users },
            ].map((tab) => (
              <motion.button
                key={tab.id}
                onClick={() => setActiveRole(tab.id)}
                className={`relative px-6 py-3 rounded-lg text-lg font-semibold transition-colors duration-300 flex items-center gap-2 ${
                  activeRole === tab.id
                    ? darkMode
                      ? "text-blue-300"
                      : "text-blue-800"
                    : darkMode
                      ? "text-gray-400 hover:text-gray-300"
                      : "text-gray-600 hover:text-gray-800"
                }`}
              >
                <tab.icon size={20} />
                {tab.label}
                {activeRole === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className={`absolute inset-0 rounded-lg ${
                      darkMode ? "bg-blue-500/20" : "bg-blue-100"
                    }`}
                    transition={{ type: "spring", duration: 0.6 }}
                  />
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Roles Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeRole}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {(activeRole === "editorial"
              ? editorialRoles
              : peerReviewRoles
            ).map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  onHoverStart={() => setHoveredItem(index)}
                  onHoverEnd={() => setHoveredItem(null)}
                  className={`group relative p-6 rounded-xl border backdrop-blur-sm transition-all duration-300 ${
                    darkMode
                      ? "border-gray-700/50 hover:bg-gray-800/60"
                      : "border-gray-200/50 hover:bg-white/60"
                  }`}
                >
                  {/* Type Badge */}
                  <div
                    className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs ${
                      darkMode
                        ? "bg-blue-500/20 text-blue-300"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {item.type}
                  </div>

                  <div className="flex items-start gap-4 mb-4">
                    <div
                      className={`p-3 rounded-lg ${
                        darkMode ? "bg-gray-700/50" : "bg-gray-100/50"
                      }`}
                    >
                      <Icon />
                    </div>
                    <div>
                      <h3
                        className={`text-xl font-bold ${
                          darkMode
                            ? textSystem.dark.primary
                            : textSystem.light.primary
                        }`}
                      >
                        {item.role}
                      </h3>
                      <p
                        className={`text-sm mt-2 ${
                          darkMode
                            ? textSystem.dark.tertiary
                            : textSystem.light.tertiary
                        }`}
                      >
                        {item.journal}
                      </p>
                    </div>
                  </div>

                  {item.location && item.location.length > 0 && (
                    <div
                      className={`flex items-center gap-2 mt-4 text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      <ChevronRight size={16} />
                      {item.location}
                    </div>
                  )}

                  {item.period && item.period.length > 0 && (
                    <div
                      className={`flex items-center gap-2 mt-2 text-sm ${
                        darkMode ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      <ChevronRight size={16} />
                      {item.period}
                    </div>
                  )}

                  <motion.div
                    animate={{
                      opacity: hoveredItem === index ? 1 : 0,
                      y: hoveredItem === index ? 0 : 10,
                    }}
                    className={`absolute bottom-4 right-4 ${
                      darkMode ? "text-blue-400" : "text-blue-600"
                    }`}
                  >
                    <ExternalLink size={20} />
                  </motion.div>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.section>
  );
};

export default EditorialPeerReview;
