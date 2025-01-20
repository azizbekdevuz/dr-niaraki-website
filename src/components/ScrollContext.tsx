// ScrollContext.tsx
import { createContext, useContext, useState, useEffect } from 'react';

interface ScrollContextType {
  currentSection: number;
  setCurrentSection: (section: number) => void;
  isTransitioning: boolean;
  direction: number;
}

export const ScrollContext = createContext<ScrollContextType>({
  currentSection: 0,
  setCurrentSection: () => {},
  isTransitioning: false,
  direction: 0,
});

export const ScrollProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentSection, setCurrentSection] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!isTransitioning) {
        // Determine the section based on scroll position
        const sections = document.querySelectorAll("[data-section]");
        const scrollY = window.scrollY;
        sections.forEach((section, index) => {
          const offsetTop = section.getBoundingClientRect().top + window.scrollY;
          if (scrollY >= offsetTop - window.innerHeight / 2) {
            setCurrentSection(index);
          }
        });
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isTransitioning]);

  return (
    <ScrollContext.Provider
      value={{ currentSection, setCurrentSection, isTransitioning, direction }}
    >
      {children}
    </ScrollContext.Provider>
  );
};

export const useScroll = () => useContext(ScrollContext);

// Button Navigation and Scroll Logic
export const scrollToSection = (sectionIndex: number, smooth: boolean = true) => {
  const sectionElement = document.querySelector(`[data-section="section-${sectionIndex}"]`);

  if (sectionElement) {
    sectionElement.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
    // Optionally update ScrollContext state here
    const { setCurrentSection } = useScroll();
    setCurrentSection(sectionIndex);
  }
};