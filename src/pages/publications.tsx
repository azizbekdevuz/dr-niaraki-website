import React, { useState, useMemo } from "react";
import publicationsData, {
  Publication,
  PublicationType,
} from "../datasets/pblcDataset";
import {
  TagFilter,
  ResearchDomainEcosystem,
  ResearchJourneyMilestones,
  PublicationModal,
} from "@/components/publications/Components";
import useDeviceDetect from "@/hooks/useDeviceDetect";
import dynamic from "next/dynamic";
import {
  BookOpen,
  Globe,
  Filter,
  Star,
  BookmarkIcon,
  FileTextIcon,
  DatabaseIcon,
  Layers,
  Orbit,
  TagIcon,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import textSystem from "@/theme/textSystem";

// Dynamic Imports
const AdvancedBackground = dynamic(
  () => import("../components/global/AdvancedBackground"),
  { ssr: false },
);
const MobileBackground = dynamic(
  () => import("../components/global/MobileBackground"),
  { ssr: false },
);
const RotatingAtomCursor = dynamic(
  () => import("../components/global/RotatingAtomCursor"),
  { ssr: false },
);

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

  const { isMobile } = useDeviceDetect();

  const publicationTags = [
    "Geo-AI",
    "Machine Learning",
    "XR Technologies",
    "IoT",
    "Spatial Computing",
    "Urban Analytics",
  ];

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Toggle Tag Selection
  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  // Filtered Publications with Advanced Filtering
  const filteredPublications = useMemo(() => {
    return publicationsData.filter(
      (pub: Publication) =>
        (selectedType === "all" || pub.type === selectedType) &&
        pub.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        (selectedTags.length === 0 ||
          selectedTags.some(
            (tag: string) =>
              pub.title.toLowerCase().includes(tag.toLowerCase()) ||
              pub.authors.some((author: string) =>
                author.toLowerCase().includes(tag.toLowerCase()),
              ),
          )),
    );
  }, [selectedType, searchQuery, selectedTags]);

  // Pagination logic
  const totalPages = Math.ceil(filteredPublications.length / itemsPerPage);
  const paginatedPublications = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPublications.slice(start, start + itemsPerPage);
  }, [filteredPublications, currentPage]);

  // Publication Statistics
  const publicationStats = useMemo(() => {
    return {
      total: publicationsData.length,
      byType: {
        journal: publicationsData.filter((p: Publication) => p.type === "journal").length,
        book: publicationsData.filter((p: Publication) => p.type === "book").length,
        book_chapter: publicationsData.filter((p: Publication) => p.type === "book_chapter").length,
        conference: publicationsData.filter((p: Publication) => p.type === "conference").length,
        referred: publicationsData.filter((p: Publication) => p.type === "referred").length,
      },
    };
  }, []);

  // Publication Card Component with Enhanced Interactions
  const PublicationCard: React.FC<{ publication: Publication }> = ({
    publication,
  }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [showDetails, setShowDetails] = useState(false);

    return (
      <div
        className={`
          p-3 sm:p-4 md:p-6 rounded-2xl shadow-lg transition-all duration-300 cursor-pointer
          transform-gpu ${isHovered ? "scale-[1.01]" : "scale-100"}
          ${darkMode ? "bg-gray-800 hover:bg-gray-750" : "bg-white hover:bg-gray-50"}
          ${darkMode ? textSystem.dark.primary : textSystem.light.primary}
          border-2 border-transparent
          ${isHovered ? (darkMode ? "border-gray-700" : "border-gray-200") : ""}
          flex flex-col gap-2
        `}
        onClick={() => setShowDetails((v) => !v)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        tabIndex={0}
        aria-label={`View details for ${publication.title}`}
      >
        {/* Publication Type Badge */}
        <div className="flex justify-between items-center mb-1 sm:mb-3">
          <span
            className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"}`}
          >
            {publication.type.charAt(0).toUpperCase() + publication.type.slice(1)}
          </span>
          <span className="text-xs font-medium text-gray-400">
            {publication.year}
          </span>
        </div>
        <h3 className="text-base sm:text-lg font-semibold mb-1 line-clamp-2 hover:line-clamp-none transition-all">
          {publication.title}
        </h3>
        {/* Show details only on desktop or when toggled on mobile */}
        <div className={`transition-all duration-300 ${showDetails || !isMobile ? "block" : "hidden"}`}>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1 line-clamp-1">
            {publication.authors.join(", ")}
          </p>
          <div className="flex justify-between items-center">
            <span className={`text-xs sm:text-sm ${darkMode ? "text-gray-300" : "text-gray-600"}`}>{publication.venue}</span>
            {publication.doi && (
              <button
                onClick={e => { e.stopPropagation(); window.open(`https://doi.org/${publication.doi}`, "_blank"); }}
                className="flex items-center px-2 py-1 rounded-lg text-xs bg-blue-500 text-white hover:bg-blue-600 transition-colors"
              >
                <Globe className="mr-1 w-3 h-3" />View
              </button>
            )}
          </div>
        </div>
        {/* Toggle details button for mobile */}
        {isMobile && (
          <button
            className="mt-1 text-xs text-blue-400 underline focus:outline-none"
            onClick={e => { e.stopPropagation(); setShowDetails(v => !v); }}
          >
            {showDetails ? "Hide Details" : "Show Details"}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className={`relative min-h-screen overflow-hidden transition-colors duration-500 ${darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"}`}>
      {/* Background */}
      {isMobile ? (
        <MobileBackground theme={darkMode ? "dark" : "light"} />
      ) : (
        <AdvancedBackground theme={darkMode ? "dark" : "light"} />
      )}

      <div className="relative z-10 max-w-7xl mx-auto px-2 sm:px-8 py-8 sm:py-16">
        {/* Header */}
        <div className="flex justify-between items-center mb-16">
          <h1 className="text-5xl font-bold flex items-center">
            <Star className="mr-6 text-blue-500" size={60} />
            Research Journey Explorer
          </h1>
        </div>

        {/* Research Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-12">
          <div
            className={`p-4 sm:p-6 rounded-2xl flex items-center shadow-lg ${darkMode ? "bg-gray-800" : "bg-white"} ${darkMode ? textSystem.dark.primary : textSystem.light.primary}`}
          >
            <DatabaseIcon className="mr-4 text-blue-500" size={40} />
            <div>
              <h3 className="text-2xl font-bold">{publicationStats.total}</h3>
              <p className="text-sm text-gray-500">Total Publications</p>
            </div>
          </div>

          <div
            className={`p-4 sm:p-6 rounded-2xl flex items-center shadow-lg ${darkMode ? "bg-gray-800" : "bg-white"} ${darkMode ? textSystem.dark.primary : textSystem.light.primary}`}
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
            className={`p-4 sm:p-6 rounded-2xl flex items-center shadow-lg ${darkMode ? "bg-gray-800" : "bg-white"} ${darkMode ? textSystem.dark.primary : textSystem.light.primary}`}
          >
            <FileTextIcon className="mr-4 text-purple-500" size={40} />
            <div>
              <h3 className="text-2xl font-bold">Top 2%</h3>
              <p className="text-sm text-gray-500">Global Scientist Ranking</p>
            </div>
          </div>
        </div>

        {/* View Selector */}
        <div className="flex flex-col sm:flex-row justify-center items-stretch sm:items-center gap-2 sm:gap-4 mb-4 sm:mb-8">
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
                onClick={() => setActiveView(view.name as "publications" | "domains" | "milestones")}
                className={`flex items-center px-3 sm:px-4 py-2 rounded-lg transition-all font-medium ${activeView === view.name ? `bg-gradient-to-r ${darkMode ? "from-blue-600 to-purple-600 text-white" : "from-blue-200 to-purple-400 text-blue-900"} shadow-lg` : `${darkMode ? "bg-white/10 hover:bg-white/20 text-blue-200" : "bg-white/70 hover:bg-blue-100 text-blue-700"}`}`}
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
                  onChange={(e) => {
                    setSelectedType(e.target.value as PublicationType | "all");
                    setCurrentPage(1); // Reset page on filter change
                  }}
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
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1); // Reset page on search
                    }}
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

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {paginatedPublications.map((publication: Publication) => (
                  <PublicationCard
                    key={publication.id}
                    publication={publication}
                  />
                ))}
              </div>
              {/* Enhanced Pagination Controls (no numbered buttons) */}
              {isMobile ? (
                <div className="flex justify-between items-center mt-6 gap-2">
                  <button
                    className="flex-1 py-2 rounded-lg bg-blue-500 text-white font-semibold disabled:opacity-50"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    aria-label="Previous page"
                  >
                    Previous
                  </button>
                  <span className="px-2 text-sm font-medium">Page {currentPage} of {totalPages}</span>
                  <button
                    className="flex-1 py-2 rounded-lg bg-blue-500 text-white font-semibold disabled:opacity-50"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    aria-label="Next page"
                  >
                    Next
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap justify-center mt-8 gap-2">
                  <button
                    className="px-3 py-1 rounded-full bg-gray-200 text-gray-700 hover:bg-blue-500 hover:text-white transition disabled:opacity-50"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    aria-label="First page"
                  >
                    <ChevronsLeft size={18} />
                  </button>
                  <button
                    className="px-3 py-1 rounded-full bg-gray-200 text-gray-700 hover:bg-blue-500 hover:text-white transition disabled:opacity-50"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span className="px-4 py-1 font-medium">Page {currentPage} of {totalPages}</span>
                  <button
                    className="px-3 py-1 rounded-full bg-gray-200 text-gray-700 hover:bg-blue-500 hover:text-white transition disabled:opacity-50"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    aria-label="Next page"
                  >
                    <ChevronRight size={18} />
                  </button>
                  <button
                    className="px-3 py-1 rounded-full bg-gray-200 text-gray-700 hover:bg-blue-500 hover:text-white transition disabled:opacity-50"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    aria-label="Last page"
                  >
                    <ChevronsRight size={18} />
                  </button>
                </div>
              )}

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
