import { useEffect, useRef } from "react";
import type { ComponentState } from "../../types/component";
import { ribbonSpeedsFor } from "../../utils/ribbons";

export function EvilEye({ state }: { state: ComponentState }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const colors = state.colors.length ? state.colors : ["#FFF7ED", "#F59E0B", "#EF4444"];
  const speed = ribbonSpeedsFor(colors.length, state.ribbonSpeeds)[0] ?? 1;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const cx = state.width / 2;
    const cy = state.height / 2;
    const rx = state.width * 0.34;
    const ry = state.height * 0.22;
    const count = Math.min(220, 90 + colors.length * 28);
    const palette = [...colors, "#7F1D1D"];
    const embers = Array.from({ length: count }, () => spawn(cx, cy, rx, ry, speed, palette));

    let frame = 0;
    const draw = () => {
      context.fillStyle = "rgba(5, 5, 8, 0.28)";
      context.fillRect(0, 0, state.width, state.height);

      const glow = context.createRadialGradient(cx, cy, 4, cx, cy, rx * 1.6);
      glow.addColorStop(0, hexAlpha(colors[0] ?? "#FFF7ED", 0.55));
      glow.addColorStop(0.35, hexAlpha(colors[1] ?? "#F59E0B", 0.28));
      glow.addColorStop(1, "rgba(0,0,0,0)");
      context.fillStyle = glow;
      context.beginPath();
      context.ellipse(cx, cy, rx * 1.35, ry * 1.7, 0, 0, Math.PI * 2);
      context.fill();

      for (const ember of embers) {
        ember.x += ember.vx;
        ember.y += ember.vy;
        ember.life -= ember.decay;
        if (ember.life <= 0 || outside(ember.x, ember.y, cx, cy, rx * 1.45, ry * 1.9)) {
          Object.assign(ember, spawn(cx, cy, rx, ry, speed, palette));
        }
        context.fillStyle = ember.color;
        context.globalAlpha = Math.max(0, ember.life);
        context.beginPath();
        context.ellipse(ember.x, ember.y, ember.w, ember.h, ember.angle, 0, Math.PI * 2);
        context.fill();
      }
      context.globalAlpha = 1;

      context.fillStyle = "#050508";
      context.beginPath();
      context.ellipse(cx, cy, rx * 0.09, ry * 0.72, 0, 0, Math.PI * 2);
      context.fill();

      frame = requestAnimationFrame(draw);
    };

    context.fillStyle = "#050508";
    context.fillRect(0, 0, state.width, state.height);
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [colors, speed, state.height, state.id, state.width]);

  return (
    <canvas
      ref={canvasRef}
      width={state.width}
      height={state.height}
      className="block rounded-[18px] bg-[#050508]"
    />
  );
}

function spawn(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  speed: number,
  palette: string[],
) {
  const angle = Math.random() * Math.PI * 2;
  const dist = Math.random() * 0.35;
  const x = cx + Math.cos(angle) * rx * dist;
  const y = cy + Math.sin(angle) * ry * dist;
  const outward = 0.35 + Math.random() * 1.1;
  const heat = Math.abs(Math.sin(angle)) * 0.45 + Math.random() * 0.55;
  return {
    x,
    y,
    vx: Math.cos(angle) * outward * speed,
    vy: Math.sin(angle) * outward * 0.72 * speed,
    w: 1.2 + Math.random() * 3.4,
    h: 3 + Math.random() * 9,
    angle,
    life: 0.55 + Math.random() * 0.45,
    decay: 0.008 + Math.random() * 0.012,
    color: palette[Math.min(palette.length - 1, Math.floor(heat * palette.length))],
  };
}

function outside(x: number, y: number, cx: number, cy: number, rx: number, ry: number) {
  const dx = (x - cx) / rx;
  const dy = (y - cy) / ry;
  return dx * dx + dy * dy > 1;
}

function hexAlpha(hex: string, alpha: number) {
  const value = hex.replace("#", "");
  const full = value.length === 3 ? value.split("").map((part) => part + part).join("") : value;
  const r = Number.parseInt(full.slice(0, 2), 16);
  const g = Number.parseInt(full.slice(2, 4), 16);
  const b = Number.parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
