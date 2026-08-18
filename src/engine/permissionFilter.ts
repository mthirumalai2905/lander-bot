import type { AttributePermissions, DesignComponent } from "../types/component";
import type { Operation } from "../types/operation";

export type PermissionError = {
  operation: Operation;
  targetId: string;
  attribute: keyof AttributePermissions | "protected";
  message: string;
};

const ATTRIBUTE_BY_TYPE: Partial<
  Record<Operation["type"], keyof AttributePermissions | "protected">
> = {
  move: "position",
  scale: "scale",
  rotate: "rotation",
  recolor: "colors",
  add_ribbon: "colors",
  remove_ribbon: "colors",
  flip: "rotation",
  set_opacity: "opacity",
  set_speed: "animation",
  delete: "delete",
};

export function isProtectedTarget(component: DesignComponent, operation: Operation): boolean {
  if (!component.protected) return false;
  return operation.type !== "duplicate" && operation.type !== "batch_duplicate";
}

export function filterOperation(
  operation: Operation,
  registry: DesignComponent[],
): { allowed: Operation | null; errors: PermissionError[] } {
  const errors: PermissionError[] = [];

  if (operation.type === "duplicate" || operation.type === "batch_duplicate") {
    const source = registry.find((component) => component.id === operation.sourceId);
    if (!source) {
      return {
        allowed: null,
        errors: [
          {
            operation,
            targetId: operation.sourceId,
            attribute: "duplicate",
            message: `I couldn't find the requested component.`,
          },
        ],
      };
    }
    if (!source.permissions.duplicate) {
      return {
        allowed: null,
        errors: [
          {
            operation,
            targetId: source.id,
            attribute: "duplicate",
            message: `Duplicating is currently locked for ${source.id}.`,
          },
        ],
      };
    }
    return { allowed: operation, errors: [] };
  }

  if (operation.type === "protect") {
    return { allowed: operation, errors: [] };
  }

  const attribute = ATTRIBUTE_BY_TYPE[operation.type];
  const targetIds = "targetIds" in operation ? operation.targetIds : [];
  const allowedIds: string[] = [];

  for (const targetId of targetIds) {
    const component = registry.find((item) => item.id === targetId);
    if (!component) {
      errors.push({
        operation,
        targetId,
        attribute: attribute ?? "position",
        message: `I couldn't find the requested component.`,
      });
      continue;
    }

    if (isProtectedTarget(component, operation)) {
      errors.push({
        operation,
        targetId,
        attribute: "protected",
        message: `I left ${component.id} unchanged because it is protected.`,
      });
      continue;
    }

    if (attribute && attribute !== "protected" && !component.permissions[attribute]) {
      errors.push({
        operation,
        targetId,
        attribute,
        message: permissionMessage(attribute, component.id),
      });
      continue;
    }

    allowedIds.push(targetId);
  }

  if (allowedIds.length === 0) {
    return { allowed: null, errors };
  }

  return {
    allowed: { ...operation, targetIds: allowedIds } as Operation,
    errors,
  };
}

export function permissionMessage(
  attribute: keyof AttributePermissions,
  id?: string,
): string {
  const label = {
    position: "Position editing",
    scale: "Scale editing",
    rotation: "Rotation editing",
    colors: "Color editing",
    opacity: "Opacity editing",
    dimensions: "Dimension editing",
    duplicate: "Duplicating",
    delete: "Deleting",
    animation: "Animation editing",
  }[attribute];

  return `${label} is currently locked${id ? ` for ${id}` : ""}, so I left it unchanged.`;
}
