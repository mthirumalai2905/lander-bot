import type { ComponentState } from "../../types/component";
import { ribbonSpeedsFor } from "../../utils/ribbons";
import Strands from "./Strands";

interface StrandProps {
  state: ComponentState;
}

export function Strand({ state }: StrandProps) {
  const colors =
    state.colors.length > 0 ? state.colors : ["#F97316", "#7C3AED", "#06B6D4"];
  const speeds = ribbonSpeedsFor(colors.length, state.ribbonSpeeds);
  const averageSpeed = speeds.reduce((sum, value) => sum + value, 0) / speeds.length;

  return (
    <div
      className="relative overflow-hidden rounded-[18px]"
      style={{
        width: state.width,
        height: state.height,
        filter: state.blur > 0 ? `blur(${state.blur}px)` : undefined,
      }}
    >
      <Strands
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
        scale={1.5}
        glass={false}
      />
    </div>
  );
}
