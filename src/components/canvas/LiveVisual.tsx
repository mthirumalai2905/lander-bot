import { Component, type ErrorInfo, type ReactNode } from "react";
import type { ComponentState } from "../../types/component";
import { compileVisual } from "../../runtime/compileVisual";
import { useCanvasStore } from "../../store/canvasStore";
import { SessionVisual } from "./SessionVisual";

class VisualBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    /* keep the previous visual on screen */
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function LiveVisual({ state }: { state: ComponentState }) {
  const source = useCanvasStore((store) => store.source ?? "");
  const compiled = source ? compileVisual(source) : null;
  const fallback = <SessionVisual state={state} />;

  if (!compiled?.ok) return fallback;

  const Compiled = compiled.Component;
  return (
    <VisualBoundary fallback={fallback}>
      <Compiled state={state} />
    </VisualBoundary>
  );
}
