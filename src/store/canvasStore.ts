import { create } from "zustand";
import { createInitialRegistry, syncRegistryIds } from "../engine/componentRegistry";
import { applyUndo } from "../engine/history";
import { executeBatch } from "../engine/batchExecutor";
import type { AttributePermissions, DesignComponent } from "../types/component";
import type { OperationHistoryEntry } from "../types/conversation";
import type { AppliedChange, Operation } from "../types/operation";
import { ribbonSpeedsFor } from "../utils/ribbons";

function hydrateRegistry(registry: DesignComponent[]): DesignComponent[] {
  return registry.map((component) => ({
    ...component,
    permissions: {
      ...component.permissions,
      animation: component.permissions.animation ?? true,
    },
    state: {
      ...component.state,
      ribbonSpeeds: ribbonSpeedsFor(
        component.state.colors.length,
        component.state.ribbonSpeeds,
      ),
      width: Math.max(component.state.width, 520),
      height: Math.max(component.state.height, 240),
    },
  }));
}

const STORAGE_KEY = "lander-bot-canvas";

interface CanvasStore {
  registry: DesignComponent[];
  groups: Record<string, string[]>;
  selectedComponentIds: string[];
  activeComponentId: string | null;
  lastCreatedComponentIds: string[];
  lastModifiedComponentIds: string[];
  lastCreatedGroupId: string | null;
  operationHistory: OperationHistoryEntry[];
  zoom: number;
  showCode: boolean;
  select: (ids: string[], additive?: boolean) => void;
  clearSelection: () => void;
  togglePermission: (id: string, key: keyof AttributePermissions) => void;
  setZoom: (zoom: number) => void;
  setShowCode: (show: boolean) => void;
  applyOperations: (operations: Operation[]) => {
    ok: boolean;
    applied: AppliedChange[];
    createdIds: string[];
    modifiedIds: string[];
    message?: string;
  };
  undo: () => boolean;
  reset: () => void;
}

function persist(state: Pick<
  CanvasStore,
  | "registry"
  | "groups"
  | "selectedComponentIds"
  | "activeComponentId"
  | "lastCreatedComponentIds"
  | "lastModifiedComponentIds"
  | "lastCreatedGroupId"
  | "operationHistory"
  | "zoom"
  | "showCode"
>) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      registry: state.registry,
      groups: state.groups,
      selectedComponentIds: state.selectedComponentIds,
      activeComponentId: state.activeComponentId,
      lastCreatedComponentIds: state.lastCreatedComponentIds,
      lastModifiedComponentIds: state.lastModifiedComponentIds,
      lastCreatedGroupId: state.lastCreatedGroupId,
      operationHistory: state.operationHistory,
      zoom: state.zoom,
      showCode: state.showCode,
    }),
  );
}

function loadPersisted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CanvasStore>;
    if (!parsed.registry?.length) return null;
    syncRegistryIds(parsed.registry, Object.keys(parsed.groups ?? {}));
    return {
      ...parsed,
      registry: hydrateRegistry(parsed.registry),
    };
  } catch {
    return null;
  }
}

const persisted = typeof localStorage !== "undefined" ? loadPersisted() : null;
const initialRegistry = persisted?.registry ?? createInitialRegistry();

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  registry: initialRegistry,
  groups: persisted?.groups ?? {},
  selectedComponentIds: persisted?.selectedComponentIds ?? (initialRegistry[0] ? [initialRegistry[0].id] : []),
  activeComponentId: persisted?.activeComponentId ?? initialRegistry[0]?.id ?? null,
  lastCreatedComponentIds: persisted?.lastCreatedComponentIds ?? [],
  lastModifiedComponentIds: persisted?.lastModifiedComponentIds ?? [],
  lastCreatedGroupId: persisted?.lastCreatedGroupId ?? null,
  operationHistory: persisted?.operationHistory ?? [],
  zoom: persisted?.zoom ?? 1,
  showCode: persisted?.showCode ?? false,

  select: (ids, additive = false) => {
    set((state) => {
      const nextIds = additive
        ? [...new Set([...state.selectedComponentIds, ...ids])]
        : ids;
      const next = {
        selectedComponentIds: nextIds,
        activeComponentId: nextIds[0] ?? null,
      };
      persist({ ...state, ...next });
      return next;
    });
  },

  clearSelection: () => {
    set((state) => {
      const next = { selectedComponentIds: [], activeComponentId: null };
      persist({ ...state, ...next });
      return next;
    });
  },

  togglePermission: (id, key) => {
    set((state) => {
      const registry = state.registry.map((component) =>
        component.id === id
          ? {
              ...component,
              permissions: {
                ...component.permissions,
                [key]: !component.permissions[key],
              },
            }
          : component,
      );
      const next = { registry };
      persist({ ...state, ...next });
      return next;
    });
  },

  setZoom: (zoom) => {
    set((state) => {
      const next = { zoom: Math.min(1.8, Math.max(0.5, zoom)) };
      persist({ ...state, ...next });
      return next;
    });
  },

  setShowCode: (showCode) => {
    set((state) => {
      persist({ ...state, showCode });
      return { showCode };
    });
  },

  applyOperations: (operations) => {
    const current = get();
    const result = executeBatch(operations, {
      registry: current.registry,
      groups: current.groups,
    });

    if (!result.ok || !result.historyEntry) {
      return {
        ok: false,
        applied: result.applied,
        createdIds: [],
        modifiedIds: [],
        message: result.message,
      };
    }

    const lastCreatedGroupId =
      Object.keys(result.state.groups).find(
        (groupId) => !current.groups[groupId] && result.createdIds.length > 0,
      ) ?? current.lastCreatedGroupId;

    set((state) => {
      const next = {
        registry: result.state.registry,
        groups: result.state.groups,
        lastCreatedComponentIds: result.createdIds.length
          ? result.createdIds
          : state.lastCreatedComponentIds,
        lastModifiedComponentIds: result.modifiedIds.length
          ? result.modifiedIds
          : result.createdIds,
        lastCreatedGroupId,
        operationHistory: [...state.operationHistory, result.historyEntry!],
        selectedComponentIds: result.createdIds.length
          ? result.createdIds.slice(0, 1)
          : result.modifiedIds.length
            ? result.modifiedIds
            : state.selectedComponentIds,
        activeComponentId: result.createdIds[0] ?? result.modifiedIds[0] ?? state.activeComponentId,
      };
      persist({ ...state, ...next });
      return next;
    });

    return {
      ok: true,
      applied: result.applied,
      createdIds: result.createdIds,
      modifiedIds: result.modifiedIds,
    };
  },

  undo: () => {
    const current = get();
    const entry = current.operationHistory.at(-1);
    if (!entry) return false;

    const restored = applyUndo(current.registry, current.groups, entry);
    set((state) => {
      const next = {
        registry: restored.registry,
        groups: restored.groups,
        operationHistory: state.operationHistory.slice(0, -1),
        lastCreatedComponentIds: [],
        lastModifiedComponentIds: [],
        selectedComponentIds: restored.registry[0] ? [restored.registry[0].id] : [],
        activeComponentId: restored.registry[0]?.id ?? null,
      };
      persist({ ...state, ...next });
      return next;
    });
    return true;
  },

  reset: () => {
    const registry = createInitialRegistry();
    const next = {
      registry,
      groups: {},
      selectedComponentIds: [registry[0].id],
      activeComponentId: registry[0].id,
      lastCreatedComponentIds: [],
      lastModifiedComponentIds: [],
      lastCreatedGroupId: null,
      operationHistory: [],
      zoom: 1,
      showCode: false,
    };
    persist(next);
    set(next);
  },
}));
