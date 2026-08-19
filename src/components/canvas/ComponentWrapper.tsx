import { motion } from "motion/react";
import type { DesignComponent } from "../../types/component";
import { useCanvasStore } from "../../store/canvasStore";
import { LiveVisual } from "./LiveVisual";

interface ComponentWrapperProps {
  component: DesignComponent;
  selected: boolean;
  erasing?: boolean;
  erasable?: boolean;
  onSelect: (id: string, additive: boolean) => void;
  onErase?: (id: string) => void;
}

export function ComponentWrapper({
  component,
  selected,
  erasing = false,
  erasable = false,
  onSelect,
  onErase,
}: ComponentWrapperProps) {
  const { state } = component;
  const source = useCanvasStore((store) => store.source ?? "");
  const shaped = /shape="(heart|star|square|circle|ellipse|parabola|triangle|diamond|hexagon)"/.test(source);
  const side = Math.max(state.width, state.height, 560);
  const width = shaped ? side : state.width;
  const height = shaped ? side : state.height;

  if (!state.visible) return null;

  return (
    <motion.button
      type="button"
      className={`absolute left-0 top-0 origin-center border-0 bg-transparent p-0 text-left ${
        erasing ? (erasable ? "cursor-cell" : "cursor-not-allowed") : "cursor-pointer"
      }`}
      style={{ width, height }}
      animate={{
        x: state.x,
        y: state.y,
        rotate: state.rotation,
        scaleX: state.scale * (state.flipX ? -1 : 1),
        scaleY: state.scale * (state.flipY ? -1 : 1),
        opacity: state.opacity,
      }}
      transition={{ type: "spring", stiffness: 260, damping: 28 }}
      onClick={(event) => {
        event.stopPropagation();
        if (erasing) {
          if (erasable) onErase?.(component.id);
          return;
        }
        onSelect(component.id, event.metaKey || event.ctrlKey || event.shiftKey);
      }}
    >
      <div
        className={`overflow-visible rounded-[20px] p-2 transition-shadow ${
          erasing && erasable
            ? "shadow-[0_0_0_1.5px_rgba(239,68,68,0.7),0_10px_36px_var(--shadow)]"
            : selected
              ? "shadow-[0_0_0_1.5px_var(--select),0_10px_36px_var(--shadow)]"
              : "shadow-[0_0_0_1px_transparent]"
        }`}
      >
        <LiveVisual state={{ ...state, width, height }} />
      </div>
      {(selected || erasing) && (
        <div className="absolute -top-6 left-2 font-mono text-[11px] tracking-wide text-[var(--muted)]">
          {component.id}
          {component.protected || !erasable ? " · kept" : ""}
          {erasing && erasable ? " · click to erase" : ""}
        </div>
      )}
    </motion.button>
  );
}
