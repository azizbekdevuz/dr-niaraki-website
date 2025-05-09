import { createContext, useContext } from "react";

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

export const useScroll = () => useContext(ScrollContext);
