import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";

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

import { useDeviceType } from "../components/useDeviceType";
import { useLoadingStates } from "../components/useLoadingStates";
import textSystem from "../components/textSystem";
import LoadingScreen from "./LoadingScreen";
import SmoothScrollWrapper from "../components/SmoothScrollWrapper";
import MainContent from "../components/MainContent";
import About from "../components/About";
import Research from "../components/Research";
import Publications from "../components/Publications";
import TeachingExperience from "../components/TeachingExperience";
import EditorialPeerReview from "../components/EditorialPeerReview";
import StatisticsTestimonials from "../components/StatisticsTestimonials";
import Contact from "../components/Contact";

export default function Home() {
  const [darkMode, setDarkMode] = useState(true);
  const [imageHovered, setImageHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const isMobile = useDeviceType();
  const { isContentLoaded } = useLoadingStates(isMobile);

  useEffect(() => {
    const handleMouseEnter = () => {
      document.body.classList.add("hovering");
    };

    const handleMouseLeave = () => {
      document.body.classList.remove("hovering");
    };

    const interactiveElements = document.querySelectorAll(
      'a, button, [role="button"]',
    );
    interactiveElements.forEach((el) => {
      el.addEventListener("mouseenter", handleMouseEnter);
      el.addEventListener("mouseleave", handleMouseLeave);
    });

    return () => {
      interactiveElements.forEach((el) => {
        el.removeEventListener("mouseenter", handleMouseEnter);
        el.removeEventListener("mouseleave", handleMouseLeave);
      });
    };
  }, []);

  return (
    <div 
      className={`relative min-h-screen overflow-x-hidden transition-colors duration-300 ${
        darkMode ? "text-white" : "text-gray-800"
      }`}
    >
      {!isContentLoaded && <LoadingScreen />}

      {isMobile ? (
        <MobileBackground theme={darkMode ? "dark" : "light"} />
      ) : (
        <AdvancedBackground theme={darkMode ? "dark" : "light"} />
      )}

<SmoothScrollWrapper 
  darkMode={darkMode} 
  sectionTitles={[
    "Main Content",
    "About",
    "Research",
    "Publications",
    "Teaching Experience",
    "Editorial & Peer Review",
    "Statistics & Testimonials",
    "Contact"
  ]}
>
  <div><MainContent           
  isLoaded={isContentLoaded}
              darkMode={darkMode}
              textSystem={textSystem}
              setDarkMode={setDarkMode}
              imageHovered={imageHovered}
              setImageHovered={setImageHovered}
              menuOpen={menuOpen}
              setMenuOpen={setMenuOpen}
              activeSection={activeSection}
              setActiveSection={setActiveSection} /></div>
  <About darkMode={darkMode} />
  <Research darkMode={darkMode} />
  <Publications darkMode={darkMode} />
  <TeachingExperience darkMode={darkMode} />
  <EditorialPeerReview darkMode={darkMode} />
  <StatisticsTestimonials darkMode={darkMode} />
  <Contact darkMode={darkMode} />
</SmoothScrollWrapper>

      {!isMobile && <RotatingAtomCursor />}
    </div>
  );
}