export type EffectQuality = "high" | "low" | "static";

type EffectQualityInput = {
  reducedMotion: boolean;
  viewportWidth: number;
  hardwareConcurrency?: number;
};

export type EffectKind = "fireflies" | "sakura" | "grass" | "danmaku";

export const EFFECT_BUDGETS = {
  fireflies: { high: 20, low: 10, static: 5 },
  sakura: { high: 14, low: 8, static: 5 },
  grass: { high: 30, low: 15, static: 10 },
  danmaku: { high: 6, low: 3, static: 0 },
} as const satisfies Record<EffectKind, Record<EffectQuality, number>>;

export function getEffectBudget(kind: EffectKind, quality: EffectQuality) {
  return EFFECT_BUDGETS[kind][quality];
}

export function createFixedEffectList<T>(
  kind: EffectKind,
  quality: EffectQuality,
  factory: (index: number) => T,
) {
  return Array.from({ length: getEffectBudget(kind, quality) }, (_, index) => factory(index));
}

export function resolveEffectQuality({
  reducedMotion,
  viewportWidth,
  hardwareConcurrency,
}: EffectQualityInput): EffectQuality {
  if (reducedMotion) return "static";
  return viewportWidth < 768 || (hardwareConcurrency ?? 4) <= 4 ? "low" : "high";
}

export function pseudoRandom(seed: number) {
  const value = Math.sin(seed * 999.91) * 43758.5453;
  return value - Math.floor(value);
}

export function effectValue(value: number, unit: string) {
  return `${value.toFixed(3)}${unit}`;
}
