import { create } from "zustand";
import { isSessionId, type SessionId } from "../sessions/catalog";
import type { ChatMessage } from "../types/conversation";
import { createLocalId } from "../utils/ids";

const STORAGE_KEY = "lander-bot-chats-v1";

interface ChatStore {
  sessionId: SessionId;
  messages: ChatMessage[];
  threads: Partial<Record<SessionId, ChatMessage[]>>;
  pending: boolean;
  lastFailedUserMessage: string | null;
  setSession: (id: SessionId) => void;
  addMessage: (message: Omit<ChatMessage, "id" | "timestamp"> & { id?: string }) => ChatMessage;
  setPending: (pending: boolean) => void;
  setLastFailedUserMessage: (message: string | null) => void;
  reset: () => void;
}

function persist(threads: Partial<Record<SessionId, ChatMessage[]>>, sessionId: SessionId) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ threads, sessionId }));
}

function loadPersisted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as { threads?: Partial<Record<SessionId, ChatMessage[]>>; sessionId?: SessionId };
  } catch {
    return null;
  }
}

const persisted = typeof localStorage !== "undefined" ? loadPersisted() : null;
const startSession = isSessionId(persisted?.sessionId ?? "") ? persisted!.sessionId! : "strands";

export const useChatStore = create<ChatStore>((set) => ({
  sessionId: startSession,
  threads: persisted?.threads ?? {},
  messages: persisted?.threads?.[startSession] ?? [],
  pending: false,
  lastFailedUserMessage: null,

  setSession: (sessionId) => {
    set((state) => {
      const threads = { ...state.threads, [state.sessionId]: state.messages };
      persist(threads, sessionId);
      return {
        sessionId,
        threads,
        messages: threads[sessionId] ?? [],
        lastFailedUserMessage: null,
      };
    });
  },

  addMessage: (message) => {
    const next: ChatMessage = {
      id: message.id ?? createLocalId("msg"),
      timestamp: Date.now(),
      ...message,
    };
    set((state) => {
      const messages = [...state.messages, next];
      const threads = { ...state.threads, [state.sessionId]: messages };
      persist(threads, state.sessionId);
      return { messages, threads };
    });
    return next;
  },

  setPending: (pending) => set({ pending }),
  setLastFailedUserMessage: (lastFailedUserMessage) => set({ lastFailedUserMessage }),

  reset: () => {
    set((state) => {
      const threads = { ...state.threads, [state.sessionId]: [] };
      persist(threads, state.sessionId);
      return { messages: [], pending: false, lastFailedUserMessage: null, threads };
    });
  },
}));
