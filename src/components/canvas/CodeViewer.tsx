import { sessionById } from "../../sessions/catalog";
import { useCanvasStore } from "../../store/canvasStore";
import { STRAND_SOURCE } from "./strandSource";

const SOURCE: Record<string, string> = {
  strand: STRAND_SOURCE,
  evileye: `export function EvilEye({ colors, speed }) {
  return <FieryEye colors={colors} speed={speed} />;
}`,
  aurora: `export function Aurora({ colors, speed }) {
  return <FlowingGradient colors={colors} speed={speed} />;
}`,
  particles: `export function Particles({ colors, count, speed }) {
  return <ParticleField colors={colors} count={count} speed={speed} />;
}`,
  beams: `export function Beams({ colors, speed }) {
  return colors.map((color) => <LightBeam color={color} speed={speed} />);
}`,
  plasma: `export function Plasma({ colors, speed }) {
  return <MorphingField colors={colors} speed={speed} />;
}`,
  threads: `export function WebThreads({ colors, speed }) {
  return <SineThreads colors={colors} speed={speed} />;
}`,
  animated: `export function AnimatedContent({ colors, speed }) {
  return <EnteringText text="Animate Me" colors={colors} speed={speed} />;
}`,
  antigravity: `export function Antigravity({ colors, speed }) {
  return <CapsuleField colors={colors} speed={speed} />;
}`,
  ascii: `export function AsciiText({ colors, speed }) {
  return <GlitchText text="ASCII" colors={colors} speed={speed} />;
}`,
};

export function CodeViewer() {
  const session = sessionById(useCanvasStore((state) => state.activeSessionId));
  return (
    <aside className="pointer-events-auto absolute right-5 top-5 z-20 w-[min(420px,46%)] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--code)]/94 shadow-[0_16px_48px_var(--shadow)] backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-2.5">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--dim)]">
            Component
          </p>
          <p className="text-[13px] font-medium text-[var(--text)]">{session.sourceName}</p>
        </div>
        <span className="rounded-full bg-[var(--chip-hover)] px-2 py-0.5 text-[11px] text-[var(--muted)]">
          source
        </span>
      </div>
      <pre className="max-h-[320px] overflow-auto px-4 py-3 font-mono text-[11.5px] leading-5 text-[var(--soft)]">
        {SOURCE[session.type] ?? STRAND_SOURCE}
      </pre>
    </aside>
  );
}
