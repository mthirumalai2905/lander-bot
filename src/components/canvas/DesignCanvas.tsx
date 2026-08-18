import { useState } from "react";
import { sessionById } from "../../sessions/catalog";
import { useThemeStore } from "../../store/themeStore";
import { useCanvasStore } from "../../store/canvasStore";
import { CodeViewer } from "./CodeViewer";
import { ComponentWrapper } from "./ComponentWrapper";

function isErasable(createdFrom?: string, canDelete?: boolean, isProtected?: boolean) {
  return Boolean(createdFrom) && canDelete !== false && !isProtected;
}

export function DesignCanvas() {
  const registry = useCanvasStore((state) => state.registry);
  const selectedComponentIds = useCanvasStore((state) => state.selectedComponentIds);
  const select = useCanvasStore((state) => state.select);
  const clearSelection = useCanvasStore((state) => state.clearSelection);
  const applyOperations = useCanvasStore((state) => state.applyOperations);
  const zoom = useCanvasStore((state) => state.zoom);
  const setZoom = useCanvasStore((state) => state.setZoom);
  const showCode = useCanvasStore((state) => state.showCode);
  const setShowCode = useCanvasStore((state) => state.setShowCode);
  const theme = useThemeStore((state) => state.theme);
  const session = sessionById(useCanvasStore((state) => state.activeSessionId));
  const [erasing, setErasing] = useState(false);
  const active = registry.find((component) => selectedComponentIds.includes(component.id));

  const eraseIds = (ids: string[]) => {
    const targetIds = ids.filter((id) => {
      const component = registry.find((item) => item.id === id);
      return component
        ? isErasable(component.createdFrom, component.permissions.delete, component.protected)
        : false;
    });
    if (!targetIds.length) return;
    applyOperations([{ type: "delete", targetIds }]);
  };

  return (
    <section className="relative flex min-w-0 flex-1 flex-col bg-[var(--canvas)]">
      <div className="flex items-center justify-between px-6 py-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--dim)]">
            {session.title}
          </p>
          <p className="text-[13px] text-[var(--muted)]">
            {session.blurb} · {registry.length} instance{registry.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              const next = !erasing;
              setErasing(next);
              if (next) {
                eraseIds(selectedComponentIds);
              }
            }}
            className={`rounded-full border px-3 py-1.5 text-[13px] transition ${
              erasing
                ? "border-red-400/50 bg-red-500/15 text-red-300"
                : "border-[var(--border)] bg-[var(--chip)] text-[var(--text)] hover:bg-[var(--chip-hover)]"
            }`}
          >
            {erasing ? "Erasing" : "Erase"}
          </button>
          <button
            type="button"
            onClick={() => setShowCode(!showCode)}
            className="rounded-full border border-[var(--border)] bg-[var(--chip)] px-3 py-1.5 text-[13px] text-[var(--text)] transition hover:bg-[var(--chip-hover)]"
          >
            {showCode ? "Hide code" : "Show code"}
          </button>
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        <div
          className="absolute inset-0 overflow-auto"
          onClick={() => clearSelection()}
        >
          <div
            className="relative min-h-full min-w-full origin-top-left"
            style={{
              transform: `scale(${zoom})`,
              backgroundImage: `radial-gradient(var(--grid) 1px, transparent 1px)`,
              backgroundSize: "22px 22px",
              minHeight: 1400,
              minWidth: 1400,
            }}
            data-theme={theme}
          >
            {registry.map((component) => (
              <ComponentWrapper
                key={component.id}
                component={component}
                selected={selectedComponentIds.includes(component.id)}
                erasing={erasing}
                erasable={isErasable(
                  component.createdFrom,
                  component.permissions.delete,
                  component.protected,
                )}
                onSelect={(id, additive) => select([id], additive)}
                onErase={(id) => eraseIds([id])}
              />
            ))}
          </div>
        </div>
        {showCode && <CodeViewer />}
      </div>

      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--chip)] p-1">
          <button
            type="button"
            className="h-7 w-7 rounded-full text-[16px] text-[var(--soft)] hover:bg-[var(--chip-hover)]"
            onClick={() => setZoom(zoom - 0.1)}
          >
            −
          </button>
          <span className="min-w-12 text-center text-[12px] text-[var(--muted)]">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            className="h-7 w-7 rounded-full text-[16px] text-[var(--soft)] hover:bg-[var(--chip-hover)]"
            onClick={() => setZoom(zoom + 0.1)}
          >
            +
          </button>
        </div>
        {active && (
          <p className="text-[12px] text-[var(--muted)]">
            {active.id}
            {active.protected ? " is protected" : ""}
            {!active.permissions.position ? " · position locked" : ""}
          </p>
        )}
      </div>
    </section>
  );
}
