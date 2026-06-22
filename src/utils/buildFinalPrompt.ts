import type { VisualPrompt } from "../types/prompt";

const nonEmpty = (value: string) => value.trim().length > 0;

const joinList = (items: string[]) => items.filter(nonEmpty).join(", ");

const promptViewMap: Record<string, string> = {
  "front view": "front view",
  "rear view": "rear view",
  "left profile view": "left profile view",
  "right profile view": "right profile view",
  "top view": "top view",
  "three-quarter front left view": "three-quarter front left view",
  "three-quarter front right view": "three-quarter front right view",
  "three-quarter rear left view": "three-quarter rear left view",
  "three-quarter rear right view": "three-quarter rear right view",
  "high-angle front view": "high-angle front view",
  "high-angle three-quarter left view": "high-angle three-quarter left view",
  "high-angle three-quarter right view": "high-angle three-quarter right view",
  "bird's-eye view": "bird's-eye view",
  "overhead view": "overhead view",
  "flat lay": "flat lay",
  "low-angle front view": "low-angle front view",
  "low-angle three-quarter left view": "low-angle three-quarter left view",
  "low-angle three-quarter right view": "low-angle three-quarter right view",
  "low-angle rear view": "low-angle rear view",
  "isometric left view": "isometric view",
  "isometric right view": "isometric view",
  "rear isometric left view": "rear isometric left view",
  "rear isometric right view": "rear isometric right view",
  "macro close-up view": "macro close-up view",
  "slight left-front view": "three-quarter front left view",
  "slight right-front view": "three-quarter front right view",
  "mid left-front view": "three-quarter front left view",
  "mid right-front view": "three-quarter front right view",
  "three-quarter left view": "three-quarter front left view",
  "three-quarter right view": "three-quarter front right view",
  "side profile left view": "left profile view",
  "side profile right view": "right profile view",
  "back view": "rear view",
  "top-down view": "bird's-eye view",
  "slightly top-down back view": "high-angle front view",
  "top-down front-left view": "bird's-eye view",
  "top-down front-right view": "bird's-eye view",
  "slightly top-down front view": "high-angle front view",
  "slightly top-down front-left view": "high-angle three-quarter left view",
  "slightly top-down front-right view": "high-angle three-quarter right view",
  "slightly top-down left view": "high-angle three-quarter left view",
  "slightly top-down right view": "high-angle three-quarter right view",
  "low-angle back view": "low-angle rear view",
  "low-angle front-left view": "low-angle three-quarter left view",
  "low-angle front-right view": "low-angle three-quarter right view",
  "low-angle mid-left view": "low-angle three-quarter left view",
  "low-angle mid-right view": "low-angle three-quarter right view",
  "low-angle left view": "low-angle three-quarter left view",
  "low-angle right view": "low-angle three-quarter right view",
  "isometric rear left view": "rear isometric left view",
  "isometric rear right view": "rear isometric right view",
  "flat lay view": "flat lay",
};

const getPromptFriendlyView = (value: string) => promptViewMap[value] ?? value;

export const buildFinalPrompt = (prompt: VisualPrompt): string => {
  const parts: string[] = [];

  if (prompt.concept.mood.length > 0) {
    parts.push(`Mood: ${joinList(prompt.concept.mood)}.`);
  }

  const stylingParts = [
    prompt.concept.style.medium ? `medium ${prompt.concept.style.medium}` : "",
    prompt.concept.style.art_direction ? `art direction ${prompt.concept.style.art_direction}` : "",
    prompt.concept.style.rendering ? `rendering ${prompt.concept.style.rendering}` : "",
    prompt.concept.style.era ? `era ${prompt.concept.style.era}` : "",
  ].filter(nonEmpty);

  if (stylingParts.length > 0) {
    parts.push(`Styling: ${stylingParts.join(", ")}.`);
  } else if (prompt.concept.styling.length > 0) {
    parts.push(`Styling: ${joinList(prompt.concept.styling)}.`);
  }

  const objectLead = [
    prompt.object.main_object,
    prompt.object.shape ? `with ${prompt.object.shape}` : "",
  ]
    .filter(nonEmpty)
    .join(" ");
  if (objectLead) {
    parts.push(`Primary subject: ${objectLead}.`);
  }

  if (prompt.object.details.length > 0) {
    parts.push(`Subject details, including texture, material, and supporting elements: ${joinList(prompt.object.details)}.`);
  }

  const compositionParts = [
    getPromptFriendlyView(prompt.composition.view),
    prompt.composition.framing,
    joinList(prompt.composition.layout),
    prompt.composition.depth,
  ].filter(nonEmpty);
  if (compositionParts.length > 0) {
    parts.push(`Use ${compositionParts.join(", ")}.`);
  }

  const lightingParts = [
    prompt.lighting.primary_light,
    prompt.lighting.reflection,
    prompt.lighting.secondary_light,
    prompt.lighting.emissive,
    prompt.lighting.shadow,
  ].filter(nonEmpty);
  if (lightingParts.length > 0) {
    parts.push(`Lighting: ${lightingParts.join(", ")}.`);
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
