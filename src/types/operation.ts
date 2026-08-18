export type Relation =
  | "above"
  | "below"
  | "left"
  | "right"
  | "beside"
  | "next_to"
  | "centered"
  | "top"
  | "bottom"
  | "upper_left"
  | "upper_right"
  | "lower_left"
  | "lower_right";

export interface RelativePosition {
  relation: Relation;
  spacing?: number;
  x?: number;
  y?: number;
}

export interface CopySpec {
  position?: RelativePosition;
  rotation?: number;
  scale?: number;
  colors?: string[];
  opacity?: number;
  flipX?: boolean;
  flipY?: boolean;
  width?: number;
  height?: number;
  ribbonSpeeds?: number[];
  text?: string;
}

export interface MoveOperation {
  type: "move";
  targetIds: string[];
  x?: number;
  y?: number;
  dx?: number;
  dy?: number;
  position?: RelativePosition;
  relativeToId?: string;
}

export interface ScaleOperation {
  type: "scale";
  targetIds: string[];
  scale: number;
}

export interface RotateOperation {
  type: "rotate";
  targetIds: string[];
  rotation: number;
  relative?: boolean;
}

export interface RecolorOperation {
  type: "recolor";
  targetIds: string[];
  colors: string[];
  replace?: { from: string; to: string };
}

export interface FlipOperation {
  type: "flip";
  targetIds: string[];
  axis: "x" | "y" | "both";
}

export interface DuplicateOperation {
  type: "duplicate";
  sourceId: string;
  count: number;
  copies?: CopySpec[];
  group?: boolean;
}

export interface BatchDuplicateOperation {
  type: "batch_duplicate";
  sourceId: string;
  count: number;
  copies?: CopySpec[];
  group?: boolean;
}

export interface DeleteOperation {
  type: "delete";
  targetIds: string[];
}

export interface OpacityOperation {
  type: "set_opacity";
  targetIds: string[];
  opacity: number;
}

export interface ProtectOperation {
  type: "protect";
  targetIds: string[];
  protected: boolean;
}

export interface AddRibbonOperation {
  type: "add_ribbon";
  targetIds: string[];
  color: string;
  placement?: "start" | "end";
}

export interface RemoveRibbonOperation {
  type: "remove_ribbon";
  targetIds: string[];
  placement?: "start" | "end";
  index?: number;
}

export interface RibbonSpeedSpec {
  index: number;
  speed: number;
}

export interface SetSpeedOperation {
  type: "set_speed";
  targetIds: string[];
  speed?: number;
  ribbonIndex?: number;
  ribbons?: RibbonSpeedSpec[];
  relative?: boolean;
}

export interface SetTextOperation {
  type: "set_text";
  targetIds: string[];
  text: string;
}

export type Operation =
  | MoveOperation
  | ScaleOperation
  | RotateOperation
  | RecolorOperation
  | FlipOperation
  | DuplicateOperation
  | BatchDuplicateOperation
  | DeleteOperation
  | OpacityOperation
  | ProtectOperation
  | AddRibbonOperation
  | RemoveRibbonOperation
  | SetSpeedOperation
  | SetTextOperation;

export interface AppliedChange {
  ok: boolean;
  text: string;
}

export interface AiResponse {
  message: string;
  operations: Operation[];
  protectIds?: string[];
  appliedChanges?: string[];
}
