import { motion } from "motion/react";
import type { ComponentState } from "../../types/component";
import { ribbonSpeedsFor } from "../../utils/ribbons";

export function AnimatedContent({ state }: { state: ComponentState }) {
  const colors = state.colors.length ? state.colors : ["#E5E7EB"];
  const speed = ribbonSpeedsFor(colors.length, state.ribbonSpeeds)[0] ?? 1;
  const letters = (state.text || "Animate Me").slice(0, 48).split("");

  return (
    <div
      className="relative flex items-center justify-center overflow-hidden rounded-[18px] bg-[#050508]"
      style={{ width: state.width, height: state.height }}
    >
      <div className="flex items-end gap-[0.08em] text-[42px] font-medium tracking-[-0.03em]">
        {letters.map((letter, index) => (
          <motion.span
            key={`${state.id}-letter-${index}`}
            className="inline-block"
            style={{ color: colors[index % colors.length] }}
            animate={{ y: [18, 0, 0, -10], opacity: [0, 1, 1, 0] }}
            transition={{
              duration: 2.6 / speed,
              repeat: Infinity,
              ease: "easeInOut",
              delay: index * 0.05,
            }}
          >
            {letter === " " ? "\u00A0" : letter}
          </motion.span>
        ))}
      </div>
    </div>
  );
}
