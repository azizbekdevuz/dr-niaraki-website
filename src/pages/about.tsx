import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import {
  Building, Calendar, GraduationCap,
  Award, Star,
  Book, Globe, Brain,  FileText,
  ExternalLink, Medal,
  Mail, Phone, MapPin, BarChart, ChevronRight
} from "lucide-react";
import VideoS from "../components/VideoS";
import textSystem from "../components/textSystem";

interface AboutProps {
  darkMode: boolean;
}

interface AnimatedCounterProps {
    end: string; // or use `number` if it's numeric
    duration?: number; // optional, default is provided
  }  

const About = ({ darkMode }: AboutProps) => {

  const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ end, duration = 2 }) => {
    const [ref, inView] = useInView({ triggerOnce: true });
    const [count, setCount] = useState(0);
  
    useEffect(() => {
      if (inView) {
        let startTime: number | null = null;
        const endNum = parseInt(end.replace(/\D/g, ""));
  
        const animate = (currentTime: number) => {
          if (!startTime) startTime = currentTime;
          const timeElapsed = currentTime - startTime;
          const progress = timeElapsed / (duration * 1000);
  
          if (progress < 1) {
            setCount(Math.min(Math.floor(endNum * progress), endNum));
            requestAnimationFrame(animate);
          } else {
            setCount(endNum);
          }
        };
  
        requestAnimationFrame(animate);
      }
    }, [inView, end, duration]);
  
    return (
      <span ref={ref} className="tabular-nums">
        {count}+
      </span>
    );
  };  

  // Contact Information
  const contactInfo = {
    position: "Associate Professor",
    department: "Dept. of Computer Science & Engineering",
    center: "eXtended Reality (XR) Center",
    university: "Sejong University",
    address: "209- Gwangjin-gu, Gunja-dong, Neungdong-ro, Seoul, Republic of Korea",
    tel: "+82 2-3408-2981",
    fax: "+82 2-3408-4321",
    email: "a.sadeghi@sejong.ac.kr"
  };

  // Career Timeline
  const careerTimeline = [
    {
      period: "2022-Present",
      role: "Research Professor",
      institution: "XR Metaverse Research Center, Sejong University",
      details: "Leading research in XR and Metaverse technologies"
    },
    {
      period: "2017-Present",
      role: "Associate Professor",
      institution: "Dept. of Computer Science and Engineering, Sejong University",
      details: "Teaching and researching in AI, XR, and Computer Science"
    },
    {
      period: "2017-2021",
      role: "Research Professor",
      institution: "Mobile Virtual Reality Research Center",
      details: "Led major VR research initiatives"
    },
    {
      period: "2009-2017",
      role: "Assistant Professor",
      institution: "INHA University",
      details: "Department of Geo-Informatics Engineering"
    }
  ];

  // Research Stats
  const researchStats = [
    {
      number: "99+",
      label: "Research Publications",
      subtext: "in top-tier journals",
      icon: FileText
    },
    {
      number: "23+",
      label: "Patents",
      subtext: "including US and international",
      icon: Medal
    },
    {
      number: "15+",
      label: "Years Experience",
      subtext: "in academia and research",
      icon: Calendar
    },
    {
      number: "30M+",
      label: "Research Grants",
      subtext: "in funded projects",
      icon: BarChart
    }
  ];

  // Research Focus Areas
  const researchAreas = [
    {
      title: "AI & Large Models",
      description: "Advanced research in artificial intelligence and large language models",
      projects: [
        "AI-Enhanced GIS Systems",
        "Machine Learning Applications",
        "Neural Networks"
      ]
    },
    {
      title: "XR & Metaverse",
      description: "Pioneering work in Extended Reality and Metaverse technologies",
      projects: [
        "Super-Realistic XR Technology",
        "Mobile Virtual Reality",
        "Mixed Reality Applications"
      ]
    },
    {
      title: "GeoAI & Smart Cities",
      description: "Integration of AI with geographic information systems",
      projects: [
        "Urban Computing",
        "Spatial Analysis",
        "Smart Infrastructure"
      ]
    },
    {
      title: "Healthcare Tech",
      description: "Technology applications in healthcare and medical systems",
      projects: [
        "Telemedicine Solutions",
        "Health Monitoring Systems",
        "Medical Imaging AI"
      ]
    }
  ];

//   // Major Projects
//   const majorProjects = [
//     {
//       title: "Super-Realistic XR Technology Research",
//       period: "2022-2030",
//       funding: "IITP, Ministry of Science",
//       description: "Research for Real-Virtual Interconnected Metaverse"
//     },
//     {
//       title: "Mobile Virtual Reality Research Center",
//       period: "2017-2021",
//       funding: "Korean Ministry of Science and ICT",
//       description: "Large-scale research project on mobile VR technologies"
//     }
//   ];

  // Teaching Areas
  const teachingAreas = {
    graduate: [
      "Artificial Intelligence and Big Data",
      "Advances in Human-Computer Interaction (HCI)",
      "Special Topic in IoT",
      "Special Topics in Biometrics"
    ],
    undergraduate: [
      "Artificial Intelligence and Big Data",
      "Web Programming",
      "Operating Systems",
      "GIS Programming"
    ]
  };

  // Editorial Positions
  const editorialPositions = [
    {
      role: "Associate Editor",
      journal: "International Journal of Geosensing and Geocomputing",
      region: "East Asia and Pacific"
    },
    {
      role: "Editorial Board Member",
      journal: "Journal of Geodesy and Geomatics Engineering",
      since: "2014"
    }
  ];

const FloatingElements = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className={`absolute ${
            darkMode ? "bg-blue-500/10" : "bg-blue-600/10"
          } rounded-full blur-2xl`}
          style={{
            width: Math.random() * 100 + 50,
            height: Math.random() * 100 + 50,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            x: [0, Math.random() * 100 - 50],
            y: [0, Math.random() * 100 - 50],
            scale: [1, Math.random() + 0.5],
            opacity: [0.3, 0.6],
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />
      ))}
    </div>
  );

return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen"
    >
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center py-24">
      <FloatingElements />
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-6"
            >
              <motion.h1
                className={`text-4xl md:text-5xl lg:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${
                  darkMode ? textSystem.dark.gradient : textSystem.light.gradient
                }`}
              >
                Dr. Abolghasem Sadeghi-Niaraki
              </motion.h1>
              
              <div className="space-y-4">
                <p className={`text-xl md:text-2xl ${
                  darkMode ? textSystem.dark.secondary : textSystem.light.secondary
                }`}>
                  Associate Professor at Sejong University
                </p>
                
                <p className={`text-lg ${
                  darkMode ? textSystem.dark.tertiary : textSystem.light.tertiary
                }`}>
                  Leading researcher in Extended Reality and Artificial Intelligence at the XR Metaverse Research Center, pioneering the future of human-computer interaction and spatial computing.
                </p>
  
                {/* Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  {[
                    { icon: Mail, text: contactInfo.email },
                    { icon: Phone, text: contactInfo.tel },
                    { icon: MapPin, text: "Seoul, Republic of Korea" },
                    { icon: Building, text: "XR Metaverse Research Center" }
                  ].map((item, index) => (
                    <motion.div
                      key={index}
                      className="flex items-center gap-2"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 * index }}
                    >
                      <item.icon className={darkMode ? "text-blue-400" : "text-blue-600"} size={16} />
                      <span className="text-sm">{item.text}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
  
              {/* Action Links */}
              <div className="flex flex-wrap gap-4 pt-6">
                <a
                  href="https://scholar.google.co.kr/citations?hl=en&user=-V8_A5YAAAAJ"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                    darkMode 
                      ? "bg-blue-500/20 hover:bg-blue-500/30 text-blue-300" 
                      : "bg-blue-100 hover:bg-blue-200 text-blue-800"
                  }`}
                >
                  <Book size={16} />
                  <span>Google Scholar</span>
                  <ExternalLink size={14} />
                </a>
  
                <a
                  href="https://sejong.elsevierpure.com/en/persons/sadeghi-niaraki-abolghasem"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                    darkMode 
                      ? "bg-purple-500/20 hover:bg-purple-500/30 text-purple-300" 
                      : "bg-purple-100 hover:bg-purple-200 text-purple-800"
                  }`}
                >
                  <Globe size={16} />
                  <span>Research Profile</span>
                  <ExternalLink size={14} />
                </a>
              </div>
            </motion.div>
  
            {/* Video/Image Section */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
            >
              <VideoS darkMode={darkMode} />
            </motion.div>
          </div>
        </div>
      </section>
  
      {/* Research Impact Section */}
      <section className="py-24 bg-gradient-to-b from-transparent via-gray-900/5 to-transparent">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-3xl md:text-4xl font-bold text-center mb-16 bg-clip-text text-transparent bg-gradient-to-r ${
              darkMode ? textSystem.dark.gradient : textSystem.light.gradient
            }`}
          >
            Research Impact
          </motion.h2>
  
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {researchStats.map((stat, index) => (
                <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.05, translateY: -5 }}
                    className={`p-6 rounded-xl backdrop-blur-sm relative group ${
                        darkMode ? "bg-gray-800/40" : "bg-white/40"
                    }`}
                    >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <stat.icon 
                        className={`${
                        darkMode ? "text-blue-400" : "text-blue-600"
                        } group-hover:scale-110 transition-transform duration-300`} 
                        size={24} 
                    />
                    <h3 className="text-3xl font-bold mt-4">
                        <AnimatedCounter end={stat.number} />
                    </h3>
                    <p className="text-sm mt-2 font-medium">{stat.label}</p>
                    <p className={`text-xs mt-1 ${
                        darkMode ? "text-gray-400" : "text-gray-600"
                    }`}>{stat.subtext}</p>
                    </motion.div>
            ))}
          </div>
        </div>
      </section>
  
      {/* Research Areas Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-3xl md:text-4xl font-bold text-center mb-16 bg-clip-text text-transparent bg-gradient-to-r ${
              darkMode ? textSystem.dark.gradient : textSystem.light.gradient
            }`}
          >
            Research Areas
          </motion.h2>
  
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {researchAreas.map((area, index) => (
                <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    className={`p-6 rounded-xl backdrop-blur-sm relative group overflow-hidden ${
                        darkMode ? "bg-gray-800/40" : "bg-white/40"
                    }`}
                    >
                    {/* Background Gradient Animation */}
                    <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10"
                        animate={{
                        x: ["0%", "100%", "0%"],
                        }}
                        transition={{
                        duration: 15,
                        repeat: Infinity,
                        ease: "linear",
                        }}
                    />

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                        <div className={`p-2 rounded-lg ${
                            darkMode ? "bg-blue-500/20" : "bg-blue-100"
                        }`}>
                            <Brain 
                            className={`w-6 h-6 ${
                                darkMode ? "text-blue-300" : "text-blue-600"
                            }`}
                            />
                        </div>
                        <h3 className={`text-xl font-bold ${
                            darkMode ? textSystem.dark.primary : textSystem.light.primary
                        }`}>{area.title}</h3>
                        </div>
                        
                        <p className="mb-6">{area.description}</p>
                        
                        <div className="grid grid-cols-1 gap-2">
                        {area.projects.map((project, idx) => (
                            <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 * idx }}
                            whileHover={{ x: 10 }}
                            className={`px-4 py-2 rounded-lg flex items-center gap-2 group/item ${
                                darkMode 
                                ? "bg-blue-500/10 text-blue-300" 
                                : "bg-blue-50 text-blue-800"
                            }`}
                            >
                            <ChevronRight size={16} className="opacity-0 group-hover/item:opacity-100 transition-opacity" />
                            <span>{project}</span>
                            </motion.div>
                        ))}
                        </div>
                    </div>
                    </motion.div>
            ))}
          </div>
        </div>
      </section>
  
      <section className="relative space-y-8">
        {/* Timeline line */}
        <div className={`absolute left-8 top-0 bottom-0 w-0.5 ${
          darkMode ? "bg-blue-500/20" : "bg-blue-200"
        }`} />

        {careerTimeline.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            className={`relative ml-16 p-6 rounded-xl backdrop-blur-sm ${
              darkMode ? "bg-gray-800/40" : "bg-white/40"
            }`}
          >
            {/* Timeline dot */}
            <motion.div 
              className={`absolute left-0 w-4 h-4 rounded-full -translate-x-[2.75rem] top-8 ${
                item.period.includes("Present") 
                  ? "bg-green-400"
                  : darkMode ? "bg-blue-400" : "bg-blue-600"
              }`}
              whileHover={{ scale: 1.5 }}
            />

            {/* Content */}
            <div className="relative">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className={`text-xl font-bold ${
                    darkMode ? textSystem.dark.primary : textSystem.light.primary
                  }`}>{item.role}</h3>
                  <p className={`text-lg ${
                    darkMode ? textSystem.dark.secondary : textSystem.light.secondary
                  }`}>{item.institution}</p>
                  <p className={`text-sm mt-2 ${
                    darkMode ? "text-blue-400" : "text-blue-600"
                  }`}>{item.period}</p>
                </div>
                <motion.span 
                  whileHover={{ scale: 1.1 }}
                  className={`px-3 py-1 rounded-full text-sm ${
                    item.period.includes("Present")
                      ? darkMode 
                        ? "bg-green-500/20 text-green-300" 
                        : "bg-green-100 text-green-800"
                      : darkMode
                        ? "bg-gray-700/50 text-gray-300"
                        : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {item.period.includes("Present") ? "Current" : "Past"}
                </motion.span>
              </div>
              <p className="mt-4">{item.details}</p>
            </div>
          </motion.div>
        ))}
      </section>

      {/* Teaching & Editorial Section */}
        <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
            <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-3xl md:text-4xl font-bold text-center mb-16 bg-clip-text text-transparent bg-gradient-to-r ${
                darkMode ? textSystem.dark.gradient : textSystem.light.gradient
            }`}
            >
            Teaching & Editorial Work
            </motion.h2>

            <div className="grid md:grid-cols-2 gap-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-6 rounded-xl backdrop-blur-sm ${
                  darkMode ? "bg-gray-800/40" : "bg-white/40"
                }`}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className={`p-2 rounded-lg ${
                    darkMode ? "bg-blue-500/20" : "bg-blue-100"
                  }`}>
                    <GraduationCap className={darkMode ? "text-blue-300" : "text-blue-600"} />
                  </div>
                  <h3 className={`text-xl font-bold ${
                    darkMode ? textSystem.dark.primary : textSystem.light.primary
                  }`}>Teaching Areas</h3>
                </div>

                <div className="space-y-8">
                  {Object.entries(teachingAreas).map(([level, courses], idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ${
                          darkMode 
                            ? level === "graduate" ? "bg-blue-500/20" : "bg-purple-500/20"
                            : level === "graduate" ? "bg-blue-100" : "bg-purple-100"
                        }`}>
                          {level === "graduate" ? "G" : "U"}
                        </span>
                        {level === "graduate" ? "Graduate Level" : "Undergraduate Level"}
                      </h4>
                      <div className="grid gap-2">
                        {courses.map((course, courseIdx) => (
                          <motion.div
                            key={courseIdx}
                            whileHover={{ x: 10 }}
                            className={`px-4 py-3 rounded-lg flex items-center gap-2 group ${
                              level === "graduate"
                                ? darkMode 
                                  ? "bg-blue-500/10 text-blue-300" 
                                  : "bg-blue-50 text-blue-800"
                                : darkMode
                                  ? "bg-purple-500/10 text-purple-300"
                                  : "bg-purple-50 text-purple-800"
                            }`}
                          >
                            <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                            <span>{course}</span>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

            {/* Editorial Positions */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-6 rounded-xl backdrop-blur-sm ${
                darkMode ? "bg-gray-800/40" : "bg-white/40"
                }`}
            >
                <h3 className={`text-xl font-bold mb-6 ${
                darkMode ? textSystem.dark.primary : textSystem.light.primary
                }`}>Editorial Positions</h3>

                <div className="space-y-6">
                {editorialPositions.map((position, idx) => (
                                    <div
                                    key={idx}
                                    className={`p-4 rounded-lg ${
                                        darkMode ? "bg-gray-700/50" : "bg-gray-50"
                                    }`}
                                    >
                                    <h4 className="font-semibold">{position.role}</h4>
                                    <p className={`mt-2 ${
                                        darkMode ? textSystem.dark.secondary : textSystem.light.secondary
                                    }`}>{position.journal}</p>
                                    {position.region && (
                                        <p className={`text-sm mt-1 ${
                                        darkMode ? "text-blue-400" : "text-blue-600"
                                        }`}>Region: {position.region}</p>
                                    )}
                                    {position.since && (
                                        <p className={`text-sm mt-1 ${
                                        darkMode ? "text-blue-400" : "text-blue-600"
                                        }`}>Since {position.since}</p>
                                    )}
                                    </div>
                ))}
                </div>
            </motion.div>
            </div>

            {/* Recognition & Awards - Move outside the grid */}
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  className="mt-12"
>
  <div className="flex items-center gap-3 mb-8">
    <div className={`p-2 rounded-lg ${
      darkMode ? "bg-yellow-500/20" : "bg-yellow-100"
    }`}>
      <Award className={darkMode ? "text-yellow-300" : "text-yellow-600"} />
    </div>
    <h3 className={`text-xl font-bold ${
      darkMode ? textSystem.dark.primary : textSystem.light.primary
    }`}>Recognition & Service</h3>
  </div>

  <div className="grid gap-6">
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`relative p-6 rounded-xl overflow-hidden ${
        darkMode ? "bg-gray-800/40" : "bg-white/40"
      }`}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-yellow-500/10"
        animate={{
          x: ["0%", "100%", "0%"],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      <div className="relative z-10">
        <h4 className="text-lg font-semibold flex items-center gap-2">
          <Star className={darkMode ? "text-yellow-400" : "text-yellow-600"} size={20} />
          Senior Member
        </h4>
        <p className="mt-2">International Engineering and Technology Institute (IETI), Hong Kong</p>
        <p className={`text-sm mt-2 ${
          darkMode ? "text-blue-400" : "text-blue-600"
        }`}>Since 2015</p>
      </div>
    </motion.div>

    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`relative p-6 rounded-xl overflow-hidden ${
        darkMode ? "bg-gray-800/40" : "bg-white/40"
      }`}
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10"
        animate={{
          x: ["0%", "100%", "0%"],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "linear",
        }}
      />
      <div className="relative z-10">
        <h4 className="text-lg font-semibold flex items-center gap-2">
          <Medal className={darkMode ? "text-blue-400" : "text-blue-600"} size={20} />
          Scientific Committee Member
        </h4>
        <p className="mt-2">SMPR Conference Series</p>
      </div>
    </motion.div>
  </div>
</motion.div>
        </div>
        </section>
  </motion.div>
);}

export default About;