import React, {useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from "framer-motion";

const SmoothScrollWrapper: React.FC<{
  children: React.ReactNode[];
  darkMode: boolean;
}> = ({ children, darkMode }) => {
  const [currentSection, setCurrentSection] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  const TRANSITION_DURATION = 800;

  // Transition variants for section changes
  const variants = {
    enter: (direction: number) => ({
      y: direction > 0 ? '100%' : '-100%',
      opacity: 0,
      transition: { duration: 0 }
    }),
    center: {
      y: 0,
      opacity: 1,
      transition: {
        duration: TRANSITION_DURATION / 1000,
        ease: [0.43, 0.13, 0.23, 0.96]
      }
    },
    exit: (direction: number) => ({
      y: direction > 0 ? '-100%' : '100%',
      opacity: 0,
      transition: {
        duration: TRANSITION_DURATION / 1000,
        ease: [0.43, 0.13, 0.23, 0.96]
      }
    })
  };

  const handleScroll = useCallback((e: WheelEvent) => {
    if (isTransitioning) return;

    const currentSectionEl = sectionRefs.current[currentSection];
    if (!currentSectionEl) return;

    const {
      scrollTop,
      scrollHeight,
      clientHeight
    } = currentSectionEl;

    // Calculate if we're at the top or bottom of the current section
    const isAtTop = scrollTop === 0;
    const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 1;

    // Only prevent default if we're about to change sections
    if ((isAtTop && e.deltaY < 0 && currentSection > 0) ||
        (isAtBottom && e.deltaY > 0 && currentSection < children.length - 1)) {
      e.preventDefault();
      
      const newDirection = e.deltaY > 0 ? 1 : -1;
      const newSection = currentSection + newDirection;

      if (newSection >= 0 && newSection < children.length) {
        setIsTransitioning(true);
        setDirection(newDirection);
        setCurrentSection(newSection);
        
        setTimeout(() => {
          setIsTransitioning(false);
          // Scroll to top of new section
          sectionRefs.current[newSection]?.scrollTo(0, 0);
        }, TRANSITION_DURATION);
      }
    }
  }, [currentSection, children.length, isTransitioning]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleScroll, { passive: false });
    }
    return () => {
      if (container) {
        container.removeEventListener('wheel', handleScroll);
      }
    };
  }, [handleScroll]);

  return (
    <div ref={containerRef} className="fixed inset-0">
      {/* Navigation Dots */}
      <div className="fixed right-8 top-1/2 transform -translate-y-1/2 z-50 flex flex-col gap-4">
        {children.map((_, index) => (
          <motion.button
            key={index}
            onClick={() => {
              if (!isTransitioning && index !== currentSection) {
                setIsTransitioning(true);
                setDirection(index > currentSection ? 1 : -1);
                setCurrentSection(index);
                setTimeout(() => {
                  setIsTransitioning(false);
                  sectionRefs.current[index]?.scrollTo(0, 0);
                }, TRANSITION_DURATION);
              }
            }}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              currentSection === index
                ? (darkMode ? 'bg-blue-400 scale-150' : 'bg-blue-600 scale-150')
                : (darkMode ? 'bg-gray-600' : 'bg-gray-400')
            }`}
            whileHover={{ scale: 1.5 }}
            whileTap={{ scale: 0.9 }}
          />
        ))}
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
        ref={el => {
          sectionRefs.current[currentSection] = el;
        }}
        className="h-full overflow-y-auto overflow-x-hidden"
        style={{ 
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {children[currentSection]}
      </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

  export default SmoothScrollWrapper;