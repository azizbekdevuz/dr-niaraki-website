import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Home,
  User,
  Book,
  Award,
  FileText,
  Send,
  Moon,
  Sun,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/router";

// Define navigation routes with icons and labels
const NAV_ROUTES = [
  { href: "/", label: "Home", icon: Home },
  { href: "/about", label: "About", icon: User },
  { href: "/research", label: "Research", icon: Book },
  { href: "/publications", label: "Publications", icon: FileText },
  { href: "/patents", label: "Patents", icon: Award },
  { href: "/contact", label: "Contact", icon: Send },
];

interface NavbarProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ darkMode, toggleDarkMode }) => {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Mobile menu toggle
  const toggleMobileMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [router.pathname]);

  return (
    <nav
      className={`
        fixed top-0 left-0 right-0 z-50 transition-all duration-300
        ${
          isScrolled
            ? "bg-white/70 dark:bg-gray-900/70 backdrop-blur-lg shadow-md"
            : "bg-transparent"
        }
      `}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className={`
                text-xl font-bold 
                bg-clip-text text-transparent 
                bg-gradient-to-r from-blue-500 to-purple-500
              `}
            >
              Dr. Sadeghi-Niaraki
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-4">
            {NAV_ROUTES.map((route) => {
              const Icon = route.icon;
              const isActive = router.pathname === route.href;

              return (
                <Link key={route.href} href={route.href}>
                  <motion.div
                    className={`
                      flex items-center px-3 py-2 rounded-lg transition-all duration-300
                      ${
                        isActive
                          ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                          : "hover:bg-gray-100 dark:hover:bg-gray-800"
                      }
                    `}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Icon className="mr-2 w-5 h-5" />
                    {route.label}
                  </motion.div>
                </Link>
              );
            })}
          </div>

          {/* Dark Mode Toggle & Mobile Menu Button */}
          <div className="flex items-center space-x-4">
            <motion.button
              onClick={toggleDarkMode}
              whileHover={{ rotate: 180 }}
              className={`
                p-2 rounded-full transition-colors duration-300
                ${
                  darkMode
                    ? "bg-gray-800 text-white hover:bg-gray-700"
                    : "bg-gray-100 text-black hover:bg-gray-200"
                }
              `}
            >
              {darkMode ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </motion.button>

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden focus:outline-none"
              onClick={toggleMobileMenu}
            >
              <div
                className={`
                  w-6 h-1 bg-gray-800 dark:bg-white 
                  transition-all duration-300 
                  ${isMenuOpen ? "transform rotate-45 translate-y-1" : ""}
                `}
              />
              <div
                className={`
                  w-6 h-1 bg-gray-800 dark:bg-white 
                  my-1 transition-all duration-300
                  ${isMenuOpen ? "opacity-0" : ""}
                `}
              />
              <div
                className={`
                  w-6 h-1 bg-gray-800 dark:bg-white 
                  transition-all duration-300
                  ${isMenuOpen ? "transform -rotate-45 -translate-y-1" : ""}
                `}
              />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="md:hidden absolute top-16 left-0 right-0 bg-white dark:bg-gray-900 shadow-lg"
            >
              {NAV_ROUTES.map((route) => {
                const Icon = route.icon;
                const isActive = router.pathname === route.href;

                return (
                  <Link key={route.href} href={route.href}>
                    <div
                      className={`
                        flex items-center p-4 border-b 
                        border-gray-100 dark:border-gray-800
                        ${
                          isActive
                            ? "bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                            : "hover:bg-gray-50 dark:hover:bg-gray-800"
                        }
                      `}
                    >
                      <Icon className="mr-4 w-6 h-6" />
                      {route.label}
                    </div>
                  </Link>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};

export default Navbar;
