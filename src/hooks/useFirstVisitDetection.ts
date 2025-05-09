import { useState, useEffect } from "react";

export function useFirstVisitDetection(key = "has-visited-site") {
  const [isFirstVisit, setIsFirstVisit] = useState(true);

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    try {
      // Check if the user has visited before in this session
      const hasVisited = sessionStorage.getItem(key);

      if (hasVisited) {
        // Not first visit
        setIsFirstVisit(false);
      } else {
        // First visit - set the flag
        sessionStorage.setItem(key, "true");
        setIsFirstVisit(true);
      }
    } catch (e) {
      // Fallback if sessionStorage is unavailable
      console.error("SessionStorage access error:", e);
      setIsFirstVisit(false);
    }
  }, [key]);

  return isFirstVisit;
}
