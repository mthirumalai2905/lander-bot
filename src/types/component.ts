export type ComponentType = "strand";

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

export function createStrandState(
  id: string,
  overrides: Partial<ComponentState> = {},
): ComponentState {
  return {
    id,
    type: "strand",
    x: 72,
    y: 88,
    scale: 1,
    rotation: 0,
    opacity: 1,
    width: 560,
    height: 280,
    colors: ["#F97316", "#7C3AED", "#06B6D4"],
    ribbonSpeeds: [1, 1, 1],
    blur: 0,
    visible: true,
    flipX: false,
    flipY: false,
    ...overrides,
  };
}
