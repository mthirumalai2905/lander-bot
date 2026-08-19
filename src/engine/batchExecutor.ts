import type { DesignComponent } from "../types/component";
import type { OperationHistoryEntry } from "../types/conversation";
import type { AppliedChange, Operation } from "../types/operation";
import { createHistoryEntry } from "./history";
import { executeOperation, type EngineState } from "./operationExecutor";
import { filterOperation, type PermissionError } from "./permissionFilter";

export interface BatchResult {
  ok: boolean;
  state: EngineState;
  historyEntry?: OperationHistoryEntry;
  createdIds: string[];
  deletedIds: string[];
  modifiedIds: string[];
  applied: AppliedChange[];
  errors: PermissionError[];
  message?: string;
}

function summarize(operation: Operation, createdIds: string[]): string {
  switch (operation.type) {
    case "duplicate":
    case "batch_duplicate":
      return createdIds.length === 1
        ? "Created 1 independent copy"
        : `Created ${createdIds.length} independent copies`;
    case "move":
      return "Updated position";
    case "scale":
      return `Scaled to ${operation.scale}`;
    case "rotate":
      return `Rotated to ${operation.rotation}°`;
    case "recolor":
      return "Applied new colors";
    case "add_ribbon":
      return `Added a ${operation.placement === "start" ? "top" : "bottom"} ribbon`;
    case "remove_ribbon":
      return "Removed a ribbon";
    case "flip":
      return `Flipped on the ${operation.axis} axis`;
    case "delete":
      return "Removed selected components";
    case "set_opacity":
      return `Set opacity to ${operation.opacity}`;
    case "protect":
      return operation.protected ? "Protected the original component" : "Unlocked the component";
    case "set_speed":
      if (operation.ribbons?.length) {
        return "Updated individual ribbon speeds";
      }
      if (operation.ribbonIndex) {
        return `Changed ribbon ${operation.ribbonIndex} speed`;
      }
      return operation.relative ? "Adjusted animation speed" : "Updated animation speed";
    case "set_text":
      return `Changed the text to ${operation.text}`;
    case "source_edit":
      return "Updated the live component source";
  }
}

export function executeBatch(
  operations: Operation[],
  current: EngineState,
): BatchResult {
  const previous = structuredClone(current);
  let working = structuredClone(current);
  const createdIds: string[] = [];
  const deletedIds: string[] = [];
  const modifiedIds: string[] = [];
  const applied: AppliedChange[] = [];
  const errors: PermissionError[] = [];
  const accepted: Operation[] = [];

  for (const operation of operations) {
    const filtered = filterOperation(operation, working.registry);
    errors.push(...filtered.errors);

    if (!filtered.allowed) {
      if (operation.type === "duplicate" || operation.type === "batch_duplicate") {
        return {
          ok: false,
          state: previous,
          createdIds: [],
          deletedIds: [],
          modifiedIds: [],
          applied: [],
          errors,
          message: "I couldn't safely apply the full batch, so no copies were created.",
        };
      }
      continue;
    }

    const result = executeOperation(filtered.allowed, working);
    if (!result.ok) {
      return {
        ok: false,
        state: previous,
        createdIds: [],
        deletedIds: [],
        modifiedIds: [],
        applied: [],
        errors,
        message: result.error ?? "I couldn't safely apply the full batch, so no copies were created.",
      };
    }

    working = result.state;
    createdIds.push(...result.createdIds);
    deletedIds.push(...result.deletedIds);
    modifiedIds.push(...result.modifiedIds);
    accepted.push(filtered.allowed);
    applied.push({
      ok: true,
      text: summarize(filtered.allowed, result.createdIds),
    });
  }

  if (accepted.length === 0) {
    return {
      ok: false,
      state: previous,
      createdIds: [],
      deletedIds: [],
      modifiedIds: [],
      applied: errors.map((error) => ({ ok: false, text: error.message })),
      errors,
      message: errors[0]?.message ?? "I applied what I could from that request.",
    };
  }

  const allIds = [...createdIds, ...deletedIds, ...modifiedIds];
  const previousTouched: DesignComponent[] = previous.registry.filter((component) =>
    allIds.includes(component.id),
  );
  const nextTouched: DesignComponent[] = working.registry.filter((component) =>
    allIds.includes(component.id),
  );

  return {
    ok: true,
    state: working,
    historyEntry: createHistoryEntry({
      operations: accepted,
      previous: previousTouched,
      next: nextTouched,
      createdIds,
      deletedIds,
      previousGroups: previous.groups,
      nextGroups: working.groups,
    }),
    createdIds,
    deletedIds,
    modifiedIds,
    applied: [
      ...applied,
      ...errors.map((error) => ({ ok: false, text: error.message })),
    ],
    errors,
  };
}
