import {
  ORIGINAL_PERMISSIONS,
  createComponentState,
  type ComponentType,
  type DesignComponent,
} from "../types/component";
import { nextId, resetIdCounters, syncIdCounter } from "../utils/ids";

export function createInitialRegistry(type: ComponentType = "strand"): DesignComponent[] {
  resetIdCounters({ [type]: 1, group: 0 });
  const id = `${type}_1`;
  return [
    {
      id,
      type,
      state: createComponentState(type, id),
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
  const prefixes = new Set(registry.map((component) => component.id.split("_")[0]));
  for (const prefix of prefixes) {
    syncIdCounter(
      prefix,
      registry.filter((component) => component.id.startsWith(`${prefix}_`)).map((component) => component.id),
    );
  }
  syncIdCounter("group", groupIds);
}

export function createDuplicateId(type: ComponentType = "strand"): string {
  return nextId(type);
}

export function createGroupId(): string {
  return nextId("group");
}
