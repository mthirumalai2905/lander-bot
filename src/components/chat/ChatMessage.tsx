import type { ChatMessage as ChatMessageType } from "../../types/conversation";
import { AppliedChanges } from "./AppliedChanges";

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <article className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[92%] ${isUser ? "" : "w-full"}`}>
        <p className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--dim)]">
          {isUser ? "You" : "Lander Bot"}
        </p>
        <div
          className={
            isUser
              ? "rounded-2xl bg-[var(--user-bg)] px-3.5 py-2.5 text-[14px] leading-6 text-[var(--user-text)]"
              : "rounded-2xl bg-[var(--panel)] px-3.5 py-2.5 text-[14px] leading-6 text-[var(--text)]"
          }
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
          {!isUser && message.appliedChanges && (
            <AppliedChanges changes={message.appliedChanges} />
          )}
        </div>
      </div>
    </article>
  );
}
