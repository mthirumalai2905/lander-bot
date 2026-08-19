import { describe, expect, it } from "vitest";
import { HEART_RIBBON_SOURCE, HEART_SOURCE, STAR_PARTICLE_SOURCE } from "../sessions/defaultSource";
import { compileVisual } from "./compileVisual";
import { validateSource } from "./sourceGate";

describe("source gate", () => {
  it("accepts the heart source and compiles a component", () => {
    expect(validateSource(HEART_SOURCE).ok).toBe(true);
    const compiled = compileVisual(HEART_SOURCE);
    expect(compiled.ok).toBe(true);
    if (compiled.ok) expect(typeof compiled.Component).toBe("function");
  });

  it("compiles ribbon heart source", () => {
    const compiled = compileVisual(HEART_RIBBON_SOURCE);
    expect(compiled.ok).toBe(true);
  });

  it("compiles the star particle source", () => {
    const compiled = compileVisual(STAR_PARTICLE_SOURCE);
    expect(compiled.ok).toBe(true);
  });

  it("rejects a forbidden import", () => {
    const result = validateSource(`import fs from "fs";
export default function Visual() { return null; }`);
    expect(result.ok).toBe(false);
  });
});
