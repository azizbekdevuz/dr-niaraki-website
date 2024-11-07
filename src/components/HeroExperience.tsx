import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, useAnimation, useReducedMotion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

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
const ParticleEffect = () => {
  const canvasRef = useRef(null);
  const [particleCount, setParticleCount] = useState(100);

  useEffect(() => {
    const canvas = canvasRef.current;
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);  

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const particles = [];

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Initialize particles
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
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.dx;
        p.y += p.dy;
        if (p.x > canvas.width || p.x < 0) p.dx *= -1;
        if (p.y > canvas.height || p.y < 0) p.dy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(200, 255, 255, 0.3)';
        ctx.fill();
      });
      requestAnimationFrame(animateParticles);
    };
    animateParticles();
  }, [particleCount]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
};

// Scroll Progress Component
const ScrollProgress = () => {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      const currentProgress = (window.pageYOffset / totalScroll) * 100;
      setScrollProgress(currentProgress);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full h-1 bg-gray-800 z-50">
      <motion.div
        className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
        style={{ width: `${scrollProgress}%` }}
      />
    </div>
  );
};

// Stat Card Component
const StatCard = ({ title, value }) => {
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
      <span className="relative">{count}+ {title}</span>
    </motion.div>
  );
};

// Floating Image Component
const FloatingImage = ({ src, position, delay, showStats }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.div
      className={`absolute ${position} rounded-full overflow-hidden border border-purple-500/30 shadow-lg shadow-purple-500/10 cursor-pointer`}
      animate={{ 
        y: [0, position.includes("top") ? -10 : 10, 0],
        rotate: [0, position.includes("right") ? 5 : -5, 0],
        scale: [1, 1.02, 1]
      }}
      transition={{ 
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
        delay
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Image 
        src={src}
        alt="Professor Gesture"
        layout="responsive"
        width={100}
        height={100}
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-gray-900/50 to-transparent" />
      
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute -top-20 left-1/2 -translate-x-1/2 bg-gray-900/90 backdrop-blur-sm p-3 rounded-lg shadow-xl w-48"
          >
            <p className="text-sm text-white text-center">{showStats}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Hero Section Component
export const HeroExperience: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();
  const controls = useAnimation();
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true
  });

  useEffect(() => {
    if (inView) {
      controls.start('visible');
    }
  }, [controls, inView]);

  return (
    <div ref={ref} className="relative w-full mb-16" >
            {/* Particle Effect with proper z-index */}
            <div className="absolute inset-0 z-0">
        {!prefersReducedMotion && <ParticleEffect />}
      </div>
      <NoiseFilter />
      <ScrollProgress />

      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.1),transparent_50%)] pointer-events-none" />

      {/* Wave Divider */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden">
        <svg className="w-full h-12" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path
            d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
            className="fill-gray-900/30"
          />
        </svg>
      </div>
      <div className="relative z-10 flex items-center justify-between max-w-7xl mx-auto">
        {/* Left side - Professor Image */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={controls}
          variants={{
            visible: { opacity: 1, x: 0 }
          }}
          className="relative group cursor-pointer"
        >
          <div className="relative w-72 h-96">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
            <motion.div
              className="absolute inset-0 rounded-2xl overflow-hidden border-2 border-blue-500/30 backdrop-blur-sm bg-gray-900/40"
              whileHover={{ scale: 1.02 }}
            >
              <Image 
                src="/assets/images/profimage.webp"
                alt="Professor"
                layout="responsive"
                width={285}
                height={381}
                className="object-cover transition-opacity duration-300"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/20 to-transparent" />
              <div 
                className="absolute inset-0 opacity-[0.15] mix-blend-overlay"
                style={{
                  filter: 'url(#noise)',
                  pointerEvents: 'none'
                }}
              />
            </motion.div>
            
            <FloatingImage 
              src="/assets/images/secondary1.webp"
              position="-right-8 top-1/4 w-24 h-24"
              delay={0}
              showStats="Research Focus: XR Technologies & Spatial Computing"
            />
            
            <FloatingImage 
              src="/assets/images/secondary2.webp"
              position="-left-8 bottom-1/4 w-20 h-20"
              delay={0.5}
              showStats="Teaching: Advanced Computer Science & VR/AR Development"
            />
          </div>
        </motion.div>
        
        <motion.div 
          className="flex-1 ml-16 space-y-6"
          initial={{ opacity: 0, x: 50 }}
          animate={controls}
          variants={{
            visible: { opacity: 1, x: 0 }
          }}
        >
          <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-blue-300 to-purple-500">
            Welcome to My Journey
          </h2>
          <p className="text-xl text-gray-300/90 leading-relaxed font-light">
            Exploring the intersection of technology and education through years of dedicated research, teaching, and industry collaboration.
          </p>
          <div className="flex space-x-4">
            <StatCard title="Years Experience" value="20" />
            <StatCard title="Publications" value="100" />
          </div>
        </motion.div>
      </div>
    </div>
  );
};
