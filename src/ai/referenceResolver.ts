import type { DesignComponent } from "../types/component";
import type { ConversationState } from "../types/conversation";

export interface ReferenceMap {
  originalId: string | null;
  selectedIds: string[];
  lastCreatedIds: string[];
  lastModifiedIds: string[];
  lastGroupIds: string[];
  copies: string[];
  aliases: Record<string, string[]>;
}

export function buildReferenceMap(
  registry: DesignComponent[],
  conversation: Pick<
    ConversationState,
    "selectedComponentIds" | "lastCreatedComponentIds" | "lastModifiedComponentIds" | "lastCreatedGroupId"
  >,
  groups: Record<string, string[]>,
): ReferenceMap {
  const original = registry.find((component) => !component.createdFrom) ?? registry[0];
  const copies = registry.filter((component) => component.createdFrom).map((component) => component.id);
  const lastGroupIds = conversation.lastCreatedGroupId
    ? (groups[conversation.lastCreatedGroupId] ?? conversation.lastCreatedComponentIds)
    : conversation.lastCreatedComponentIds;

  const aliases: Record<string, string[]> = {
    original: original ? [original.id] : [],
    main: original ? [original.id] : [],
    it: conversation.selectedComponentIds.length
      ? conversation.selectedComponentIds
      : conversation.lastModifiedComponentIds.length
        ? conversation.lastModifiedComponentIds
        : conversation.lastCreatedComponentIds,
    this: conversation.selectedComponentIds,
    copy: lastGroupIds.length ? [lastGroupIds[0]] : copies.slice(0, 1),
    copies: lastGroupIds.length ? lastGroupIds : copies,
  };

  lastGroupIds.forEach((id, index) => {
    aliases[`copy_${index + 1}`] = [id];
  });

  return {
    originalId: original?.id ?? null,
    selectedIds: conversation.selectedComponentIds,
    lastCreatedIds: conversation.lastCreatedComponentIds,
    lastModifiedIds: conversation.lastModifiedComponentIds,
    lastGroupIds,
    copies,
    aliases,
  };
}

export function describeReferences(map: ReferenceMap): string {
  return JSON.stringify(map, null, 2);
}
