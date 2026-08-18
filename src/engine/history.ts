import type { DesignComponent } from "../types/component";
import type { OperationHistoryEntry } from "../types/conversation";
import type { Operation } from "../types/operation";
import { createLocalId } from "../utils/ids";

export function captureStates(
  registry: DesignComponent[],
  ids: string[],
): Record<string, DesignComponent["state"] | null> {
  const unique = [...new Set(ids)];
  const snapshot: Record<string, DesignComponent["state"] | null> = {};
  for (const id of unique) {
    const component = registry.find((item) => item.id === id);
    snapshot[id] = component ? structuredClone(component.state) : null;
  }
  return snapshot;
}

export function captureProtected(
  registry: DesignComponent[],
  ids: string[],
): Record<string, boolean> {
  const values: Record<string, boolean> = {};
  for (const id of ids) {
    const component = registry.find((item) => item.id === id);
    values[id] = Boolean(component?.protected);
  }
  return values;
}

export function createHistoryEntry(args: {
  operations: Operation[];
  previous: DesignComponent[];
  next: DesignComponent[];
  createdIds: string[];
  deletedIds: string[];
  previousGroups: Record<string, string[]>;
  nextGroups: Record<string, string[]>;
}): OperationHistoryEntry {
  const affected = [
    ...args.createdIds,
    ...args.deletedIds,
    ...args.previous.map((component) => component.id),
    ...args.next.map((component) => component.id),
  ];

  return {
    id: createLocalId("hist"),
    timestamp: Date.now(),
    operations: args.operations,
    previousState: captureStates(args.previous, affected),
    nextState: captureStates(args.next, affected),
    createdIds: args.createdIds,
    deletedIds: args.deletedIds,
    previousProtected: captureProtected(args.previous, affected),
    nextProtected: captureProtected(args.next, affected),
    previousGroups: structuredClone(args.previousGroups),
    nextGroups: structuredClone(args.nextGroups),
  };
}

export function applyUndo(
  registry: DesignComponent[],
  groups: Record<string, string[]>,
  entry: OperationHistoryEntry,
): { registry: DesignComponent[]; groups: Record<string, string[]> } {
  let nextRegistry = structuredClone(registry);
  const nextGroups = structuredClone(entry.previousGroups);

  for (const id of entry.createdIds) {
    nextRegistry = nextRegistry.filter((component) => component.id !== id);
  }

  for (const id of entry.deletedIds) {
    const previous = registry.find((component) => component.id === id);
    const state = entry.previousState[id];
    if (!state) continue;
    if (previous) {
      nextRegistry = nextRegistry.map((component) =>
        component.id === id ? { ...component, state: structuredClone(state) } : component,
      );
    } else {
      nextRegistry.push({
        id,
        type: state.type,
        state: structuredClone(state),
        permissions: {
          position: true,
          scale: true,
          rotation: true,
          colors: true,
          opacity: true,
          dimensions: true,
          duplicate: true,
          delete: true,
          animation: true,
        },
        protected: entry.previousProtected[id] ?? false,
      });
    }
  }

  nextRegistry = nextRegistry.map((component) => {
    if (entry.createdIds.includes(component.id)) return component;
    const previous = entry.previousState[component.id];
    if (!previous) return component;
    return {
      ...component,
      state: structuredClone(previous),
      protected: entry.previousProtected[component.id] ?? component.protected,
    };
  });

  void groups;
  return { registry: nextRegistry, groups: nextGroups };
}
