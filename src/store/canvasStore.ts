import { create } from "zustand";
import { createInitialRegistry, syncRegistryIds } from "../engine/componentRegistry";
import { applyUndo } from "../engine/history";
import { executeBatch } from "../engine/batchExecutor";
import { defaultSourceFor } from "../sessions/defaultSource";
import { SESSIONS, isSessionId, sessionById, type SessionId } from "../sessions/catalog";
import { compileVisual } from "../runtime/compileVisual";
import {
  defaultTextFor,
  type AttributePermissions,
  type ComponentType,
  type DesignComponent,
} from "../types/component";
import type { OperationHistoryEntry } from "../types/conversation";
import type { AppliedChange, Operation } from "../types/operation";
import { ribbonSpeedsFor } from "../utils/ribbons";

export interface CanvasSlice {
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
  source: string;
}

const STORAGE_KEY = "lander-bot-sessions-v1";

function fitRegistryForSource(registry: DesignComponent[], source: string): DesignComponent[] {
  if (!/shape="(heart|star|square|circle|ellipse|parabola|triangle|diamond|hexagon)"/.test(source)) {
    return registry;
  }
  return registry.map((component) => {
    const side = Math.max(component.state.width, component.state.height, 560);
    return {
      ...component,
      state: {
        ...component.state,
        width: side,
        height: side,
      },
    };
  });
}

function hydrateRegistry(registry: DesignComponent[]): DesignComponent[] {
  return registry.map((component) => ({
    ...component,
    permissions: {
      ...component.permissions,
      animation: component.permissions.animation ?? true,
    },
    state: {
      ...component.state,
      type: component.state.type ?? component.type,
      ribbonSpeeds: ribbonSpeedsFor(
        component.state.colors.length,
        component.state.ribbonSpeeds,
      ),
      width: Math.max(component.state.width, 520),
      height: Math.max(component.state.height, 240),
      text: component.state.text || defaultTextFor(component.state.type ?? component.type),
    },
  }));
}

function makeSlice(type: ComponentType): CanvasSlice {
  const registry = hydrateRegistry(createInitialRegistry(type));
  syncRegistryIds(registry);
  return {
    registry,
    groups: {},
    selectedComponentIds: registry[0] ? [registry[0].id] : [],
    activeComponentId: registry[0]?.id ?? null,
    lastCreatedComponentIds: [],
    lastModifiedComponentIds: [],
    lastCreatedGroupId: null,
    operationHistory: [],
    zoom: 1,
    showCode: false,
    source: defaultSourceFor(type),
  };
}

function readSlice(state: CanvasSlice): CanvasSlice {
  return {
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
    source: state.source || defaultSourceFor(state.registry[0]?.type ?? "strand"),
  };
}

interface CanvasStore extends CanvasSlice {
  activeSessionId: SessionId;
  sessions: Partial<Record<SessionId, CanvasSlice>>;
  setSession: (id: SessionId) => void;
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

function persist(state: {
  activeSessionId: SessionId;
  sessions: Partial<Record<SessionId, CanvasSlice>>;
} & CanvasSlice) {
  const sessions = {
    ...state.sessions,
    [state.activeSessionId]: readSlice(state),
  };
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      activeSessionId: state.activeSessionId,
      sessions,
    }),
  );
}

function loadPersisted(): { activeSessionId: SessionId; slice: CanvasSlice; sessions: Partial<Record<SessionId, CanvasSlice>> } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {
      activeSessionId?: SessionId;
      sessions?: Partial<Record<SessionId, CanvasSlice>>;
    };
    const activeSessionId = isSessionId(parsed.activeSessionId ?? "")
      ? parsed.activeSessionId!
      : "strands";
    const sessions = parsed.sessions ?? {};
    const slice = sessions[activeSessionId];
    if (!slice?.registry?.length) return null;
    syncRegistryIds(slice.registry, Object.keys(slice.groups ?? {}));
    const type = slice.registry[0]?.type ?? "strand";
    return {
      activeSessionId,
      sessions,
      slice: {
        ...slice,
        source: slice.source || defaultSourceFor(type),
        registry: fitRegistryForSource(
          hydrateRegistry(slice.registry),
          slice.source || defaultSourceFor(type),
        ),
      },
    };
  } catch {
    return null;
  }
}

const persisted = typeof localStorage !== "undefined" ? loadPersisted() : null;
const initial = persisted?.slice ?? makeSlice("strand");

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  activeSessionId: persisted?.activeSessionId ?? "strands",
  sessions: persisted?.sessions ?? {},
  ...initial,

  setSession: (id) => {
    set((state) => {
      const sessions = { ...state.sessions, [state.activeSessionId]: readSlice(state) };
      const nextSlice = sessions[id] ?? makeSlice(sessionById(id).type);
      syncRegistryIds(nextSlice.registry, Object.keys(nextSlice.groups ?? {}));
      const next = {
        activeSessionId: id,
        sessions,
        ...nextSlice,
      };
      persist(next);
      return next;
    });
  },

  select: (ids, additive = false) => {
    set((state) => {
      const nextIds = additive ? [...new Set([...state.selectedComponentIds, ...ids])] : ids;
      const next = { selectedComponentIds: nextIds, activeComponentId: nextIds[0] ?? null };
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
      persist({ ...state, registry });
      return { registry };
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
    const sourceEdit = operations.find((operation) => operation.type === "source_edit");
    let nextSource = current.source;
    if (sourceEdit?.type === "source_edit") {
      const compiled = compileVisual(sourceEdit.source);
      if (!compiled.ok) {
        return {
          ok: false,
          applied: [{ ok: false, text: compiled.error }],
          createdIds: [],
          modifiedIds: [],
          message: compiled.error,
        };
      }
      nextSource = sourceEdit.source;
    }

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
        registry: fitRegistryForSource(result.state.registry, nextSource),
        groups: result.state.groups,
        lastCreatedComponentIds: result.createdIds.length
          ? result.createdIds
          : state.lastCreatedComponentIds,
        lastModifiedComponentIds: result.modifiedIds.length
          ? result.modifiedIds
          : result.createdIds,
        lastCreatedGroupId,
        source: nextSource,
        operationHistory: [
          ...state.operationHistory,
          {
            ...result.historyEntry!,
            previousSource: current.source,
            nextSource,
          },
        ],
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
        source: entry.previousSource ?? state.source,
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
    const type = sessionById(get().activeSessionId).type;
    const slice = makeSlice(type);
    set((state) => {
      const next = { ...state, ...slice };
      persist(next);
      return slice;
    });
  },
}));

export const sessionList = SESSIONS;
