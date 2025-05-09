import React, { useState } from "react";
import dynamic from "next/dynamic";
import { useDeviceType } from "@/hooks/useDeviceType";
import { patents } from "../datasets/patents";
import { Award, Filter, Check, Clock, Globe, Search, Grid, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { groupBy } from "lodash";

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

// Add interface for Patent type at the top
interface Patent {
  id: number;
  type: string;
  title: string;
  number: string;
  date: string;
  inventors: string[];
  status?: string;
  applicant?: string;
}

// Filter options for patents
const PATENT_TYPES = ["All", "US International", "Korean", "Applications"];
const PATENT_YEARS = ["All", "2024", "2023", "2022", "2021", "2020", "2019"];

const PatentOverview = ({ darkMode }: { darkMode: boolean }) => (
  <div
    className={`grid grid-cols-1 lg:grid-cols-4 gap-4 mb-12 ${
      darkMode ? "text-gray-100" : "text-gray-800"
    }`}
  >
    {[
      {
        title: "Total Patents",
        count: 42,
        icon: <Award className="w-8 h-8 text-purple-500" />,
        description: "Registered & Completed",
        color: "purple",
      },
      {
        title: "US Patents",
        count: 3,
        icon: <Globe className="w-8 h-8 text-blue-500" />,
        description: "International",
        color: "blue",
      },
      {
        title: "Korean Patents",
        count: 17,
        icon: <Award className="w-8 h-8 text-green-500" />,
        description: "Registered",
        color: "green",
      },
      {
        title: "Applications",
        count: 22,
        icon: <Clock className="w-8 h-8 text-orange-500" />,
        description: "In Progress",
        color: "orange",
      },
    ].map((stat, index) => (
      <div
        key={index}
        className={`p-6 rounded-xl ${
          darkMode ? "bg-gray-800" : "bg-white"
        } shadow-lg transition-transform hover:scale-105`}
      >
        <div className="flex items-center justify-between mb-4">
          {stat.icon}
          <span className={`text-3xl font-bold text-${stat.color}-500`}>
            {stat.count}
          </span>
        </div>
        <h3 className="text-lg font-semibold mb-1">{stat.title}</h3>
        <p
          className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}
        >
          {stat.description}
        </p>
      </div>
    ))}
  </div>
);

const SearchBar = ({ onSearch }: { onSearch: (query: string) => void }) => (
  <div className="relative mb-8">
    <input
      type="text"
      placeholder="Search patents by title, number, or inventors..."
      onChange={(e) => onSearch(e.target.value)}
      className="w-full px-4 py-3 rounded-lg bg-white dark:bg-gray-800 
          border border-gray-300 dark:border-gray-700 focus:ring-2 
          focus:ring-blue-500 outline-none transition-all"
    />
    <Search className="absolute right-4 top-3.5 text-gray-400" />
  </div>
);

const getStatusColor = (type: string, darkMode: boolean) => {
  switch (type) {
    case "US International":
      return darkMode
        ? "bg-blue-900 text-blue-100"
        : "bg-blue-100 text-blue-800";
    case "Korean":
      return darkMode
        ? "bg-green-900 text-green-100"
        : "bg-green-100 text-green-800";
    case "Applications":
      return darkMode
        ? "bg-purple-900 text-purple-100"
        : "bg-purple-100 text-purple-800";
    default:
      return darkMode
        ? "bg-gray-900 text-gray-100"
        : "bg-gray-100 text-gray-800";
  }
};

const PatentTimeline = ({
  patents,
  darkMode,
}: {
  patents: Patent[];
  darkMode: boolean;
}) => {
  const patentsByYear = groupBy(patents, (patent) =>
    new Date(patent.date).getFullYear(),
  );

  return (
    <div className="relative">
      <div
        className={`absolute left-1/2 transform -translate-x-1/2 h-full w-0.5
          ${darkMode ? "bg-gray-700" : "bg-gray-200"}`}
      />

      {Object.entries(patentsByYear).map(([year, yearPatents]) => (
        <div key={year} className="mb-12">
          <div className="flex items-center justify-center mb-8">
            <span
              className={`px-4 py-2 rounded-full text-sm font-bold
                ${darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-800"}
                shadow-lg`}
            >
              {year}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {yearPatents.map((patent) => (
              <PatentCard key={patent.id} patent={patent} darkMode={darkMode} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const ViewToggle = ({
  view,
  setView,
}: {
  view: "grid" | "timeline";
  setView: (view: "grid" | "timeline") => void;
}) => (
  <div className="flex items-center space-x-2 mb-8">
    <button
      onClick={() => setView("grid")}
      className={`p-2 rounded ${view === "grid" ? "bg-blue-500 text-white" : ""}`}
    >
      <Grid className="w-5 h-5" />
    </button>
    <button
      onClick={() => setView("timeline")}
      className={`p-2 rounded ${view === "timeline" ? "bg-blue-500 text-white" : ""}`}
    >
      <Clock className="w-5 h-5" />
    </button>
  </div>
);

const PatentCard = ({
  patent,
  darkMode,
}: {
  patent: Patent;
  darkMode: boolean;
}) => (
  <div
    className={`relative group p-6 rounded-xl transition-all duration-300
        ${
          darkMode
            ? "bg-gray-800 hover:bg-gray-750"
            : "bg-white hover:bg-gray-50"
        } 
        shadow-lg hover:shadow-xl cursor-pointer
        border border-transparent hover:border-blue-500`}
  >
    <div className="absolute top-4 right-4">
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium
          ${getStatusColor(patent.type, darkMode)}`}
      >
        {patent.type}
      </span>
    </div>

    <h3 className="font-semibold mb-3 pr-24">{patent.title}</h3>

    <div className="space-y-2">
      <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
        <span className="inline-block w-20 font-medium">Number:</span>
        {patent.number}
      </p>
      <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
        <span className="inline-block w-20 font-medium">Date:</span>
        {patent.date}
      </p>
      <div
        className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}
      >
        <span className="inline-block w-20 font-medium">Inventors:</span>
        <div className="inline-flex flex-wrap gap-1">
          {patent.inventors.map((inventor, idx) => (
            <span
              key={idx}
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs
                  ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}
            >
              {inventor}
            </span>
          ))}
        </div>
      </div>
    </div>

    <div
      className={`absolute inset-x-0 bottom-0 h-1 rounded-b-xl
        transition-transform transform scale-x-0 group-hover:scale-x-100
        bg-gradient-to-r from-blue-500 to-purple-500`}
    />
  </div>
);

const FilterButton = ({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors
      ${
        active
          ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
          : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
      }`}
  >
    {children}
  </button>
);

const PatentsPage = () => {
  const [darkMode] = useState(true);
  const [selectedType, setSelectedType] = useState("All");
  const [selectedYear, setSelectedYear] = useState("All");
  const [view, setView] = useState<"grid" | "timeline">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const isMobile = useDeviceType();

  // Update the filter logic to include search
  const filteredPatents = patents.filter((patent: Patent) => {
    const matchesType = selectedType === "All" || patent.type === selectedType;
    const matchesYear =
      selectedYear === "All" || patent.date.includes(selectedYear);
    const matchesSearch =
      searchQuery === "" ||
      patent.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patent.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patent.inventors.some((inventor: string) =>
        inventor.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    return matchesType && matchesYear && matchesSearch;
  });

  const totalPages = Math.ceil(filteredPatents.length / itemsPerPage);
  const paginatedPatents = filteredPatents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div
      className={`relative min-h-screen overflow-x-hidden transition-colors duration-300 ${
        darkMode ? "text-white" : "text-gray-800"
      }`}
    >
      {isMobile ? (
        <MobileBackground theme={darkMode ? "dark" : "light"} />
      ) : (
        <AdvancedBackground theme={darkMode ? "dark" : "light"} />
      )}

      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 py-12">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">
              Patents & Intellectual Property
            </h1>
            <div className="flex justify-center items-center space-x-2">
              <Award className="w-5 h-5" />
              <p className="text-xl">42 Registered & Completed Patents</p>
            </div>
          </div>

          {/* Add these new components */}
          <PatentOverview darkMode={darkMode} />
          <SearchBar onSearch={(query) => setSearchQuery(query)} />
          <ViewToggle view={view} setView={setView} />

          {/* Filters */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <Filter className="w-5 h-5 mr-2" />
              <h2 className="text-lg font-semibold">Filter Patents</h2>
            </div>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <span className="text-sm font-medium mr-2">Type:</span>
                {PATENT_TYPES.map((type) => (
                  <FilterButton
                    key={type}
                    active={selectedType === type}
                    onClick={() => setSelectedType(type)}
                  >
                    {type}
                  </FilterButton>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="text-sm font-medium mr-2">Year:</span>
                {PATENT_YEARS.map((year) => (
                  <FilterButton
                    key={year}
                    active={selectedYear === year}
                    onClick={() => setSelectedYear(year)}
                  >
                    {year}
                  </FilterButton>
                ))}
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div
            className={`grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 ${
              darkMode ? "bg-gray-900" : "bg-gray-50"
            } rounded-lg p-6`}
          >
            <div className="flex items-center">
              <Check className="w-8 h-8 text-green-500 mr-3" />
              <div>
                <p className="text-2xl font-bold">3</p>
                <p className="text-sm">US Patents</p>
              </div>
            </div>
            <div className="flex items-center">
              <Award className="w-8 h-8 text-blue-500 mr-3" />
              <div>
                <p className="text-2xl font-bold">17</p>
                <p className="text-sm">Korean Patents</p>
              </div>
            </div>
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-purple-500 mr-3" />
              <div>
                <p className="text-2xl font-bold">22</p>
                <p className="text-sm">Patent Applicationss</p>
              </div>
            </div>
          </div>

          {/* Patents Grid */}
          {view === "grid" ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedPatents.map((patent: Patent) => (
                  <PatentCard
                    key={patent.id}
                    patent={patent}
                    darkMode={darkMode}
                  />
                ))}
              </div>
              {/* Pagination Controls */}
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
            </>
          ) : (
            <PatentTimeline patents={filteredPatents} darkMode={darkMode} />
          )}
        </div>
      </div>

      {!isMobile && <RotatingAtomCursor />}
    </div>
  );
};

export default PatentsPage;
