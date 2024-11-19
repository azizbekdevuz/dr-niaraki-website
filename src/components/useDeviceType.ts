import { useState, useEffect } from "react";

export function useDeviceType() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", checkDevice);
    checkDevice();

    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  return isMobile;
}