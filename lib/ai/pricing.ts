// DeepSeek list prices in USD per 1M tokens, from
// https://api-docs.deepseek.com/quick_start/pricing (checked 2026-11-27).
// Off-peak requests cost half. Unknown models are priced like the most
// expensive known one so the budget errs on the safe side.
const PEAK_PRICES: Record<string, { cacheHit: number; cacheMiss: number; output: number }> = {
  'deepseek-flash': { cacheHit: 0.006, cacheMiss: 0.3, output: 1.2 },
  'deepseek-v4-pro': { cacheHit: 0.044, cacheMiss: 1.32, output: 3.96 },
};
const FALLBACK_PRICES = PEAK_PRICES['deepseek-v4-pro'];

export interface TokenUsage {
  cacheHitTokens: number;
  cacheMissTokens: number;
  completionTokens: number;
}

/**
 * DeepSeek peak hours: Monday–Friday 01:00–04:00 and 06:00–10:00 UTC.
 * Chinese public holidays are off-peak too, but they are treated as peak here
 * so cost estimates only ever err high.
 */
export function isPeakTime(at: Date): boolean {
  const day = at.getUTCDay();
  if (day === 0 || day === 6) return false;
  const hour = at.getUTCHours();
  return (hour >= 1 && hour < 4) || (hour >= 6 && hour < 10);
}

export function estimateCostUsd(usage: TokenUsage, model: string, at: Date = new Date()): number {
  const prices = PEAK_PRICES[model] ?? FALLBACK_PRICES;
  const factor = isPeakTime(at) ? 1 : 0.5;
  const peakCost = usage.cacheHitTokens * prices.cacheHit
    + usage.cacheMissTokens * prices.cacheMiss
    + usage.completionTokens * prices.output;
  return (factor * peakCost) / 1_000_000;
}

/**
 * Rough token count used only when a stream ends before DeepSeek reports usage
 * (for example the visitor closed the chat). DeepSeek estimates ~0.6 tokens per
 * Chinese character and ~0.3 per English one; 0.6 keeps the estimate high.
 */
export function roughTokenCount(text: string): number {
  return Math.ceil(text.length * 0.6);
}
