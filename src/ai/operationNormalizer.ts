import type { Operation } from "../types/operation";

const ADD_RIBBON =
  /\b(add|insert|put|place)\b[\s\S]{0,40}\bribbons?\b|\bribbons?\b[\s\S]{0,40}\b(add|insert)\b|\b(one more|another|extra)\s+ribbons?\b/i;

export function normalizeRibbonRequests(
  userMessage: string,
  operations: Operation[],
): Operation[] {
  if (!ADD_RIBBON.test(userMessage)) return operations;

  const placement = /\b(top|start|first|above|beginning)\b/i.test(userMessage)
    ? "start"
    : "end";

  return operations.map((operation) => {
    if (operation.type !== "recolor") return operation;
    const color = operation.colors.at(-1) ?? operation.replace?.to;
    if (!color) return operation;
    return {
      type: "add_ribbon",
      targetIds: operation.targetIds,
      color,
      placement,
    };
  });
}
