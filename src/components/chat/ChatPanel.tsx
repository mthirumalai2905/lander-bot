import { useEffect, useRef } from "react";
import { requestLanderOperations } from "../../ai/deepseek";
import { fallbackMessage, inferFallbackOperations } from "../../ai/intentFallback";
import { useCanvasStore } from "../../store/canvasStore";
import { useChatStore } from "../../store/chatStore";
import type { Operation } from "../../types/operation";
import { ChatInput } from "./ChatInput";
import { ChatMessage } from "./ChatMessage";

export function ChatPanel() {
  const messages = useChatStore((state) => state.messages);
  const pending = useChatStore((state) => state.pending);
  const lastFailedUserMessage = useChatStore((state) => state.lastFailedUserMessage);
  const addMessage = useChatStore((state) => state.addMessage);
  const setPending = useChatStore((state) => state.setPending);
  const setLastFailedUserMessage = useChatStore((state) => state.setLastFailedUserMessage);
  const resetChat = useChatStore((state) => state.reset);
  const undo = useCanvasStore((state) => state.undo);
  const resetCanvas = useCanvasStore((state) => state.reset);
  const canUndo = useCanvasStore((state) => state.operationHistory.length > 0);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending]);

  const send = async (text: string) => {
    addMessage({ role: "user", content: text });
    setPending(true);
    setLastFailedUserMessage(null);

    try {
      const canvas = useCanvasStore.getState();
      const chat = useChatStore.getState();
      const response = await requestLanderOperations({
        registry: canvas.registry,
        groups: canvas.groups,
        conversation: {
          messages: chat.messages,
          activeComponentId: canvas.activeComponentId,
          selectedComponentIds: canvas.selectedComponentIds,
          lastCreatedComponentIds: canvas.lastCreatedComponentIds,
          lastModifiedComponentIds: canvas.lastModifiedComponentIds,
          lastCreatedGroupId: canvas.lastCreatedGroupId,
          operationHistory: canvas.operationHistory,
        },
        userMessage: text,
      });

      const operations: Operation[] = [...response.operations];
      if (response.protectIds?.length) {
        operations.unshift({
          type: "protect",
          targetIds: response.protectIds,
          protected: true,
        });
      }

      if (operations.length === 0) {
        addMessage({
          role: "assistant",
          content: response.message,
          appliedChanges: response.appliedChanges,
        });
        return;
      }

      let result = canvas.applyOperations(operations);
      if (!result.ok) {
        const fallback = inferFallbackOperations(text, canvas.registry, {
          selectedComponentIds: canvas.selectedComponentIds,
          lastCreatedComponentIds: canvas.lastCreatedComponentIds,
          lastModifiedComponentIds: canvas.lastModifiedComponentIds,
          lastCreatedGroupId: canvas.lastCreatedGroupId,
          groups: canvas.groups,
        });
        if (fallback.length) {
          result = canvas.applyOperations(fallback);
          addMessage({
            role: "assistant",
            content: result.ok ? fallbackMessage(fallback) : "Applied the closest matching change.",
            appliedChanges: result.applied.map((item) => item.text),
          });
          return;
        }
      }

      addMessage({
        role: "assistant",
        content: result.ok ? response.message : "Applied the closest matching change.",
        appliedChanges: result.applied.map((item) => item.text),
      });
    } catch {
      const canvas = useCanvasStore.getState();
      const fallback = inferFallbackOperations(text, canvas.registry, {
        selectedComponentIds: canvas.selectedComponentIds,
        lastCreatedComponentIds: canvas.lastCreatedComponentIds,
        lastModifiedComponentIds: canvas.lastModifiedComponentIds,
        lastCreatedGroupId: canvas.lastCreatedGroupId,
        groups: canvas.groups,
      });
      if (fallback.length) {
        const result = canvas.applyOperations(fallback);
        addMessage({
          role: "assistant",
          content: fallbackMessage(fallback),
          appliedChanges: result.applied.map((item) => item.text),
        });
        return;
      }
      addMessage({
        role: "assistant",
        content: "Tell me what to change and I'll do it on the canvas.",
      });
    } finally {
      setPending(false);
    }
  };

  return (
    <aside className="flex h-full w-[380px] shrink-0 flex-col border-l border-[var(--border)] bg-[var(--chat)]">
      <header className="border-b border-[var(--border)] px-5 py-4">
        <p className="text-[15px] font-medium tracking-[-0.02em] text-[var(--text)]">Lander Bot</p>
        <p className="mt-0.5 text-[13px] text-[var(--muted)]">Your AI design assistant</p>
      </header>

      <div ref={scroller} className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5">
        {messages.length === 0 && (
          <div className="rounded-2xl bg-[var(--panel)] px-4 py-3 text-[13px] leading-6 text-[var(--muted)]">
            Ask for a duplicate, a recolor, a rotation, or a batch of copies. The original Strand
            stays on the canvas until you change it.
          </div>
        )}
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        {pending && (
          <p className="text-[13px] text-[var(--dim)]">Lander is thinking…</p>
        )}
      </div>

      <div className="flex items-center gap-2 px-4">
        <button
          type="button"
          disabled={!canUndo || pending}
          onClick={() => {
            const undone = undo();
            if (undone) {
              addMessage({
                role: "assistant",
                content: "Undid the last change.",
                appliedChanges: ["Reverted the previous batch as one action"],
              });
            }
          }}
          className="rounded-full border border-[var(--border)] px-3 py-1.5 text-[12px] text-[var(--soft)] disabled:opacity-40"
        >
          Undo last change
        </button>
        {lastFailedUserMessage && (
          <button
            type="button"
            disabled={pending}
            onClick={() => void send(lastFailedUserMessage)}
            className="rounded-full border border-[var(--border)] px-3 py-1.5 text-[12px] text-[var(--soft)]"
          >
            Retry
          </button>
        )}
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            resetCanvas();
            resetChat();
          }}
          className="ml-auto rounded-full px-3 py-1.5 text-[12px] text-[var(--dim)] hover:text-[var(--soft)]"
        >
          Reset
        </button>
      </div>

      <ChatInput disabled={pending} onSend={(value) => void send(value)} />
    </aside>
  );
}
