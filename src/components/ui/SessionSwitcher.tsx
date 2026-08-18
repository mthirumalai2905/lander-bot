import { SESSIONS, type SessionId } from "../../sessions/catalog";
import { useCanvasStore } from "../../store/canvasStore";
import { useChatStore } from "../../store/chatStore";

export function SessionSwitcher() {
  const activeSessionId = useCanvasStore((state) => state.activeSessionId);
  const setCanvasSession = useCanvasStore((state) => state.setSession);
  const setChatSession = useChatStore((state) => state.setSession);

  const select = (id: SessionId) => {
    setCanvasSession(id);
    setChatSession(id);
  };

  return (
    <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
      {SESSIONS.map((session) => {
        const active = session.id === activeSessionId;
        return (
          <button
            key={session.id}
            type="button"
            onClick={() => select(session.id)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] transition ${
              active
                ? "bg-[var(--user-bg)] text-[var(--user-text)]"
                : "text-[var(--muted)] hover:bg-[var(--chip)] hover:text-[var(--text)]"
            }`}
          >
            {session.title}
          </button>
        );
      })}
    </div>
  );
}
