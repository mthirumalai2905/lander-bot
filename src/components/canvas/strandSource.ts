export const STRAND_SOURCE = `import Strands from "./Strands";

export function Strand({ colors, count, speed }: StrandProps) {
  return (
    <div style={{ width: "100%", height: 280, position: "relative" }}>
      <Strands
        colors={colors}
        count={count}
        speed={speed}
        amplitude={1}
        waviness={1}
        thickness={0.7}
        glow={2.6}
        taper={3}
        spread={1}
        intensity={0.6}
        saturation={1.5}
        opacity={1}
        scale={1.5}
      />
    </div>
  );
}
`;
