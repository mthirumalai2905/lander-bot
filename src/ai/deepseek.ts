import type { ChatMessage, ConversationState } from "../types/conversation";
import type { DesignComponent } from "../types/component";
import { buildModelMessages } from "./contextBuilder";
import {
  fallbackMessage,
  inferFallbackOperations,
  repairOperations,
  type IntentContext,
} from "./intentFallback";
import { normalizeRibbonRequests } from "./operationNormalizer";
import { parseAiResponse } from "./operationParser";
import { SYSTEM_PROMPT } from "./systemPrompt";

function intentContext(
  registry: DesignComponent[],
  conversation: ConversationState,
  groups: Record<string, string[]>,
): IntentContext {
  return {
    selectedComponentIds: conversation.selectedComponentIds,
    lastCreatedComponentIds: conversation.lastCreatedComponentIds,
    lastModifiedComponentIds: conversation.lastModifiedComponentIds,
    lastCreatedGroupId: conversation.lastCreatedGroupId,
    groups,
  };
}

export async function requestLanderOperations(args: {
  registry: DesignComponent[];
  groups: Record<string, string[]>;
  conversation: ConversationState;
  userMessage: string;
}) {
  const fallback = inferFallbackOperations(
    args.userMessage,
    args.registry,
    intentContext(args.registry, args.conversation, args.groups),
  );

  const messages = buildModelMessages({
    systemPrompt: SYSTEM_PROMPT,
    registry: args.registry,
    groups: args.groups,
    conversation: args.conversation,
    userMessage: args.userMessage,
  });

  try {
    const response = await fetch("/api/lander", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });

    const payload = (await response.json()) as {
      content?: string;
      error?: string;
    };

    if (response.ok && payload.content) {
      const parsed = parseAiResponse(payload.content);
      if (parsed.ok) {
        let operations = repairOperations(
          normalizeRibbonRequests(args.userMessage, parsed.data.operations),
          args.registry,
        );
        const aiMadeManyCopies = operations.some(
          (operation) =>
            (operation.type === "duplicate" || operation.type === "batch_duplicate") &&
            operation.count > 1,
        );
        const wantsOneComponent = /\b(one more|another)\b/i.test(args.userMessage);
        if (fallback.length && (!operations.length || (wantsOneComponent && aiMadeManyCopies))) {
          operations = fallback;
        }
        if (operations.length) {
          return {
            ...parsed.data,
            message: parsed.data.operations.length ? parsed.data.message : fallbackMessage(operations),
            operations,
          };
        }
      }
    }
  } catch {
    /* fall through and apply the local interpretation */
  }

  if (fallback.length) {
    return {
      message: fallbackMessage(fallback),
      operations: fallback,
    };
  }

  return {
    message: "Tell me what to change on the canvas and I'll do it.",
    operations: [],
  };
}

export function conversationFromMessages(
  messages: ChatMessage[],
  extras: Omit<ConversationState, "messages">,
): ConversationState {
  return {
    messages,
    ...extras,
  };
}
