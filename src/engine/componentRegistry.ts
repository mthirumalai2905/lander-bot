import {
  ORIGINAL_PERMISSIONS,
  createStrandState,
  type DesignComponent,
} from "../types/component";
import { nextId, resetIdCounters, syncIdCounter } from "../utils/ids";

export function createInitialRegistry(): DesignComponent[] {
  resetIdCounters({ strand: 1, group: 0 });
  const id = "strand_1";
  return [
    {
      id,
      type: "strand",
      state: createStrandState(id),
      permissions: { ...ORIGINAL_PERMISSIONS },
      protected: false,
    },
  ];
}

export function findComponent(
  registry: DesignComponent[],
  id: string,
): DesignComponent | undefined {
  return registry.find((component) => component.id === id);
}

export function cloneRegistry(registry: DesignComponent[]): DesignComponent[] {
  return structuredClone(registry);
}

export function syncRegistryIds(registry: DesignComponent[], groupIds: string[] = []): void {
  syncIdCounter(
    "strand",
    registry.map((component) => component.id),
  );
  syncIdCounter("group", groupIds);
}

export function createDuplicateId(): string {
  return nextId("strand");
}

export function createGroupId(): string {
  return nextId("group");
}
