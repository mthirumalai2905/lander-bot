import { useEffect, useRef } from "react";
import type { ComponentState } from "../../types/component";
import { ribbonSpeedsFor } from "../../utils/ribbons";

export function Antigravity({ state }: { state: ComponentState }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = state.colors.length ? state.colors : ["#FFFFFF", "#E5E7EB", "#CBD5E1"];
  const speed = ribbonSpeedsFor(colors.length, state.ribbonSpeeds)[0] ?? 1;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const count = Math.min(90, 28 + colors.length * 16);
    const pieces = Array.from({ length: count }, (_, index) => ({
      x: Math.random() * state.width,
      y: Math.random() * state.height,
      w: 1.4 + (index % 5) * 0.7,
      h: 6 + (index % 4) * 3.2,
      vx: (Math.random() - 0.5) * 0.35 * speed,
      vy: (-0.25 - Math.random() * 0.55) * speed,
      rot: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 0.03,
      color: colors[index % colors.length],
    }));

    let frame = 0;
    const draw = () => {
      context.clearRect(0, 0, state.width, state.height);
      context.fillStyle = "#050508";
      context.fillRect(0, 0, state.width, state.height);
      for (const piece of pieces) {
        piece.x += piece.vx;
        piece.y += piece.vy;
        piece.rot += piece.spin;
        if (piece.y < -12) piece.y = state.height + 12;
        if (piece.x < -12) piece.x = state.width + 12;
        if (piece.x > state.width + 12) piece.x = -12;
        context.save();
        context.translate(piece.x, piece.y);
        context.rotate(piece.rot);
        context.fillStyle = piece.color;
        context.globalAlpha = 0.88;
        roundRect(context, -piece.w / 2, -piece.h / 2, piece.w, piece.h, piece.w / 2);
        context.fill();
        context.restore();
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

function roundRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
}
