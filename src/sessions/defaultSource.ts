import type { RibbonShape } from "../runtime/kit";
import type { ComponentType } from "../types/component";

export const BUILTIN_SOURCE = `import { SessionBuiltin } from "@lander/kit";

export default function Visual({ state }) {
  return <SessionBuiltin state={state} />;
}
`;

export const WAVE_RIBBON_SOURCE = `import { RibbonField } from "@lander/kit";

export default function Visual({ state }) {
  return <RibbonField state={state} shape="wave" />;
}
`;

export const HEART_RIBBON_SOURCE = `import { RibbonField } from "@lander/kit";

export default function Visual({ state }) {
  return <RibbonField state={state} shape="heart" />;
}
`;

export const STAR_RIBBON_SOURCE = `import { RibbonField } from "@lander/kit";

export default function Visual({ state }) {
  return <RibbonField state={state} shape="star" />;
}
`;

export const DNA_RIBBON_SOURCE = `import { RibbonField } from "@lander/kit";

export default function Visual({ state }) {
  return <RibbonField state={state} shape="dna" />;
}
`;

export const HEART_SOURCE = `import { HeartFrame, SessionBuiltin } from "@lander/kit";

export default function Visual({ state }) {
  return (
    <HeartFrame state={state}>
      <SessionBuiltin state={state} />
    </HeartFrame>
  );
}
`;

export const STAR_SOURCE = `import { StarFrame, SessionBuiltin } from "@lander/kit";

export default function Visual({ state }) {
  return (
    <StarFrame state={state}>
      <SessionBuiltin state={state} />
    </StarFrame>
  );
}
`;

export const STAR_PARTICLE_SOURCE = `import { StarField, StarFrame } from "@lander/kit";

export default function Visual({ state }) {
  return (
    <StarFrame state={state}>
      <StarField state={state} />
    </StarFrame>
  );
}
`;

export function ribbonSourceFor(shape: RibbonShape): string {
  return `import { RibbonField } from "@lander/kit";

export default function Visual({ state }) {
  return <RibbonField state={state} shape="${shape}" />;
}
`;
}

export function shapeFromSource(source: string): RibbonShape | null {
  const match = source.match(
    /shape="(wave|heart|star|dna|square|circle|ellipse|parabola|triangle|diamond|hexagon)"/,
  );
  return match ? (match[1] as RibbonShape) : null;
}

export function shapeFromMessage(
  message: string,
  currentShape: RibbonShape | null = null,
): RibbonShape | null {
  if (/\b(dna|helix|helical|helixe?s?|double helix)\b/i.test(message)) return "dna";
  if (/\bstars?\b/i.test(message)) return "star";
  if (/\bheart\b/i.test(message)) return "heart";
  if (/\b(square|sqaure|sauare|box|rect(angle)?)\b/i.test(message)) return "square";
  if (/\b(ellipse|ellipses|elliptical|elliptic|elipse|eliptical|elipses|oval|oblong|egg[- ]?shaped)\b/i.test(message)) {
    return "ellipse";
  }
  if (/\b(parabola|parabolas|parabolic|parabole|parobola|parabolla)\b/i.test(message)) {
    return "parabola";
  }
  if (/\b(circle|round|ring|loop)\b/i.test(message)) return "circle";
  if (/\btriangles?\b/i.test(message)) return "triangle";
  if (/\b(diamond|rhombus)\b/i.test(message)) return "diamond";
  if (/\b(hexagons?|hex)\b/i.test(message)) return "hexagon";
  if (
    /\b(bulge|bulging|puff|swell|stretch|wider|widen|flatten)\b/i.test(message) &&
    /\b(left|right|side|sides|end|ends|horizontal)\b/i.test(message)
  ) {
    return "ellipse";
  }
  if (
    (currentShape === "circle" || currentShape === "ellipse" || currentShape === "wave") &&
    /\b(stretch|wider|flatten|more oval|less round|bulge|bulging)\b/i.test(message)
  ) {
    return "ellipse";
  }
  return null;
}

export function sourceForShape(
  message: string,
  type: ComponentType,
  currentSource?: string,
): string | null {
  const shape = shapeFromMessage(message, shapeFromSource(currentSource ?? ""));
  if (!shape || shape === "wave") return null;
  if (type !== "strand") {
    if (shape === "star") return STAR_PARTICLE_SOURCE;
    if (shape === "heart") return HEART_SOURCE;
  }
  return ribbonSourceFor(shape);
}

export function defaultSourceFor(type: ComponentType): string {
  return type === "strand" ? WAVE_RIBBON_SOURCE : BUILTIN_SOURCE;
}
