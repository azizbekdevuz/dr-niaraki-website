import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";

type Theme = "dark" | "light";

class Node {
  x!: number;
  y!: number;
  vx!: number;
  vy!: number;
  targetX!: number;
  targetY!: number;
  fixed: boolean = false;
  active: boolean = true;

  constructor(canvas: HTMLCanvasElement) {
    this.reset(canvas);
  }

  reset(canvas: HTMLCanvasElement) {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.vx = (Math.random() - 0.5) * 0.5;
    this.vy = (Math.random() - 0.5) * 0.5;
    this.targetX = this.x;
    this.targetY = this.y;
    this.fixed = false;
    this.active = true;
  }

  draw(
    context: CanvasRenderingContext2D,
    hueShift: number,
    nodeColor: (hue: number) => string,
  ) {
    if (!this.active) return;

    const gradient = context.createRadialGradient(
      this.x,
      this.y,
      0,
      this.x,
      this.y,
      3,
    );
    gradient.addColorStop(0, nodeColor(hueShift));
    gradient.addColorStop(1, "transparent");
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(this.x, this.y, 6, 0, Math.PI * 2);
    context.fill();
  }

  update(
    canvas: HTMLCanvasElement,
    restrictedArea: {
      left: number;
      right: number;
      top: number;
      bottom: number;
    },
  ) {
    if (!this.active) return;

    if (this.fixed) {
      this.x += (this.targetX - this.x) * 0.05;
      this.y += (this.targetY - this.y) * 0.05;
    } else {
      this.x += this.vx;
      this.y += this.vy;

      const { left, right, top, bottom } = restrictedArea;
      if (this.x > left && this.x < right && this.y > top && this.y < bottom) {
        if (this.x < left || this.x > right) this.vx *= -1;
        if (this.y < top || this.y > bottom) this.vy *= -1;
      }

      if (this.x > canvas.width || this.x < 0) this.vx *= -1;
      if (this.y > canvas.height || this.y < 0) this.vy *= -1;
    }
  }
}

export default function AdvancedBackground({
  theme = "dark",
}: {
  theme?: Theme;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodeCount, setNodeCount] = useState(90);
  const animationRef = useRef<number>();
  const nodesRef = useRef<Node[]>([]);
  const lastFrameTimeRef = useRef(0);
  const hueShiftRef = useRef(0);

  const themeColors: Record<
    Theme,
    {
      background: string;
      nodeColor: (hue: number) => string;
      lineColor: (opacity: number) => string;
      gradientStart: string;
      gradientEnd: string;
    }
  > = useMemo(
    () => ({
      dark: {
        background: "#000428",
        nodeColor: (hue: number) => `hsla(${hue}, 100%, 50%, 1)`,
        lineColor: (opacity: number) => `rgba(0, 165, 224, ${opacity})`,
        gradientStart: "#0f2027",
        gradientEnd: "#203a43",
      },
      light: {
        background: "#f0f8ff",
        nodeColor: (hue: number) => `hsla(${hue}, 100%, 30%, 1)`,
        lineColor: (opacity: number) => `rgba(0, 100, 200, ${opacity})`,
        gradientStart: "#9be2fc",
        gradientEnd: "#2c3e50",
      },
    }),
    [],
  );

  const maxDistance = 150;
  const shapeNodesCount = 18;
  const targetFPS = 60;
  const frameInterval = 1000 / targetFPS;

  const restrictedAreaRef = useRef({
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  });

  const setupCanvas = useCallback(
    (canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) => {
      const devicePixelRatio = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();

      canvas.width = rect.width * devicePixelRatio;
      canvas.height = rect.height * devicePixelRatio;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      context.scale(devicePixelRatio, devicePixelRatio);

      const newNodeCount = Math.min(
        50, // Maximum nodes
        Math.floor((canvas.width * canvas.height) / 10000)
      );
      setNodeCount(newNodeCount);

      const gradient = context.createLinearGradient(
        0,
        0,
        canvas.width,
        canvas.height,
      );
      gradient.addColorStop(0, themeColors[theme as Theme].gradientStart);
      gradient.addColorStop(1, themeColors[theme as Theme].gradientEnd);
      canvas.style.backgroundColor = themeColors[theme as Theme].background;
      context.fillStyle = gradient;
      context.fillRect(0, 0, canvas.width, canvas.height);
    },
    [theme, themeColors],
  );

  const getNode = useCallback((canvas: HTMLCanvasElement) => {
    const inactiveNode = nodesRef.current.find((node) => !node.active);
    if (inactiveNode) {
      inactiveNode.reset(canvas);
      return inactiveNode;
    }
    return new Node(canvas);
  }, []);

  const adjustNodeCount = useCallback(
    (canvas: HTMLCanvasElement) => {
      while (nodesRef.current.length < nodeCount) {
        nodesRef.current.push(getNode(canvas));
      }
      while (nodesRef.current.length > nodeCount) {
        const node = nodesRef.current.pop();
        if (node) node.active = false;
      }
    },
    [nodeCount, getNode],
  );

  const drawShape = useCallback(
    (shapeIndex: number, canvas: HTMLCanvasElement) => {
      let shapeNodeCount: number;
      const radius = 100;

      switch (shapeIndex) {
        case 0: // Circuit Shape
          shapeNodeCount = 16; // An even number works well for this shape
          break;
        case 1: // Holographic Display (Rectangular Grid)
          shapeNodeCount = 25; // 5x5 grid
          break;
        case 2: // Hexagonal Grid
          shapeNodeCount = 19; // Optimal for hexagonal pattern
          break;
        case 3: // Concentric Circles
          shapeNodeCount = 24; // 3 rings with 8 nodes each
          break;
        case 4: // Pentagon/Star
          shapeNodeCount = 10; // 5 outer points, 5 inner points
          break;
        case 5: // Artificial Neural Network
          shapeNodeCount = 16; // 4 layers with 4 nodes each
          break;
        case 6: // Research Data Network
          shapeNodeCount = 25; // Flexible, but consistent with other shapes
          break;
        default:
          shapeNodeCount = 25; // Default to the largest required count
      }

      const shapeNodes = nodesRef.current.slice(0, shapeNodeCount);

      shapeNodes.forEach((node, index) => {
        switch (shapeIndex) {
          case 0: // Circuit Shape
            node.targetX =
              canvas.width / 2 + (index % 2 === 0 ? radius : -radius);
            node.targetY =
              canvas.height / 2 + (index % 2 === 0 ? -radius : radius);
            break;
          case 1: // Holographic Display (Rectangular Grid)
            const gridSize = 5;
            node.targetX =
              canvas.width / 2 + (index % gridSize) * 40 - (gridSize - 1) * 20;
            node.targetY =
              canvas.height / 2 +
              Math.floor(index / gridSize) * 40 -
              (gridSize - 1) * 20;
            break;
          case 2: // Hexagonal Grid
            if (index === 0) {
              node.targetX = canvas.width / 2;
              node.targetY = canvas.height / 2;
            } else {
              const ringIndex = index <= 6 ? 1 : 2;
              const angleOffset = index <= 6 ? 0 : Math.PI / 6;
              const ringAngle = ((index - 1) % 6) * (Math.PI / 3) + angleOffset;
              node.targetX =
                canvas.width / 2 +
                Math.cos(ringAngle) * ((radius * ringIndex) / 2);
              node.targetY =
                canvas.height / 2 +
                Math.sin(ringAngle) * ((radius * ringIndex) / 2);
            }
            break;
          case 3: // Concentric Circles
            const ringsCount = 3;
            const nodesPerRing = shapeNodeCount / ringsCount;
            const ringIndex = Math.floor(index / nodesPerRing);
            const angleStep = (2 * Math.PI) / nodesPerRing;
            const circleAngle = (index % nodesPerRing) * angleStep;
            node.targetX =
              canvas.width / 2 + Math.cos(circleAngle) * (50 + 40 * ringIndex);
            node.targetY =
              canvas.height / 2 + Math.sin(circleAngle) * (50 + 40 * ringIndex);
            break;
          case 4: // Pentagon/Star
            const starRadius = index % 2 === 0 ? radius : radius * 0.6;
            const starAngle = ((2 * Math.PI) / 5) * Math.floor(index / 2);
            node.targetX = canvas.width / 2 + Math.cos(starAngle) * starRadius;
            node.targetY = canvas.height / 2 + Math.sin(starAngle) * starRadius;
            break;
          case 5: // Artificial Neural Network
            const layersCount = 4;
            const nodesPerLayer = shapeNodeCount / layersCount;
            const layerIndex = Math.floor(index / nodesPerLayer);
            const nodeInLayerIndex = index % nodesPerLayer;
            node.targetX =
              canvas.width / 2 + (layerIndex - (layersCount - 1) / 2) * 100;
            node.targetY =
              canvas.height / 2 +
              (nodeInLayerIndex - (nodesPerLayer - 1) / 2) * 60;
            break;
          case 6: // Research Data Network
            node.targetX =
              canvas.width / 2 + Math.random() * radius * 2 - radius;
            node.targetY =
              canvas.height / 2 + Math.random() * radius * 2 - radius;
            break;
        }

        node.fixed = true;
      });

      restrictedAreaRef.current = {
        left: Math.min(...shapeNodes.map((node) => node.targetX)) - 50,
        right: Math.max(...shapeNodes.map((node) => node.targetX)) + 50,
        top: Math.min(...shapeNodes.map((node) => node.targetY)) - 50,
        bottom: Math.max(...shapeNodes.map((node) => node.targetY)) + 50,
      };
    },
    [],
  );

  const resetShapeNodes = useCallback(() => {
    nodesRef.current.forEach((node, index) => {
      if (index < shapeNodesCount) {
        node.fixed = false;
      }
    });
  }, []);

  const animate = useCallback(
    (currentTime: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const context = canvas.getContext("2d");
      if (!context) return;

      if (currentTime - lastFrameTimeRef.current < frameInterval) {
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      lastFrameTimeRef.current = currentTime;
      hueShiftRef.current += 0.5;
      context.clearRect(0, 0, canvas.width, canvas.height);

      const activeNodes = nodesRef.current.filter((node) => node.active);
      activeNodes.forEach((node) =>
        node.update(canvas, restrictedAreaRef.current),
      );

      for (let i = 0; i < activeNodes.length; i++) {
        const node = activeNodes[i];
        node.draw(
          context,
          hueShiftRef.current,
          themeColors[theme as Theme].nodeColor,
        );

        for (let j = i + 1; j < activeNodes.length; j++) {
          const otherNode = activeNodes[j];
          const dx = node.x - otherNode.x;
          const dy = node.y - otherNode.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < maxDistance) {
            context.beginPath();
            context.moveTo(node.x, node.y);
            context.lineTo(otherNode.x, otherNode.y);
            context.strokeStyle = themeColors[theme].lineColor(
              1 - distance / maxDistance,
            );
            context.stroke();

            const midX = (node.x + otherNode.x) / 2;
            const midY = (node.y + otherNode.y) / 2;
            const gradient = context.createRadialGradient(
              midX,
              midY,
              0,
              midX,
              midY,
              20,
            );
            gradient.addColorStop(
              0,
              `hsla(${hueShiftRef.current}, 100%, 50%, 0.5)`,
            );
            gradient.addColorStop(1, "transparent");
            context.fillStyle = gradient;
            context.fillRect(midX - 20, midY - 20, 40, 40);
          }
        }
      }

      animationRef.current = requestAnimationFrame(animate);
    },
    [theme, themeColors, frameInterval],
  );

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    nodesRef.current.forEach((node, index) => {
      if (index >= shapeNodesCount && !node.fixed) {
        const dx = mouseX - node.x;
        const dy = mouseY - node.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 100) {
          node.vx += (dx / distance) * 0.05;
          node.vy += (dy / distance) * 0.05;
        }
      }
    });
  }, []);

  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    setupCanvas(canvas, context);
    adjustNodeCount(canvas);
  }, [setupCanvas, adjustNodeCount]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    setupCanvas(canvas, context);
    adjustNodeCount(canvas);

    let currentShapeIndex = 0;
    const changeShape = () => {
      resetShapeNodes();
      drawShape(currentShapeIndex, canvas);
      currentShapeIndex = (currentShapeIndex + 1) % 10;
    };

    animationRef.current = requestAnimationFrame(animate);
    const shapeChangeInterval = setInterval(changeShape, 5000);

    const throttledMouseMove = throttle(handleMouseMove, 16);
    const throttledResize = throttle(handleResize, 250);

    window.addEventListener("mousemove", throttledMouseMove);
    window.addEventListener("resize", throttledResize);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      clearInterval(shapeChangeInterval);
      window.removeEventListener("mousemove", throttledMouseMove);
      window.removeEventListener("resize", throttledResize);
    };
  }, [
    setupCanvas,
    adjustNodeCount,
    animate,
    handleMouseMove,
    handleResize,
    resetShapeNodes,
    drawShape,
  ]);

  // Updated throttle function to use more specific types
  const throttle = <T extends (...args: Parameters<T>) => ReturnType<T>>(
    func: T,
    limit: number,
  ): T => {
    let inThrottle = false;

    return ((...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => {
          inThrottle = false;
        }, limit);
      }
    }) as T;
  };

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full pointer-events-none"
      style={{ height: "100vh", position: "fixed" }}
    />
  );
}