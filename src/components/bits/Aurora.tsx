import { motion } from "motion/react";
import type { ComponentState } from "../../types/component";
import { ribbonSpeedsFor } from "../../utils/ribbons";

export function Aurora({ state }: { state: ComponentState }) {
  const colors = state.colors.length ? state.colors : ["#22C55E", "#06B6D4", "#8B5CF6"];
  const speed = ribbonSpeedsFor(colors.length, state.ribbonSpeeds)[0] ?? 1;

  return (
    <div className="relative overflow-hidden rounded-[18px]" style={{ width: state.width, height: state.height }}>
      {colors.map((color, index) => (
        <motion.div
          key={`${state.id}-aurora-${index}`}
          className="absolute inset-[-20%] rounded-full blur-3xl"
          style={{ background: `radial-gradient(circle at ${20 + index * 28}% 50%, ${color}99, transparent 55%)` }}
          animate={{
            x: [0, 30 + index * 12, -20, 0],
            y: [0, -18, 16, 0],
            opacity: [0.35, 0.7, 0.4, 0.35],
          }}
          transition={{ duration: 8 / speed, repeat: Infinity, ease: "easeInOut", delay: index * 0.4 }}
        />
      ))}
    </div>
  );
}
