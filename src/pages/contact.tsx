import dynamic from "next/dynamic";
import Image from "next/image";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDeviceType } from "../components/useDeviceType";
import {
  Phone,
  Building,
  Globe,
  GraduationCap,
  Award,
  BookOpen,
  Link2,
  Copy,
  CheckCircle,
  ExternalLink,
  MessageSquare,
  Users,
  Star,
  ArrowRight,
  FileText,
  Zap,
  PartyPopper,
} from "lucide-react";

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

interface ContactPageProps {
  darkMode?: boolean;
}

const ContactPage: React.FC<ContactPageProps> = () => {
  const [darkMode] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const isMobile = useDeviceType();

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const contactInfo = {
    position: {
      title: "Associate Professor",
      department: "Dept. of Computer Science & Engineering",
      center: "eXtended Reality (XR) Research Center",
      institution: "Sejong University",
      address:
        "209- Gwangjin-gu, Gunja-dong, Neungdong-ro, Seoul, Republic of Korea",
    },
    affiliations: [
      { title: "Fellow at Harvard SDL", icon: Award },
      { title: "Member of AAG", icon: Users },
      {
        title: "Top 2% Scientist, Stanford-Elsevier Dataset, 2024",
        icon: Star,
      },
    ],
    contact: {
      tel: "+82 2-3408-2981",
      fax: "+82 2-3408-4321",
      cell: "+82 10 4253-5-313",
      officialEmail: "a.sadeghi@sejong.ac.kr",
      personalEmail: "a.sadeqi313@gmail.com",
    },
    online: {
      website: "www.abolghasemsadeghi-n.com",
      linkedin: "linkedin.com/in/abolghasemsadeghi-n",
      googleScholar: "Abolghasem Sadeghi-Niaraki",
    },
  };

  const stats = [
    { icon: BookOpen, title: "Publications", value: "200+", color: "blue" },
    { icon: Award, title: "Patents", value: "42+", color: "purple" },
    { icon: GraduationCap, title: "Students", value: "2000+", color: "green" },
    { icon: Star, title: "Global Ranking", value: "Top 2%", color: "pink" },
  ];

  const achievements = [
    {
      title: "Global Recognition",
      desc: "Top 2% Scientist Worldwide (Stanford-Elsevier 2024)",
      icon: Star,
      colorClass: "text-yellow-500",
    },
    {
      title: "Harvard Fellowship",
      desc: "Fellow at Harvard SDL, Center for Geographic Analysis",
      icon: Award,
      colorClass: "text-red-500",
    },
    {
      title: "Research Impact",
      desc: "42+ Patents in XR and Geo-AI Technologies",
      icon: FileText,
      colorClass: "text-blue-500",
    },
    {
      title: "Academic Leadership",
      desc: "Leading $9.3M+ in Research Projects",
      icon: Zap,
      colorClass: "text-purple-500",
    },
  ];

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
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-8 flex justify-center"
          >
            <div className="relative group">
              <motion.div
                animate={{
                  rotate: [0, 360],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                  scale: {
                    duration: 2,
                    repeat: Infinity,
                    repeatType: "reverse",
                  },
                }}
                className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 opacity-20 blur-md group-hover:opacity-30"
              />
              <div className="relative w-48 h-48 rounded-full overflow-hidden border-2 border-white/10 shadow-2xl flex items-center justify-center">
                <Image
                width="192" height="192"
                  src="/assets/images/contact-image.png"
                  alt="Dr. Sadeghi-Niaraki"
                  onLoad={() => setImageLoaded(true)}
                  onError={() => {
                    console.error("Image failed to load");
                    setImageLoaded(false);
                  }}
                  className={`
                    absolute inset-0 w-full h-full object-cover transform transition-transform duration-700 
                    group-hover:scale-110
                    ${imageLoaded ? "opacity-100" : "opacity-0"}
                  `}
                />
                {!imageLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-200/50 backdrop-blur-sm">
                    <span className="text-gray-500 text-sm opacity-70 text-center">
                      Let's Do
                      <br />
                      It Together
                    </span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400"
          >
            Contact & Connect
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-xl ${darkMode ? "text-gray-300" : "text-gray-600"}`}
          >
            Let's collaborate on innovative research and projects
          </motion.p>
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className={`
                p-6 rounded-2xl
                ${darkMode ? "bg-gray-800" : "bg-white"}
                shadow-lg backdrop-blur-sm overflow-hidden group
              `}
            >
              <div className="flex items-center space-x-4">
                <stat.icon className={`w-8 h-8 text-${stat.color}-500`} />
                <div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div
                    className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}
                  >
                    {stat.title}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Academic Profile */}
          <div
            className={`
            p-6 rounded-2xl
            ${darkMode ? "bg-gray-800" : "bg-white"}
            shadow-lg lg:col-span-2
          `}
          >
            <div className="flex items-start gap-4">
              <Building className="w-6 h-6 text-blue-500 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                  Academic Profile
                </h2>
                <motion.div
                  className="space-y-3"
                  initial="hidden"
                  animate="show"
                  variants={{
                    hidden: { opacity: 0 },
                    show: {
                      opacity: 1,
                      transition: { staggerChildren: 0.1 },
                    },
                  }}
                >
                  {Object.entries(contactInfo.position).map(
                    ([key, value], index) => (
                      <motion.p
                        key={key}
                        variants={{
                          hidden: { opacity: 0, x: -20 },
                          show: { opacity: 1, x: 0 },
                        }}
                        className={index === 0 ? "font-semibold text-lg" : ""}
                      >
                        {value}
                      </motion.p>
                    ),
                  )}
                </motion.div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div
            className={`
            p-6 rounded-2xl
            ${darkMode ? "bg-gray-800" : "bg-white"}
            shadow-lg
          `}
          >
            <div className="flex items-start gap-4">
              <Phone className="w-6 h-6 text-purple-500 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                  Contact Details
                </h2>
                <div className="space-y-4">
                  {Object.entries(contactInfo.contact).map(([key, value]) => (
                    <motion.div
                      key={key}
                      className="group relative p-3 rounded-lg hover:bg-gray-700/10"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="capitalize text-sm">
                          {key.replace(/([A-Z])/g, " $1").trim()}:
                        </span>
                        <button
                          onClick={() => handleCopy(value, key)}
                          className="flex items-center space-x-2 text-sm hover:text-blue-500"
                        >
                          <span>{value}</span>
                          <AnimatePresence mode="wait">
                            {copied === key ? (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                              >
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              </motion.div>
                            ) : (
                              <Copy className="w-4 h-4 opacity-0 group-hover:opacity-100" />
                            )}
                          </AnimatePresence>
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Professional Links */}
          <div
            className={`
            p-6 rounded-2xl 
            ${darkMode ? "bg-gray-800" : "bg-white"}
            shadow-lg
          `}
          >
            <div className="flex items-start gap-4">
              <Link2 className="w-6 h-6 text-pink-500 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-purple-400">
                  Professional Links
                </h2>
                <div className="space-y-4">
                  {Object.entries(contactInfo.online).map(([platform, url]) => (
                    <motion.a
                      key={platform}
                      href={`https://${url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 rounded-lg group"
                      whileHover={{
                        scale: 1.02,
                        backgroundColor: darkMode
                          ? "rgba(255,255,255,0.05)"
                          : "rgba(0,0,0,0.05)",
                      }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="capitalize flex items-center">
                        <Globe className="w-4 h-4 mr-2 text-blue-500" />
                        {platform.replace(/([A-Z])/g, " $1").trim()}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm opacity-60">{url}</span>
                        <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </motion.a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Achievements */}
          <div
            className={`
            p-6 rounded-2xl
            ${darkMode ? "bg-gray-800" : "bg-white"}
            shadow-lg lg:col-span-2
          `}
          >
            <div className="flex items-start gap-4">
              <PartyPopper className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-2xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-400">
                  Recent Achievements
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {achievements.map((achievement, index) => (
                    <motion.div
                      key={index}
                      className={`
                        p-4 rounded-2xl transition-all duration-300
                        ${
                          darkMode
                            ? "bg-gray-750 hover:bg-gray-700"
                            : "bg-gray-50 hover:bg-gray-100"
                        }
                      `}
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <achievement.icon
                        className={`w-8 h-8 mb-2 ${achievement.colorClass}`}
                      />
                      <h3 className="font-semibold mb-1">
                        {achievement.title}
                      </h3>
                      <p
                        className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}
                      >
                        {achievement.desc}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mt-12"
        >
          <div className="relative inline-block group">
            <motion.div
              className="absolute -inset-1 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-70 blur-sm"
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`
                relative px-8 py-4 rounded-full
                ${
                  darkMode
                    ? "bg-gray-800 hover:bg-gray-700"
                    : "bg-white hover:bg-gray-50"
                } 
                text-lg font-semibold transition-all duration-300
                flex items-center space-x-3
              `}
            >
              <MessageSquare className="w-5 h-5" />
              <span>Let's Connect</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className={`
            mt-16 pt-8 
            ${
              darkMode ? "border-t border-gray-800" : "border-t border-gray-200"
            }
          `}
        >
          <div className="text-center">
            <p
              className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}
            >
              Located at Sejong University • Seoul, South Korea
            </p>
            <p
              className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}
            >
              © {new Date().getFullYear()} Dr. Abolghasem Sadeghi-Niaraki
            </p>
          </div>
        </motion.div>
      </div>

      {/* Cursor for desktop */}
      {!isMobile && <RotatingAtomCursor />}
    </div>
  );
};

export default ContactPage;
