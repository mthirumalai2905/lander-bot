import { z } from "zod";
import type { AiResponse, Operation } from "../types/operation";
import { operationSchema } from "./operationSchema";

export function stripCodeFences(raw: string): string {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1].trim() : trimmed;
}

function extractJson(raw: string): unknown | null {
  const text = stripCodeFences(raw);
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end <= start) return null;
    try {
      return JSON.parse(text.slice(start, end + 1));
    } catch {
      return null;
    }
  }
}

const looseEnvelopeSchema = z.object({
  message: z.string().default("Done."),
  operations: z.array(z.unknown()).default([]),
  protectIds: z.array(z.string()).optional(),
  appliedChanges: z.array(z.string()).optional(),
});

export function parseAiResponse(raw: string): { ok: true; data: AiResponse } | { ok: false; error: string } {
  const parsed = extractJson(raw);
  if (!parsed) {
    return { ok: false, error: "APPLY_FALLBACK" };
  }

  const envelope = looseEnvelopeSchema.safeParse(parsed);
  if (!envelope.success) {
    return { ok: false, error: "APPLY_FALLBACK" };
  }

  const operations: Operation[] = [];
  for (const item of envelope.data.operations) {
    const operation = operationSchema.safeParse(item);
    if (operation.success) {
      operations.push(operation.data);
    }
  }

  if (envelope.data.operations.length > 0 && operations.length === 0) {
    return { ok: false, error: "APPLY_FALLBACK" };
  }

  return {
    ok: true,
    data: {
      message: envelope.data.message,
      operations,
      protectIds: envelope.data.protectIds,
      appliedChanges: envelope.data.appliedChanges,
    },
  };
}
