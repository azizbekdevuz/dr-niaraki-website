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
import { useDeviceType } from "@/hooks/useDeviceType";
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

  const isMobile = useDeviceType();

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
                onClick={() => setActiveView(view.name as "publications" | "domains" | "milestones")}
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

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedPublications.map((publication: Publication) => (
                  <PublicationCard
                    key={publication.id}
                    publication={publication}
                  />
                ))}
              </div>
              {/* Enhanced Pagination Controls (no numbered buttons) */}
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
