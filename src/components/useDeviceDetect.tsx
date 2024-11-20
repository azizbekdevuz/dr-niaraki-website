import { useEffect, useState } from "react";

interface DeviceInfo {
  isMobile: boolean; //for mobile
  isTablet: boolean; //tablet
  isDesktop: boolean; //pc - desktop
  deviceType: "mobile" | "tablet" | "desktop"; //identify device type
}

const useDeviceDetect = (): DeviceInfo => {
  //detect device type
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    deviceType: "desktop",
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;

      const getDeviceType = (
        //get device type based on screen size
        width: number,
      ): "mobile" | "tablet" | "desktop" => {
        if (width < 768) return "mobile"; //if width less then 768, mobile
        if (width < 1024) return "tablet"; //if width less than 1024, tablet
        return "desktop"; //other all cases, desktop
      };

      const newDeviceInfo: DeviceInfo = {
        //device info
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
        deviceType: getDeviceType(width),
      };

      setDeviceInfo(newDeviceInfo);
    };

    handleResize(); // Initial check

    window.addEventListener("resize", handleResize); // Add event listener

    return () => window.removeEventListener("resize", handleResize); // Cleanup
  }, []);

  return deviceInfo;
};

export default useDeviceDetect;
