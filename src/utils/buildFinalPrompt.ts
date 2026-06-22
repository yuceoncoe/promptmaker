import type { UnifiedPrompt } from "../types/prompt";

const nonEmpty = (value: string) => value.trim().length > 0;
const joinList = (items: string[]) => items.filter(nonEmpty).join(", ");

export const buildFinalPrompt = (prompt: UnifiedPrompt): string => {
  const parts: string[] = [];

  // Subject
  const objectLead = [
    prompt.subject.type !== "other" ? `${prompt.subject.type}:` : "",
    prompt.subject.main_object,
  ]
    .filter(nonEmpty)
    .join(" ")
    .trim();

  if (objectLead) {
    parts.push(`Primary subject: ${objectLead}.`);
  }

  if (prompt.subject.details.length > 0) {
    parts.push(`Subject details: ${joinList(prompt.subject.details)}.`);
  }

  // Scene & Composition
  const sceneParts = [
    prompt.scene.background,
    ...prompt.scene.composition,
  ].filter(nonEmpty);
  if (sceneParts.length > 0) {
    parts.push(`Scene & Composition: ${sceneParts.join(", ")}.`);
  }

  // Style
  if (prompt.style.medium.length > 0) {
    parts.push(`Medium: ${joinList(prompt.style.medium)}.`);
  }
  if (prompt.style.aesthetic.length > 0) {
    parts.push(`Aesthetic: ${joinList(prompt.style.aesthetic)}.`);
  }

  if (prompt.style.era.length > 0) {
    parts.push(`Era/Time period: ${joinList(prompt.style.era)}.`);
  }

  if (prompt.style.mood.length > 0) {
    parts.push(`Mood: ${joinList(prompt.style.mood)}.`);
  }
  if (prompt.style.color_palette.length > 0) {
    parts.push(`Colors: ${joinList(prompt.style.color_palette)}.`);
  }

  if (prompt.style.lighting.length > 0) {
    parts.push(`Lighting: ${joinList(prompt.style.lighting)}.`);
  }

  return parts.join(" ").replace(/\s+/g, " ").trim();
};
