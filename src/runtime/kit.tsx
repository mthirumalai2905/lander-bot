import type { ReactNode } from "react";
import { useEffect, useId, useRef } from "react";
import { motion } from "motion/react";
import { SessionVisual } from "../components/canvas/SessionVisual";
import Strands from "../components/canvas/Strands";
import type { ComponentState } from "../types/component";
import { ribbonSpeedsFor } from "../utils/ribbons";

export type RibbonShape =
  | "wave"
  | "heart"
  | "star"
  | "dna"
  | "square"
  | "circle"
  | "ellipse"
  | "parabola"
  | "triangle"
  | "diamond"
  | "hexagon";

export const HEART_PATH =
  "M50 88 C20 65 5 45 5 28 C5 14 16 5 28 5 C36 5 44 9 50 18 C56 9 64 5 72 5 C84 5 95 14 95 28 C95 45 80 65 50 88 Z";

export const HEART_CLIP_PATH =
  "M0.50 0.88 C0.20 0.65 0.05 0.45 0.05 0.28 C0.05 0.14 0.16 0.05 0.28 0.05 C0.36 0.05 0.44 0.09 0.50 0.18 C0.56 0.09 0.64 0.05 0.72 0.05 C0.84 0.05 0.95 0.14 0.95 0.28 C0.95 0.45 0.80 0.65 0.50 0.88 Z";

export function heartPath(): string {
  return HEART_PATH;
}

export function SessionBuiltin({ state }: { state: ComponentState }) {
  return <SessionVisual state={state} />;
}

export function HeartClip({
  width,
  height,
  children,
}: {
  width: number;
  height: number;
  children: ReactNode;
}) {
  const id = useId().replace(/:/g, "");
  return (
    <div className="relative overflow-hidden" style={{ width, height }}>
      <svg width={0} height={0} className="absolute">
        <defs>
          <clipPath id={id} clipPathUnits="objectBoundingBox">
            <path d={HEART_CLIP_PATH} />
          </clipPath>
        </defs>
      </svg>
      <div className="h-full w-full" style={{ clipPath: `url(#${id})` }}>
        {children}
      </div>
    </div>
  );
}

export function HeartFrame({
  state,
  children,
}: {
  state: ComponentState;
  children?: ReactNode;
}) {
  const colors = state.colors.length ? state.colors : ["#F97316", "#7C3AED", "#06B6D4"];
  const speeds = ribbonSpeedsFor(colors.length, state.ribbonSpeeds);

  return (
    <div className="relative overflow-hidden rounded-[18px] bg-[#050508]" style={{ width: state.width, height: state.height }}>
      <HeartClip width={state.width} height={state.height}>
        {children ?? <SessionBuiltin state={state} />}
      </HeartClip>
      <svg
        className="pointer-events-none absolute inset-0"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
      >
        {colors.map((color, index) => (
          <motion.path
            key={`${state.id}-heart-${index}`}
            d={HEART_PATH}
            fill="none"
            stroke={color}
            strokeWidth={2.2 - index * 0.35}
            strokeLinejoin="round"
            style={{ filter: `drop-shadow(0 0 6px ${color})` }}
            animate={{ opacity: [0.45, 1, 0.5], scale: [0.96, 1.02, 0.96] }}
            transition={{
              duration: 3.2 / (speeds[index] ?? 1),
              repeat: Infinity,
              ease: "easeInOut",
              delay: index * 0.15,
            }}
          />
        ))}
      </svg>
    </div>
  );
}

export function starPath(spikes = 5): string {
  const points: string[] = [];
  for (let index = 0; index < spikes * 2; index += 1) {
    const radius = index % 2 === 0 ? 42 : 18;
    const angle = (index * Math.PI) / spikes - Math.PI / 2;
    const x = 50 + Math.cos(angle) * radius;
    const y = 50 + Math.sin(angle) * radius;
    points.push(`${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  return `${points.join(" ")} Z`;
}

export const STAR_PATH = starPath();
export const STAR_CLIP_PATH = starPath()
  .replace(/(\d+\.\d+|\d+)/g, (value) => (Number(value) / 100).toFixed(3));

export function StarClip({
  width,
  height,
  children,
}: {
  width: number;
  height: number;
  children: ReactNode;
}) {
  const id = useId().replace(/:/g, "");
  return (
    <div className="relative overflow-hidden" style={{ width, height }}>
      <svg width={0} height={0} className="absolute">
        <defs>
          <clipPath id={id} clipPathUnits="objectBoundingBox">
            <path d={STAR_CLIP_PATH} />
          </clipPath>
        </defs>
      </svg>
      <div className="h-full w-full" style={{ clipPath: `url(#${id})` }}>
        {children}
      </div>
    </div>
  );
}

export function StarFrame({
  state,
  children,
}: {
  state: ComponentState;
  children?: ReactNode;
}) {
  const colors = state.colors.length ? state.colors : ["#F97316", "#F43F5E", "#FBBF24"];
  const speeds = ribbonSpeedsFor(colors.length, state.ribbonSpeeds);

  return (
    <div className="relative overflow-hidden rounded-[18px] bg-[#050508]" style={{ width: state.width, height: state.height }}>
      <StarClip width={state.width} height={state.height}>
        {children ?? <SessionBuiltin state={state} />}
      </StarClip>
      <svg
        className="pointer-events-none absolute inset-0"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
      >
        {colors.map((color, index) => (
          <motion.path
            key={`${state.id}-star-${index}`}
            d={STAR_PATH}
            fill="none"
            stroke={color}
            strokeWidth={2.1 - index * 0.3}
            strokeLinejoin="round"
            style={{ filter: `drop-shadow(0 0 6px ${color})` }}
            animate={{ opacity: [0.45, 1, 0.5], rotate: [0, 8, 0] }}
            transition={{
              duration: 3.6 / (speeds[index] ?? 1),
              repeat: Infinity,
              ease: "easeInOut",
              delay: index * 0.12,
            }}
          />
        ))}
      </svg>
    </div>
  );
}

export function StarField({ state }: { state: ComponentState }) {
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
      r: 3.2 + (index % 4),
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
        context.fillStyle = dot.color;
        context.globalAlpha = 0.9;
        drawStar(context, dot.x, dot.y, dot.r);
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
      className="block"
    />
  );
}

function drawStar(context: CanvasRenderingContext2D, x: number, y: number, radius: number, spikes = 5) {
  context.beginPath();
  for (let index = 0; index < spikes * 2; index += 1) {
    const r = index % 2 === 0 ? radius : radius * 0.42;
    const angle = (index * Math.PI) / spikes - Math.PI / 2;
    const px = x + Math.cos(angle) * r;
    const py = y + Math.sin(angle) * r;
    if (index === 0) context.moveTo(px, py);
    else context.lineTo(px, py);
  }
  context.closePath();
  context.fill();
}

export function Strand({ state }: { state: ComponentState }) {
  return <RibbonField state={state} shape="wave" />;
}

export function RibbonField({
  state,
  shape = "wave",
}: {
  state: ComponentState;
  shape?: RibbonShape;
}) {
  const colors = state.colors.length ? state.colors : ["#F97316", "#7C3AED", "#06B6D4"];
  const speeds = ribbonSpeedsFor(colors.length, state.ribbonSpeeds);
  const averageSpeed = speeds.reduce((sum, value) => sum + value, 0) / speeds.length;

  return (
    <div
      className="relative overflow-hidden rounded-[18px]"
      style={{ width: state.width, height: state.height }}
    >
      <Strands
        shape={shape}
        colors={colors}
        count={Math.min(colors.length, 12)}
        speed={0.5 * averageSpeed}
        speeds={speeds}
        amplitude={1}
        waviness={1}
        thickness={0.7}
        glow={2.6}
        taper={3}
        spread={Math.max(0.85, 0.55 + colors.length * 0.12)}
        intensity={0.6}
        saturation={1.5}
        opacity={state.opacity}
        scale={shape === "wave" || shape === "dna" || shape === "parabola" ? 1.35 : 0.78}
        glass={false}
      />
    </div>
  );
}

export { Strands, ribbonSpeedsFor };
