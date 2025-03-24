import React, { useState, useMemo, useEffect } from "react";
import publicationsData, {
  Publication,
  PublicationType,
} from "../components/datasets/pblcDataset";
import { useDeviceType } from "../components/useDeviceType";
import dynamic from "next/dynamic";
import {
  BookOpen,
  Globe,
  Award,
  Filter,
  Star,
  BookmarkIcon,
  FileTextIcon,
  DatabaseIcon,
  Layers,
  Orbit,
  TagIcon,
  DownloadIcon,
  SparklesIcon,
} from "lucide-react";

// Dynamic Imports
const AdvancedBackground = dynamic(
  () => import("../components/AdvancedBackground"),
  { ssr: false },
);
const MobileBackground = dynamic(
  () => import("../components/MobileBackground"),
  { ssr: false },
);
const RotatingAtomCursor = dynamic(
  () => import("../components/RotatingAtomCursor"),
  { ssr: false },
);

// Research Domain Component
const ResearchDomainEcosystem: React.FC<{ darkMode: boolean }> = ({
  darkMode,
}) => {
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);

  const domains = [
    {
      name: "Geo-AI",
      color: "#3B82F6",
      publications: 45,
      description: "Spatial computing and artificial intelligence integration",
      keyAreas: [
        "Spatial Machine Learning",
        "Geospatial AI Modeling",
        "Predictive Geospatial Analytics",
      ],
    },
    {
      name: "XR Technologies",
      color: "#10B981",
      publications: 35,
      description: "Extended Reality and immersive technologies",
      keyAreas: [
        "Augmented Reality",
        "Virtual Reality Interfaces",
        "Immersive User Experiences",
      ],
    },
    {
      name: "IoT & Ubiquitous Computing",
      color: "#8B5CF6",
      publications: 30,
      description: "Internet of Things and pervasive computing systems",
      keyAreas: [
        "Sensor Networks",
        "Pervasive Computing",
        "Smart Systems Integration",
      ],
    },
  ];

  return (
    <div
      className={`
      rounded-3xl p-8 relative overflow-hidden
      ${darkMode ? "bg-gray-900" : "bg-white"}
      shadow-2xl transition-all duration-500
    `}
    >
      <h2 className="text-3xl font-bold mb-6 flex items-center">
        <Layers className="mr-4 text-blue-500" />
        Research Domain Ecosystem
      </h2>

      <div className="grid grid-cols-3 gap-6">
        {domains.map((domain) => {
          const isSelected = selectedDomain === domain.name;

          return (
            <div
              key={domain.name}
              onClick={() => setSelectedDomain(isSelected ? null : domain.name)}
              className={`
                p-6 rounded-2xl cursor-pointer transition-all duration-300
                relative overflow-hidden
                ${
                  isSelected
                    ? `${darkMode ? "bg-gray-800" : "bg-gray-100"} scale-105`
                    : `${darkMode ? "bg-gray-850" : "bg-gray-50"} hover:scale-105`
                }
              `}
            >
              <div
                className="absolute top-0 left-0 h-1 transition-all duration-500"
                style={{
                  width: `${(domain.publications / 45) * 100}%`,
                  backgroundColor: domain.color,
                  opacity: 0.8,
                }}
              ></div>

              <h3
                className="text-xl font-semibold mb-2"
                style={{ color: domain.color }}
              >
                {domain.name}
              </h3>
              <p className="text-sm mb-2">{domain.publications} Publications</p>
              <p
                className={`
                text-sm mb-4
                ${darkMode ? "text-gray-400" : "text-gray-600"}
              `}
              >
                {domain.description}
              </p>

              {isSelected && (
                <div className="mt-4">
                  <h4 className="font-medium text-sm mb-2">
                    Key Research Areas:
                  </h4>
                  <ul
                    className={`
                    list-disc list-inside text-sm
                    ${darkMode ? "text-gray-300" : "text-gray-700"}
                  `}
                  >
                    {domain.keyAreas.map((area) => (
                      <li key={area}>{area}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Research Journey Milestones Component
const ResearchJourneyMilestones: React.FC<{ darkMode: boolean }> = ({
  darkMode,
}) => {
  const milestones = [
    {
      year: 2024,
      title: "Top 2% Global Scientist",
      description: "Stanford-Elsevier Global Ranking",
      icon: Award,
      color: "#3B82F6",
    },
    {
      year: 2023,
      title: "XR Research Breakthrough",
      description: "Pioneering Extended Reality Applications",
      icon: Globe,
      color: "#10B981",
    },
    {
      year: 2022,
      title: "Harvard SDL Fellowship",
      description: "Spatial Data Lab Research Fellowship",
      icon: BookOpen,
      color: "#8B5CF6",
    },
  ];

  return (
    <div
      className={`
      rounded-3xl p-8
      ${darkMode ? "bg-gray-900" : "bg-white"}
      shadow-2xl
    `}
    >
      <h2 className="text-3xl font-bold mb-6 flex items-center">
        <Orbit className="mr-4 text-green-500" />
        Research Journey Milestones
      </h2>

      <div className="relative">
        <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-purple-500 opacity-30"></div>

        {milestones.map((milestone) => {
          const Icon = milestone.icon;
          return (
            <div
              key={milestone.year}
              className="flex items-center mb-8 pl-16 relative"
            >
              <div
                className="absolute left-0 w-4 h-4 rounded-full"
                style={{
                  backgroundColor: milestone.color,
                  top: "50%",
                  transform: "translateY(-50%)",
                }}
              ></div>

              <div
                className={`
                p-6 rounded-2xl w-full
                ${
                  darkMode
                    ? "bg-gray-800 hover:bg-gray-750"
                    : "bg-gray-50 hover:bg-gray-100"
                }
                transition-all duration-300
              `}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3
                      className="text-xl font-semibold mb-2"
                      style={{ color: milestone.color }}
                    >
                      {milestone.year} • {milestone.title}
                    </h3>
                    <p
                      className={`
                      text-sm
                      ${darkMode ? "text-gray-400" : "text-gray-600"}
                    `}
                    >
                      {milestone.description}
                    </p>
                  </div>
                  <Icon
                    className="text-gray-500 opacity-50"
                    size={40}
                    style={{ color: milestone.color }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Enhanced Publication Modal Component
const PublicationModal: React.FC<{
  publication: Publication;
  onClose: () => void;
  darkMode: boolean;
}> = ({ publication, onClose, darkMode }) => {
  // Animation state
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 200);
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  return (
    <div
      className={`
        fixed inset-0 z-50 flex items-center justify-center
        transition-all duration-300
        ${isClosing ? "opacity-0" : "opacity-100"}
      `}
      onClick={handleClose}
    >
      <div className="absolute inset-0 bg-black bg-opacity-50" />

      <div
        className={`
          w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-8
          ${darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"}
          shadow-2xl relative
          transform-gpu transition-all duration-300
          ${isClosing ? "scale-95 opacity-0" : "scale-100 opacity-100"}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleClose}
          className={`
            absolute top-4 right-4 p-2 rounded-full
            transition-colors duration-200
            ${
              darkMode
                ? "text-gray-400 hover:text-gray-200 hover:bg-gray-700"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            }
          `}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Publication Type Badge */}
        <div className="mb-4">
          <span
            className={`
            px-3 py-1 rounded-full text-xs font-medium
            ${
              darkMode
                ? "bg-gray-700 text-gray-300"
                : "bg-gray-100 text-gray-600"
            }
          `}
          >
            {publication.type.charAt(0).toUpperCase() +
              publication.type.slice(1)}
          </span>
        </div>

        <h2 className="text-2xl font-bold mb-4">{publication.title}</h2>

        <div className="mb-6 space-y-2">
          <p className="font-medium text-gray-600 dark:text-gray-300">
            Authors: {publication.authors.join(", ")}
          </p>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {publication.venue}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              • {publication.year}
            </span>
            {publication.impact && (
              <span
                className="px-3 py-1 rounded-full text-xs font-medium 
                bg-blue-100 dark:bg-blue-900 
                text-blue-800 dark:text-blue-200"
              >
                Impact Factor: {publication.impact}
              </span>
            )}
          </div>
        </div>

        <div className="flex space-x-4 mb-6">
          {publication.doi && (
            <a
              href={`https://doi.org/${publication.doi}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center px-4 py-2 rounded-lg
                bg-blue-500 text-white hover:bg-blue-600
                transition-colors duration-200"
            >
              <Globe className="mr-2" size={16} />
              View Paper
            </a>
          )}
          <button
            className="flex items-center px-4 py-2 rounded-lg
              bg-green-500 text-white hover:bg-green-600
              transition-colors duration-200"
            onClick={() => {
              // Here you would implement citation export functionality
              console.log("Export citation");
            }}
          >
            <DownloadIcon className="mr-2" size={16} />
            Export Citation
          </button>
        </div>

        {/* Publication Details */}
        <div
          className={`
          mt-6 p-4 rounded-lg
          ${darkMode ? "bg-gray-700" : "bg-gray-100"}
        `}
        >
          <h3 className="font-semibold mb-4 flex items-center">
            <SparklesIcon className="mr-2 text-purple-500" size={20} />
            Publication Details
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                Publication Type
              </span>
              <span className="block text-lg font-bold text-purple-600 dark:text-purple-400">
                {publication.type.charAt(0).toUpperCase() +
                  publication.type.slice(1)}
              </span>
            </div>
            {publication.impact && (
              <div>
                <span className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                  Impact Factor
                </span>
                <span className="block text-lg font-bold text-blue-600 dark:text-blue-400">
                  {publication.impact}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Advanced Tag Filter
const TagFilter: React.FC<{
  tags: string[];
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
  darkMode: boolean;
}> = ({ tags, selectedTags, onTagToggle, darkMode }) => {
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <button
          key={tag}
          onClick={() => onTagToggle(tag)}
          className={`
              px-3 py-1 rounded-full text-xs transition-all
              ${
                selectedTags.includes(tag)
                  ? "bg-blue-500 text-white"
                  : `
                  ${
                    darkMode
                      ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                  }
                `
              }
            `}
        >
          {tag}
        </button>
      ))}
    </div>
  );
};

// Main Research Explorer Component
const ComprehensiveResearchExplorer: React.FC = () => {
  const [darkMode] = useState(true);
  const [selectedType, setSelectedType] = useState<PublicationType | "all">(
    "all",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [activeView, setActiveView] = useState<
    "publications" | "domains" | "milestones"
  >("publications");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedPublication, setSelectedPublication] =
    useState<Publication | null>(null);

  const isMobile = useDeviceType();

  const publicationTags = [
    "Geo-AI",
    "Machine Learning",
    "XR Technologies",
    "IoT",
    "Spatial Computing",
    "Urban Analytics",
  ];

  // Toggle Tag Selection
  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  // Filtered Publications with Advanced Filtering
  const filteredPublications = useMemo(() => {
    return publicationsData.filter(
      (pub) =>
        (selectedType === "all" || pub.type === selectedType) &&
        pub.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        (selectedTags.length === 0 ||
          selectedTags.some(
            (tag) =>
              pub.title.toLowerCase().includes(tag.toLowerCase()) ||
              pub.authors.some((author) =>
                author.toLowerCase().includes(tag.toLowerCase()),
              ),
          )),
    );
  }, [selectedType, searchQuery, selectedTags]);

  // Publication Statistics
  const publicationStats = useMemo(() => {
    return {
      total: publicationsData.length,
      byType: {
        journal: publicationsData.filter((p) => p.type === "journal").length,
        book: publicationsData.filter((p) => p.type === "book").length,
        book_chapter: publicationsData.filter((p) => p.type === "book_chapter")
          .length,
        conference: publicationsData.filter((p) => p.type === "conference")
          .length,
        referred: publicationsData.filter((p) => p.type === "referred").length,
      },
    };
  }, [publicationsData]);

  // Publication Card Component with Enhanced Interactions
  const PublicationCard: React.FC<{ publication: Publication }> = ({
    publication,
  }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
      <div
        className={`
        p-6 rounded-2xl shadow-lg transition-all duration-300 cursor-pointer
        transform-gpu ${isHovered ? "scale-[1.02]" : "scale-100"}
        ${
          darkMode
            ? "bg-gray-800 hover:bg-gray-750 text-gray-100"
            : "bg-white hover:bg-gray-50 text-gray-800"
        }
        border-2 border-transparent
        ${isHovered ? (darkMode ? "border-gray-700" : "border-gray-200") : ""}
      `}
        onClick={() => setSelectedPublication(publication)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Publication Type Badge */}
        <div className="flex justify-between items-start mb-3">
          <span
            className={`
          px-3 py-1 rounded-full text-xs font-medium
          ${
            darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"
          }
        `}
          >
            {publication.type.charAt(0).toUpperCase() +
              publication.type.slice(1)}
          </span>
          {publication.impact && (
            <span
              className="px-3 py-1 rounded-full text-xs font-medium 
            bg-blue-100 dark:bg-blue-900 
            text-blue-800 dark:text-blue-200"
            >
              IF: {publication.impact}
            </span>
          )}
        </div>

        <h3 className="text-lg font-semibold mb-2 line-clamp-2 hover:line-clamp-none transition-all">
          {publication.title}
        </h3>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-1">
          {publication.authors.join(", ")}
        </p>

        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span
              className={`
            text-sm
            ${darkMode ? "text-gray-300" : "text-gray-600"}
          `}
            >
              {publication.venue}
            </span>
            <span
              className={`
            text-sm font-medium
            ${darkMode ? "text-gray-400" : "text-gray-500"}
          `}
            >
              • {publication.year}
            </span>
          </div>

          {publication.doi && (
            <div
              className={`
            flex items-center space-x-2 transition-opacity duration-200
            ${isHovered ? "opacity-100" : "opacity-0"}
          `}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(`https://doi.org/${publication.doi}`, "_blank");
                }}
                className="flex items-center px-3 py-1 rounded-lg text-sm
                bg-blue-500 text-white hover:bg-blue-600 transition-colors"
              >
                <Globe className="mr-1" size={14} />
                View
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      className={`
      relative min-h-screen overflow-hidden
      ${darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"}
      transition-colors duration-500
    `}
    >
      {/* Background */}
      {isMobile ? (
        <MobileBackground theme={darkMode ? "dark" : "light"} />
      ) : (
        <AdvancedBackground theme={darkMode ? "dark" : "light"} />
      )}

      <div className="relative z-10 max-w-7xl mx-auto px-8 py-16">
        {/* Header */}
        <div className="flex justify-between items-center mb-16">
          <h1 className="text-5xl font-bold flex items-center">
            <Star className="mr-6 text-blue-500" size={60} />
            Research Journey Explorer
          </h1>
        </div>

        {/* Research Statistics */}
        <div className="grid grid-cols-3 gap-6 mb-12">
          <div
            className={`
            p-6 rounded-2xl flex items-center
            ${darkMode ? "bg-gray-800" : "bg-white"}
            shadow-lg
          `}
          >
            <DatabaseIcon className="mr-4 text-blue-500" size={40} />
            <div>
              <h3 className="text-2xl font-bold">{publicationStats.total}</h3>
              <p className="text-sm text-gray-500">Total Publications</p>
            </div>
          </div>

          <div
            className={`
            p-6 rounded-2xl flex items-center
            ${darkMode ? "bg-gray-800" : "bg-white"}
            shadow-lg
          `}
          >
            <BookmarkIcon className="mr-4 text-green-500" size={40} />
            <div>
              <h3 className="text-2xl font-bold">
                {publicationStats.byType.journal}
              </h3>
              <p className="text-sm text-gray-500">Journal Publications</p>
            </div>
          </div>

          <div
            className={`
            p-6 rounded-2xl flex items-center
            ${darkMode ? "bg-gray-800" : "bg-white"}
            shadow-lg
          `}
          >
            <FileTextIcon className="mr-4 text-purple-500" size={40} />
            <div>
              <h3 className="text-2xl font-bold">Top 2%</h3>
              <p className="text-sm text-gray-500">Global Scientist Ranking</p>
            </div>
          </div>
        </div>

        {/* View Selector */}
        <div className="flex justify-center space-x-4 mb-8">
          {[
            {
              name: "publications",
              label: "Publications",
              icon: BookOpen,
            },
            {
              name: "domains",
              label: "Research Domains",
              icon: Layers,
            },
            {
              name: "milestones",
              label: "Research Milestones",
              icon: Orbit,
            },
          ].map((view) => {
            const Icon = view.icon;
            return (
              <button
                key={view.name}
                onClick={() => setActiveView(view.name as any)}
                className={`
                  flex items-center px-4 py-2 rounded-lg transition-all
                  ${
                    activeView === view.name
                      ? "bg-blue-500 text-white"
                      : `
                      ${
                        darkMode
                          ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }
                    `
                  }
                `}
              >
                <Icon className="mr-2" size={20} />
                {view.label}
              </button>
            );
          })}
        </div>

        {/* Dynamic Content Area */}
        <div>
          {activeView === "publications" && (
            <>
              {/* Advanced Tag Filtering */}
              <div className="max-w-7xl mx-auto px-8 mb-6">
                <div className="flex items-center space-x-4">
                  <TagIcon
                    className={`${darkMode ? "text-gray-300" : "text-gray-600"}`}
                  />
                  <TagFilter
                    tags={publicationTags}
                    selectedTags={selectedTags}
                    onTagToggle={handleTagToggle}
                    darkMode={darkMode}
                  />
                </div>
              </div>

              {/* Publication Filters */}
              <div className="flex space-x-4 mb-8">
                <select
                  value={selectedType}
                  onChange={(e) =>
                    setSelectedType(e.target.value as PublicationType | "all")
                  }
                  className={`
                    p-2 rounded-lg border
                    ${
                      darkMode
                        ? "bg-gray-800 border-gray-700 text-white"
                        : "bg-white border-gray-300 text-gray-800"
                    }
                  `}
                >
                  <option value="all">All Publications</option>
                  <option value="journal">Journal Papers</option>
                  <option value="book">Books</option>
                  <option value="book_chapter">Book Chapters</option>
                  <option value="conference">Conference Papers</option>
                  <option value="referred">Referred Journals</option>
                </select>

                <div className="flex-grow relative">
                  <input
                    type="text"
                    placeholder="Search publications..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`
                      w-full p-2 pl-10 rounded-lg border
                      ${
                        darkMode
                          ? "bg-gray-800 border-gray-700 text-white"
                          : "bg-white border-gray-300 text-gray-800"
                      }
                    `}
                  />
                  <Filter
                    className={`
                      absolute left-3 top-3
                      ${darkMode ? "text-gray-400" : "text-gray-500"}
                    `}
                    size={20}
                  />
                </div>
              </div>

              {/* Publications Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPublications.map((publication) => (
                  <PublicationCard
                    key={publication.id}
                    publication={publication}
                  />
                ))}
              </div>

              {/* No Results */}
              {filteredPublications.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-xl text-gray-500">
                    No publications found matching your criteria.
                  </p>
                </div>
              )}
            </>
          )}

          {activeView === "domains" && (
            <ResearchDomainEcosystem darkMode={darkMode} />
          )}

          {activeView === "milestones" && (
            <ResearchJourneyMilestones darkMode={darkMode} />
          )}
        </div>

        {/* Publication Modal */}
        {selectedPublication && (
          <PublicationModal
            publication={selectedPublication}
            onClose={() => setSelectedPublication(null)}
            darkMode={darkMode}
          />
        )}
      </div>

      {/* Cursor for desktop */}
      {!isMobile && <RotatingAtomCursor />}
    </div>
  );
};

export default ComprehensiveResearchExplorer;
