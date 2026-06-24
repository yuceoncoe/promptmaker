import type { UnifiedPrompt } from "../types/prompt";

const nonEmpty = (value: string) => value.trim().length > 0;
const joinList = (items: string[]) => items.filter(nonEmpty).join(", ");

export const buildFinalPrompt = (prompt: UnifiedPrompt): string => {
  const parts: string[] = [];

  // Subject
  const objectLead = [
    prompt.subject.type !== "other" ? `${prompt.subject.type}:` : "",
    joinList(prompt.subject.main_object),
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

  // Background
  const bgParts = [];
  if (prompt.background.type === "solid" && prompt.background.color.trim()) {
    bgParts.push(`${prompt.background.color.trim()} background`);
  } else if (prompt.background.type === "environment" && prompt.background.environment.length > 0) {
    bgParts.push(joinList(prompt.background.environment));
  }

  if (prompt.background.props.length > 0) {
    bgParts.push(`with ${joinList(prompt.background.props)}`);
  }

  if (bgParts.length > 0) {
    parts.push(`Background: ${bgParts.join(" ")}.`);
  }

  // Scene & Composition
  const sceneParts = [...prompt.scene.composition].filter(nonEmpty);
  if (sceneParts.length > 0) {
    parts.push(`Composition: ${sceneParts.join(", ")}.`);
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
  if (prompt.style.color_temperature.length > 0) {
    parts.push(`Color grading: ${joinList(prompt.style.color_temperature)}.`);
  }

  if (prompt.style.lighting.length > 0) {
    parts.push(`Lighting: ${joinList(prompt.style.lighting)}.`);
  }

  if (prompt.constraints.custom_rules.trim()) {
    parts.push(prompt.constraints.custom_rules.trim());
  }

  if (prompt.constraints.negative_prompt.length > 0) {
    parts.push(`--no ${prompt.constraints.negative_prompt.join(", ")}`);
  }

  if (prompt.scene.framing) {
    parts.push(`--ar ${prompt.scene.framing}`);
  }

  return parts.join(" ").replace(/\s+/g, " ").trim();
};
