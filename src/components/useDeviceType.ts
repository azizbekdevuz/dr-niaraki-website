import { useState, useEffect } from 'react';

export function useDeviceType() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth <= 768); // Mobile width threshold
    };

    window.addEventListener('resize', checkDevice);
    checkDevice(); // Initial check on mount

    return () => window.removeEventListener('resize', checkDevice); // Cleanup
  }, []);

  return isMobile;
}