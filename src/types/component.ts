export type ComponentType =
  | "strand"
  | "lightning"
  | "aurora"
  | "particles"
  | "beams"
  | "plasma"
  | "threads"
  | "animated"
  | "antigravity"
  | "ascii"
  | "evileye";

export interface ComponentState {
  id: string;
  type: ComponentType;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
  width: number;
  height: number;
  colors: string[];
  ribbonSpeeds: number[];
  blur: number;
  visible: boolean;
  flipX: boolean;
  flipY: boolean;
  text: string;
}

export interface AttributePermissions {
  position: boolean;
  scale: boolean;
  rotation: boolean;
  colors: boolean;
  opacity: boolean;
  dimensions: boolean;
  duplicate: boolean;
  delete: boolean;
  animation: boolean;
}

export interface DesignComponent {
  id: string;
  type: ComponentType;
  state: ComponentState;
  permissions: AttributePermissions;
  createdFrom?: string;
  groupId?: string;
  protected?: boolean;
}

export interface ComponentGroup {
  id: string;
  sourceId: string;
  memberIds: string[];
}

export const DEFAULT_PERMISSIONS: AttributePermissions = {
  position: true,
  scale: true,
  rotation: true,
  colors: true,
  opacity: true,
  dimensions: true,
  duplicate: true,
  delete: true,
  animation: true,
};

export const ORIGINAL_PERMISSIONS: AttributePermissions = {
  position: false,
  scale: true,
  rotation: true,
  colors: true,
  opacity: true,
  dimensions: true,
  duplicate: true,
  delete: false,
  animation: true,
};

const DEFAULTS: Record<ComponentType, Partial<ComponentState>> = {
  strand: {
    colors: ["#F97316", "#7C3AED", "#06B6D4"],
  },
  lightning: {
    colors: ["#93C5FD", "#38BDF8", "#E0F2FE"],
  },
  aurora: {
    colors: ["#22C55E", "#06B6D4", "#8B5CF6"],
  },
  particles: {
    colors: ["#F97316", "#F43F5E", "#FBBF24"],
  },
  beams: {
    colors: ["#38BDF8", "#A78BFA", "#F472B6"],
  },
  plasma: {
    colors: ["#EC4899", "#8B5CF6", "#22D3EE"],
  },
  threads: {
    colors: ["#A78BFA", "#C4B5FD", "#FFFFFF"],
  },
  animated: {
    colors: ["#E5E7EB", "#F8FAFC", "#CBD5E1"],
    text: "Animate Me",
  },
  antigravity: {
    colors: ["#FFFFFF", "#E5E7EB", "#CBD5E1"],
  },
  ascii: {
    colors: ["#FFFFFF", "#22D3EE", "#F472B6"],
    text: "ASCII",
  },
  evileye: {
    colors: ["#FFF7ED", "#F59E0B", "#EF4444"],
  },
};

export function createComponentState(
  type: ComponentType,
  id: string,
  overrides: Partial<ComponentState> = {},
): ComponentState {
  const { type: _type, id: _id, ...rest } = overrides;
  return {
    x: 72,
    y: 88,
    scale: 1,
    rotation: 0,
    opacity: 1,
    width: 560,
    height: 280,
    colors: DEFAULTS[type].colors ?? ["#F97316", "#7C3AED", "#06B6D4"],
    ribbonSpeeds: [1, 1, 1],
    blur: 0,
    visible: true,
    flipX: false,
    flipY: false,
    text: DEFAULTS[type].text ?? "",
    ...rest,
    type,
    id,
  };
}

export function defaultTextFor(type: ComponentType): string {
  return DEFAULTS[type].text ?? "";
}

export const createStrandState = (
  id: string,
  overrides: Partial<ComponentState> = {},
): ComponentState => createComponentState("strand", id, overrides);
