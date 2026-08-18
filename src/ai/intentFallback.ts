import type { DesignComponent } from "../types/component";
import type { Operation } from "../types/operation";
import { namedColor, rainbowPalette, rampSpeeds } from "../utils/colors";
import { buildReferenceMap } from "./referenceResolver";

export interface IntentContext {
  selectedComponentIds: string[];
  lastCreatedComponentIds: string[];
  lastModifiedComponentIds: string[];
  lastCreatedGroupId: string | null;
  groups: Record<string, string[]>;
}

function lowestComponent(registry: DesignComponent[]): DesignComponent | undefined {
  return registry.reduce<DesignComponent | undefined>((lowest, component) => {
    if (!lowest) return component;
    const lowestBottom = lowest.state.y + lowest.state.height * lowest.state.scale;
    const bottom = component.state.y + component.state.height * component.state.scale;
    return bottom > lowestBottom ? component : lowest;
  }, undefined);
}

function resolveTargets(
  userMessage: string,
  registry: DesignComponent[],
  context: IntentContext,
): string[] {
  const map = buildReferenceMap(registry, context, context.groups);
  const text = userMessage.toLowerCase();

  if (/\b(all copies|all the copies|all five|all new copies)\b/.test(text)) {
    return map.aliases.copies?.length ? map.aliases.copies : map.copies;
  }
  if (/\b(main|original|first (strand|one|component)|strand_1|aurora_1|particles_1|beams_1|plasma_1|threads_1|animated_1|antigravity_1|ascii_1|evileye_1)\b/.test(text) && !/\b(copy|copies|duplicate)\b/.test(text)) {
    return map.originalId ? [map.originalId] : [];
  }
  const ordinal = text.match(/\b(second|third|fourth|fifth|2nd|3rd|4th|5th)\b/);
  if (ordinal) {
    const index =
      { second: 1, "2nd": 1, third: 2, "3rd": 2, fourth: 3, "4th": 3, fifth: 4, "5th": 4 }[
        ordinal[1]
      ] ?? 0;
    const pool = map.lastGroupIds.length ? map.lastGroupIds : map.copies;
    if (pool[index]) return [pool[index]];
    if (registry[index]) return [registry[index].id];
  }
  if (/\b(the copy|this copy|that copy|strand_2|aurora_2|particles_2|beams_2|plasma_2|threads_2|animated_2|antigravity_2|ascii_2|evileye_2)\b/.test(text)) {
    return map.aliases.copy?.length ? map.aliases.copy : map.copies.slice(0, 1);
  }
  if (map.selectedIds.length) return map.selectedIds;
  if (map.lastCreatedIds.length) return map.lastCreatedIds;
  if (map.lastModifiedIds.length) return map.lastModifiedIds;
  if (map.copies.length) return map.copies.slice(-1);
  return map.originalId ? [map.originalId] : [];
}

function mentionedColor(userMessage: string): string | null {
  const hex = userMessage.match(/#([0-9a-fA-F]{3,8})/);
  if (hex) return `#${hex[1]}`;
  const named = userMessage.match(
    /\b(red|green|blue|yellow|purple|orange|pink|cyan|black|white|violet|indigo|teal)\b/i,
  );
  return named ? namedColor(named[1]) : null;
}

function mentionedColors(userMessage: string): string[] {
  if (/rainbow/i.test(userMessage)) return rainbowPalette(8);
  const found: string[] = [];
  const matches = userMessage.matchAll(
    /\b(red|green|blue|yellow|purple|orange|pink|cyan|black|white|violet|indigo|teal)\b/gi,
  );
  for (const match of matches) {
    const color = namedColor(match[1]);
    if (color && !found.includes(color)) found.push(color);
  }
  return found;
}

function isChatOnly(userMessage: string): boolean {
  return /^(hi|hello|hey|thanks|thank you|ok|okay|cool|nice|yo)\b/i.test(userMessage.trim());
}

function mentionedText(userMessage: string): string | null {
  const quoted = userMessage.match(/[“"]([^”"]+)[”"]|'([^']+)'/);
  if (quoted) {
    const value = (quoted[1] ?? quoted[2]).trim();
    if (value) return value.slice(0, 48);
  }

  const hasTextNoun =
    /\b(text|ascii|label|word|words|title|phrase|name)\b/i.test(userMessage) ||
    /\b(say|says|read|reads|rename)\b/i.test(userMessage);
  if (!hasTextNoun) return null;

  const afterTo = userMessage.match(
    /\b(?:change|set|update|rename|make|cange|chage)\b[\s\S]*?\b(?:to|as|into)\s+(.+)$/i,
  );
  const afterSay = userMessage.match(/\b(?:say|says|read|reads)\s+(.+)$/i);
  const raw = (afterTo?.[1] ?? afterSay?.[1] ?? "").trim();
  if (!raw) return null;

  return raw
    .replace(/^["'“”]|["'“”]$/g, "")
    .replace(/[.!?]+$/, "")
    .trim()
    .slice(0, 48);
}

export function inferFallbackOperations(
  userMessage: string,
  registry: DesignComponent[],
  context: IntentContext = {
    selectedComponentIds: [],
    lastCreatedComponentIds: [],
    lastModifiedComponentIds: [],
    lastCreatedGroupId: null,
    groups: {},
  },
): Operation[] {
  if (!registry.length || isChatOnly(userMessage)) return [];

  const original = registry.find((component) => !component.createdFrom) ?? registry[0];
  const targets = resolveTargets(userMessage, registry, context);
  const text = userMessage.toLowerCase();
  const operations: Operation[] = [];

  if (/\b(don't touch|do not touch|leave .* unchanged|protect)\b/.test(text) && original) {
    operations.push({ type: "protect", targetIds: [original.id], protected: true });
  }

  const nextLabel = mentionedText(userMessage);
  if (nextLabel) {
    operations.push({
      type: "set_text",
      targetIds: targets.length ? targets : [original.id],
      text: nextLabel,
    });
    return operations;
  }

  const copyCount = text.match(
    /\b(\d+)\s+(copies|duplicates|strands|components|auroras?|particles?|beams?|plasmas?|threads?|animated|antigravity|ascii|eyes?)\b/,
  );
  const ribbonCount = text.match(/\b(\d+)\s+ribbons?\b/);
  const wantsAnother =
    /\b(one more|another|new)\b.*\b(component|strand|copy|animation|aurora|particle|beam|plasma|thread|animated|antigravity|ascii|eye)\b/i.test(
      userMessage,
    ) ||
    /\b(duplicate|copy|create|make)\b.*\b(component|strand|copy|animation|aurora|particle|beam|plasma|thread|animated|antigravity|ascii|eye)\b/i.test(
      userMessage,
    ) ||
    /\b(duplicate|copy) (it|this|that|the)\b/i.test(userMessage) ||
    Boolean(copyCount) ||
    (Boolean(ribbonCount) &&
      /\b(component|strand|aurora|particle|beam|plasma|thread|animated|antigravity|ascii|eye|another|one more|new)\b/i.test(
        userMessage,
      ));

  if (wantsAnother) {
    const componentCount = copyCount ? Number(copyCount[1]) : 1;
    const ribbons = ribbonCount ? Number(ribbonCount[1]) : /rainbow/i.test(userMessage) ? 8 : 0;
    const colors = /rainbow/i.test(userMessage)
      ? rainbowPalette(ribbons || 8)
      : mentionedColors(userMessage);
    const progressive = /faster|slow|dynamic|progressiv|upcoming/i.test(userMessage);
    const anchor = lowestComponent(registry) ?? original;
    const copies = Array.from({ length: Math.max(componentCount, 1) }, (_, index) => ({
      position: {
        relation: "below" as const,
        spacing: 56,
        x: anchor.state.x,
        y: anchor.state.y + (anchor.state.height * anchor.state.scale + 56) * (index + 1),
      },
      colors: colors.length ? colors : ribbons ? rainbowPalette(ribbons) : undefined,
      ribbonSpeeds: progressive && (ribbons || colors.length)
        ? rampSpeeds(ribbons || colors.length || 8)
        : undefined,
      width: Math.max(anchor.state.width, 560),
      height: Math.max(240, 200 + (ribbons || colors.length || 3) * 24),
    }));

    operations.push({
      type: componentCount > 1 ? "batch_duplicate" : "duplicate",
      sourceId: original.id,
      count: Math.max(componentCount, 1),
      copies,
    });
    return operations;
  }

  if (/\b(add|insert|put|place)\b[\s\S]{0,48}\bribbons?\b|\b(one more|another|extra)\s+ribbons?\b/i.test(userMessage)) {
    operations.push({
      type: "add_ribbon",
      targetIds: targets.length ? targets : [original.id],
      color: mentionedColor(userMessage) ?? "#22C55E",
      placement: /\b(top|start|first|above)\b/i.test(userMessage) ? "start" : "end",
    });
    return operations;
  }

  if (/\b(faster|rapid|speed up|slow|slowest|fastest)\b/i.test(userMessage)) {
    const targetIds = targets.length ? targets : [original.id];
    if (/\bribbon\b/i.test(userMessage) && /\b(1|2|3|first|second|third)\b/i.test(userMessage)) {
      const component = registry.find((item) => item.id === targetIds[0]) ?? original;
      const count = component.state.colors.length;
      operations.push({
        type: "set_speed",
        targetIds,
        ribbons: Array.from({ length: count }, (_, index) => ({
          index: index + 1,
          speed: Number((0.35 + (index / Math.max(count - 1, 1)) * 2.25).toFixed(2)),
        })),
      });
    } else {
      operations.push({
        type: "set_speed",
        targetIds,
        speed: /\bslow/i.test(userMessage) ? 0.45 : 1.8,
      });
    }
    return operations;
  }

  if (/\brotate|degrees?\b/i.test(userMessage)) {
    const degrees = userMessage.match(/(-?\d+)\s*degrees?/i);
    operations.push({
      type: "rotate",
      targetIds: targets.length ? targets : [original.id],
      rotation: degrees ? Number(degrees[1]) : 180,
    });
    return operations;
  }

  if (/\bhalf|smaller|50%|twice|scale\b/i.test(userMessage)) {
    operations.push({
      type: "scale",
      targetIds: targets.length ? targets : [original.id],
      scale: /\btwice\b/i.test(userMessage) ? 2 : 0.5,
    });
    return operations;
  }

  const colors = mentionedColors(userMessage);
  if (colors.length) {
    operations.push({
      type: "recolor",
      targetIds: targets.length ? targets : [original.id],
      colors,
    });
    return operations;
  }

  if (/\bflip\b/i.test(userMessage)) {
    operations.push({
      type: "flip",
      targetIds: targets.length ? targets : [original.id],
      axis: /\bvert/i.test(userMessage) ? "y" : "x",
    });
    return operations;
  }

  if (/\b(left|right|up|down|below|above)\b/i.test(userMessage)) {
    const dx = /\bleft\b/i.test(userMessage) ? -80 : /\bright\b/i.test(userMessage) ? 80 : 0;
    const dy = /\b(down|below)\b/i.test(userMessage) ? 80 : /\b(up|above)\b/i.test(userMessage) ? -80 : 0;
    operations.push({
      type: "move",
      targetIds: targets.length ? targets : [original.id],
      dx,
      dy,
    });
    return operations;
  }

  if (/\b(delete|remove|erase)\b/i.test(userMessage)) {
    const copies = registry.filter((component) => component.createdFrom).map((component) => component.id);
    const targetIds = targets.filter((id) => copies.includes(id));
    if (targetIds.length) {
      operations.push({ type: "delete", targetIds });
    }
    return operations;
  }

  if (/\b(text|ascii|say|rename|label|word)\b/i.test(userMessage)) {
    return operations;
  }

  operations.push({
    type: "duplicate",
    sourceId: original.id,
    count: 1,
    copies: [{ position: { relation: "below", spacing: 56 } }],
  });
  return operations;
}

export function repairOperations(
  operations: Operation[],
  registry: DesignComponent[],
): Operation[] {
  const original = registry.find((component) => !component.createdFrom) ?? registry[0];
  const ids = new Set(registry.map((component) => component.id));

  return operations.map((operation) => {
    if (operation.type === "duplicate" || operation.type === "batch_duplicate") {
      if (!ids.has(operation.sourceId) && original) {
        return { ...operation, sourceId: original.id };
      }
      return operation;
    }
    if ("targetIds" in operation) {
      const targetIds = operation.targetIds.filter((id) => ids.has(id));
      if (targetIds.length) return { ...operation, targetIds };
      if (original && operation.type !== "delete") {
        return { ...operation, targetIds: [original.id] };
      }
    }
    return operation;
  });
}

export function fallbackMessage(operations: Operation[]): string {
  const first = operations[0];
  if (!first) return "Done.";
  if (first.type === "duplicate" || first.type === "batch_duplicate") {
    return "Created a new instance with that setup.";
  }
  if (first.type === "add_ribbon") return "Added the ribbon.";
  if (first.type === "set_speed") return "Updated the ribbon speed.";
  if (first.type === "recolor") return "Updated the colors.";
  if (first.type === "rotate") return "Rotated it.";
  if (first.type === "scale") return "Resized it.";
  if (first.type === "delete") return "Removed the copy.";
  if (first.type === "set_text") return `Changed the text to ${first.text}.`;
  return "Applied that change.";
}
