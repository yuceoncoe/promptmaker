import type { InsideObject, VisualPrompt } from "../types/prompt";

const nonEmpty = (value: string) => value.trim().length > 0;

const joinList = (items: string[]) => items.filter(nonEmpty).join(", ");

const insideObjectSummary = (items: InsideObject[]) => {
  const summaries = items
    .map((item) => [item.description || item.name, item.material ? `made of ${item.material}` : ""].filter(nonEmpty).join(", "))
    .filter(nonEmpty);

  if (!summaries.length) {
    return "";
  }

  return `Inside the main object, include ${summaries.join("; ")}.`;
};

export const buildFinalPrompt = (prompt: VisualPrompt): string => {
  const parts: string[] = [];
  const conceptLead = [prompt.concept.title, prompt.concept.description].filter(nonEmpty).join(": ");
  if (conceptLead) {
    parts.push(conceptLead.endsWith(".") ? conceptLead : `${conceptLead}.`);
  }

  if (prompt.concept.mood.length > 0) {
    parts.push(`Mood: ${joinList(prompt.concept.mood)}.`);
  }

  const objectLead = [
    prompt.object.main_object,
    prompt.object.shape ? `with ${prompt.object.shape}` : "",
  ]
    .filter(nonEmpty)
    .join(" ");
  if (objectLead) {
    parts.push(`Feature ${objectLead}.`);
  }

  if (prompt.object.details.length > 0) {
    parts.push(`Object details: ${joinList(prompt.object.details)}.`);
  }

  if (prompt.object.surface.length > 0) {
    parts.push(`Surface: ${joinList(prompt.object.surface)}.`);
  }

  const insideObjects = insideObjectSummary(prompt.object.inside_objects);
  if (insideObjects) {
    parts.push(insideObjects);
  }

  const compositionParts = [
    prompt.composition.view,
    prompt.composition.angle,
    prompt.composition.placement,
    prompt.composition.framing,
    joinList(prompt.composition.layout),
    prompt.composition.balance,
    prompt.composition.depth,
  ].filter(nonEmpty);
  if (compositionParts.length > 0) {
    parts.push(`Use ${compositionParts.join(", ")}.`);
  }

  const lightingParts = [
    prompt.lighting.main_light,
    prompt.lighting.highlight,
    prompt.lighting.glow,
    prompt.lighting.shadow,
    prompt.lighting.mood,
    prompt.lighting.rendering_style,
  ].filter(nonEmpty);
  if (lightingParts.length > 0) {
    parts.push(`Lighting and rendering: ${lightingParts.join(", ")}.`);
  }

  const backgroundParts = [
    prompt.background.color,
    prompt.background.style,
    prompt.background.surface,
    prompt.background.purpose,
  ].filter(nonEmpty);
  if (backgroundParts.length > 0) {
    parts.push(`Background: ${backgroundParts.join(", ")}.`);
  }

  const paletteParts = [
    prompt.color_palette.primary.length ? `primary colors ${joinList(prompt.color_palette.primary)}` : "",
    prompt.color_palette.accent.length ? `accent colors ${joinList(prompt.color_palette.accent)}` : "",
    prompt.color_palette.contrast,
  ].filter(nonEmpty);
  if (paletteParts.length > 0) {
    parts.push(`Color palette: ${paletteParts.join(", ")}.`);
  }

  const textParts = [
    prompt.text_elements.top_left_text,
    prompt.text_elements.price_label,
    prompt.text_elements.bottom_labels.length ? `bottom labels ${joinList(prompt.text_elements.bottom_labels)}` : "",
    prompt.text_elements.text_direction,
    prompt.text_elements.note,
  ].filter(nonEmpty);
  if (textParts.length > 0) {
    parts.push(`Text elements: ${textParts.join(", ")}.`);
  }

  if (prompt.style_keywords.length > 0) {
    parts.push(`Style keywords: ${joinList(prompt.style_keywords)}.`);
  }

  return parts.join(" ").replace(/\s+/g, " ").trim();
};
