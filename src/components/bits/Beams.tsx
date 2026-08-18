import { motion } from "motion/react";
import type { ComponentState } from "../../types/component";
import { ribbonSpeedsFor } from "../../utils/ribbons";

export function Beams({ state }: { state: ComponentState }) {
  const colors = state.colors.length ? state.colors : ["#38BDF8", "#A78BFA", "#F472B6"];
  const speeds = ribbonSpeedsFor(colors.length, state.ribbonSpeeds);

  return (
    <div className="relative overflow-hidden rounded-[18px]" style={{ width: state.width, height: state.height }}>
      {colors.map((color, index) => (
        <motion.div
          key={`${state.id}-beam-${index}`}
          className="absolute left-[-20%] top-1/2 h-[2px] w-[140%] origin-center"
          style={{
            background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
            boxShadow: `0 0 18px ${color}`,
            rotate: `${-18 + index * 18}deg`,
          }}
          animate={{ opacity: [0.25, 0.95, 0.25], scaleX: [0.7, 1.05, 0.7] }}
          transition={{
            duration: 3.2 / (speeds[index] ?? 1),
            repeat: Infinity,
            ease: "easeInOut",
            delay: index * 0.25,
          }}
        />
      ))}
    </div>
  );
}
