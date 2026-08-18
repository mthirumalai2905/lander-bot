import { motion } from "motion/react";
import type { ComponentState } from "../../types/component";
import { ribbonSpeedsFor } from "../../utils/ribbons";

export function AsciiText({ state }: { state: ComponentState }) {
  const colors = state.colors.length ? state.colors : ["#FFFFFF", "#22D3EE", "#F472B6"];
  const speed = ribbonSpeedsFor(colors.length, state.ribbonSpeeds)[0] ?? 1;
  const [base = "#FFFFFF", cyan = "#22D3EE", magenta = "#F472B6"] = colors;
  const label = (state.text || "ASCII").slice(0, 48);
  const fontSize = Math.max(28, Math.min(84, (state.width * 0.9) / Math.max(label.length, 1) * 1.15));

  return (
    <div
      className="relative flex items-center justify-center overflow-hidden rounded-[18px] bg-[#050508]"
      style={{ width: state.width, height: state.height }}
    >
      <div
        className="relative max-w-[92%] select-none whitespace-nowrap font-mono font-black leading-none tracking-[-0.06em]"
        style={{ fontSize }}
      >
        <motion.span
          className="absolute inset-0 mix-blend-screen"
          style={{ color: cyan }}
          animate={{ x: [-4, 3, -2, -4], skewX: [0, 8, -6, 0] }}
          transition={{ duration: 1.6 / speed, repeat: Infinity, ease: "linear" }}
        >
          {label}
        </motion.span>
        <motion.span
          className="absolute inset-0 mix-blend-screen"
          style={{ color: magenta }}
          animate={{ x: [4, -3, 2, 4], skewX: [0, -7, 5, 0] }}
          transition={{ duration: 1.8 / speed, repeat: Infinity, ease: "linear" }}
        >
          {label}
        </motion.span>
        <motion.span
          className="relative"
          style={{
            color: base,
            textShadow: `0 0 18px ${cyan}66`,
          }}
          animate={{ x: [0, 2, -3, 0], clipPath: ["inset(0 0 0 0)", "inset(12% 0 0 0)", "inset(0 0 18% 0)", "inset(0 0 0 0)"] }}
          transition={{ duration: 2.1 / speed, repeat: Infinity, ease: "easeInOut" }}
        >
          {label}
        </motion.span>
      </div>
    </div>
  );
}
