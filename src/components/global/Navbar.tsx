import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Home, User, Book, Award, FileText, Send, Menu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/router";
import textSystem from "@/theme/textSystem";

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

const Navbar: React.FC<NavbarProps> = ({ darkMode }) => {
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

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [router.pathname]);

  return (
    <nav
      className={`
        fixed top-0 left-0 right-0 z-50 transition-all duration-300
        ${darkMode
          ? "bg-gradient-to-b from-black/70 to-transparent"
          : "bg-gradient-to-b from-white/80 to-transparent"}
        backdrop-blur-xl border-b border-blue-500/20
        ${isScrolled ? "shadow-lg" : "shadow-none"}
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
              className={`text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${darkMode ? textSystem.dark.gradient : textSystem.light.gradient} drop-shadow-md`}
            >
              Dr. Sadeghi-Niaraki
            </motion.div>
          </Link>

          {/* Hamburger Button for Mobile */}
          <button
            className={`md:hidden p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-blue-500/30 shadow-lg ${darkMode ? "bg-blue-900/60" : "bg-blue-100/60"}`}
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-label="Open menu"
          >
            <Menu className={`w-7 h-7 ${darkMode ? "text-blue-200" : "text-blue-700"}`} />
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-4">
            {NAV_ROUTES.map((route) => {
              const Icon = route.icon;
              const isActive = router.pathname === route.href;

              return (
                <Link key={route.href} href={route.href}>
                  <motion.div
                    className={`
                      relative flex items-center px-4 py-2 rounded-xl transition-all duration-300 font-medium
                      ${
                        isActive
                          ? `bg-gradient-to-r ${darkMode ? "from-blue-600/80 to-purple-600/80 text-white" : "from-blue-200/80 to-purple-200/80 text-blue-900"} shadow-lg`
                          : `${darkMode ? "hover:bg-blue-900/30 hover:text-blue-200 text-blue-200" : "hover:bg-blue-100/60 hover:text-blue-700 text-blue-700"}`
                      }
                    `}
                    whileHover={{ scale: 1.07 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Icon className="mr-2 w-5 h-5" />
                    {route.label}
                    {/* Animated gradient bar under active link */}
                    {isActive && (
                      <motion.div
                        layoutId="navbar-underline"
                        className={`absolute left-2 right-2 -bottom-1 h-1 rounded-full bg-gradient-to-r ${darkMode ? textSystem.dark.gradient : textSystem.light.gradient} shadow-lg`}
                      />
                    )}
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`md:hidden absolute top-16 left-0 right-0 backdrop-blur-xl border-b border-blue-500/20 shadow-2xl rounded-b-2xl overflow-hidden ${darkMode ? "bg-gradient-to-b from-black/95 via-blue-900/90 to-black/95" : "bg-gradient-to-b from-white/95 via-blue-100/90 to-white/95"}`}
            >
              {NAV_ROUTES.map((route) => {
                const Icon = route.icon;
                const isActive = router.pathname === route.href;

                return (
                  <Link key={route.href} href={route.href}>
                    <div
                      className={`
                        flex items-center p-5 border-b border-blue-500/10 font-semibold text-lg transition-all
                        ${
                          isActive
                            ? `bg-gradient-to-r ${darkMode ? "from-blue-700/60 to-purple-700/60 text-white" : "from-blue-200/60 to-purple-200/60 text-blue-900"}`
                            : `${darkMode ? "hover:bg-blue-900/40 hover:text-blue-200 text-blue-200" : "hover:bg-blue-100/60 hover:text-blue-700 text-blue-700"}`
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
