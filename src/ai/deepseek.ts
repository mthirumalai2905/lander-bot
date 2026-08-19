import type { ChatMessage, ConversationState } from "../types/conversation";
import type { DesignComponent } from "../types/component";
import type { Operation } from "../types/operation";
import { buildModelMessages } from "./contextBuilder";
import {
  estimateUsageFromText,
  normalizeDeepSeekUsage,
  type TokenUsage,
} from "./deepseekPricing";
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
  currentSource?: string,
): IntentContext {
  return {
    selectedComponentIds: conversation.selectedComponentIds,
    lastCreatedComponentIds: conversation.lastCreatedComponentIds,
    lastModifiedComponentIds: conversation.lastModifiedComponentIds,
    lastCreatedGroupId: conversation.lastCreatedGroupId,
    groups,
    currentSource,
  };
}

export async function requestLanderOperations(args: {
  registry: DesignComponent[];
  groups: Record<string, string[]>;
  conversation: ConversationState;
  userMessage: string;
  source?: string;
}): Promise<{
  message: string;
  operations: Operation[];
  appliedChanges?: string[];
  protectIds?: string[];
  usage?: TokenUsage;
}> {
  const fallback = inferFallbackOperations(
    args.userMessage,
    args.registry,
    intentContext(args.registry, args.conversation, args.groups, args.source),
  );

  const messages = buildModelMessages({
    systemPrompt: SYSTEM_PROMPT,
    registry: args.registry,
    groups: args.groups,
    conversation: args.conversation,
    userMessage: args.userMessage,
    source: args.source,
  });

  let usage: TokenUsage | undefined;

  try {
    const response = await fetch("/api/lander", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });

    const payload = (await response.json()) as {
      content?: string;
      error?: string;
      usage?: unknown;
    };
    let headerUsage: TokenUsage | undefined;
    try {
      const header = response.headers.get("x-deepseek-usage");
      headerUsage = header ? normalizeDeepSeekUsage(JSON.parse(header)) : undefined;
    } catch {
      headerUsage = undefined;
    }
    usage =
      normalizeDeepSeekUsage(payload.usage) ??
      headerUsage ??
      (payload.content
        ? estimateUsageFromText(
            messages.map((message) => message.content).join("\n"),
            payload.content,
          )
        : undefined);

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
        const shapeFallback = fallback.some((operation) => operation.type === "source_edit");
        const aiEditedSource = operations.some((operation) => operation.type === "source_edit");
        const fallbackIsCopy = fallback.some(
          (operation) => operation.type === "duplicate" || operation.type === "batch_duplicate",
        );
        const aiCopied = operations.some(
          (operation) => operation.type === "duplicate" || operation.type === "batch_duplicate",
        );
        if (shapeFallback && !aiEditedSource) {
          return {
            message: fallbackMessage(fallback),
            operations: fallback,
            usage,
          };
        }
        if (fallbackIsCopy && !aiCopied) {
          return {
            message: fallbackMessage(fallback),
            operations: fallback,
            usage,
          };
        }
        if (fallback.length && (!operations.length || (wantsOneComponent && aiMadeManyCopies))) {
          operations = fallback;
        }
        if (operations.length) {
          return {
            ...parsed.data,
            message: parsed.data.operations.length ? parsed.data.message : fallbackMessage(operations),
            operations,
            usage,
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
      usage,
    };
  }

  return {
    message: "Tell me what to change on the canvas and I'll do it.",
    operations: [],
    usage,
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
