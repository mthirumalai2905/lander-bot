import {
  DEFAULT_PERMISSIONS,
  type ComponentState,
  type DesignComponent,
} from "../types/component";
import type { CopySpec, Operation } from "../types/operation";
import { normalizeColor } from "../utils/colors";
import {
  clampRibbonSpeed,
  insertRibbonSpeed,
  removeRibbonSpeed,
  ribbonSpeedsFor,
} from "../utils/ribbons";
import { createDuplicateId, createGroupId } from "./componentRegistry";
import { positionFromSpec } from "./positioning";

export function heightForRibbonCount(count: number, currentHeight: number): number {
  return Math.max(currentHeight, 240, 200 + count * 24);
}

export interface EngineState {
  registry: DesignComponent[];
  groups: Record<string, string[]>;
}

export interface ExecuteResult {
  ok: boolean;
  state: EngineState;
  createdIds: string[];
  deletedIds: string[];
  modifiedIds: string[];
  error?: string;
}

function cloneState(state: EngineState): EngineState {
  return structuredClone(state);
}

function updateComponent(
  registry: DesignComponent[],
  id: string,
  updater: (component: DesignComponent) => DesignComponent,
): DesignComponent[] {
  return registry.map((component) => (component.id === id ? updater(component) : component));
}

function applyCopyOverrides(
  source: ComponentState,
  spec: CopySpec | undefined,
  index: number,
): ComponentState {
  const colors = spec?.colors?.map(normalizeColor) ?? [...source.colors];
  const next: ComponentState = {
    ...structuredClone(source),
    scale: spec?.scale ?? source.scale,
    rotation: spec?.rotation ?? source.rotation,
    opacity: spec?.opacity ?? source.opacity,
    colors,
    ribbonSpeeds: ribbonSpeedsFor(colors.length, spec?.ribbonSpeeds ?? source.ribbonSpeeds),
    flipX: spec?.flipX ?? source.flipX,
    flipY: spec?.flipY ?? source.flipY,
    width: spec?.width ?? source.width,
    height: spec?.height ?? heightForRibbonCount(colors.length, source.height),
    visible: true,
    text: spec?.text ?? source.text,
  };

  const position = positionFromSpec(source, next, spec?.position, index);
  next.x = position.x;
  next.y = position.y;
  return next;
}

function duplicateFrom(
  state: EngineState,
  sourceId: string,
  count: number,
  copies: CopySpec[] = [],
  grouped = true,
): ExecuteResult {
  const source = state.registry.find((component) => component.id === sourceId);
  if (!source) {
    return {
      ok: false,
      state,
      createdIds: [],
      deletedIds: [],
      modifiedIds: [],
      error: "I couldn't find the requested component.",
    };
  }

  const createdIds: string[] = [];
  const nextRegistry = [...state.registry];
  const groupId = grouped && count > 1 ? createGroupId() : count === 1 && grouped ? createGroupId() : undefined;
  const memberIds: string[] = [];

  for (let index = 0; index < count; index += 1) {
    const id = createDuplicateId(source.type);
    const spec = copies[index] ?? copies[0] ?? {};
    const nextState = applyCopyOverrides(source.state, spec, index);
    nextState.id = id;
    nextRegistry.push({
      id,
      type: source.type,
      state: nextState,
      permissions: { ...DEFAULT_PERMISSIONS },
      createdFrom: source.id,
      groupId,
      protected: false,
    });
    createdIds.push(id);
    memberIds.push(id);
  }

  const groups = { ...state.groups };
  if (groupId) {
    groups[groupId] = memberIds;
  }

  return {
    ok: true,
    state: { registry: nextRegistry, groups },
    createdIds,
    deletedIds: [],
    modifiedIds: [],
  };
}

export function executeOperation(operation: Operation, current: EngineState): ExecuteResult {
  const state = cloneState(current);

  switch (operation.type) {
    case "move": {
      const modifiedIds: string[] = [];
      let registry = state.registry;
      for (const targetId of operation.targetIds) {
        const component = registry.find((item) => item.id === targetId);
        if (!component) {
          return {
            ok: false,
            state: current,
            createdIds: [],
            deletedIds: [],
            modifiedIds: [],
            error: "I couldn't find the requested component.",
          };
        }

        const relativeSource = operation.relativeToId
          ? registry.find((item) => item.id === operation.relativeToId)?.state
          : component.state;

        let x = component.state.x;
        let y = component.state.y;

        if (operation.position && relativeSource) {
          const positioned = positionFromSpec(relativeSource, component.state, operation.position, 0);
          x = positioned.x;
          y = positioned.y;
        }
        if (operation.x !== undefined) x = operation.x;
        if (operation.y !== undefined) y = operation.y;
        if (operation.dx !== undefined) x += operation.dx;
        if (operation.dy !== undefined) y += operation.dy;

        registry = updateComponent(registry, targetId, (item) => ({
          ...item,
          state: { ...item.state, x, y },
        }));
        modifiedIds.push(targetId);
      }
      return {
        ok: true,
        state: { ...state, registry },
        createdIds: [],
        deletedIds: [],
        modifiedIds,
      };
    }

    case "scale": {
      let registry = state.registry;
      for (const targetId of operation.targetIds) {
        registry = updateComponent(registry, targetId, (item) => ({
          ...item,
          state: { ...item.state, scale: operation.scale },
        }));
      }
      return {
        ok: true,
        state: { ...state, registry },
        createdIds: [],
        deletedIds: [],
        modifiedIds: [...operation.targetIds],
      };
    }

    case "rotate": {
      let registry = state.registry;
      for (const targetId of operation.targetIds) {
        registry = updateComponent(registry, targetId, (item) => ({
          ...item,
          state: {
            ...item.state,
            rotation: operation.relative
              ? item.state.rotation + operation.rotation
              : operation.rotation,
          },
        }));
      }
      return {
        ok: true,
        state: { ...state, registry },
        createdIds: [],
        deletedIds: [],
        modifiedIds: [...operation.targetIds],
      };
    }

    case "recolor": {
      let registry = state.registry;
      for (const targetId of operation.targetIds) {
        registry = updateComponent(registry, targetId, (item) => {
          if (operation.replace) {
            const from = normalizeColor(operation.replace.from).toLowerCase();
            const to = normalizeColor(operation.replace.to);
            return {
              ...item,
              state: {
                ...item.state,
                colors: item.state.colors.map((color) =>
                  color.toLowerCase() === from ? to : color,
                ),
              },
            };
          }
          const colors = operation.colors.map(normalizeColor);
          return {
            ...item,
            state: {
              ...item.state,
              colors,
              ribbonSpeeds: ribbonSpeedsFor(colors.length, item.state.ribbonSpeeds),
              height: heightForRibbonCount(colors.length, item.state.height),
            },
          };
        });
      }
      return {
        ok: true,
        state: { ...state, registry },
        createdIds: [],
        deletedIds: [],
        modifiedIds: [...operation.targetIds],
      };
    }

    case "flip": {
      let registry = state.registry;
      for (const targetId of operation.targetIds) {
        registry = updateComponent(registry, targetId, (item) => ({
          ...item,
          state: {
            ...item.state,
            flipX:
              operation.axis === "x" || operation.axis === "both"
                ? !item.state.flipX
                : item.state.flipX,
            flipY:
              operation.axis === "y" || operation.axis === "both"
                ? !item.state.flipY
                : item.state.flipY,
          },
        }));
      }
      return {
        ok: true,
        state: { ...state, registry },
        createdIds: [],
        deletedIds: [],
        modifiedIds: [...operation.targetIds],
      };
    }

    case "set_opacity": {
      let registry = state.registry;
      for (const targetId of operation.targetIds) {
        registry = updateComponent(registry, targetId, (item) => ({
          ...item,
          state: { ...item.state, opacity: operation.opacity },
        }));
      }
      return {
        ok: true,
        state: { ...state, registry },
        createdIds: [],
        deletedIds: [],
        modifiedIds: [...operation.targetIds],
      };
    }

    case "delete": {
      const deletedIds = [...operation.targetIds];
      return {
        ok: true,
        state: {
          ...state,
          registry: state.registry.filter((component) => !deletedIds.includes(component.id)),
          groups: Object.fromEntries(
            Object.entries(state.groups).map(([groupId, memberIds]) => [
              groupId,
              memberIds.filter((id) => !deletedIds.includes(id)),
            ]),
          ),
        },
        createdIds: [],
        deletedIds,
        modifiedIds: [],
      };
    }

    case "duplicate":
      return duplicateFrom(
        state,
        operation.sourceId,
        operation.count ?? 1,
        operation.copies ?? [],
        operation.group ?? true,
      );

    case "batch_duplicate":
      return duplicateFrom(
        state,
        operation.sourceId,
        operation.count,
        operation.copies ?? [],
        operation.group ?? true,
      );

    case "protect": {
      let registry = state.registry;
      for (const targetId of operation.targetIds) {
        registry = updateComponent(registry, targetId, (item) => ({
          ...item,
          protected: operation.protected,
        }));
      }
      return {
        ok: true,
        state: { ...state, registry },
        createdIds: [],
        deletedIds: [],
        modifiedIds: [...operation.targetIds],
      };
    }

    case "add_ribbon": {
      const color = normalizeColor(operation.color);
      const placement = operation.placement ?? "end";
      let registry = state.registry;
      for (const targetId of operation.targetIds) {
        registry = updateComponent(registry, targetId, (item) => {
          if (item.state.colors.length >= 12) return item;
          const colors =
            placement === "start"
              ? [color, ...item.state.colors]
              : [...item.state.colors, color];
          return {
            ...item,
            state: {
              ...item.state,
              colors,
              ribbonSpeeds: insertRibbonSpeed(
                ribbonSpeedsFor(item.state.colors.length, item.state.ribbonSpeeds),
                placement,
                1,
              ),
              height: heightForRibbonCount(colors.length, item.state.height),
            },
          };
        });
      }
      return {
        ok: true,
        state: { ...state, registry },
        createdIds: [],
        deletedIds: [],
        modifiedIds: [...operation.targetIds],
      };
    }

    case "remove_ribbon": {
      let registry = state.registry;
      for (const targetId of operation.targetIds) {
        registry = updateComponent(registry, targetId, (item) => {
          if (item.state.colors.length <= 1) return item;
          const colors = [...item.state.colors];
          const placement = operation.placement ?? "end";
          if (operation.index !== undefined && operation.index < colors.length) {
            colors.splice(operation.index, 1);
          } else if (placement === "start") {
            colors.shift();
          } else {
            colors.pop();
          }
          return {
            ...item,
            state: {
              ...item.state,
              colors,
              ribbonSpeeds: removeRibbonSpeed(
                ribbonSpeedsFor(item.state.colors.length, item.state.ribbonSpeeds),
                placement,
                operation.index,
              ),
            },
          };
        });
      }
      return {
        ok: true,
        state: { ...state, registry },
        createdIds: [],
        deletedIds: [],
        modifiedIds: [...operation.targetIds],
      };
    }

    case "source_edit":
      return {
        ok: true,
        state,
        createdIds: [],
        deletedIds: [],
        modifiedIds: state.registry.map((component) => component.id),
      };

    case "set_text": {
      const nextText = operation.text.trim().slice(0, 48);
      if (!nextText) {
        return {
          ok: false,
          state: current,
          createdIds: [],
          deletedIds: [],
          modifiedIds: [],
          error: "I need some text to put on the component.",
        };
      }
      let registry = state.registry;
      for (const targetId of operation.targetIds) {
        registry = updateComponent(registry, targetId, (item) => ({
          ...item,
          state: { ...item.state, text: nextText },
        }));
      }
      return {
        ok: true,
        state: { ...state, registry },
        createdIds: [],
        deletedIds: [],
        modifiedIds: [...operation.targetIds],
      };
    }

    case "set_speed": {
      let registry = state.registry;
      for (const targetId of operation.targetIds) {
        registry = updateComponent(registry, targetId, (item) => {
          const current = ribbonSpeedsFor(item.state.colors.length, item.state.ribbonSpeeds);
          const applyValue = (existing: number, next: number) =>
            clampRibbonSpeed(operation.relative ? existing * next : next);

          let ribbonSpeeds = [...current];
          if (operation.ribbons?.length) {
            for (const ribbon of operation.ribbons) {
              const index = ribbon.index - 1;
              if (index >= 0 && index < ribbonSpeeds.length) {
                ribbonSpeeds[index] = applyValue(ribbonSpeeds[index], ribbon.speed);
              }
            }
          } else if (operation.ribbonIndex !== undefined) {
            const index = operation.ribbonIndex - 1;
            if (index >= 0 && index < ribbonSpeeds.length) {
              ribbonSpeeds[index] = applyValue(ribbonSpeeds[index], operation.speed ?? 1);
            }
          } else {
            ribbonSpeeds = ribbonSpeeds.map((speed) => applyValue(speed, operation.speed ?? 1));
          }

          return {
            ...item,
            state: { ...item.state, ribbonSpeeds },
          };
        });
      }
      return {
        ok: true,
        state: { ...state, registry },
        createdIds: [],
        deletedIds: [],
        modifiedIds: [...operation.targetIds],
      };
    }
  }
}
