import React, { useEffect, useState } from 'react';

const RotatingAtomCursor: React.FC = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isClicking, setIsClicking] = useState(false);
  const [isPointing, setIsPointing] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  // Cursor mounted/unmounted debugging
  useEffect(() => {
    console.log('Cursor Mounted');
    return () => {
      console.log('Cursor Unmounted');
    };
  }, []);
  
  useEffect(() => {
    const updatePosition = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);

    const handleMouseEnter = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('a, button, [role="button"], .interactive-card')) {
        setIsPointing(true);
      }
    };

    const handleMouseLeave = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('a, button, [role="button"], .interactive-card')) {
        setIsPointing(false);
      }
    };

    const handleDocumentMouseLeave = () => {
      setIsVisible(false); // Hide cursor when leaving document area
    };

    const handleDocumentMouseEnter = () => {
      setIsVisible(true); // Show cursor when entering document area
    };

    document.addEventListener('mousemove', updatePosition);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseover', handleMouseEnter);
    document.addEventListener('mouseout', handleMouseLeave);
    document.addEventListener('mouseleave', handleDocumentMouseLeave); // Mouse leaves webpage
    document.addEventListener('mouseenter', handleDocumentMouseEnter); // Mouse enters webpage

    return () => {
      document.removeEventListener('mousemove', updatePosition);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseover', handleMouseEnter);
      document.removeEventListener('mouseout', handleMouseLeave);
      document.removeEventListener('mouseleave', handleDocumentMouseLeave);
      document.removeEventListener('mouseenter', handleDocumentMouseEnter);
    };
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        pointerEvents: 'none',
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)',
        zIndex: 9999,
        visibility: isVisible ? 'visible' : 'hidden',
      }}
    >
      <div className={`atom-cursor ${isPointing ? 'pointing' : ''}`}>
        <div className="nucleus"></div>
        <div className="orbit orbit-1"></div>
        <div className="orbit orbit-2"></div>
        <div className="orbit orbit-3"></div>
        <div className="glow"></div>
        <div className="particle-trail"></div>
      </div>
    </div>
  );
};

// Wrap it with React.memo
export default RotatingAtomCursor;