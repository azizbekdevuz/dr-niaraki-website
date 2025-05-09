import React, { useState, useEffect, lazy, Suspense, useCallback } from "react";
import dynamic from "next/dynamic";
import { useDeviceType } from "../hooks/useDeviceType";
import { useLoadingStates } from "@/hooks/useLoadingStates";
import textSystem from "../theme/textSystem";

// Import loading screen normally since we need it immediately
import LoadingScreen from "@/components/ui/LoadingScreen";

// Component for loading states
const ComponentLoader: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <div className="min-h-[200px] flex items-center justify-center">
    {children}
  </div>
);

// Dynamic imports with fallbacks
const AdvancedBackground = dynamic(
  () => import("../components/global/AdvancedBackground"),
  {
    ssr: false,
    loading: () => <div className="fixed inset-0 bg-black" />,
  },
);

const MobileBackground = dynamic(
  () => import("../components/global/MobileBackground"),
  {
    ssr: false,
    loading: () => <div className="fixed inset-0 bg-black" />,
  },
);

const RotatingAtomCursor = dynamic(
  () => import("../components/global/RotatingAtomCursor"),
  {
    ssr: false,
    loading: () => null,
  },
);

// Regular imports for above-the-fold content
import MainContent from "../components/index/MainContent";

// Lazy load below-the-fold content
const About = lazy(() => import("../components/index/About"));
const Research = lazy(() => import("../components/index/Research"));
const Publications = lazy(() => import("../components/index/Publications"));
const TeachingExperience = lazy(
  () => import("../components/index/TeachingExperience"),
);
const EditorialPeerReview = lazy(
  () => import("../components/index/EditorialPeerReview"),
);
const StatisticsTestimonials = lazy(
  () => import("../components/index/StatisticsTestimonials"),
);
const Contact = lazy(() => import("../components/index/Contact"));

export default function Home() {
  // State management
  const [darkMode, setDarkMode] = useState(true);
  const isMobile = useDeviceType();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { isContentLoaded, loadingProgress, isFirstVisit } =
    useLoadingStates(isMobile);
  const [imageHovered, setImageHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const [visibleSections, setVisibleSections] = useState({
    about: false,
    research: false,
    publications: false,
    teaching: false,
    editorial: false,
    statistics: false,
    contact: false,
  });

  // Setup intersection observer for lazy loading sections
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "100px", // Load when within 100px of viewport
      threshold: 0.1,
    };

    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const id = entry.target.id;
        if (entry.isIntersecting) {
          setVisibleSections((prev) => ({ ...prev, [id]: true }));
        }
      });
    }, observerOptions);

    // Observe all section containers
    const sections = document.querySelectorAll("div[id]");
    sections.forEach((section) => sectionObserver.observe(section));

    return () => {
      sections.forEach((section) => sectionObserver.unobserve(section));
    };
  }, [isContentLoaded]);

  const handleHoverEffects = useCallback((e: MouseEvent) => {
    const target = e.target as Element;
    const isInteractive = target.closest('a, button, [role="button"]');

    if (e.type === "mouseenter" && isInteractive) {
      document.body.classList.add("hovering");
    } else if (e.type === "mouseleave" && isInteractive) {
      document.body.classList.remove("hovering");
    }
  }, []);

  useEffect(() => {
    // Use event delegation instead of attaching to each element
    document.body.addEventListener("mouseenter", handleHoverEffects, true);
    document.body.addEventListener("mouseleave", handleHoverEffects, true);

    return () => {
      document.body.removeEventListener("mouseenter", handleHoverEffects, true);
      document.body.removeEventListener("mouseleave", handleHoverEffects, true);
    };
  }, [handleHoverEffects]);

  return (
    <div
      className={`relative min-h-screen overflow-x-hidden transition-colors duration-300 ${
        darkMode ? "text-white" : "text-gray-800"
      }`}
    >
      {!isContentLoaded && <LoadingScreen progress={loadingProgress} />}

      {isMobile ? (
        <MobileBackground theme={darkMode ? "dark" : "light"} />
      ) : (
        <AdvancedBackground theme={darkMode ? "dark" : "light"} />
      )}

      <div>
        <MainContent
          isLoaded={isContentLoaded}
          darkMode={darkMode}
          textSystem={textSystem}
          setDarkMode={setDarkMode}
          imageHovered={imageHovered}
          setImageHovered={setImageHovered}
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
          activeSection={activeSection}
          setActiveSection={setActiveSection}
        />
      </div>

      <div id="about">
        <Suspense
          fallback={<ComponentLoader>Loading About...</ComponentLoader>}
        >
          {visibleSections.about && <About darkMode={darkMode} />}
        </Suspense>
      </div>

      <div id="research">
        <Suspense
          fallback={<ComponentLoader>Loading Research...</ComponentLoader>}
        >
          {visibleSections.research && <Research darkMode={darkMode} />}
        </Suspense>
      </div>

      <div id="publications">
        <Suspense
          fallback={<ComponentLoader>Loading Publications...</ComponentLoader>}
        >
          {visibleSections.publications && <Publications darkMode={darkMode} />}
        </Suspense>
      </div>

      <div id="teaching-experience">
        <Suspense
          fallback={
            <ComponentLoader>Loading Teaching Experience...</ComponentLoader>
          }
        >
          {visibleSections.teaching && (
            <TeachingExperience darkMode={darkMode} />
          )}
        </Suspense>
      </div>

      <div id="editorial-peer-review">
        <Suspense
          fallback={
            <ComponentLoader>
              Loading Editorial & Peer Review...
            </ComponentLoader>
          }
        >
          {visibleSections.editorial && (
            <EditorialPeerReview darkMode={darkMode} />
          )}
        </Suspense>
      </div>

      <div id="statistics-testimonials">
        <Suspense
          fallback={
            <ComponentLoader>
              Loading Statistics & Testimonials...
            </ComponentLoader>
          }
        >
          {visibleSections.statistics && (
            <StatisticsTestimonials darkMode={darkMode} />
          )}
        </Suspense>
      </div>

      <div id="contact">
        <Suspense
          fallback={<ComponentLoader>Loading Contact...</ComponentLoader>}
        >
          {visibleSections.contact && <Contact darkMode={darkMode} />}
        </Suspense>
      </div>

      {!isMobile && <RotatingAtomCursor />}
    </div>
  );
}
