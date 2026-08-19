import { describe, expect, it } from "vitest";
import {
  estimateDeepSeekCost,
  formatUsd,
  isDeepSeekPeakHour,
  normalizeDeepSeekUsage,
} from "./deepseekPricing";

describe("DeepSeek pricing", () => {
  it("treats 01:00–04:00 and 06:00–10:00 UTC as peak", () => {
    expect(isDeepSeekPeakHour(new Date("2026-08-19T00:59:00Z"))).toBe(false);
    expect(isDeepSeekPeakHour(new Date("2026-08-19T01:00:00Z"))).toBe(true);
    expect(isDeepSeekPeakHour(new Date("2026-08-19T03:59:00Z"))).toBe(true);
    expect(isDeepSeekPeakHour(new Date("2026-08-19T04:00:00Z"))).toBe(false);
    expect(isDeepSeekPeakHour(new Date("2026-08-19T06:00:00Z"))).toBe(true);
    expect(isDeepSeekPeakHour(new Date("2026-08-19T09:59:00Z"))).toBe(true);
    expect(isDeepSeekPeakHour(new Date("2026-08-19T10:00:00Z"))).toBe(false);
  });

  it("bills cache hit, cache miss, and output separately at off-peak Flash rates", () => {
    const usage = normalizeDeepSeekUsage(
      {
        prompt_tokens: 1100,
        prompt_cache_hit_tokens: 1000,
        prompt_cache_miss_tokens: 100,
        completion_tokens: 200,
        total_tokens: 1300,
      },
      Date.parse("2026-08-19T12:00:00Z"),
    );

    expect(usage).toBeDefined();
    const { costUsd, peak } = estimateDeepSeekCost(usage!);
    expect(peak).toBe(false);
    expect(costUsd).toBeCloseTo(1000 / 1e6 * 0.007 + 100 / 1e6 * 0.22 + 200 / 1e6 * 0.66);
  });

  it("doubles Flash rates during peak hours", () => {
    const usage = normalizeDeepSeekUsage(
      {
        prompt_tokens: 1000,
        prompt_cache_hit_tokens: 0,
        prompt_cache_miss_tokens: 1000,
        completion_tokens: 500,
        total_tokens: 1500,
      },
      Date.parse("2026-08-19T07:00:00Z"),
    );

    const { costUsd, peak } = estimateDeepSeekCost(usage!);
    expect(peak).toBe(true);
    expect(costUsd).toBeCloseTo(1000 / 1e6 * 0.44 + 500 / 1e6 * 1.32);
  });

  it("fills missing cache-miss tokens from the prompt total", () => {
    const usage = normalizeDeepSeekUsage({
      prompt_tokens: 80,
      prompt_cache_hit_tokens: 50,
      completion_tokens: 10,
      total_tokens: 90,
    });

    expect(usage?.cacheMissTokens).toBe(30);
  });

  it("formats tiny request costs without rounding them to zero", () => {
    expect(formatUsd(0.0000123)).toBe("$0.000012");
  });

  it("reads DeepSeek usage from camelCase and input/output aliases", () => {
    const usage = normalizeDeepSeekUsage({
      input_tokens: 40,
      output_tokens: 12,
      prompt_tokens_details: { cached_tokens: 10 },
    });

    expect(usage).toMatchObject({
      promptTokens: 40,
      completionTokens: 12,
      totalTokens: 52,
      cacheHitTokens: 10,
      cacheMissTokens: 30,
    });
  });
});
