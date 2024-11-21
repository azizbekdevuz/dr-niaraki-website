import React, { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import MenuOverlay from "./MenuOverlay";
import MobileMenu from "./MobileMenu";
import textSystem from "./textSystem";
import { useDeviceType } from "./useDeviceType";
import { useScroll } from "../components/ScrollContext";
import InteractiveCard from "./InteractiveCard";
import {
  Menu,
  Search,
  Sun,
  Moon,
  Handshake,
  GraduationCap,
  Linkedin,
  BriefcaseBusiness,
  Github,
  ArrowDown,
} from "lucide-react";

interface MainContentProps {
  isLoaded: boolean;
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
  imageHovered: boolean;
  setImageHovered: (value: boolean) => void;
  menuOpen: boolean;
  setMenuOpen: (value: boolean) => void;
  activeSection: number;
  setActiveSection: (value: number) => void;
}

const MainContent: React.FC<
  MainContentProps & { textSystem: typeof textSystem }
> = ({
  isLoaded,
  darkMode,
  setDarkMode,
  imageHovered,
  setImageHovered,
  menuOpen,
  setMenuOpen,
}) => {
  const { setCurrentSection } = useScroll();
  const isMobile = useDeviceType();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const Cards = [
    {
      icon: Github,
      title: "Research Projects",
      description: "Explore ongoing and completed research initiatives.",
      sectionIndex: 2,
    },
    {
      icon: Linkedin,
      title: "Publications",
      description: "Access scholarly articles and academic publications.",
      sectionIndex: 3,
    },
    {
      icon: Handshake,
      title: "Collaborations",
      description: "Discover opportunities for academic partnerships.",
      sectionIndex: 7,
    },
  ];

  const socialLinks = [
    {
      Icon: GraduationCap,
      url: "https://scholar.google.com/citations?user=-V8_A5YAAAAJ&hl=en",
      ariaLabel: "Google Scholar >"
    },
    {
      Icon: Linkedin,
      url: "https://kr.linkedin.com/in/abolghasem-sadeghi-niaraki-62669b14",
      ariaLabel: "LinkedIn >"
    },
    {
      Icon: BriefcaseBusiness,
      url: "https://sejong.elsevierpure.com/en/persons/sadeghi-niaraki-abolghasem",
      ariaLabel: "Current School >"
    }
  ];

  const toggleMenu = () => {
    if (isMobile) {
      setMobileMenuOpen(!mobileMenuOpen);
    } else {
      setMenuOpen(!menuOpen);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isLoaded ? 1 : 0 }}
      transition={{ duration: 0.5 }}
      className="relative min-h-screen"
    >
      {/* Header */}
      <motion.header
        className="fixed top-0 left-0 right-0 z-40 flex justify-between items-center p-4 md:p-6 bg-gradient-to-b from-black/50 to-transparent"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
      >
        <Link href="/">
          <span
            className={`text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${
              darkMode ? textSystem.dark.gradient : textSystem.light.gradient
            }`}
          />
        </Link>

        <div className="flex items-center space-x-4 md:space-x-6">
          <Search />

          <motion.button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {darkMode ? (
              <Sun className="w-5 h-5 md:w-6 md:h-6" />
            ) : (
              <Moon className="w-5 h-5 md:w-6 md:h-6" />
            )}
          </motion.button>

          <motion.button
            onClick={toggleMenu}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Menu className="w-5 h-5 md:w-6 md:h-6" />
          </motion.button>
        </div>
      </motion.header>

      {/* Add the main content below the header */}

      {/* Mobile Menu */}
      {isMobile && (
        <MobileMenu
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          darkMode={darkMode}
        />
      )}

      {/* Desktop Menu */}
      {!isMobile && (
        <MenuOverlay
          isOpen={menuOpen}
          onClose={() => setMenuOpen(false)}
          darkMode={darkMode}
        />
      )}

      <main className="relative pt-20 px-4 md:px-8 max-w-7xl mx-auto bg-transparent">
        {/* Hero Section */}
        <section
          className={`min-h-screen flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-16 py-16 lg:py-24 ${
            darkMode ? "text-white" : "text-gray-800"
          }`}
        >
          {/* Profile Image */}
          <motion.div
            className="w-full lg:w-5/12 z-10"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 }}
          >
            <div
              className="relative w-60 h-60 md:w-80 md:h-80 lg:w-[420px] lg:h-[420px] mx-auto"
              onMouseEnter={() => setImageHovered(true)}
              onMouseLeave={() => setImageHovered(false)}
            >
              <Image
                src="/assets/images/profpic.jpg"
                alt="Dr. Niaraki-Sadeghi"
                fill
                sizes="(max-width: 768px) 240px, (max-width: 1024px) 320px, 420px"
                className={`rounded-full transition-all duration-300 object-cover ${
                  darkMode ? "grayscale" : "grayscale-0"
                } ${imageHovered ? "scale-105" : "scale-100"}`}
              />
              <motion.div
                className={`absolute inset-0 bg-gradient-to-br ${
                  darkMode
                    ? "from-blue-500/40 to-purple-500/40"
                    : "from-blue-300/40 to-purple-300/40"
                } rounded-full opacity-0 transition-opacity duration-300`}
                animate={{ opacity: imageHovered ? 1 : 0 }}
              />
            </div>
          </motion.div>

          {/* Main Content */}
          <div className="w-full lg:w-7/12 space-y-6 lg:space-y-8 text-center lg:text-left px-4 lg:px-0">
            <motion.h1
              className={`text-4xl md:text-5xl lg:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r ${
                darkMode ? textSystem.dark.gradient : textSystem.light.gradient
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Pioneering the Future of XR & AI
            </motion.h1>

            <motion.p
              className={`text-xl md:text-2xl lg:text-3xl ${
                darkMode
                  ? textSystem.dark.secondary
                  : textSystem.light.secondary
              }`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Shaping the Next Frontier in Human-Computer Interaction
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="space-y-6"
            >
              <p
                className={`text-base md:text-lg lg:text-xl ${
                  darkMode
                    ? textSystem.dark.tertiary
                    : textSystem.light.tertiary
                }`}
              >
                Dr. Niaraki-Sadeghi is a leading researcher in Extended Reality
                and Artificial Intelligence, dedicated to transforming education
                and human-computer interaction through innovative technologies.
              </p>
              <motion.button
                onClick={() => {
                  setCurrentSection(2);
                }}
                className={`animate-bounce bg-gradient-to-r ${
                  darkMode
                    ? "from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400"
                    : "from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                } text-white font-bold py-3 px-6 rounded-full text-lg transition-all duration-300`} 
                whileHover={{
                  scale: 1.05,
                  boxShadow: darkMode
                    ? "0px 0px 8px rgb(147, 197, 253)"
                    : "0px 0px 8px rgb(37, 99, 235)",
                }}
                whileTap={{ scale: 0.95 }}
              >
                <span>Explore Research </span>
              </motion.button>
            </motion.div>

            <motion.div
              className="flex justify-center md:justify-start space-x-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              {socialLinks.map(({ Icon, url, ariaLabel }, index) => (
                <motion.a
                  key={index}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={ariaLabel}
                  className={`${
                    darkMode
                      ? "text-gray-400 hover:text-blue-300"
                      : "text-gray-600 hover:text-blue-600"
                  } transition-colors`}
                  whileHover={{ scale: 1.2, rotate: 5 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Icon className="w-8 h-8" />
                </motion.a>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Research Highlights Section */}
        <section className="py-12 md:py-20">
          <h2 className={`text-3xl md:text-4xl font-bold mb-8 text-center ${
            darkMode ? textSystem.dark.primary : textSystem.light.primary
          }`}>
            Research Highlights
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {Cards.map((card, index) => (
              <div
                key={index}
                onClick={() => {
                  console.log('Clicking section:', card.sectionIndex);
                  setCurrentSection(card.sectionIndex);
                }}
                className="cursor-pointer"
              >
                <InteractiveCard
                  icon={card.icon}
                  title={card.title}
                  description={card.description}
                  delay={0.2 * (index + 1)}
                  darkMode={darkMode}
                />
              </div>
            ))}
          </div>
        </section>
      </main>

      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white text-sm"
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
      >
        <ArrowDown className="w-6 h-6 animate-bounce" />
        <span className="sr-only">Scroll down</span>
      </motion.div>
    </motion.div>
  );
};

export default MainContent;
