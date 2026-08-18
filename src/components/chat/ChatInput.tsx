import { useState, type KeyboardEvent } from "react";

interface ChatInputProps {
  disabled: boolean;
  onSend: (value: string) => void;
  placeholder?: string;
}

export function ChatInput({
  disabled,
  onSend,
  placeholder = "Type your command...",
}: ChatInputProps) {
  const [value, setValue] = useState("");

  const submit = () => {
    const next = value.trim();
    if (!next || disabled) return;
    onSend(next);
    setValue("");
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <div className="border-t border-[var(--border)] bg-[var(--chat)] p-4">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-2 focus-within:border-[var(--muted)]">
        <textarea
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={onKeyDown}
          disabled={disabled}
          rows={3}
          placeholder={placeholder}
          className="w-full resize-none bg-transparent px-2 py-1.5 text-[14px] leading-6 text-[var(--text)] outline-none placeholder:text-[var(--dim)] disabled:opacity-60"
        />
        <div className="flex items-center justify-between px-2 pb-1">
          <span className="text-[11px] text-[var(--dim)]">Enter to send · Shift+Enter for a new line</span>
          <button
            type="button"
            onClick={submit}
            disabled={disabled || !value.trim()}
            className="rounded-full bg-[var(--user-bg)] px-3.5 py-1.5 text-[13px] text-[var(--user-text)] disabled:opacity-40"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
