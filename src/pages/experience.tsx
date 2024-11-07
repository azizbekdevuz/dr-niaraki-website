import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { Briefcase, ChevronRight, Calendar } from 'lucide-react';
import { HeroExperience } from '../components/HeroExperience';
import { Dispatch, SetStateAction } from 'react';

const RotatingAtomCursor = dynamic(() => import('../components/RotatingAtomCursor'), { ssr: false });

interface ExperienceData {
  title?: string;
  role?: string;
  institution?: string;
  organization?: string;
  period: string;
  additionalInformation?: string;
  details?: string;
  highlights: string[];
  progressPercentage?: number;
  location?: string;
}

const experienceData: ExperienceData[] = [
    {
      period: "March 2017 - Present",
      role: "Associate Professor",
      institution: "Dept. of Computer Science and Engineering, AI Center",
      organization: "Sejong University, South Korea",
      additionalInformation: "Specializes in teaching subjects like Virtual Reality, Mixed Reality, Culture Technology, and Geo-informatics.",
      highlights: [
        "Leading the eXtended Reality (XR) Center",
        "Teaching advanced Computer Science courses",
        "Supervising graduate research",
        "Publishing in top-tier journals"
      ],
      progressPercentage: 85
    },
    {
      period: "2022 - 2030",
      role: "Research Professor",
      institution: "XR Metaverse Research Center",
      organization: "Sejong University, South Korea",
      additionalInformation: "Leads research in XR technologies with a focus on creating a realistic interconnected metaverse.",
      highlights: [
        "Leading XR and Metaverse research initiatives",
        "Developing cutting-edge AR/VR applications",
        "Supervising advanced research projects",
        "Integrating AI with XR technologies"
      ],
      progressPercentage: 100
    },
    {
      period: "2017 - 2021",
      role: "Research Professor",
      institution: "Mobile Virtual Reality Research Center, Information Technology Research Center",
      organization: "Sejong University, South Korea",
      additionalInformation: "Conducted research in VR, MR, and GIS under the Ministry of Science and ICT support program supervised by the IITP.",
      highlights: [
        "Conducted VR and MR research",
        "Focused on GIS integration with virtual environments",
        "Secured government research support",
        "Collaborated on projects under IITP supervision"
      ],
      progressPercentage: 75
    },
    {
      period: "March 2009 - February 2017",
      role: "Assistant Professor",
      institution: "Dept. of Geoinformatic Engineering",
      organization: "INHA University, South Korea",
      additionalInformation: "Developed a background in leadership, supervised Master's and Ph.D. students, and contributed to research projects bridging South Korean and Iranian research efforts.",
      highlights: [
        "Led research in spatial data science",
        "Developed innovative curriculum",
        "International project collaboration",
        "Graduate student supervision"
      ],
      progressPercentage: 65
    },
    {
      period: "Winter 2009",
      role: "Visiting Professor",
      institution: "Dept. of Geomatics",
      organization: "University of Melbourne, Australia",
      additionalInformation: "Participated in discussions and delivered seminars on Ubiquitous GIS and spatially enabled systems.",
      highlights: [
        "Delivered seminars on GIS",
        "Focused on Ubiquitous GIS and spatially enabled systems",
        "Collaborated with international scholars"
      ],
      progressPercentage: 50
    }
  ];  

const industryExperienceData = [
    {
      role: "International Consultant",
      institution: "Hancom, Inc.",
      period: "2016 - 2017",
      additionalInformation: "Involved in consulting on GIS and related technologies for Korean companies.",
      highlights: [
        "Technology consulting services",
        "GIS implementation guidance",
        "Strategic technology planning",
        "Korean market expertise"
      ],
      progressPercentage: 90
    },
    {
      role: "Invited Researcher and Consultant",
      institution: "Korea geoSpatial Information & Communication (KSIC) Co., Ltd",
      location: "Seoul, South Korea",
      period: "August 2009 - November 2009",
      additionalInformation: "Focused on GIS-based IT solutions.",
      highlights: [
        "GIS solution development",
        "IT infrastructure consulting",
        "Technical research leadership",
        "Solution architecture design"
      ],
      progressPercentage: 85
    },
    {
      role: "ITS Researcher",
      institution: "Korea geoSpatial Information & Communication (KSIC) Co., Ltd",
      location: "Seoul, South Korea",
      period: "Summer 2005",
      additionalInformation: "Worked on intelligent transportation systems (ITS) and GIS applications.",
      highlights: [
        "ITS system development",
        "GIS integration",
        "Transportation solutions",
        "Technical research"
      ],
      progressPercentage: 75
    },
    {
      role: "GIS Manager for IT and GIS National Projects",
      institution: "Road Maintenance and Transportation Organization (RMTO)",
      location: "Iran",
      period: "March 2002 - January 2005",
      additionalInformation: "Managed IT and GIS projects, recognized as a top researcher by the Iranian President.",
      highlights: [
        "National project management",
        "IT infrastructure oversight",
        "GIS implementation",
        "Research recognition"
      ],
      progressPercentage: 95
    },
    {
      role: "Executive Manager",
      institution: "Bayan Computer Institute",
      period: "March 1996 - September 1999",
      additionalInformation: "Oversaw institute operations and project management for various computer-related programs.",
      highlights: [
        "Institute operations management",
        "Project oversight",
        "Program development",
        "Strategic planning"
      ],
      progressPercentage: 80
    }
  ];
  
const consultingData = [
    {
      title: "Korean Companies Consulting",
      institution: "Various Korean Technology Companies",
      period: "2015-2017",
      details: "Provided comprehensive consulting services to major companies including Hancom and KSIC.net",
      highlights: [
        "GIS technology implementation",
        "Strategic technology planning",
        "System architecture design",
        "Technical roadmap development"
      ],
      progressPercentage: 95
    },
    {
      title: "Hi-Tech Workshops and Seminars",
      location: "Iran",
      period: "2014-2016",
      details: "Organized and directed various technology-focused workshops and seminars featuring Korean experts",
      highlights: [
        "Workshop organization",
        "International expert coordination",
        "Knowledge transfer programs",
        "Technical training sessions"
      ],
      progressPercentage: 90
    },
    {
      title: "Gimpo Airport GIS Project",
      location: "Seoul, South Korea",
      period: "2013-2015",
      details: "Led development of advanced GIS services utilizing Context Awareness and AI for passenger navigation",
      highlights: [
        "Navigation system development",
        "AI integration",
        "Context-aware services",
        "Passenger experience optimization"
      ],
      progressPercentage: 100
    }
  ];

interface SectionNavigationProps {
    activeSection: number;
    setActiveSection: React.Dispatch<React.SetStateAction<number>>;
}

const SectionNavigation: React.FC<SectionNavigationProps> = ({ activeSection, setActiveSection }) => {
  return (
      <div className="flex justify-center gap-4 mb-16">
          {['Professional Journey', 'Industry Experience', 'Consulting & Collaboration'].map((section, idx) => (
              <motion.button
                  key={idx}
                  onClick={() => setActiveSection(idx)}
                  className={`${
                      activeSection === idx ? 'text-blue-500 font-semibold' : 'text-gray-500'
                  } transition-colors duration-300`}
              >
                  {section}
              </motion.button>
          ))}
      </div>
  );
};

interface IndustrySectionProps {
  activeIndustryIndex: number;
  setActiveIndustryIndex: React.Dispatch<React.SetStateAction<number>>;
}
  
const IndustrySection: React.FC<IndustrySectionProps> = ({ activeIndustryIndex, setActiveIndustryIndex }) => {
  useEffect(() => {
      const interval = setInterval(() => {
          setActiveIndustryIndex((prev) => (prev + 1) % industryExperienceData.length);
      }, 3000);

      return () => clearInterval(interval);
  }, [setActiveIndustryIndex]);
  
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
      >
      <AdvancedTimeline 
        activeIndex={activeIndustryIndex} 
        setActiveIndex={setActiveIndustryIndex}
        data={industryExperienceData} 
      />
        <div className="space-y-6">
          {industryExperienceData.map((exp, idx) => (
            <ExperienceCard
              key={idx}
              data={exp}
              index={idx}
              isActive={idx === activeIndustryIndex}
              onClick={() => setActiveIndustryIndex(idx)}
            />
          ))}
        </div>
      </motion.div>
    );
  };
  
interface ConsultingSectionProps {
    activeConsultingIndex: number;
    setActiveConsultingIndex: React.Dispatch<React.SetStateAction<number>>;
}

const ConsultingSection: React.FC<ConsultingSectionProps> = ({ activeConsultingIndex, setActiveConsultingIndex }) => {
    useEffect(() => {
      const interval = setInterval(() => {
        setActiveConsultingIndex((prev) => (prev + 1) % consultingData.length);
      }, 5000);
      return () => clearInterval(interval);
    }, []);
  
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
      >
      <AdvancedTimeline 
        activeIndex={activeConsultingIndex} 
        setActiveIndex={setActiveConsultingIndex}
        data={consultingData} 
      />
        <div className="space-y-6">
          {consultingData.map((exp, idx) => (
            <ExperienceCard
              key={idx}
              data={exp}
              index={idx}
              isActive={idx === activeConsultingIndex}
              onClick={() => setActiveConsultingIndex(idx)}
            />
          ))}
        </div>
      </motion.div>
    );
  };

interface AdvancedTimelineProps {
    activeIndex: number;
    setActiveIndex: Dispatch<SetStateAction<number>>;
    data: ({
      title?: string;
      role?: string;
      institution?: string;
      location?: string;
      organization?: string;
      period: string;
      details?: string;
      additionalInformation?: string;
      highlights: string[];
      progressPercentage: number;
    })[];
}
  
const AdvancedTimeline: React.FC<AdvancedTimelineProps> = ({ activeIndex, setActiveIndex, data }) => {
    return (
      <div className="relative w-full py-16">
        {/* Timeline Bar */}
        <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gray-700 transform -translate-y-1/2">
          <motion.div
            className="absolute left-0 h-full bg-gradient-to-r from-blue-500 to-purple-500"
            style={{
              width: `${(activeIndex / (data.length - 1)) * 100}%`
            }}
            transition={{ duration: 0.5 }}
          />
        </div>
  
        {/* Timeline Points */}
        <div className="relative flex justify-between mx-8">
          {data.map((exp, idx) => (
            <motion.div
              key={idx}
              className="relative"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: idx * 0.1 }}
            >
              {/* Connection Line */}
              <motion.div
                className="absolute left-1/2 bottom-full mb-4 w-px h-8 bg-gradient-to-b from-transparent via-blue-500/50 to-blue-500"
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: idx * 0.1 + 0.2 }}
              />
  
              {/* Timeline Point */}
              <motion.button
                className="relative group"
                onClick={() => setActiveIndex(idx)}
                whileHover={{ scale: 1.2 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                {/* Outer Ring */}
                <motion.div
                  className={`absolute -inset-4 rounded-full ${
                    idx === activeIndex 
                      ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20' 
                      : 'bg-transparent'
                  }`}
                  animate={{
                    scale: idx === activeIndex ? [1, 1.2, 1] : 1,
                    opacity: idx === activeIndex ? [0.5, 0.8, 0.5] : 0
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
  
                {/* Main Point */}
                <motion.div
                  className={`relative w-6 h-6 rounded-full flex items-center justify-center ${
                    idx === activeIndex
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500'
                      : 'bg-gray-700 hover:bg-gray-600'
                  }`}
                >
                  <motion.div
                    className="absolute inset-0 rounded-full bg-blue-500"
                    initial={false}
                    animate={{
                      scale: idx === activeIndex ? [0.8, 1.2, 0.8] : 0.8,
                      opacity: idx === activeIndex ? 1 : 0.5
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                </motion.div>
  
                {/* Year Label */}
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                  <motion.div
                    className={`text-sm font-medium ${
                      idx === activeIndex ? 'text-blue-400' : 'text-gray-500'
                    }`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 + 0.3 }}
                  >
                    {exp.period}
                  </motion.div>
                </div>
  
                {/* Hover Card */}
                <div className="absolute bottom-full mb-16 left-1/2 transform -translate-x-1/2 pointer-events-none">
                  <AnimatePresence>
                    {idx === activeIndex && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-3 shadow-xl"
                      >
                        <div className="text-white font-medium">{exp.role}</div>
                        <div className="text-blue-400 text-sm">{exp.organization}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.button>
  
              {/* Progress Indicator */}
              <motion.div
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                initial={false}
                animate={{
                  scale: idx === activeIndex ? [1, 1.2, 1] : 1,
                  opacity: idx === activeIndex ? 1 : 0.3
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <svg className="w-12 h-12" viewBox="0 0 50 50">
                  <circle
                    cx="25"
                    cy="25"
                    r="20"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeDasharray={`${exp.progressPercentage * 1.26} 126`}
                    className={`transform -rotate-90 ${
                      idx === activeIndex ? 'text-blue-500' : 'text-gray-700'
                    }`}
                  />
                </svg>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    );
};
  
const ProgressBar = ({ progress }: { progress: number }) => (
    <div className="relative w-full h-2 bg-gray-800 rounded-full overflow-hidden">
      <motion.div
        className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-purple-500"
        style={{ width: `${progress}%` }}
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      />
    </div>
);

interface ExperienceCardProps {
  data: ExperienceData;
  index: number;
  isActive: boolean;
  onClick: () => void;
}

interface ExperienceCardProps {
  data: ExperienceData;
  index: number;
  isActive: boolean;
  onClick: () => void;
}
  
const ExperienceCard: React.FC<ExperienceCardProps> = ({ data, index, isActive, onClick }) => (
    <motion.div
      className={`relative ${isActive ? 'z-10' : 'z-0'}`}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.2 }}
    >
      <motion.div
        className={`p-6 rounded-xl border transition-all duration-300 ${
          isActive
            ? 'bg-gray-800/95 border-blue-500/50 shadow-lg shadow-blue-500/20 border-opacity-50'
            : 'bg-gray-800/90 border-gray-700/30 hover:bg-gray-800/95 hover:border-gray-700/50'
        }`}
        whileHover={{ scale: 1.02 }}
        onClick={onClick}
      >
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <motion.div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isActive ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-gray-700'
                }`}
                animate={{ rotate: isActive ? 360 : 0 }}
                transition={{ duration: 0.5 }}
              >
                <Briefcase className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <h3 className="text-xl font-bold text-white">{data.title || data.role}</h3>
                <p className="text-blue-400">{data.institution}</p>
                {data.location && (
                  <p className="text-sm text-gray-400">{data.location}</p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2 text-gray-400">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">{data.period}</span>
            </div>
          </div>
  
          {/* Additional Information */}
          <div className="text-gray-300 text-sm">
            {data.additionalInformation || data.details}
          </div>
  
          <ProgressBar progress={data.progressPercentage ?? 0} />
  
          <AnimatePresence>
            {isActive && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="space-y-3 pt-4"
              >
                {data.highlights?.map((highlight, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center space-x-2"
                  >
                    <ChevronRight className="w-4 h-4 text-blue-400" />
                    <span className="text-gray-300">{highlight}</span>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
  
  export default function Experience() {
    const [activeIndex, setActiveIndex] = useState(0);
    const [activeIndustryIndex, setActiveIndustryIndex] = useState(0);
    const [activeConsultingIndex, setActiveConsultingIndex] = useState(0);
    const [activeSection, setActiveSection] = useState(0);
  
    useEffect(() => {
      const interval = setInterval(() => {
        setActiveIndex((prev) => (prev + 1) % experienceData.length);
      }, 5000);
      return () => clearInterval(interval);
    }, []);
  
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="relative max-w-7xl mx-auto px-4 py-20">
        {/* Added Hero Section */}
        <HeroExperience />
            <motion.h1
              className="text-4xl md:text-5xl font-bold text-center mb-12 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Professional Experience
            </motion.h1>
    
            <SectionNavigation 
              activeSection={activeSection} 
              setActiveSection={setActiveSection} 
            />
    
            <AnimatePresence mode="wait">
              {activeSection === 0 && (
                <motion.div
                  key="professional"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <motion.h2 className="text-3xl font-bold text-center mb-8 text-blue-400">
                    Professional Journey
                  </motion.h2>
                    <AdvancedTimeline 
                      activeIndex={activeIndex} 
                      setActiveIndex={setActiveIndex}
                      data={experienceData.map(exp => ({
                        ...exp,
                      progressPercentage: exp.progressPercentage ?? 0,}))} 
                    />
                  <div className="space-y-6">
                    {experienceData.map((exp, idx) => (
                      <ExperienceCard
                        key={idx}
                        data={exp}
                        index={idx}
                        isActive={idx === activeIndex}
                        onClick={() => setActiveIndex(idx)}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
    
              {activeSection === 1 && (
                <motion.div
                  key="industry"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <motion.h2 className="text-3xl font-bold text-center mb-8 text-blue-400">
                    Industry Experience
                  </motion.h2>
                  <IndustrySection 
                    activeIndustryIndex={activeIndustryIndex}
                    setActiveIndustryIndex={setActiveIndustryIndex}
                  />
                </motion.div>
              )}
    
              {activeSection === 2 && (
                <motion.div
                  key="consulting"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <motion.h2 className="text-3xl font-bold text-center mb-8 text-blue-400">
                    Consulting & Collaboration
                  </motion.h2>
                  <ConsultingSection 
                    activeConsultingIndex={activeConsultingIndex}
                    setActiveConsultingIndex={setActiveConsultingIndex}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {<RotatingAtomCursor />}
        </div>
      );
    }