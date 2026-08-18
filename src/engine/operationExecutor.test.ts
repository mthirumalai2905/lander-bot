import { beforeEach, describe, expect, it } from "vitest";
import type { DesignComponent } from "../types/component";
import { inferFallbackOperations } from "../ai/intentFallback";
import { normalizeRibbonRequests } from "../ai/operationNormalizer";
import { parseAiResponse } from "../ai/operationParser";
import { buildReferenceMap } from "../ai/referenceResolver";
import { executeBatch } from "./batchExecutor";
import { createInitialRegistry } from "./componentRegistry";
import { applyUndo } from "./history";
import { executeOperation, type EngineState } from "./operationExecutor";
import { resetIdCounters } from "../utils/ids";

function freshState(): EngineState {
  resetIdCounters({ strand: 1, group: 0 });
  return {
    registry: createInitialRegistry(),
    groups: {},
  };
}

function original(state: EngineState): DesignComponent {
  return state.registry[0];
}

describe("operation engine", () => {
  beforeEach(() => {
    resetIdCounters({ strand: 1, group: 0 });
  });

  it("duplicates one original into two components", () => {
    const result = executeOperation(
      {
        type: "duplicate",
        sourceId: "strand_1",
        count: 1,
        copies: [{ position: { relation: "below", spacing: 40 } }],
      },
      freshState(),
    );

    expect(result.ok).toBe(true);
    expect(result.state.registry).toHaveLength(2);
    expect(result.createdIds).toEqual(["strand_2"]);
    expect(result.state.registry[0].state).toMatchObject(original(freshState()).state);
  });

  it("creates five duplicates from one original", () => {
    const result = executeOperation(
      {
        type: "batch_duplicate",
        sourceId: "strand_1",
        count: 5,
      },
      freshState(),
    );

    expect(result.state.registry).toHaveLength(6);
    expect(result.createdIds).toEqual([
      "strand_2",
      "strand_3",
      "strand_4",
      "strand_5",
      "strand_6",
    ]);
  });

  it("creates ten duplicates from one original", () => {
    const result = executeOperation(
      {
        type: "batch_duplicate",
        sourceId: "strand_1",
        count: 10,
      },
      freshState(),
    );

    expect(result.state.registry).toHaveLength(11);
  });

  it("keeps the original unchanged when the copy is modified", () => {
    const duplicated = executeOperation(
      { type: "duplicate", sourceId: "strand_1", count: 1 },
      freshState(),
    );
    const before = structuredClone(duplicated.state.registry[0].state);
    const recolored = executeOperation(
      {
        type: "recolor",
        targetIds: ["strand_2"],
        colors: ["#FF0000", "#111111", "#22C55E"],
      },
      duplicated.state,
    );

    expect(recolored.state.registry[0].state).toEqual(before);
    expect(recolored.state.registry[1].state.colors).toEqual([
      "#FF0000",
      "#111111",
      "#22C55E",
    ]);
  });

  it("rotates 0 to 180", () => {
    const result = executeOperation(
      { type: "rotate", targetIds: ["strand_1"], rotation: 180 },
      freshState(),
    );
    expect(result.state.registry[0].state.rotation).toBe(180);
  });

  it("scales 1 to 0.5", () => {
    const result = executeOperation(
      { type: "scale", targetIds: ["strand_1"], scale: 0.5 },
      freshState(),
    );
    expect(result.state.registry[0].state.scale).toBe(0.5);
  });

  it("recolors purple to red / black / green", () => {
    const start = freshState();
    start.registry[0].state.colors = ["#7C3AED"];
    const result = executeOperation(
      {
        type: "recolor",
        targetIds: ["strand_1"],
        colors: ["#FF0000", "#111111", "#22C55E"],
      },
      start,
    );
    expect(result.state.registry[0].state.colors).toEqual([
      "#FF0000",
      "#111111",
      "#22C55E",
    ]);
  });

  it("rejects a move when position is locked", () => {
    const start = freshState();
    const before = structuredClone(start.registry[0].state);
    const result = executeBatch(
      [{ type: "move", targetIds: ["strand_1"], dx: -100 }],
      start,
    );
    expect(result.ok).toBe(false);
    expect(result.state.registry[0].state).toEqual(before);
  });

  it("undoes a batch of five copies as one action", () => {
    const start = freshState();
    const batch = executeBatch(
      [{ type: "batch_duplicate", sourceId: "strand_1", count: 5 }],
      start,
    );
    expect(batch.state.registry).toHaveLength(6);
    const undone = applyUndo(batch.state.registry, batch.state.groups, batch.historyEntry!);
    expect(undone.registry).toHaveLength(1);
    expect(undone.registry[0].id).toBe("strand_1");
  });

  it("resolves the second one after creating a copy", () => {
    const duplicated = executeOperation(
      { type: "duplicate", sourceId: "strand_1", count: 1 },
      freshState(),
    );
    const references = buildReferenceMap(
      duplicated.state.registry,
      {
        selectedComponentIds: [],
        lastCreatedComponentIds: duplicated.createdIds,
        lastModifiedComponentIds: [],
        lastCreatedGroupId: Object.keys(duplicated.state.groups)[0] ?? null,
      },
      duplicated.state.groups,
    );
    expect(references.aliases.copy_1).toEqual(["strand_2"]);

    const parsed = parseAiResponse(
      JSON.stringify({
        message: "Made the second one green.",
        operations: [
          { type: "recolor", targetIds: ["strand_2"], colors: ["#22C55E"] },
        ],
      }),
    );
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      const result = executeOperation(parsed.data.operations[0], duplicated.state);
      expect(result.state.registry[1].state.colors).toEqual(["#22C55E"]);
      expect(result.state.registry[0].state.colors).not.toEqual(["#22C55E"]);
    }
  });

  it("adds a fourth green ribbon without replacing the existing three", () => {
    const start = freshState();
    start.registry[0].state.colors = ["#EAB308", "#EF4444", "#22C55E"];
    const result = executeOperation(
      {
        type: "add_ribbon",
        targetIds: ["strand_1"],
        color: "#22C55E",
        placement: "end",
      },
      start,
    );

    expect(result.state.registry[0].state.colors).toEqual([
      "#EAB308",
      "#EF4444",
      "#22C55E",
      "#22C55E",
    ]);
  });

  it("rewrites a recolor into add_ribbon when the user asked to add a ribbon", () => {
    const normalized = normalizeRibbonRequests(
      "add one more ribbon at the last with green color",
      [
        {
          type: "recolor",
          targetIds: ["strand_2"],
          colors: ["#EAB308", "#EF4444", "#22C55E"],
        },
      ],
    );

    expect(normalized).toEqual([
      {
        type: "add_ribbon",
        targetIds: ["strand_2"],
        color: "#22C55E",
        placement: "end",
      },
    ]);
  });

  it("speeds up every ribbon when asked to move more rapidly", () => {
    const result = executeOperation(
      { type: "set_speed", targetIds: ["strand_1"], speed: 1.8 },
      freshState(),
    );
    expect(result.state.registry[0].state.ribbonSpeeds).toEqual([1.8, 1.8, 1.8]);
  });

  it("sets independent ribbon speeds from top to bottom", () => {
    const result = executeOperation(
      {
        type: "set_speed",
        targetIds: ["strand_1"],
        ribbons: [
          { index: 1, speed: 0.4 },
          { index: 2, speed: 1.7 },
          { index: 3, speed: 2.6 },
        ],
      },
      freshState(),
    );
    expect(result.state.registry[0].state.ribbonSpeeds).toEqual([0.4, 1.7, 2.6]);
  });

  it("creates one new component with 8 rainbow ribbons and ramped speeds", () => {
    const operations = inferFallbackOperations(
      "lets have one more component with 8 ribbons in it all of the rainbow color where the first strand moves slow then the upcoming strand moves faster than the previous one",
      freshState().registry,
    );
    expect(operations).toHaveLength(1);
    const result = executeOperation(operations[0], freshState());
    expect(result.state.registry).toHaveLength(2);
    expect(result.state.registry[1].state.colors).toHaveLength(8);
    expect(result.state.registry[1].state.ribbonSpeeds[0]).toBeLessThan(
      result.state.registry[1].state.ribbonSpeeds[7],
    );
    expect(result.state.registry[0].state.colors).toHaveLength(3);
  });

  it("keeps valid operations when the model wraps JSON or adds a bad op", () => {
    const parsed = parseAiResponse(`Sure.
\`\`\`json
{"message":"ok","operations":[{"type":"create","foo":1},{"type":"rotate","targetIds":["strand_1"],"rotation":20}]}
\`\`\``);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.data.operations).toEqual([
        { type: "rotate", targetIds: ["strand_1"], rotation: 20 },
      ]);
    }
  });
});
