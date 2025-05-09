import React, { useEffect, useRef } from "react";

type Theme = "dark" | "light";

export default function MobileBackground({
  theme = "dark",
}: {
  theme?: Theme;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const dpr = window.devicePixelRatio || 1;
    const updateCanvasSize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = document.documentElement.scrollHeight * dpr;
      context.scale(dpr, dpr);

      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${document.documentElement.scrollHeight}px`;

      const themeColors: Record<Theme, string> = {
        dark: "#000428",
        light: "#f0f8ff",
      };
      canvas.style.backgroundColor = themeColors[theme as Theme];
    };

    updateCanvasSize();

    const nodes: Node[] = [];
    const nodeCount = 30;
    const maxDistance = 200;
    let hueShift = 0;

    class Node {
      x: number;
      y: number;
      vx: number;
      vy: number;

      constructor(canvasWidth: number, canvasHeight: number) {
        this.x = (Math.random() * canvasWidth) / dpr;
        this.y = (Math.random() * canvasHeight) / dpr;
        this.vx = (Math.random() - 0.5) * 0.7;
        this.vy = (Math.random() - 0.5) * 0.7;
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `hsl(${hueShift}, 100%, 50%)`;
        ctx.fill();
      }

      update(canvasWidth: number, canvasHeight: number) {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x > canvasWidth / dpr || this.x < 0) this.vx *= -1;
        if (this.y > canvasHeight / dpr || this.y < 0) this.vy *= -1;
      }
    }

    for (let i = 0; i < nodeCount; i++) {
      nodes.push(new Node(canvas.width, canvas.height));
    }

    function animate() {
      if (!context || !canvas) return; // Add this null check

      hueShift += 0.3;
      context.clearRect(0, 0, canvas.width, canvas.height);

      nodes.forEach((node, index) => {
        node.update(canvas.width, canvas.height);
        node.draw(context);

        for (let j = index + 1; j < nodeCount; j++) {
          const distance = Math.sqrt(
            (node.x - nodes[j].x) ** 2 + (node.y - nodes[j].y) ** 2,
          );
          if (distance < maxDistance) {
            context.beginPath();
            context.moveTo(node.x, node.y);
            context.lineTo(nodes[j].x, nodes[j].y);
            context.strokeStyle = `rgba(0, 165, 224, ${1 - distance / maxDistance})`;
            context.stroke();
          }
        }
      });

      requestAnimationFrame(animate);
    }

    animate();

    window.addEventListener("resize", updateCanvasSize);
    window.addEventListener("scroll", updateCanvasSize);

    return () => {
      window.removeEventListener("resize", updateCanvasSize);
      window.removeEventListener("scroll", updateCanvasSize);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full pointer-events-none"
    />
  );
}
