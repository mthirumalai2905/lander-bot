import { useEffect, useRef } from "react";
import type { ComponentState } from "../../types/component";
import { ribbonSpeedsFor } from "../../utils/ribbons";

export function Particles({ state }: { state: ComponentState }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = state.colors.length ? state.colors : ["#F97316", "#F43F5E", "#FBBF24"];
  const speed = ribbonSpeedsFor(colors.length, state.ribbonSpeeds)[0] ?? 1;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const count = Math.min(80, 18 + colors.length * 14);
    const dots = Array.from({ length: count }, (_, index) => ({
      x: Math.random() * state.width,
      y: Math.random() * state.height,
      r: 1.2 + (index % 4),
      vx: (Math.random() - 0.5) * 0.6 * speed,
      vy: (Math.random() - 0.5) * 0.6 * speed,
      color: colors[index % colors.length],
    }));

    let frame = 0;
    const draw = () => {
      context.clearRect(0, 0, state.width, state.height);
      for (const dot of dots) {
        dot.x += dot.vx;
        dot.y += dot.vy;
        if (dot.x < 0 || dot.x > state.width) dot.vx *= -1;
        if (dot.y < 0 || dot.y > state.height) dot.vy *= -1;
        context.beginPath();
        context.fillStyle = dot.color;
        context.globalAlpha = 0.85;
        context.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
        context.fill();
      }
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [colors, speed, state.height, state.id, state.width]);

  return (
    <canvas
      ref={canvasRef}
      width={state.width}
      height={state.height}
      className="block rounded-[18px]"
    />
  );
}
