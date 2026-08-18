import type { ComponentType } from "../types/component";

export type SessionId =
  | "strands"
  | "aurora"
  | "particles"
  | "beams"
  | "plasma"
  | "threads"
  | "animated"
  | "antigravity"
  | "ascii"
  | "evileye";

export interface SessionDefinition {
  id: SessionId;
  type: ComponentType;
  title: string;
  blurb: string;
  sourceName: string;
}

export const SESSIONS: SessionDefinition[] = [
  {
    id: "strands",
    type: "strand",
    title: "Strands",
    blurb: "Glowing woven ribbons",
    sourceName: "Strands.tsx",
  },
  {
    id: "aurora",
    type: "aurora",
    title: "Aurora",
    blurb: "Flowing northern lights",
    sourceName: "Aurora.tsx",
  },
  {
    id: "particles",
    type: "particles",
    title: "Particles",
    blurb: "Drifting particle field",
    sourceName: "Particles.tsx",
  },
  {
    id: "beams",
    type: "beams",
    title: "Beams",
    blurb: "Crossing light ribbons",
    sourceName: "Beams.tsx",
  },
  {
    id: "plasma",
    type: "plasma",
    title: "Plasma",
    blurb: "Morphing energy field",
    sourceName: "Plasma.tsx",
  },
  {
    id: "threads",
    type: "threads",
    title: "Web Threads",
    blurb: "Glowing sine threads",
    sourceName: "WebThreads.tsx",
  },
  {
    id: "animated",
    type: "animated",
    title: "Animated Content",
    blurb: "Text that enters on a loop",
    sourceName: "AnimatedContent.tsx",
  },
  {
    id: "antigravity",
    type: "antigravity",
    title: "Antigravity",
    blurb: "Floating capsule field",
    sourceName: "Antigravity.tsx",
  },
  {
    id: "ascii",
    type: "ascii",
    title: "ASCII Text",
    blurb: "Glitchy chromatic letters",
    sourceName: "AsciiText.tsx",
  },
  {
    id: "evileye",
    type: "evileye",
    title: "Evil Eye",
    blurb: "Fiery slit-pupil background",
    sourceName: "EvilEye.tsx",
  },
];

export function isSessionId(id: string): id is SessionId {
  return SESSIONS.some((session) => session.id === id);
}

export function sessionById(id: SessionId | string): SessionDefinition {
  return SESSIONS.find((session) => session.id === id) ?? SESSIONS[0];
}

export function sessionByType(type: ComponentType): SessionDefinition {
  return SESSIONS.find((session) => session.type === type) ?? SESSIONS[0];
}
