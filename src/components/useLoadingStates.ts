import { useState, useEffect } from "react";

export function useLoadingStates(isMobile: boolean) {
    const [isCPULoaded, setIsCPULoaded] = useState(false);
    const [isContentLoaded, setIsContentLoaded] = useState(false);
  
    useEffect(() => {
      const cpuTimer = setTimeout(
        () => setIsCPULoaded(true),
        isMobile ? 500 : 1000,
      );
      return () => clearTimeout(cpuTimer);
    }, [isMobile]);
  
    useEffect(() => {
      if (isCPULoaded) {
        const contentTimer = setTimeout(
          () => setIsContentLoaded(true),
          isMobile ? 1000 : 2000,
        );
        return () => clearTimeout(contentTimer);
      }
    }, [isCPULoaded, isMobile]);
  
    return { isCPULoaded, isContentLoaded };
  }