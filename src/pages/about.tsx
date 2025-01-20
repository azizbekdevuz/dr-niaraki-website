import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  BookOpen,
  Award,
  Lightbulb,
  Globe,
  GraduationCap,
  Beaker,
  Building2,
  Users,
  Code,
  Brain,
} from "lucide-react";
import { useDeviceType } from "../components/useDeviceType";
import VideoS from "../components/VideoS";

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

// Update the component definitions to include darkMode prop
const Card = ({
  children,
  darkMode,
}: {
  children: React.ReactNode;
  darkMode: boolean;
}) => (
  <div
    className={`rounded-lg shadow-lg p-6 transition-colors duration-300
    ${darkMode ? "bg-gray-900 border border-gray-700" : "bg-white"} 
    ${
      darkMode
        ? "text-gray-100 [&_p]:text-gray-300 [&_h3]:text-white [&_h4]:text-white [&_li]:text-gray-300"
        : "text-gray-800 [&_p]:text-gray-600 [&_h3]:text-gray-800 [&_h4]:text-gray-800 [&_li]:text-gray-600"
    }`}
  >
    {children}
  </div>
);

const TabButton = ({
  active,
  onClick,
  children,
  darkMode,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  darkMode: boolean;
}) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors
      ${
        active
          ? darkMode
            ? "bg-blue-900 text-blue-100 border border-blue-700"
            : "bg-blue-100 text-blue-800"
          : darkMode
            ? "text-gray-300 hover:bg-gray-800"
            : "text-gray-600 hover:bg-gray-100"
      }`}
  >
    {children}
  </button>
);

const AboutPage = () => {
  const [darkMode] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const isMobile = useDeviceType();

  // Handle interactive elements cursor effect
  useEffect(() => {
    const handleMouseEnter = () => {
      document.body.classList.add("hovering");
    };

    const handleMouseLeave = () => {
      document.body.classList.remove("hovering");
    };

    const interactiveElements = document.querySelectorAll(
      'a, button, [role="button"]',
    );

    interactiveElements.forEach((el) => {
      el.addEventListener("mouseenter", handleMouseEnter);
      el.addEventListener("mouseleave", handleMouseLeave);
    });

    return () => {
      interactiveElements.forEach((el) => {
        el.removeEventListener("mouseenter", handleMouseEnter);
        el.removeEventListener("mouseleave", handleMouseLeave);
      });
    };
  }, []);

  return (
    <div
      className={`relative min-h-screen overflow-x-hidden transition-colors duration-300 ${
        darkMode ? "text-white" : "text-gray-800"
      }`}
    >
      {/* Background Component */}
      {isMobile ? (
        <MobileBackground theme={darkMode ? "dark" : "light"} />
      ) : (
        <AdvancedBackground theme={darkMode ? "dark" : "light"} />
      )}

      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 py-12">
          {/* Hero Section */}
          <div className="mb-12">
            {/* Title and Role */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-4">
                Dr. Abolghasem Sadeghi-Niaraki
              </h1>
              <p className="text-xl text-gray-600">
                Associate Professor at Sejong University | Harvard SDL Fellow |
                Top 2% Scientist
              </p>
            </div>

            {/* Video Section - Now more prominent */}
            <div className="mb-8">
              <VideoS darkMode={darkMode} />
            </div>

            {/* Tags and Links - Below video */}
            <div className="text-center">
              <div className="flex justify-center space-x-4 mb-6">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  <Globe className="w-4 h-4 mr-1" />
                  Geo-AI Expert
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  <Beaker className="w-4 h-4 mr-1" />
                  XR Researcher
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                  <Lightbulb className="w-4 h-4 mr-1" />
                  Innovation Leader
                </span>
              </div>

              <div className="flex justify-center space-x-6">
                <a
                  href="https://scholar.google.com/citations?user=YOUR_ID"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center px-4 py-2 rounded-lg transition-colors
          ${
            darkMode
              ? "bg-gray-800 hover:bg-gray-700 text-gray-100"
              : "bg-gray-100 hover:bg-gray-200 text-gray-800"
          }`}
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Google Scholar
                </a>
                <a
                  href="https://linkedin.com/in/abolghasemsadeghi-n"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center px-4 py-2 rounded-lg transition-colors
          ${
            darkMode
              ? "bg-gray-800 hover:bg-gray-700 text-gray-100"
              : "bg-gray-100 hover:bg-gray-200 text-gray-800"
          }`}
                >
                  <Users className="w-4 h-4 mr-2" />
                  LinkedIn
                </a>
                <a
                  href="http://www.abolghasemsadeghi-n.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center px-4 py-2 rounded-lg transition-colors
          ${
            darkMode
              ? "bg-gray-800 hover:bg-gray-700 text-gray-100"
              : "bg-gray-100 hover:bg-gray-200 text-gray-800"
          }`}
                >
                  <Globe className="w-4 h-4 mr-2" />
                  Website
                </a>
              </div>
            </div>
          </div>

          {/* Enhanced Tabs */}
          <div className="mb-8 flex space-x-4 justify-center flex-wrap gap-y-2">
            {[
              "overview",
              "expertise",
              "education",
              "awards",
              "leadership",
              "skills",
              "research",
              "experience",
              "service",
              "contact",
            ].map((tab) => (
              <TabButton
                key={tab}
                active={activeTab === tab}
                onClick={() => setActiveTab(tab)}
                darkMode={darkMode}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </TabButton>
            ))}
          </div>

          <div className="mt-6">
            {activeTab === "overview" && (
              <Card darkMode={darkMode}>
                <div className="prose max-w-none">
                  <p className="text-lg mb-6 dark:text-gray-300">
                    Dr. Abolghasem Sadeghi-Niaraki is an Associate Professor in
                    the Department of Computer Science and Engineering at the XR
                    (eXtended Reality) Metaverse Research Center, Sejong
                    University, Republic of Korea, where he has been a faculty
                    member since 2017. Recently appointed as a Fellow at Harvard
                    University's Spatial Data Lab (SDL), he conducts
                    collaborative research in spatiotemporal data analytics,
                    visualization, and geo-AI-based platforms, contributing to
                    innovative geographic data applications and natural hazards
                    research.
                  </p>
                  <p className="text-lg mb-6">
                    With a strong academic foundation and over 15 years of
                    experience, Dr. Sadeghi-Niaraki has established himself as a
                    prolific researcher advancing the fields of Geo-AI, GIS,
                    HCI, IoT, and Metaverse technologies. His groundbreaking
                    research in Geo-AI, Virtual Reality (VR), Mixed Reality
                    (MR), and Extended Reality (XR) applications, supported by
                    the Korean Ministry of Science and ICT, has pushed the
                    boundaries of immersive technologies in spatial data
                    systems.
                  </p>
                  <div
                    className={`my-8 border-t ${darkMode ? "border-gray-700" : "border-gray-200"}`}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                    <div className="space-y-4">
                      <h3 className="text-xl font-semibold flex items-center">
                        <BookOpen className="w-5 h-5 mr-2" />
                        Research Impact
                      </h3>
                      <ul className="list-disc pl-5 space-y-2">
                        <li>Published 120+ peer-reviewed papers</li>
                        <li>Secured 42 patents (US & Korean)</li>
                        <li>Led $9.3M+ in research funding</li>
                        <li>Supervised 40+ Master's & 6+ Ph.D. students</li>
                      </ul>
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-xl font-semibold flex items-center">
                        <Award className="w-5 h-5 mr-2" />
                        Key Achievements
                      </h3>
                      <ul className="list-disc pl-5 space-y-2">
                        <li>
                          Top 2% Scientist Worldwide (Stanford-Elsevier 2024)
                        </li>
                        <li>Fellow at Harvard SDL</li>
                        <li>Member of American Association of Geographers</li>
                        <li>Australian Endeavour Fellowship Recipient</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {activeTab === "expertise" && (
              <Card darkMode={darkMode}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-xl font-semibold mb-4">
                      Technical Expertise
                    </h3>
                    <ul className="space-y-3">
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                        Geo-AI & Spatial Computing
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                        Machine Learning & Deep Learning
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                        Extended Reality (XR) Technologies
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                        Natural Language Processing
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-4">
                      Research Areas
                    </h3>
                    <ul className="space-y-3">
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        IoT & Ubiquitous Computing
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        Human-Computer Interaction
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        Big Data Analytics
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        Metaverse Technologies
                      </li>
                    </ul>
                  </div>
                </div>
              </Card>
            )}

            {activeTab === "education" && (
              <Card darkMode={darkMode}>
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <GraduationCap className="w-6 h-6 mt-1" />
                    <div>
                      <h3 className="text-lg font-semibold">
                        Ph.D. in Geo-Informatics Engineering
                      </h3>
                      <p className="text-gray-600">
                        INHA University, South Korea
                      </p>
                      <p className="text-sm text-gray-500">2005 - 2008</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <GraduationCap className="w-6 h-6 mt-1" />
                    <div>
                      <h3 className="text-lg font-semibold">
                        M.Sc. in GIS Engineering
                      </h3>
                      <p className="text-gray-600">
                        K.N. Toosi University of Technology
                      </p>
                      <p className="text-sm text-gray-500">2000 - 2002</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <GraduationCap className="w-6 h-6 mt-1" />
                    <div>
                      <h3 className="text-lg font-semibold">
                        Post-Doctoral Fellowship
                      </h3>
                      <p className="text-gray-600">
                        University of Melbourne, Australia
                      </p>
                      <p className="text-sm text-gray-500">2012</p>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {activeTab === "awards" && (
              <Card darkMode={darkMode}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                      <Award className="w-6 h-6 mt-1 text-yellow-500" />
                      <div>
                        <h3 className="text-lg font-semibold">
                          Stanford-Elsevier Top 2% Scientist
                        </h3>
                        <p className="text-gray-600">2024</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4">
                      <Award className="w-6 h-6 mt-1 text-blue-500" />
                      <div>
                        <h3 className="text-lg font-semibold">
                          Harvard SDL Fellowship
                        </h3>
                        <p className="text-gray-600">2024 - Present</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                      <Award className="w-6 h-6 mt-1 text-purple-500" />
                      <div>
                        <h3 className="text-lg font-semibold">
                          Australian Endeavour Fellowship
                        </h3>
                        <p className="text-gray-600">2012</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4">
                      <Award className="w-6 h-6 mt-1 text-green-500" />
                      <div>
                        <h3 className="text-lg font-semibold">
                          Best Researcher Award
                        </h3>
                        <p className="text-gray-600">
                          International Soil Scientist Awards, 2024
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {activeTab === "leadership" && (
              <Card darkMode={darkMode}>
                <div className="space-y-8">
                  <div>
                    <h3 className="text-xl font-semibold mb-4 flex items-center">
                      <Building2 className="w-5 h-5 mr-2" />
                      Research Center Leadership
                    </h3>
                    <div className="space-y-4">
                      <div className="border-l-4 border-blue-500 pl-4">
                        <h4 className="font-semibold">
                          Super-Realistic XR Technology Research Center
                        </h4>
                        <p className="text-gray-600">Director, 2022 - 2030</p>
                        <p className="text-sm mt-2">
                          Leading cutting-edge research in Real-Virtual
                          Interconnected Metaverse technologies
                        </p>
                      </div>
                      <div className="border-l-4 border-green-500 pl-4">
                        <h4 className="font-semibold">
                          Mobile Virtual Reality Research Center
                        </h4>
                        <p className="text-gray-600">
                          Research Professor, 2017 - 2021
                        </p>
                        <p className="text-sm mt-2">
                          Managed international collaboration with 14
                          universities across 8 countries
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-4 flex items-center">
                      <Users className="w-5 h-5 mr-2" />
                      International Collaboration
                    </h3>
                    <ul className="space-y-2">
                      <li>
                        • Established international postgraduate programs with
                        KAIST
                      </li>
                      <li>
                        • Led Korea Knowledge Sharing Program (KSP) projects
                      </li>
                      <li>
                        • Consulting for major Korean companies including HANCOM
                        Group
                      </li>
                      <li>
                        • Implemented innovative solutions at Gimpo Airport
                      </li>
                    </ul>
                  </div>
                </div>
              </Card>
            )}

            {activeTab === "skills" && (
              <Card darkMode={darkMode}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-xl font-semibold mb-4 flex items-center">
                      <Code className="w-5 h-5 mr-2" />
                      Programming & Tools
                    </h3>
                    <ul className="space-y-3">
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                        Machine Learning Frameworks (TensorFlow, PyTorch,
                        Hugging Face)
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                        Python (Pandas, NumPy, Scikit-learn)
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                        Big Data (Hadoop, Spark, PySpark)
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                        Web Development (Django, HTML5, CSS3, JavaScript)
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-4 flex items-center">
                      <Brain className="w-5 h-5 mr-2" />
                      Domain Expertise
                    </h3>
                    <ul className="space-y-3">
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        Spatial Data Analysis & GeoAI Systems
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        Digital Twin & Virtual Environments
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        Smart City Technologies
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        Bioinformatics & Sensors Integration
                      </li>
                    </ul>
                  </div>
                </div>
              </Card>
            )}

            {activeTab === "research" && (
              <Card darkMode={darkMode}>
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold mb-4">
                    Major Research Projects
                  </h3>
                  <div className="space-y-4">
                    <div className="border-l-4 border-blue-500 pl-4">
                      <h4 className="font-semibold">
                        Super-Realistic XR Technology Research
                      </h4>
                      <p className="text-gray-600">2022 - 2030</p>
                      <p className="text-sm">Funding: ~750,000 USD per year</p>
                      <p className="text-sm mt-2">
                        Research for Real-Virtual Interconnected Metaverse
                        applications
                      </p>
                    </div>
                    <div className="border-l-4 border-green-500 pl-4">
                      <h4 className="font-semibold">
                        Mobile Virtual Reality Research Center
                      </h4>
                      <p className="text-gray-600">2016 - 2021</p>
                      <p className="text-sm">Funding: ~660,000 USD per year</p>
                      <p className="text-sm mt-2">
                        International collaboration across 14 universities and
                        11 companies
                      </p>
                    </div>
                    <div className="border-l-4 border-purple-500 pl-4">
                      <h4 className="font-semibold">
                        Knowledge Sharing Project (KSP)
                      </h4>
                      <p className="text-gray-600">2016 - 2017</p>
                      <p className="text-sm">Funding: 300,000 USD</p>
                      <p className="text-sm mt-2">
                        Strategic consulting with ETRI and VPST
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {activeTab === "experience" && (
              <Card darkMode={darkMode}>
                <div className="space-y-8">
                  <div>
                    <h3 className="text-xl font-semibold mb-4 flex items-center">
                      <Building2 className="w-5 h-5 mr-2" />
                      Academic Appointments
                    </h3>
                    <div className="space-y-4">
                      <div className="border-l-4 border-blue-500 pl-4">
                        <h4 className="font-semibold">Associate Professor</h4>
                        <p>
                          Department of Computer Science & Engineering, Sejong
                          University
                        </p>
                        <p className="text-gray-600">March 2017 - Present</p>
                      </div>
                      <div className="border-l-4 border-green-500 pl-4">
                        <h4 className="font-semibold">Research Professor</h4>
                        <p>XR Metaverse Research Center, Sejong University</p>
                        <p className="text-gray-600">2022 - 2030</p>
                      </div>
                      <div className="border-l-4 border-purple-500 pl-4">
                        <h4 className="font-semibold">Assistant Professor</h4>
                        <p>
                          Department of Geoinformatic Engineering, INHA
                          University
                        </p>
                        <p className="text-gray-600">
                          March 2009 - February 2017
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {activeTab === "service" && (
              <Card darkMode={darkMode}>
                <div className="space-y-8">
                  <div>
                    <h3 className="text-xl font-semibold mb-4">
                      Editorial Positions
                    </h3>
                    <ul className="space-y-3">
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                        Guest Editor, Sensors (IF: 3.4)
                      </li>
                      <li className="flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                        Guest Editor, Sustainability (IF: 3.3)
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-4">
                      Academic Supervision
                    </h3>
                    <ul className="space-y-2">
                      <li>• Supervised 40+ Master's students</li>
                      <li>• Directed 6 Ph.D. dissertations</li>
                      <li>• External examiner for 100+ theses</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-4">
                      Professional Memberships
                    </h3>
                    <ul className="space-y-2">
                      <li>
                        • Senior Member, International Engineering and
                        Technology Institute
                      </li>
                      <li>
                        • Member, American Association of Geographers (AAG)
                      </li>
                    </ul>
                  </div>
                </div>
              </Card>
            )}

            {activeTab === "contact" && (
              <Card darkMode={darkMode}>
                <div className="space-y-8">
                  <div>
                    <h3 className="text-xl font-semibold mb-6">
                      Contact Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold mb-2">
                            Office Location
                          </h4>
                          <p>Department of Computer Science & Engineering</p>
                          <p>Sejong University</p>
                          <p>209- Gwangjin-gu, Gunja-dong</p>
                          <p>Neungdong-ro, Seoul</p>
                          <p>Republic of Korea</p>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">
                            Contact Details
                          </h4>
                          <p>Tel: +82 2-3408-2981</p>
                          <p>Fax: +82 2-3408-4321</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold mb-2">Email</h4>
                          <p>Official: a.sadeghi@sejong.ac.kr</p>
                          <p>Personal: a.sadeqi313@gmail.com</p>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">
                            Research Centers
                          </h4>
                          <p>eXtended Reality (XR) Research Center</p>
                          <p>Spatial Data Lab (SDL), Harvard University</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-4">
                      Teaching & Mentorship
                    </h3>
                    <p className="mb-4">
                      With over 15 years of academic experience, I am committed
                      to fostering the next generation of computer scientists
                      and researchers. My teaching philosophy emphasizes
                      hands-on experience with cutting-edge technologies while
                      building strong theoretical foundations.
                    </p>
                    <p>
                      I have supervised over 40 Master's and 6 Ph.D. students,
                      guiding research in areas including Geo-AI, XR
                      technologies, and spatial computing. My approach combines
                      rigorous academic standards with practical industry
                      relevance.
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Custom Cursor */}
        {!isMobile && <RotatingAtomCursor />}
      </div>
    </div>
  );
};

export default AboutPage;
