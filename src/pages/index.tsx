import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowDown, Github, Linkedin, Twitter, Moon, Sun, ArrowRight, Search, Menu, X } from 'lucide-react';

const AdvancedBackground = dynamic(() => import('../components/AdvancedBackground'), { ssr: false });
const MobileBackground = dynamic(() => import('../components/MobileBackground'), { ssr: false });
const RotatingAtomCursor = dynamic(() => import('../components/RotatingAtomCursor'), { ssr: false });
import LoadingScreen from './LoadingScreen';

// Custom hook to detect device type
function useDeviceType() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', checkDevice);
    checkDevice();

    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return isMobile;
}

// Custom hook for managing loading states
function useLoadingStates(isMobile: boolean) {
  const [isCPULoaded, setIsCPULoaded] = useState(false);
  const [isContentLoaded, setIsContentLoaded] = useState(false);

  useEffect(() => {
    const cpuTimer = setTimeout(() => setIsCPULoaded(true), isMobile ? 500 : 1000);
    return () => clearTimeout(cpuTimer);
  }, [isMobile]);

  useEffect(() => {
    if (isCPULoaded) {
      const contentTimer = setTimeout(() => setIsContentLoaded(true), isMobile ? 1000 : 2000);
      return () => clearTimeout(contentTimer);
    }
  }, [isCPULoaded, isMobile]);

  return { isCPULoaded, isContentLoaded };
}

const MenuOverlay: React.FC<{ isOpen: boolean; onClose: () => void; darkMode: boolean }> = ({ isOpen, onClose, darkMode }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0, x: '100%' }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: '100%' }}
        transition={{ type: 'spring', damping: 20 }}
        className={`fixed inset-0 z-50 ${darkMode ? 'bg-gray-900' : 'bg-white'}`}
      >
        <div className="flex justify-end p-4 md:p-6">
          <button onClick={onClose} className="text-xl md:text-2xl">
            <X />
          </button>
        </div>
        <nav className="flex flex-col items-center justify-center h-full space-y-6 md:space-y-8">
          {['Research', 'Publications', 'Contact'].map((item) => (
            <motion.div
              key={item}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link href={`/${item.toLowerCase()}`}>
                <span className="text-2xl md:text-3xl font-bold hover:text-blue-400 transition-colors">
                  {item}
                </span>
              </Link>
            </motion.div>
          ))}
        </nav>
      </motion.div>
    )}
  </AnimatePresence>
);

const InteractiveCard: React.FC<{ icon: React.ElementType; title: string; description: string; delay: number; darkMode: boolean }> = ({ icon: Icon, title, description, delay, darkMode }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    whileHover={{ scale: 1.05 }}
    className={`p-4 md:p-6 rounded-xl ${
      darkMode 
        ? 'bg-gray-800/30 hover:bg-gray-800/50' 
        : 'bg-white/30 hover:bg-white/50'
    } backdrop-blur-sm border ${
      darkMode ? 'border-gray-700/50' : 'border-gray-200/50'
    } cursor-none interactive-card group transition-all duration-300`}
  >
    <Icon className={`w-6 h-6 md:w-8 md:h-8 mb-3 md:mb-4 ${
      darkMode ? 'text-blue-400 group-hover:text-blue-300' : 'text-blue-600 group-hover:text-blue-500'
    } transition-colors`} />
    <h3 className={`text-lg md:text-xl font-semibold mb-2 ${
      darkMode ? 'text-white' : 'text-gray-800'
    }`}>{title}</h3>
    <p className={`text-sm md:text-base ${
      darkMode ? 'text-gray-300' : 'text-gray-600'
    } opacity-70 group-hover:opacity-100 transition-opacity`}>{description}</p>
    <motion.div
      className={`mt-3 md:mt-4 flex items-center ${
        darkMode ? 'text-blue-400 group-hover:text-blue-300' : 'text-blue-600 group-hover:text-blue-500'
      }`}
      whileHover={{ x: 10 }}
    >
      <span className="text-sm md:text-base">Learn more</span> 
      <ArrowRight className="ml-2 w-4 h-4" />
    </motion.div>
  </motion.div>
);

const SearchBar: React.FC<{ darkMode: boolean }> = ({ darkMode }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      className="relative"
      animate={{ width: isExpanded ? '100%' : 40 }}
    >
      <motion.input
        type="text"
        placeholder="Search research..."
        className={`w-full h-8 md:h-10 px-8 md:px-10 text-sm md:text-base rounded-full ${darkMode ? 'bg-gray-800/10' : 'bg-white/10'} backdrop-blur-sm border border-white/20 focus:outline-none focus:border-blue-400 ${isExpanded ? 'opacity-100' : 'opacity-1'}`}
        animate={{ opacity: isExpanded ? 1 : 0 }}
      />
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute left-0 top-0 h-8 md:h-10 w-8 md:w-10 flex items-center justify-center"
      >
        <Search className="w-4 h-4 md:w-5 md:h-5" />
      </button>
    </motion.div>
  );
};

const MobileMenu: React.FC<{ isOpen: boolean; onClose: () => void; darkMode: boolean }> = ({ isOpen, onClose, darkMode }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`fixed inset-x-0 top-16 z-50 ${darkMode ? 'bg-gray-900' : 'bg-white'} shadow-lg`}
      >
        <nav className="flex flex-col p-4">
          {['Research', 'Publications', 'Contact'].map((item) => (
            <Link key={item} href={`/${item.toLowerCase()}`}>
              <span className={`block py-2 text-lg font-semibold ${darkMode ? 'text-white hover:text-blue-400' : 'text-gray-800 hover:text-blue-600'}`}>
                {item}
              </span>
            </Link>
          ))}
        </nav>
        <button
          onClick={onClose}
          className={`absolute top-2 right-2 p-2 rounded-full ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}
        >
          <X className="w-6 h-6" />
        </button>
      </motion.div>
    )}
  </AnimatePresence>
);

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

const MainContent: React.FC<MainContentProps> = ({ isLoaded, darkMode, setDarkMode, imageHovered, setImageHovered, menuOpen, setMenuOpen, activeSection, setActiveSection }) => {
  const isMobile = useDeviceType();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const sections = [
    { id: 'hero', content: 'Welcome' },
    { id: 'research', content: 'Research Areas' },
    { id: 'timeline', content: 'Timeline' }
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
      {isMobile ? <MobileBackground theme={darkMode ? 'dark' : 'light'} /> : <AdvancedBackground theme={darkMode ? 'dark' : 'light'} />}
      
      {/* Header */}
      <motion.header
        className="fixed top-0 left-0 right-0 z-40 flex justify-between items-center p-4 md:p-6 bg-gradient-to-b from-black/50 to-transparent"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
      >
        <Link href="/">
          <span className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">Dr. Niaraki-Sadeghi</span>
        </Link>

        <div className="flex items-center space-x-4 md:space-x-6">
          <SearchBar darkMode={darkMode} />

          <motion.button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {darkMode ? <Sun className="w-5 h-5 md:w-6 md:h-6" /> : <Moon className="w-5 h-5 md:w-6 md:h-6" />}
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
      {isMobile && <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} darkMode={darkMode} />}

      {/* Desktop Menu */}
      {!isMobile && <MenuOverlay isOpen={menuOpen} onClose={() => setMenuOpen(false)} darkMode={darkMode} />}

      <main className="relative pt-20 px-4 md:px-8 max-w-7xl mx-auto bg-transparent">
        {/* Section navigation dots */}
        <div className="fixed left-4 md:left-8 top-1/2 transform -translate-y-1/2 z-30 flex flex-col space-y-4">
          {sections.map((section, index) => (
            <motion.button
              key={section.id}
              className={`w-3 h-3 rounded-full ${activeSection === index ? 'bg-blue-400' : 'bg-white/50'}`}
              whileHover={{ scale: 1.5 }}
              onClick={() => setActiveSection(index)}
            >
              <span className="sr-only">{section.content}</span>
            </motion.button>
          ))}
        </div>

        {/* Hero Section */}
        <section className={`min-h-screen flex flex-col md:flex-row items-center justify-between py-12 md:py-20 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          {/* Profile Image */}
          <motion.div
            className="md:w-1/3 z-10 mb-8 md:mb-0"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 }}
          >
            <div 
              className="relative w-48 h-48 md:w-64 md:h-64 lg:w-80 lg:h-80 mx-auto"
              onMouseEnter={() => setImageHovered(true)}
              onMouseLeave={() => setImageHovered(false)}
            >
              <Image
                src="/assets/images/profpic.jpg"
                alt="Dr. Niaraki-Sadeghi"
                fill
                sizes="(max-width: 768px) 192px, (max-width: 1200px) 256px, 320px"
                className={`rounded-full transition-all duration-300 object-cover ${
                  darkMode ? 'grayscale' : 'grayscale-0'
                } ${imageHovered ? 'scale-105' : 'scale-100'}`}
              />
              <motion.div
                className={`absolute inset-0 bg-gradient-to-br ${
                  darkMode 
                    ? 'from-blue-500/40 to-purple-500/40' 
                    : 'from-blue-300/40 to-purple-300/40'
                } rounded-full opacity-0 transition-opacity duration-300`}
                animate={{ opacity: imageHovered ? 1 : 0 }}
              />
            </div>
          </motion.div>
          
          {/* Main Content */}
          <div className="md:w-2/3 space-y-8 text-center md:text-left">
            <motion.h1
              className={`text-4xl md:text-6xl lg:text-7xl font-bold mb-4 md:mb-6 bg-clip-text text-transparent bg-gradient-to-r ${
                darkMode ? 'from-blue-400 to-purple-500' : 'from-blue-600 to-purple-700'
              }`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Pioneering the Future of XR & AI
            </motion.h1>
            
            <motion.p
              className={`text-xl md:text-2xl lg:text-3xl ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
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
              <p className={`text-lg md:text-xl ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Dr. Niaraki-Sadeghi is a leading researcher in Extended Reality and Artificial Intelligence, 
                dedicated to transforming education and human-computer interaction through innovative technologies.
              </p>
              <motion.button
                className={`bg-gradient-to-r ${
                  darkMode 
                    ? 'from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600' 
                    : 'from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                } text-white font-bold py-3 px-6 rounded-full text-lg transition-all duration-300`}
                whileHover={{ scale: 1.05, boxShadow: darkMode ? "0px 0px 8px rgb(59, 130, 246)" : "0px 0px 8px rgb(29, 78, 216)" }}
                whileTap={{ scale: 0.95 }}
              >
                Explore Research
              </motion.button>
            </motion.div>

            <motion.div
              className="flex justify-center md:justify-start space-x-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              {[Twitter, Linkedin, Github].map((Icon, index) => (
                <motion.a
                  key={index}
                  href="#"
                  className={`${darkMode ? 'text-gray-400 hover:text-blue-400' : 'text-gray-600 hover:text-blue-600'} transition-colors`}
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
          <h2 className={`text-3xl md:text-4xl font-bold mb-8 text-center ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            Research Highlights
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Github, title: "Research Projects", description: "Explore ongoing and completed research initiatives." },
              { icon: Linkedin, title: "Publications", description: "Access scholarly articles and academic publications." },
              { icon: Twitter, title: "Collaborations", description: "Discover opportunities for academic partnerships." }
            ].map((card, index) => (
              <InteractiveCard
                key={index}
                icon={card.icon}
                title={card.title}
                description={card.description}
                delay={0.2 * (index + 1)}
                darkMode={darkMode}
              />
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

export default function Home() {
  const [darkMode, setDarkMode] = useState(true);
  const [imageHovered, setImageHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const isMobile = useDeviceType();
  const { isCPULoaded, isContentLoaded } = useLoadingStates(isMobile);

  useEffect(() => {
    const handleMouseEnter = () => {
      document.body.classList.add('hovering');
    };

    const handleMouseLeave = () => {
      document.body.classList.remove('hovering');
    };

    const interactiveElements = document.querySelectorAll('a, button, [role="button"]');
    interactiveElements.forEach(el => {
      el.addEventListener('mouseenter', handleMouseEnter);
      el.addEventListener('mouseleave', handleMouseLeave);
    });

    return () => {
      interactiveElements.forEach(el => {
        el.removeEventListener('mouseenter', handleMouseEnter);
        el.removeEventListener('mouseleave', handleMouseLeave);
      });
    };
  }, []);

  return (
    <div className={`relative min-h-screen overflow-x-hidden transition-colors duration-300 ${darkMode ? 'text-white bg-black' : 'text-gray-800 bg-gray-100'}`}>
      {!isContentLoaded && <LoadingScreen />}

      {isCPULoaded && (
        <MainContent
          isLoaded={isContentLoaded}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          imageHovered={imageHovered}
          setImageHovered={setImageHovered}
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
          activeSection={activeSection}
          setActiveSection={setActiveSection}
        />
      )}

      {!isMobile && <RotatingAtomCursor />}
    </div>
  );
}