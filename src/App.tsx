import { useEffect } from "react";
import { DesignCanvas } from "./components/canvas/DesignCanvas";
import { ChatPanel } from "./components/chat/ChatPanel";
import { SessionSwitcher } from "./components/ui/SessionSwitcher";
import { ThemeToggle } from "./components/ui/ThemeToggle";
import { useCanvasStore } from "./store/canvasStore";
import { useChatStore } from "./store/chatStore";

export default function App() {
  useEffect(() => {
    const canvasSession = useCanvasStore.getState().activeSessionId;
    if (useChatStore.getState().sessionId !== canvasSession) {
      useChatStore.getState().setSession(canvasSession);
    }
  }, []);

  return (
    <div className="flex h-screen flex-col bg-[var(--bg)] text-[var(--text)]">
      <header className="flex h-12 items-center gap-4 border-b border-[var(--border)] px-6">
        <p className="shrink-0 text-[14px] font-medium tracking-[-0.02em]">Lander Bot</p>
        <SessionSwitcher />
        <ThemeToggle />
      </header>
      <main className="flex min-h-0 flex-1">
        <DesignCanvas />
        <ChatPanel />
      </main>
    </div>
  );
}
