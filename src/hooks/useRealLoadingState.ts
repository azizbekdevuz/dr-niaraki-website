import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";

export function useRealLoadingState(minimumDisplayTime = 2500) {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const minimumTimeElapsedRef = useRef(false);
  const resourcesLoadedRef = useRef(false);
  const router = useRouter();

  // Track minimum display time
  useEffect(() => {
    const minTimer = setTimeout(() => {
      minimumTimeElapsedRef.current = true;
      if (resourcesLoadedRef.current) {
        setIsLoading(false);
      }
    }, minimumDisplayTime);

    const windowLoaded = () => {
      resourcesLoadedRef.current = true;
      if (minimumTimeElapsedRef.current) {
        setIsLoading(false);
      }
    };

    window.addEventListener("load", windowLoaded);

    return () => {
      clearTimeout(minTimer);
      window.removeEventListener("load", windowLoaded);
    };
  }, [minimumDisplayTime]);

  // Track actual resource loading
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Initial progress from document readiness
    if (document.readyState === "loading") {
      setProgress(0.1);
    } else {
      setProgress(0.5);
    }

    // Listen for DOM content loaded
    const domContentLoaded = () => {
      setProgress(0.6);
    };

    // Listen for window load
    const windowLoaded = () => {
      setProgress(0.8);

      // Use a small delay to allow React to render
      setTimeout(() => {
        setProgress(1);
        resourcesLoadedRef.current = true;

        if (minimumTimeElapsedRef.current) {
          setIsLoading(false);
        }
      }, 500);
    };

    // Monitor Next.js route changes
    const handleRouteChangeStart = () => {
      setProgress(0.2);
    };

    const handleRouteChangeComplete = () => {
      setProgress(0.9);
    };

    // Add event listeners
    document.addEventListener("DOMContentLoaded", domContentLoaded);
    window.addEventListener("load", windowLoaded);
    router.events.on("routeChangeStart", handleRouteChangeStart);
    router.events.on("routeChangeComplete", handleRouteChangeComplete);

    // Register performance observer if available
    if ("PerformanceObserver" in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];

          // Update progress based on performance metrics
          if (lastEntry.entryType === "largest-contentful-paint") {
            setProgress((p) => Math.max(p, 0.7));
          }

          if (lastEntry.entryType === "resource") {
            setProgress((p) => Math.max(p, 0.6));
          }
        });

        observer.observe({
          entryTypes: ["resource", "largest-contentful-paint"],
        });

        return () => observer.disconnect();
      } catch (e) {
        console.error("Performance Observer error:", e);
      }
    }

    return () => {
      document.removeEventListener("DOMContentLoaded", domContentLoaded);
      window.removeEventListener("load", windowLoaded);
      router.events.off("routeChangeStart", handleRouteChangeStart);
      router.events.off("routeChangeComplete", handleRouteChangeComplete);
    };
  }, [router]);

  return { isLoading, progress };
}
