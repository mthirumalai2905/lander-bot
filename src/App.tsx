import { DesignCanvas } from "./components/canvas/DesignCanvas";
import { ChatPanel } from "./components/chat/ChatPanel";
import { ThemeToggle } from "./components/ui/ThemeToggle";

export default function App() {
  return (
    <div className="flex h-screen flex-col bg-[var(--bg)] text-[var(--text)]">
      <header className="flex h-12 items-center justify-between border-b border-[var(--border)] px-6">
        <p className="text-[14px] font-medium tracking-[-0.02em]">Lander Bot</p>
        <div className="flex items-center gap-3">
          <p className="text-[12px] text-[var(--dim)]">Design editor POC</p>
          <ThemeToggle />
        </div>
      </header>
      <main className="flex min-h-0 flex-1">
        <DesignCanvas />
        <ChatPanel />
      </main>
    </div>
  );
}
