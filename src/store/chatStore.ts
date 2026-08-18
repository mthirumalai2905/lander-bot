import { create } from "zustand";
import type { ChatMessage } from "../types/conversation";
import { createLocalId } from "../utils/ids";

const STORAGE_KEY = "lander-bot-chat";

interface ChatStore {
  messages: ChatMessage[];
  pending: boolean;
  lastFailedUserMessage: string | null;
  addMessage: (message: Omit<ChatMessage, "id" | "timestamp"> & { id?: string }) => ChatMessage;
  setPending: (pending: boolean) => void;
  setLastFailedUserMessage: (message: string | null) => void;
  reset: () => void;
}

function persist(messages: ChatMessage[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
}

function loadMessages(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ChatMessage[];
  } catch {
    return [];
  }
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: typeof localStorage !== "undefined" ? loadMessages() : [],
  pending: false,
  lastFailedUserMessage: null,

  addMessage: (message) => {
    const next: ChatMessage = {
      id: message.id ?? createLocalId("msg"),
      timestamp: Date.now(),
      ...message,
    };
    set((state) => {
      const messages = [...state.messages, next];
      persist(messages);
      return { messages };
    });
    return next;
  },

  setPending: (pending) => set({ pending }),
  setLastFailedUserMessage: (lastFailedUserMessage) => set({ lastFailedUserMessage }),

  reset: () => {
    persist([]);
    set({ messages: [], pending: false, lastFailedUserMessage: null });
  },
}));
