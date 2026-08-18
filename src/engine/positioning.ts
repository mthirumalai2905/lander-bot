import type { ComponentState } from "../types/component";
import type { Relation, RelativePosition } from "../types/operation";

export function visualSize(source: ComponentState) {
  return {
    width: source.width * source.scale,
    height: source.height * source.scale,
  };
}

export function calculateRelativePosition(
  source: ComponentState,
  targetSize: { width: number; height: number },
  relation: Relation,
  spacing = 40,
): { x: number; y: number } {
  const sourceSize = visualSize(source);
  const cx = source.x + sourceSize.width / 2 - targetSize.width / 2;
  const cy = source.y + sourceSize.height / 2 - targetSize.height / 2;

  switch (relation) {
    case "above":
    case "top":
      return { x: source.x, y: source.y - targetSize.height - spacing };
    case "below":
    case "bottom":
      return { x: source.x, y: source.y + sourceSize.height + spacing };
    case "left":
      return { x: source.x - targetSize.width - spacing, y: source.y };
    case "right":
    case "beside":
    case "next_to":
      return { x: source.x + sourceSize.width + spacing, y: source.y };
    case "centered":
      return { x: cx, y: cy };
    case "upper_left":
      return {
        x: source.x - targetSize.width - spacing,
        y: source.y - targetSize.height - spacing,
      };
    case "upper_right":
      return {
        x: source.x + sourceSize.width + spacing,
        y: source.y - targetSize.height - spacing,
      };
    case "lower_left":
      return {
        x: source.x - targetSize.width - spacing,
        y: source.y + sourceSize.height + spacing,
      };
    case "lower_right":
      return {
        x: source.x + sourceSize.width + spacing,
        y: source.y + sourceSize.height + spacing,
      };
    default:
      return { x: source.x, y: source.y + sourceSize.height + spacing };
  }
}

export function positionFromSpec(
  source: ComponentState,
  target: Pick<ComponentState, "width" | "height" | "scale">,
  spec?: RelativePosition,
  index = 0,
): { x: number; y: number } {
  const targetSize = {
    width: target.width * target.scale,
    height: target.height * target.scale,
  };

  if (spec?.x !== undefined && spec?.y !== undefined) {
    return { x: spec.x, y: spec.y };
  }

  const relation = spec?.relation ?? "below";
  const spacing = spec?.spacing ?? 40;
  const stackedSpacing =
    relation === "below" || relation === "bottom" || relation === "above" || relation === "top"
      ? spacing + index * (targetSize.height + spacing)
      : relation === "left" || relation === "right" || relation === "beside" || relation === "next_to"
        ? spacing + index * (targetSize.width + spacing)
        : spacing;

  const base = calculateRelativePosition(source, targetSize, relation, stackedSpacing);
  return {
    x: spec?.x ?? base.x,
    y: spec?.y ?? base.y,
  };
}
