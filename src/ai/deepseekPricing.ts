/** Official DeepSeek V4 Flash rates (USD per 1M tokens). */
export const DEEPSEEK_V4_FLASH_RATES = {
  peak: { cacheHit: 0.014, cacheMiss: 0.44, output: 1.32 },
  offPeak: { cacheHit: 0.007, cacheMiss: 0.22, output: 0.66 },
} as const;

export const DEEPSEEK_CHAT_MODEL = "deepseek-chat";

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cacheHitTokens: number;
  cacheMissTokens: number;
  model: string;
  billedAt: number;
  estimated?: boolean;
}

export interface DeepSeekUsagePayload {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  prompt_cache_hit_tokens?: number;
  prompt_cache_miss_tokens?: number;
  input_tokens?: number;
  output_tokens?: number;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  prompt_tokens_details?: { cached_tokens?: number; cachedTokens?: number };
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return undefined;
}

export function extractDeepSeekUsage(raw: unknown): DeepSeekUsagePayload | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const usage = raw as Record<string, unknown>;
  const details =
    usage.prompt_tokens_details && typeof usage.prompt_tokens_details === "object"
      ? (usage.prompt_tokens_details as Record<string, unknown>)
      : undefined;

  const promptTokens = asNumber(
    usage.prompt_tokens ?? usage.input_tokens ?? usage.promptTokens ?? usage.inputTokens,
  );
  const completionTokens = asNumber(
    usage.completion_tokens ?? usage.output_tokens ?? usage.completionTokens ?? usage.outputTokens,
  );
  const totalTokens = asNumber(usage.total_tokens ?? usage.totalTokens);
  const cacheHitTokens = asNumber(
    usage.prompt_cache_hit_tokens ??
      usage.promptCacheHitTokens ??
      details?.cached_tokens ??
      details?.cachedTokens,
  );
  const cacheMissTokens = asNumber(usage.prompt_cache_miss_tokens ?? usage.promptCacheMissTokens);

  if (promptTokens == null && completionTokens == null && totalTokens == null) return undefined;

  return {
    prompt_tokens: promptTokens ?? 0,
    completion_tokens: completionTokens ?? 0,
    total_tokens: totalTokens ?? (promptTokens ?? 0) + (completionTokens ?? 0),
    prompt_cache_hit_tokens: cacheHitTokens,
    prompt_cache_miss_tokens: cacheMissTokens,
  };
}

export function estimateUsageFromText(
  prompt: string,
  completion: string,
  billedAt = Date.now(),
): TokenUsage {
  const promptTokens = Math.max(1, Math.round(prompt.length / 4));
  const completionTokens = Math.max(1, Math.round(completion.length / 4));
  return {
    promptTokens,
    completionTokens,
    totalTokens: promptTokens + completionTokens,
    cacheHitTokens: 0,
    cacheMissTokens: promptTokens,
    model: DEEPSEEK_CHAT_MODEL,
    billedAt,
    estimated: true,
  };
}

/** Peak hours are 01:00–04:00 and 06:00–10:00 UTC. */
export function isDeepSeekPeakHour(date: Date): boolean {
  const hour = date.getUTCHours();
  return (hour >= 1 && hour < 4) || (hour >= 6 && hour < 10);
}

export function normalizeDeepSeekUsage(
  raw: unknown,
  billedAt = Date.now(),
): TokenUsage | undefined {
  const payload = extractDeepSeekUsage(raw);
  if (!payload) return undefined;
  const promptTokens = payload.prompt_tokens ?? 0;
  const completionTokens = payload.completion_tokens ?? 0;
  const totalTokens = payload.total_tokens ?? promptTokens + completionTokens;
  if (!promptTokens && !completionTokens && !totalTokens) return undefined;

  const cacheHitTokens = payload.prompt_cache_hit_tokens ?? 0;
  const cacheMissTokens =
    payload.prompt_cache_miss_tokens ?? Math.max(0, promptTokens - cacheHitTokens);

  return {
    promptTokens,
    completionTokens,
    totalTokens,
    cacheHitTokens,
    cacheMissTokens,
    model: DEEPSEEK_CHAT_MODEL,
    billedAt,
  };
}

export function estimateDeepSeekCost(usage: TokenUsage) {
  const peak = isDeepSeekPeakHour(new Date(usage.billedAt));
  const rates = peak ? DEEPSEEK_V4_FLASH_RATES.peak : DEEPSEEK_V4_FLASH_RATES.offPeak;
  const costUsd =
    (usage.cacheHitTokens / 1_000_000) * rates.cacheHit +
    (usage.cacheMissTokens / 1_000_000) * rates.cacheMiss +
    (usage.completionTokens / 1_000_000) * rates.output;

  return { costUsd, peak };
}

export function formatUsd(amount: number): string {
  if (amount <= 0) return "$0.00";
  if (amount < 0.0001) return `$${amount.toFixed(6)}`;
  if (amount < 0.01) return `$${amount.toFixed(4)}`;
  return `$${amount.toFixed(3)}`;
}

export function formatTokenCount(count: number): string {
  return count.toLocaleString("en-US");
}
