import type { UnifiedPrompt } from "../types/prompt";

const hasText = (...values: string[]) => values.some((value) => value.trim().length > 0);
const hasItems = (items: string[]) => items.some((item) => item.trim().length > 0);

export const calculateQualityScore = (prompt: UnifiedPrompt): number => {
  let score = 0;

  if (
    hasText(prompt.meta.purpose) ||
    hasItems(prompt.style.mood) ||
    hasItems(prompt.style.medium) ||
    hasItems(prompt.style.aesthetic) ||
    hasItems(prompt.style.era)
  ) {
    score += 20;
  }
  if (
    hasItems(prompt.subject.main_object) ||
    hasItems(prompt.subject.details)
  ) score += 30;
  if (
    hasText(prompt.background.color) ||
    hasItems(prompt.background.environment) ||
    hasItems(prompt.background.props) ||
    hasItems(prompt.scene.composition)
  ) score += 20;
  if (
    hasItems(prompt.style.lighting) ||
    hasItems(prompt.style.color_temperature)
  ) score += 20;
  if (prompt.constraints.negative_prompt.filter((item) => item.trim()).length >= 3) score += 10;

  return Math.min(score, 100);
};
