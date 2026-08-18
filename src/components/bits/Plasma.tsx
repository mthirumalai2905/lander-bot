import { motion } from "motion/react";
import type { ComponentState } from "../../types/component";
import { ribbonSpeedsFor } from "../../utils/ribbons";

export function Plasma({ state }: { state: ComponentState }) {
  const colors = state.colors.length ? state.colors : ["#EC4899", "#8B5CF6", "#22D3EE"];
  const speed = ribbonSpeedsFor(colors.length, state.ribbonSpeeds)[0] ?? 1;

  return (
    <div className="relative overflow-hidden rounded-[18px]" style={{ width: state.width, height: state.height }}>
      <motion.div
        className="absolute inset-[-30%]"
        style={{
          background: `conic-gradient(from 90deg, ${colors.join(", ")}, ${colors[0]})`,
          filter: "blur(28px) saturate(1.4)",
        }}
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 14 / speed, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}
