import { create } from "zustand";
import {
  estimateDeepSeekCost,
  type TokenUsage,
} from "../ai/deepseekPricing";
import { createLocalId } from "../utils/ids";

const STORAGE_KEY = "lander-bot-usage-v1";

export interface UsageEntry {
  id: string;
  timestamp: number;
  task: string;
  changes: string[];
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cacheHitTokens: number;
  cacheMissTokens: number;
  costUsd: number;
  peak: boolean;
  model: string;
  estimated?: boolean;
}

interface UsageStore {
  entries: UsageEntry[];
  record: (input: { task: string; changes: string[]; usage: TokenUsage }) => void;
  clear: () => void;
}

function loadPersisted(): UsageEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { entries?: UsageEntry[] };
    return Array.isArray(parsed.entries) ? parsed.entries : [];
  } catch {
    return [];
  }
}

function persist(entries: UsageEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ entries }));
  } catch {
    /* ignore quota / private mode */
  }
}

export function usageTotals(entries: UsageEntry[]) {
  return entries.reduce(
    (totals, entry) => ({
      tokens: totals.tokens + entry.totalTokens,
      costUsd: totals.costUsd + entry.costUsd,
    }),
    { tokens: 0, costUsd: 0 },
  );
}

export const useUsageStore = create<UsageStore>((set) => ({
  entries: typeof localStorage !== "undefined" ? loadPersisted() : [],

  record: ({ task, changes, usage }) => {
    const { costUsd, peak } = estimateDeepSeekCost(usage);
    const entry: UsageEntry = {
      id: createLocalId("usage"),
      timestamp: usage.billedAt,
      task,
      changes,
      promptTokens: usage.promptTokens,
      completionTokens: usage.completionTokens,
      totalTokens: usage.totalTokens,
      cacheHitTokens: usage.cacheHitTokens,
      cacheMissTokens: usage.cacheMissTokens,
      costUsd,
      peak,
      model: usage.model,
      estimated: usage.estimated,
    };
    set((state) => {
      const entries = [entry, ...state.entries].slice(0, 200);
      persist(entries);
      return { entries };
    });
  },

  clear: () => {
    persist([]);
    set({ entries: [] });
  },
}));
