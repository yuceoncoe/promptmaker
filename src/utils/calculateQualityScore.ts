import type { VisualPrompt } from "../types/prompt";

const hasText = (...values: string[]) => values.some((value) => value.trim().length > 0);
const hasItems = (items: string[]) => items.some((item) => item.trim().length > 0);

export const calculateQualityScore = (prompt: VisualPrompt): number => {
  let score = 0;

  if (hasText(prompt.concept.title, prompt.concept.description) || hasItems(prompt.concept.mood)) score += 10;
  if (
    hasText(prompt.object.main_object, prompt.object.shape) ||
    hasItems(prompt.object.details) ||
    hasItems(prompt.object.surface) ||
    prompt.object.inside_objects.length > 0
  ) score += 20;
  if (
    hasText(
      prompt.composition.view,
      prompt.composition.angle,
      prompt.composition.placement,
      prompt.composition.framing,
      prompt.composition.balance,
      prompt.composition.depth
    ) || hasItems(prompt.composition.layout)
  ) score += 15;
  if (
    hasText(
      prompt.lighting.main_light,
      prompt.lighting.highlight,
      prompt.lighting.glow,
      prompt.lighting.shadow,
      prompt.lighting.mood,
      prompt.lighting.rendering_style
    )
  ) score += 15;
  if (hasText(prompt.background.color, prompt.background.style, prompt.background.surface, prompt.background.purpose)) score += 10;
  if (prompt.style_keywords.filter((item) => item.trim()).length >= 3) score += 10;
  if (prompt.negative_prompt.filter((item) => item.trim()).length >= 3) score += 5;

  return Math.min(score, 100);
};
