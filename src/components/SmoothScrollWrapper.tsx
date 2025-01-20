import React, { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, ChevronDown } from "lucide-react";
import { ScrollContext } from "../components/ScrollContext";

// Custom hook for handling scroll logic
const useScrollHandler = (
  currentSection: number,
  totalSections: number,
  isTransitioning: boolean,
  setCurrentSection: (section: number) => void,
  setDirection: (direction: number) => void,
  setIsTransitioning: (transitioning: boolean) => void,
  sectionRefs: React.MutableRefObject<(HTMLDivElement | null)[]>,
  transitionDuration: number,
) => {
  return useCallback(
    (e: WheelEvent | TouchEvent) => {
      if (isTransitioning) return;

      const currentSectionEl = sectionRefs.current[currentSection];
      if (!currentSectionEl) return;

      const { scrollTop, scrollHeight, clientHeight } = currentSectionEl;
      const isAtTop = scrollTop === 0;
      const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 1;

      // Handle both wheel and touch events
      let delta = 0;
      if (e instanceof WheelEvent) {
        delta = e.deltaY;
      } else if (e instanceof TouchEvent) {
        // Implementation for touch events
        const touch = e.touches[0] || e.changedTouches[0];
        delta = touch.clientY;
      }

      if (
        (isAtTop && delta < 0 && currentSection > 0) ||
        (isAtBottom && delta > 0 && currentSection < totalSections - 1)
      ) {
        e.preventDefault();

        const newDirection = delta > 0 ? 1 : -1;
        const newSection = currentSection + newDirection;

        if (newSection >= 0 && newSection < totalSections) {
          setIsTransitioning(true);
          setDirection(newDirection);
          setCurrentSection(newSection);

          setTimeout(() => {
            setIsTransitioning(false);
            sectionRefs.current[newSection]?.scrollTo({
              top: 0,
              behavior: "smooth",
            });
          }, transitionDuration);
        }
      }
    },
    [
      currentSection,
      isTransitioning,
      setCurrentSection,
      setDirection,
      setIsTransitioning,
      sectionRefs,
      transitionDuration,
      totalSections,
    ],
  );
};

interface SmoothScrollWrapperProps {
  children: React.ReactNode[];
  darkMode: boolean;
  sectionTitles?: string[];
}

const SmoothScrollWrapper: React.FC<SmoothScrollWrapperProps> = ({
  children,
  darkMode,
  sectionTitles = [],
}) => {
  const [currentSection, setCurrentSection] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  const TRANSITION_DURATION = 800;

  const handleSectionChange = (newSection: number) => {
    if (isTransitioning) return;

    setIsTransitioning(true);
    setDirection(newSection > currentSection ? 1 : -1);
    setCurrentSection(newSection);

    setTimeout(() => {
      setIsTransitioning(false);
      if (sectionRefs.current[newSection]) {
        sectionRefs.current[newSection]?.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      }
    }, TRANSITION_DURATION);
  };

  const contextValue = {
    currentSection,
    setCurrentSection: handleSectionChange,
    isTransitioning,
    direction,
  };

  const variants = {
    enter: (direction: number) => ({
      y: direction > 0 ? "100%" : "-100%",
      opacity: 0,
      transition: { duration: 0 },
    }),
    center: {
      y: 0,
      opacity: 1,
      transition: {
        duration: TRANSITION_DURATION / 1000,
        ease: [0.43, 0.13, 0.23, 0.96],
      },
    },
    exit: (direction: number) => ({
      y: direction > 0 ? "-100%" : "100%",
      opacity: 0,
      transition: {
        duration: TRANSITION_DURATION / 1000,
        ease: [0.43, 0.13, 0.23, 0.96],
      },
    }),
  };

  const handleScroll = useScrollHandler(
    currentSection,
    children.length,
    isTransitioning,
    setCurrentSection,
    setDirection,
    setIsTransitioning,
    sectionRefs,
    TRANSITION_DURATION,
  );

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (isTransitioning) return;

      if (e.key === "ArrowUp" && currentSection > 0) {
        setIsTransitioning(true);
        setDirection(-1);
        setCurrentSection((prev) => prev - 1);
      } else if (
        e.key === "ArrowDown" &&
        currentSection < children.length - 1
      ) {
        setIsTransitioning(true);
        setDirection(1);
        setCurrentSection((prev) => prev + 1);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [currentSection, children.length, isTransitioning]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener("wheel", handleScroll, { passive: false });
      container.addEventListener("touchstart", handleScroll, {
        passive: false,
      });
      container.addEventListener("touchmove", handleScroll, { passive: false });
    }
    return () => {
      if (container) {
        container.removeEventListener("wheel", handleScroll);
        container.removeEventListener("touchstart", handleScroll);
        container.removeEventListener("touchmove", handleScroll);
      }
    };
  }, [handleScroll]);

  return (
    <ScrollContext.Provider value={contextValue}>
      <div
        ref={containerRef}
        className="fixed inset-0"
        role="region"
        aria-label="Scrollable content sections"
      >
        {/* Navigation Controls */}
        <div className="fixed right-8 top-1/2 transform -translate-y-1/2 z-50 flex flex-col items-center gap-4">
          <button
            onClick={() =>
              currentSection > 0 && setCurrentSection(currentSection - 1)
            }
            className={`p-2 rounded-full transition-all duration-300 ${
              currentSection === 0
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-gray-200/20"
            }`}
            disabled={currentSection === 0}
            aria-label="Previous section"
          >
            <ChevronUp className="w-6 h-6" />
          </button>

          {/* Navigation Dots */}
          <div
            className="flex flex-col gap-4"
            role="navigation"
            aria-label="Section navigation"
          >
            {children.map((_, index) => (
              <motion.button
                key={index}
                onClick={() => {
                  if (!isTransitioning && index !== currentSection) {
                    setIsTransitioning(true);
                    setDirection(index > currentSection ? 1 : -1);
                    setCurrentSection(index);
                  }
                }}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  currentSection === index
                    ? darkMode
                      ? "bg-blue-400 scale-150"
                      : "bg-blue-600 scale-150"
                    : darkMode
                      ? "bg-gray-600"
                      : "bg-gray-400"
                }`}
                whileHover={{ scale: 1.5 }}
                whileTap={{ scale: 0.9 }}
                aria-label={sectionTitles[index] || `Section ${index + 1}`}
                aria-current={currentSection === index ? "true" : "false"}
              />
            ))}
          </div>

          <button
            onClick={() =>
              currentSection < children.length - 1 &&
              setCurrentSection(currentSection + 1)
            }
            className={`p-2 rounded-full transition-all duration-300 ${
              currentSection === children.length - 1
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-gray-200/20"
            }`}
            disabled={currentSection === children.length - 1}
            aria-label="Next section"
          >
            <ChevronDown className="w-6 h-6" />
          </button>
        </div>

        {/* Sections */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentSection}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            className="absolute inset-0 w-full"
          >
            <div
              ref={(el) => {
                sectionRefs.current[currentSection] = el;
              }}
              className="h-full overflow-y-auto overflow-x-hidden scroll-smooth"
              role="region"
              aria-label={
                sectionTitles[currentSection] || `Section ${currentSection + 1}`
              }
            >
              {children[currentSection]}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Progress Indicator */}
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
          <p className="text-sm opacity-60">
            {currentSection + 1} / {children.length}
          </p>
        </div>
      </div>
    </ScrollContext.Provider>
  );
};

export default SmoothScrollWrapper;
