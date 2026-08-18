import { motion } from "motion/react";
import type { ComponentState } from "../../types/component";
import { ribbonSpeedsFor } from "../../utils/ribbons";

export function WebThreads({ state }: { state: ComponentState }) {
  const colors = state.colors.length ? state.colors : ["#A78BFA", "#C4B5FD", "#FFFFFF"];
  const speeds = ribbonSpeedsFor(colors.length, state.ribbonSpeeds);
  const count = Math.max(colors.length, 5);

  return (
    <div
      className="relative overflow-hidden rounded-[18px] bg-[#050508]"
      style={{ width: state.width, height: state.height }}
    >
      <svg width={state.width} height={state.height} className="absolute inset-0">
        <defs>
          <filter id={`${state.id}-thread-glow`}>
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id={`${state.id}-core`} cx="50%" cy="50%" r="18%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
          </radialGradient>
        </defs>
        {Array.from({ length: count }, (_, index) => (
          <motion.path
            key={`${state.id}-thread-${index}`}
            fill="none"
            stroke={colors[index % colors.length]}
            strokeWidth={index % 3 === 0 ? 1.8 : 1.1}
            strokeLinecap="round"
            filter={`url(#${state.id}-thread-glow)`}
            animate={{
              d: [
                threadPath(state.width, state.height, index, count, 0),
                threadPath(state.width, state.height, index, count, 1),
                threadPath(state.width, state.height, index, count, 0),
              ],
              opacity: [0.45, 0.95, 0.45],
            }}
            transition={{
              duration: 5.2 / (speeds[index % speeds.length] ?? 1),
              repeat: Infinity,
              ease: "easeInOut",
              delay: index * 0.12,
            }}
          />
        ))}
        <circle
          cx={state.width / 2}
          cy={state.height / 2}
          r={Math.min(state.width, state.height) * 0.16}
          fill={`url(#${state.id}-core)`}
        />
      </svg>
    </div>
  );
}

function threadPath(width: number, height: number, index: number, count: number, phase: number): string {
  const cx = width / 2;
  const cy = height / 2;
  const angle = (index / count) * Math.PI;
  const reachX = width * 0.58;
  const reachY = height * 0.52;
  const wobble = (phase ? 1 : -1) * (18 + index * 6);
  const x1 = cx + Math.cos(angle) * reachX;
  const y1 = cy + Math.sin(angle) * reachY;
  const x2 = cx - Math.cos(angle) * reachX;
  const y2 = cy - Math.sin(angle) * reachY;
  return `M ${x1} ${y1} Q ${cx + wobble} ${cy - wobble * 0.4} ${x2} ${y2}`;
}
