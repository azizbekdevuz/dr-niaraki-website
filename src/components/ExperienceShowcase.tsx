import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layers,
  Sparkles,
  Newspaper,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { consultingData } from "../components/datasets/consultingData";
import { experienceData } from "../components/datasets/experienceData";
import { industryExperienceData } from "../components/datasets/industryExperienceData";

// Import ExperienceData type or define it here
interface ExperienceData {
  title?: string;
  role?: string;
  institution?: string;
  organization?: string;
  period?: string;
  additionalInformation?: string;
  description?: string;
  tags?: string | string[];
  icon?: React.ElementType;
  details?: string;
  highlights: string[];
  progressPercentage?: number;
  location?: string;
}

type DatasetType = "experience" | "industry" | "consulting";

const DATASET_TYPES: DatasetType[] = ["experience", "industry", "consulting"];

// Helper function to normalize tags
const normalizeTags = (tags: string | string[] | undefined): string[] => {
  if (!tags) return [];
  return typeof tags === "string" ? [tags] : tags;
};

const ExperienceShowcase: React.FC = () => {
  const [activeSet, setActiveSet] = useState<DatasetType>("experience");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const getDataset = useCallback((type: DatasetType): ExperienceData[] => {
    switch (type) {
      case "experience":
        return experienceData;
      case "industry":
        return industryExperienceData;
      case "consulting":
        return consultingData;
      default:
        return [];
    }
  }, []);

  // New function to render expanded content
  const renderExpandedContent = (item: ExperienceData) => {
    const normalizedTags = normalizeTags(item.tags);

    return (
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden space-y-4"
      >
        {/* Organization/Institution */}
        {(item.organization || item.institution) && (
          <div className="text-sm text-blue-200">
            {item.organization || item.institution}
            {item.location && ` • ${item.location}`}
          </div>
        )}

        {/* Description */}
        {item.description && (
          <p className="text-sm text-gray-300 leading-relaxed">
            {item.description}
          </p>
        )}

        {/* Additional Information */}
        {item.additionalInformation && (
          <p className="text-sm text-gray-400 italic">
            {item.additionalInformation}
          </p>
        )}

        {/* Highlights */}
        {item.highlights && item.highlights.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-semibold text-blue-300">
              Highlights
            </div>
            <ul className="space-y-1">
              {item.highlights.map((highlight, idx) => (
                <li
                  key={idx}
                  className="text-sm text-gray-300 flex items-start gap-2"
                >
                  <ChevronRight className="w-4 h-4 mt-1 flex-shrink-0 text-blue-400" />
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Details */}
        {item.details && (
          <p className="text-sm text-gray-300">{item.details}</p>
        )}

        {/* Progress Percentage */}
        {item.progressPercentage && (
          <div className="w-full bg-blue-900/30 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
              style={{ width: `${item.progressPercentage}%` }}
            />
          </div>
        )}

        {/* Tags */}
        {normalizedTags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {normalizedTags.map((tag, tagIdx) => (
              <span
                key={tagIdx}
                className="px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-300"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </motion.div>
    );
  };

  const getIcon = (type: DatasetType) => {
    switch (type) {
      case "experience":
        return Newspaper;
      case "industry":
        return Layers;
      case "consulting":
        return Sparkles;
      default:
        return Newspaper;
    }
  };

  return (
    <div className="space-y-8">
      {/* Interactive Navigation Orbs */}
      <div className="flex justify-center gap-8 mb-12">
        {DATASET_TYPES.map((type) => {
          const Icon = getIcon(type);
          return (
            <motion.button
              key={type}
              onClick={() => setActiveSet(type)}
              className={`relative p-6 rounded-full ${
                activeSet === type
                  ? "bg-gradient-to-br from-blue-500 to-purple-500"
                  : "bg-blue-900/20"
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Icon
                className={`w-6 h-6 ${
                  activeSet === type ? "text-white" : "text-blue-400"
                }`}
              />
              {activeSet === type && (
                <motion.div
                  className="absolute inset-0 rounded-full"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0.2, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  style={{
                    background:
                      "linear-gradient(45deg, rgba(59,130,246,0.5), rgba(147,51,234,0.5))",
                  }}
                />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="wait">
          {getDataset(activeSet).map((item: ExperienceData, idx: number) => (
            <motion.div
              key={`${activeSet}-${idx}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3, delay: idx * 0.1 }}
              className="relative"
              onHoverStart={() => setHoveredId(`${activeSet}-${idx}`)}
              onHoverEnd={() => setHoveredId(null)}
              onClick={() =>
                setExpandedId(
                  expandedId === `${activeSet}-${idx}`
                    ? null
                    : `${activeSet}-${idx}`,
                )
              }
            >
              <div
                className={`
                relative overflow-hidden rounded-lg p-6
                ${hoveredId === `${activeSet}-${idx}` ? "bg-blue-900/40" : "bg-blue-900/20"}
                backdrop-blur-lg transition-all duration-300
              `}
              >
                {/* Ambient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-50" />

                {/* Content */}
                <div className="relative z-10">
                  <h3 className="text-xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                    {item.title || item.role}
                  </h3>

                  <div className="flex items-center gap-2 text-sm text-blue-200 mb-3">
                    <Calendar className="w-4 h-4" />
                    <span>{item.period}</span>
                  </div>

                  <AnimatePresence>
                    {expandedId === `${activeSet}-${idx}` ? (
                      renderExpandedContent(item)
                    ) : (
                      <motion.div
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-1 text-sm text-blue-400"
                      >
                        <span>Click to expand</span>
                        <ChevronRight className="w-4 h-4" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Interactive Highlight Effect */}
                {hoveredId === `${activeSet}-${idx}` && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  />
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ExperienceShowcase;
