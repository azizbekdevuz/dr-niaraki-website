import React, { useState } from "react";
import dynamic from "next/dynamic";
import { useDeviceType } from "../components/useDeviceType";
import { Award, Filter, Check, Clock, Globe, Search, Grid } from "lucide-react";
import { groupBy } from "lodash";

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
  const [darkMode, setDarkMode] = useState(true);
  const [selectedType, setSelectedType] = useState("All");
  const [selectedYear, setSelectedYear] = useState("All");
  const [view, setView] = useState<"grid" | "timeline">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const isMobile = useDeviceType();

  // Patent data from CV
  const patents = [
    {
      id: 1,
      type: "US International",
      title:
        "Tourist Accommodation Recommendation Method and System Using Multi-Criteria Decision-Making and Augmented Reality",
      number: "US11,816,804B2",
      date: "Nov 14, 2023",
      inventors: [
        "Abolghasem Sadeghi-Niaraki",
        "Soo-Mi Choi",
        "Somaieh Rokhsaritalemi",
      ],
    },
    {
      id: 2,
      type: "US International",
      title:
        "IOT-BASED APPROACH METHOD FOR LEARNING GEOMETRIC SHAPES IN EARLY CHILDHOOD AND DEVICE THEREOF",
      number: "18/821,509",
      date: "Aug 30, 2024",
      inventors: [
        "Abolghasem Sadeghi-Niaraki",
        "Soo-Mi Choi",
        "SAFARI BAZARGANI JALAL",
        "RAHIMI FATEMA",
        "Tamer Abuhmed",
      ],
    },
    {
      id: 3,
      type: "US International",
      title:
        "SEMANTIC INFORMATION RETRIEVAL METHOD FOR AUGMENTED REALITY DOMAIN AND DEVICE THEREOF",
      number: "18/818,158",
      date: "Aug 28, 2024",
      inventors: ["Abolghasem Sadeghi-Niaraki", "Soo-Mi Choi", "Tamer Abuhmed"],
    },
    {
      id: 4,
      type: "Korean",
      title:
        "Geospatial Information System-Based Modeling Approach for Leakage Management in Urban Water Distribution Networks",
      number: "10-2356500",
      date: "Jan 24, 2022",
      inventors: ["Abolghasem Sadeghi-Niaraki", "Soo-Mi Choi"],
    },
    {
      id: 5,
      type: "Korean",
      title:
        "Groundwater Potential Mapping Using Integrated Ensemble of Three Bivariate Statistical Models with Random Forest and Logistic Tree Models",
      number: "10-2307898",
      date: "Sept 27, 2021",
      inventors: ["Abolghasem Sadeghi-Niaraki", "Soo-Mi Choi"],
    },
    {
      id: 6,
      type: "Korean",
      title:
        "Method and Apparatus for Enhancing Response Coordination through Assessment of Response Network Structural Dynamics",
      number: "10-2208906", // Corrected number
      date: "Jan 22, 2021",
      inventors: ["Abolghasem Sadeghi-Niaraki", "Soo-Mi Choi"],
    },
    {
      id: 7,
      type: "Korean",
      title:
        "Context-Aware Route Finding Algorithm for Self-Driving Tourists Using Ontology",
      number: "10-2148349",
      date: "Aug 20, 2020",
      inventors: ["Abolghasem Sadeghi-Niaraki", "Soo-Mi Choi"],
    },
    {
      id: 8,
      type: "Korean",
      title:
        "Spatial Cluster-Based Model for Static Rebalancing Bike Sharing Problem",
      number: "10-2252678",
      date: "May 11, 2021",
      inventors: ["Abolghasem Sadeghi-Niaraki", "Soo-Mi Choi"],
    },
    {
      id: 9,
      type: "Korean",
      title:
        "Semantic Interoperability of GIS and MCDA Tools for Environmental Assessment and Decision Making",
      number: "10-2003643",
      date: "Jul 18, 2019",
      inventors: [
        "Soo-Mi Choi",
        "Abolghasem Sadeghi-Niaraki",
        "Mohammadreza Jelokhani-Niaraki",
      ],
    },
    {
      id: 10,
      type: "Korean",
      title:
        "Methodological Framework for Assessment of Ubiquitous Cities Using ANP and DEMATEL Method",
      number: "10-2010180",
      date: "Aug 6, 2019",
      inventors: ["Soo-Mi Choi", "Abolghasem Sadeghi-Niaraki"],
    },
    {
      id: 11,
      type: "Korean",
      title: "Ubiquitous Sensor Network Simulation and Emulation Environments",
      number: "10-2011215",
      date: "Aug 8, 2019",
      inventors: ["Abolghasem Sadeghi-Niaraki", "Soo-Mi Choi"],
    },
    {
      id: 12,
      type: "Korean",
      title:
        "Method and Device for Generating a Wildfire Vulnerability Map Using Artificial Intelligence",
      number: "10-2706021",
      date: "Sept 9, 2024",
      inventors: ["Soo-Mi Choi", "Abolghasem Sadeghi-Niaraki"],
    },
    {
      id: 13,
      type: "Korean",
      title:
        "Methodological Framework for Assessment of Ubiquitous Cities Using ANP and DEMATEL Method",
      number: "10-2679714",
      date: "Jun 25, 2024",
      inventors: ["Soo-Mi Choi", "Abolghasem Sadeghi-Niaraki"],
    },
    {
      id: 14,
      type: "Korean",
      title: "Ubiquitous Sensor Network Simulation and Emulation Environments",
      number: "10-2718516",
      date: "Oct 14, 2024",
      inventors: ["Soo-Mi Choi", "Abolghasem Sadeghi-Niaraki"],
    },
    {
      id: 15,
      type: "Korean",
      title:
        "System and Method for Representing Real World of a Road Network for Route Planning in GIS",
      number: "10-2707106", // Matches CV and not marked expired
      date: "Sept 11, 2024",
      inventors: ["Soo-Mi Choi", "Abolghasem Sadeghi-Niaraki"],
    },
    {
      id: 16,
      type: "Korean",
      title:
        "Ontology Based Personalized Route Planning System Using Multi Criteria Decision Making Approach",
      number: "10-2718568", // Matches CV with first title
      date: "Oct 14, 2024",
      inventors: [
        "Abolghasem Sadeghi-Niaraki",
        "Soo-Mi Choi",
        "Seyed Vahid Razavi-Termeh",
      ],
    },
    {
      id: 17,
      type: "Applications",
      title:
        "Ubiquitous GIS-Based Outdoor Evacuation Support for Earthquake Disaster Response",
      number: "10-2023-0068491",
      date: "May 26, 2023",
      inventors: ["Abolghasem Sadeghi-Niaraki", "Soo-Mi Choi"],
    },
    {
      id: 18,
      type: "Applications",
      title:
        "Fuzzy Logic and Distance Metrics Based Approach for Measuring Spatial Similarity Among COVID-19 Epicenters",
      number: "10-2023-0070773", // Fixed missing "a" in title
      date: "Jun 1, 2023",
      inventors: ["Abolghasem Sadeghi-Niaraki", "Soo-Mi Choi", "Tamer Abuhmed"],
    },
    {
      id: 19,
      type: "Applications",
      title:
        "Integration of Machine Learning Algorithms and GIS-Based Approaches to Cutaneous Leishmaniasis Prevalence Risk Mapping",
      number: "10-2023-0070774",
      date: "Jun 1, 2023",
      inventors: [
        "Abolghasem Sadeghi-Niaraki",
        "Soo-Mi Choi",
        "Seyed Vahid Razavi-Termeh",
        "Tamer Abuhmed",
      ],
    },
    {
      id: 20,
      type: "Applications",
      title:
        "Method and System for Ontological Data Modeling for Points of Interest in a Cultural Heritage Site",
      number: "10-2023-0020692",
      date: "Feb 16, 2023",
      inventors: ["Abolghasem Sadeghi-Niaraki", "Soo-Mi Choi"],
    },
    {
      id: 21,
      type: "Applications",
      title:
        "Method and Device for Spatio-Temporal Distribution Analysis of Schools",
      number: "10-2021-0174434",
      date: "Dec 8, 2021",
      inventors: ["Abolghasem Sadeghi-Niaraki", "Soo-Mi Choi"],
    },
    {
      id: 22,
      type: "Applications",
      title: "Method and Device for Long-Term Temperature Modeling",
      number: "10-2021-0135546",
      date: "Oct 13, 2021",
      inventors: ["Soo-Mi Choi", "Abolghasem Sadeghi-Niaraki"],
    },
    {
      id: 23,
      type: "Applications",
      title: "Asthma-Prone Area Modeling Using a Machine Learning Model",
      number: "10-2021-0151937",
      date: "Nov 8, 2021",
      inventors: ["Abolghasem Sadeghi-Niaraki", "Soo-Mi Choi"],
    },
    {
      id: 24,
      type: "Applications",
      title:
        "Method and System of Recommending Accommodation for Tourists Using Multi-Criteria Decision Making and Augmented Reality",
      number: "10-2021-0169659",
      date: "Dec 1, 2021",
      inventors: [
        "Abolghasem Sadeghi-Niaraki",
        "Soo-Mi Choi",
        "Somaieh Rokhsaritalemi",
      ],
    },
    {
      id: 25,
      type: "Applications",
      title: "Augmented Reality-Based Border Management System",
      number: "10-2023-0001857",
      date: "Jan 5, 2023",
      inventors: ["Abolghasem Sadeghi-Niaraki", "Soo-Mi Choi"],
    },
    {
      id: 26,
      type: "Applications",
      title:
        "IOT-Based Approach for Learning Geometric Shapes in Early Childhood",
      number: "10-2023-0162687",
      date: "Nov 21, 2023",
      inventors: [
        "Abolghasem Sadeghi-Niaraki",
        "Soo-Mi Choi",
        "SAFARI BAZARGANI JALAL",
        "RAHIMI FATEMA",
        "Tamer Abuhmed",
      ],
    },
    {
      id: 27,
      type: "Applications",
      title: "Semantic Information Retrieval for Augmented Reality Domain",
      number: "10-2023-0162688",
      date: "Nov 21, 2023",
      inventors: ["Abolghasem Sadeghi-Niaraki", "Soo-Mi Choi", "Tamer Abuhmed"],
    },
    {
      id: 28,
      type: "Applications",
      title:
        "Optimization of Machine Learning Algorithm for Flood Susceptibility Mapping Using Radar Satellite Imagery",
      number: "10-2023-0162720", // Fixed typo in title
      date: "Nov 21, 2023",
      inventors: [
        "Abolghasem Sadeghi-Niaraki",
        "Soo-Mi Choi",
        "Seyed Vahid Razavi-Termeh",
        "MyoungBae Seo",
      ],
    },
    {
      id: 29,
      type: "Applications",
      title:
        "Time Series Hourly Sea Surface Temperature Prediction Method and System Using Deep Neural Network Model",
      number: "10-2024-0067597",
      date: "May 24, 2024",
      inventors: [
        "Abolghasem Sadeghi-Niaraki",
        "Soo-Mi Choi",
        "SAFARI BAZARGANI JALAL",
        "SEYED VAHID RAZAVI-TERMEH",
        "Hussain Dildar",
      ],
    },
    {
      id: 30,
      type: "Applications",
      title:
        "Wildfire Susceptibility Mapping Method and System Using Deep Learning Algorithms in Two Satellite Imagery Dataset",
      number: "10-2024-0067598", // Fixed typo in title
      date: "May 24, 2024",
      inventors: [
        "Abolghasem Sadeghi-Niaraki",
        "Soo-Mi Choi",
        "Seyed Vahid Razavi-Termeh",
        "Tamer Abuhmed",
      ],
    },
    {
      id: 31,
      type: "Applications",
      title:
        "Hybridization Method and System of Spatial Modeling and Deep Learning for People's Visual Perception of Urban Landscapes",
      number: "10-2024-0067599",
      date: "May 24, 2024",
      inventors: [
        "Abolghasem Sadeghi-Niaraki",
        "Soo-Mi Choi",
        "SEYED VAHID RAZAVI-TERMEH",
      ],
    },
    {
      id: 32,
      type: "Applications",
      title:
        "Dust Detection and Susceptibility Mapping Method and System by Aiding Satellite Imagery Time Series and Integration of Ensemble Machine Learning with Evolutionary Algorithms",
      number: "10-2024-0067600", // Fixed typo in title
      date: "May 24, 2024",
      inventors: [
        "Abolghasem Sadeghi-Niaraki",
        "Soo-Mi Choi",
        "Seyed Vahid Razavi-Termeh",
        "Rizwan Ali NAQVI",
      ],
    },
    {
      id: 33,
      type: "Applications",
      title:
        "Method and System for Assessing Temporal Dynamics of Urban Gas Pipeline Risks",
      number: "10-2024-0067601",
      date: "May 24, 2024",
      inventors: [
        "Abolghasem Sadeghi-Niaraki",
        "Soo-Mi Choi",
        "RAHIMI FATEMA",
        "Tamer Abuhmed",
      ],
    },
    {
      id: 34,
      type: "Applications",
      title:
        "Flash Flood Detection and Susceptibility Mapping Method and System in the Monsoon Period by Integration of Optical and Radar Satellite Imagery Using an Improvement of a Sequential Ensemble Algorithm",
      number: "10-2024-0082425",
      date: "Jun 25, 2024",
      inventors: [
        "Abolghasem Sadeghi-Niaraki",
        "Soo-Mi Choi",
        "SEYED VAHID RAZAVI-TERMEH",
        "MyoungBae Seo",
      ],
    },
    {
      id: 35,
      type: "Applications",
      title:
        "GIS-Based Multi-Objective Evolutionary Algorithm for Landslide Susceptibility Mapping",
      number: "10-2024-0082426",
      date: "Jun 25, 2024",
      inventors: [
        "Abolghasem Sadeghi-Niaraki",
        "Soo-Mi Choi",
        "SEYED VAHID RAZAVI-TERMEH",
      ],
    },
    {
      id: 36,
      type: "Applications",
      title:
        "New Approach Based on Biology-Inspired Metaheuristic Algorithm in Combination with Random Forest to Enhance the Flood Susceptibility Mapping",
      number: "10-2024-0082427", // Fixed typo in title
      date: "Jun 25, 2024",
      inventors: [
        "Abolghasem Sadeghi-Niaraki",
        "Soo-Mi Choi",
        "Seyed Vahid Razavi-Termeh",
      ],
    },
    {
      id: 37,
      type: "Applications",
      title:
        "Method and System for Enhancing Mapping of Flood-Prone Areas by Fine-Tuning the K-Nearest Neighbors Algorithm for Spatial Modeling",
      number: "10-2024-0082428",
      date: "Jun 25, 2024",
      inventors: [
        "Abolghasem Sadeghi-Niaraki",
        "Soo-Mi Choi",
        "SEYED VAHID RAZAVI-TERMEH",
      ],
    },
    {
      id: 38,
      type: "Applications",
      title:
        "Geospatial Artificial Intelligence and Satellite Imagery Fusion for Soil Physical Property Prediction",
      number: "10-2024-0082178",
      date: "Jun 24, 2024",
      inventors: [
        "Abolghasem Sadeghi-Niaraki",
        "Soo-Mi Choi",
        "SEYED VAHID RAZAVI-TERMEH",
        "MyoungBae Seo",
        "Yong-Guk Kim",
      ],
    },
    {
      id: 39,
      type: "Korean",
      title:
        "System and Method for Representing Real World of a Road Network for Route Planning in GIS",
      number: "10130417300000",
      date: "Aug 29, 2013",
      inventors: ["Abolghasem Sadeghi-Niaraki", "Kyehyun Kim"],
      status: "Expired",
      applicant: "Inha University", // Added status and applicant
    },
    {
      id: 40,
      type: "Korean",
      title:
        "Ontology Based Personalized Route Planning System Using Multi Criteria Decision Making Approach",
      number: "10-1304173",
      date: "Sept 29, 2010",
      inventors: ["Abolghasem Sadeghi-Niaraki", "Kyehyun Kim"],
      status: "Expired",
      applicant: "Inha University", // Added status and applicant
    },
    {
      id: 41,
      type: "Applications",
      title:
        "Method and System for Spatio-Temporal Modeling of Asthma-Prone Areas Using Machine Learning Optimized with Metaheuristic Algorithms",
      number: "10-2718568",
      date: "Oct 14, 2024",
      inventors: [
        "Abolghasem Sadeghi-Niaraki",
        "Soo-Mi Choi",
        "Seyed Vahid Razavi-Termeh",
      ],
    },
    {
      id: 42,
      type: "Applications",
      title:
        "Method and Device for Generating a Wildfire Vulnerability Map Using Artificial Intelligence",
      number: "10-2706021",
      date: "Sept 9, 2024",
      inventors: [
        "Soo-Mi Choi",
        "Abolghasem Sadeghi-Niaraki",
        "Somaieh Rokhsaritalemi",
      ],
    },
  ];

  // Update the filter logic to include search
  const filteredPatents = patents.filter((patent) => {
    const matchesType = selectedType === "All" || patent.type === selectedType;
    const matchesYear =
      selectedYear === "All" || patent.date.includes(selectedYear);
    const matchesSearch =
      searchQuery === "" ||
      patent.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patent.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patent.inventors.some((inventor) =>
        inventor.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    return matchesType && matchesYear && matchesSearch;
  });

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
          {/* Dark Mode Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`fixed top-4 right-4 p-2 rounded-full ${
              darkMode ? "bg-white text-black" : "bg-gray-800 text-white"
            }`}
          >
            {darkMode ? "☀️" : "🌙"}
          </button>

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPatents.map((patent) => (
                <PatentCard
                  key={patent.id}
                  patent={patent}
                  darkMode={darkMode}
                />
              ))}
            </div>
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
