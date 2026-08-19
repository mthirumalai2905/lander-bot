import * as React from "react";
import * as Motion from "motion/react";
import { transform } from "sucrase";
import type { ComponentType } from "react";
import type { ComponentState } from "../types/component";
import * as kit from "./kit";
import { validateSource } from "./sourceGate";

export type VisualComponent = ComponentType<{ state: ComponentState }>;

export function compileVisual(source: string):
  | { ok: true; Component: VisualComponent }
  | { ok: false; error: string } {
  const gated = validateSource(source);
  if (!gated.ok) return gated;

  try {
    const { code } = transform(source, {
      transforms: ["typescript", "jsx", "imports"],
      production: true,
    });

    const module = { exports: {} as { default?: VisualComponent } & Record<string, VisualComponent> };
    const requireModule = (name: string) => {
      if (name === "react") return React;
      if (name === "motion/react") return Motion;
      if (name === "@lander/kit") return kit;
      throw new Error(`Import "${name}" is not allowed.`);
    };

    const factory = new Function("require", "module", "exports", "React", code);
    factory(requireModule, module, module.exports, React);

    const Component =
      module.exports.default ??
      module.exports.Visual ??
      Object.values(module.exports).find((value) => typeof value === "function");

    if (typeof Component !== "function") {
      return { ok: false, error: "Compiled source did not export a component." };
    }

    return { ok: true, Component };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "I couldn't compile that source.",
    };
  }
}
