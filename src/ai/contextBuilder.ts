import type { DesignComponent } from "../types/component";
import type { ChatMessage, ConversationState } from "../types/conversation";
import { buildReferenceMap, describeReferences } from "./referenceResolver";

const MAX_MESSAGES = 16;
const MAX_HISTORY = 6;

export function buildModelMessages(args: {
  systemPrompt: string;
  registry: DesignComponent[];
  groups: Record<string, string[]>;
  conversation: ConversationState;
  userMessage: string;
}): { role: "system" | "user" | "assistant"; content: string }[] {
  const references = buildReferenceMap(args.registry, args.conversation, args.groups);
  const recentMessages = args.conversation.messages.slice(-MAX_MESSAGES);
  const recentHistory = args.conversation.operationHistory.slice(-MAX_HISTORY).map((entry) => ({
    id: entry.id,
    createdIds: entry.createdIds,
    deletedIds: entry.deletedIds,
    operations: entry.operations.map((operation) => operation.type),
  }));

  const canvasContext = {
    components: args.registry.map((component) => ({
      id: component.id,
      type: component.type,
      createdFrom: component.createdFrom ?? null,
      groupId: component.groupId ?? null,
      protected: Boolean(component.protected),
      permissions: component.permissions,
      state: {
        x: component.state.x,
        y: component.state.y,
        scale: component.state.scale,
        rotation: component.state.rotation,
        opacity: component.state.opacity,
        width: component.state.width,
        height: component.state.height,
        colors: component.state.colors,
        ribbonCount: component.state.colors.length,
        ribbonSpeeds: component.state.ribbonSpeeds ?? component.state.colors.map(() => 1),
        flipX: component.state.flipX,
        flipY: component.state.flipY,
        visible: component.state.visible,
      },
    })),
    groups: args.groups,
    selectedComponentIds: args.conversation.selectedComponentIds,
    lastCreatedComponentIds: args.conversation.lastCreatedComponentIds,
    lastModifiedComponentIds: args.conversation.lastModifiedComponentIds,
    lastCreatedGroupId: args.conversation.lastCreatedGroupId,
    references,
    recentHistory,
  };

  const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: args.systemPrompt },
    {
      role: "system",
      content: `Current canvas source of truth:\n${JSON.stringify(canvasContext)}\n\nReference map:\n${describeReferences(references)}`,
    },
  ];

  for (const message of recentMessages) {
    if (message.role === "system") continue;
    messages.push({
      role: message.role,
      content: formatHistoryMessage(message),
    });
  }

  messages.push({ role: "user", content: args.userMessage });
  return messages;
}

function formatHistoryMessage(message: ChatMessage): string {
  if (message.role === "assistant" && message.appliedChanges?.length) {
    return `${message.content}\nApplied: ${message.appliedChanges.join("; ")}`;
  }
  return message.content;
}
