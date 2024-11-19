import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  motion,
  useAnimation,
  useReducedMotion,
} from "framer-motion";
import { useInView } from "react-intersection-observer";

interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  deviceType: "mobile" | "tablet" | "desktop";
}

const useDeviceDetect = (): DeviceInfo => {
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
        width: number,
      ): "mobile" | "tablet" | "desktop" => {
        if (width < 768) return "mobile";
        if (width < 1024) return "tablet";
        return "desktop";
      };

      const newDeviceInfo: DeviceInfo = {
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
        deviceType: getDeviceType(width),
      };

      setDeviceInfo(newDeviceInfo);
    };

    // Initial check
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return deviceInfo;
};

// Noise Filter Component
const NoiseFilter = () => (
  <svg className="hidden">
    <filter id="noise">
      <feTurbulence
        type="fractalNoise"
        baseFrequency="0.80"
        numOctaves="4"
        stitchTiles="stitch"
      />
    </filter>
  </svg>
);

// Particle Effect Component
const ParticleEffect: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [particleCount] = useState(100);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const resizeCanvas = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      };
      resizeCanvas();
      window.addEventListener("resize", resizeCanvas);
      return () => window.removeEventListener("resize", resizeCanvas);
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      const particles: {
        x: number;
        y: number;
        size: number;
        dx: number;
        dy: number;
      }[] = [];

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 4 + 1,
          dx: (Math.random() - 0.5) * 0.5,
          dy: (Math.random() - 0.5) * 0.5,
        });
      }

      const animateParticles = () => {
        if (ctx) {
          // Null check for ctx
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          particles.forEach((p) => {
            p.x += p.dx;
            p.y += p.dy;
            if (p.x > canvas.width || p.x < 0) p.dx *= -1;
            if (p.y > canvas.height || p.y < 0) p.dy *= -1;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(200, 255, 255, 0.3)";
            ctx.fill();
          });
          requestAnimationFrame(animateParticles);
        }
      };
      animateParticles();
    }
  }, [particleCount]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
};

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string;
}

// Stat Card Component
const StatCard: React.FC<StatCardProps> = ({ title, value }) => {
  const [count, setCount] = useState(0);
  const { ref, inView } = useInView();

  useEffect(() => {
    if (inView) {
      const target = parseInt(value);
      let current = 0;
      const increment = target / 50;
      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          setCount(target);
          clearInterval(timer);
        } else {
          setCount(Math.floor(current));
        }
      }, 30);
      return () => clearInterval(timer);
    }
  }, [inView, value]);

  return (
    <motion.div
      ref={ref}
      className="group px-6 py-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 relative overflow-hidden"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className="absolute inset-0 bg-blue-400/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
      <span className="relative">
        {count}+ {title}
      </span>
    </motion.div>
  );
};

// Hero Section Component
export const HeroExperience: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();
  const controls = useAnimation();
  const device = useDeviceDetect();
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  useEffect(() => {
    if (inView) {
      controls.start("visible");
    }
  }, [controls, inView]);

  // Device-specific image positioning and sizing
  const getImageStyles = () => {
    if (device.isMobile) {
      return {
        mainImage: "w-64 h-80",
        secondary1Position: "-right-3 top-1/4 w-16 h-16",
        secondary2Position: "-left-3 bottom-1/4 w-16 h-16",
        containerStyles: "mb-8 mx-auto px-4",
      };
    } else if (device.isTablet) {
      return {
        mainImage: "w-68 h-88",
        secondary1Position: "-right-5 top-1/4 w-20 h-20",
        secondary2Position: "-left-5 bottom-1/4 w-20 h-20",
        containerStyles: "",
      };
    } else {
      return {
        mainImage: "w-72 h-96",
        secondary1Position: "-right-8 top-1/4 w-24 h-24",
        secondary2Position: "-left-8 bottom-1/4 w-20 h-20",
        containerStyles: "",
      };
    }
  };

  const imageStyles = getImageStyles();

  return (
    <div ref={ref} className="relative w-full mb-16">
      {/* Particle Effect only for desktop */}
      {!prefersReducedMotion && device.isDesktop && (
        <div className="absolute inset-0 z-0">
          <ParticleEffect />
        </div>
      )}
      <NoiseFilter />

      {/* Wave Divider */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden">
        <svg
          className="w-full h-12"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path
            d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
            className="fill-gray-900/30"
          />
        </svg>
      </div>

      {/* Main Content */}
      <div
        className={`relative z-10 flex ${device.isMobile ? "flex-col" : "items-center justify-between"} max-w-7xl mx-auto`}
      >
        {/* Left side - Professor Image */}
        <motion.div
          initial={{
            opacity: 0,
            x: device.isMobile ? 0 : -50,
            y: device.isMobile ? -50 : 0,
          }}
          animate={controls}
          variants={{
            visible: { opacity: 1, x: 0, y: 0 },
          }}
          className={`relative group cursor-pointer ${imageStyles.containerStyles}`}
        >
          <div className={`relative ${imageStyles.mainImage}`}>
            {/* Gradient border effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300" />

            {/* Main image container */}
            <motion.div
              className="absolute inset-0 rounded-2xl overflow-hidden border-2 border-blue-500/30 backdrop-blur-sm bg-gray-900/40"
              whileHover={{ scale: device.isDesktop ? 1.02 : 1 }}
            >
              <Image
                src="/assets/images/profimage.webp"
                alt="Professor"
                layout="fill"
                objectFit="cover"
                className="transition-opacity duration-300"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/20 to-transparent" />
              <div
                className="absolute inset-0 opacity-[0.15] mix-blend-overlay"
                style={{
                  filter: "url(#noise)",
                  pointerEvents: "none",
                }}
              />
            </motion.div>
          </div>
        </motion.div>

        {/* Right side content */}
        <motion.div
          className={`flex-1 ${device.isMobile ? "text-center px-4" : "ml-16"} space-y-6`}
          initial={{
            opacity: 0,
            x: device.isMobile ? 0 : 50,
            y: device.isMobile ? 50 : 0,
          }}
          animate={controls}
          variants={{
            visible: { opacity: 1, x: 0, y: 0 },
          }}
        >
          <h2
            className={`${device.isMobile ? "text-3xl" : "text-4xl"} font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-blue-300 to-purple-500`}
          >
            Welcome to My Journey
          </h2>
          <p
            className={`${device.isMobile ? "text-lg" : "text-xl"} text-gray-300/90 leading-relaxed font-light`}
          >
            Exploring the intersection of technology and education through years
            of dedicated research, teaching, and industry collaboration.
          </p>
          <div
            className={`flex ${device.isMobile ? "justify-center" : ""} space-x-4`}
          >
            <StatCard title="Years Experience" value="20" />
            <StatCard title="Publications" value="100" />
          </div>
        </motion.div>
      </div>
    </div>
  );
};
