import { getStyleMoodPresetById } from "./style-mood-presets";
import { joinReadableList, maybeJoinSentence, mergeUniqueStrings, parseSize } from "./prompt-utils";
import type { PromptConfig } from "../types/promptConfig";

const textOrEmpty = (value?: string) => value?.trim() ?? "";

export const compileBrandPositioningPrompt = (config: PromptConfig) => {
  const preset = config.brandPositioning.selectedPresetId
    ? getStyleMoodPresetById(config.brandPositioning.selectedPresetId)
    : undefined;

  if (
    !preset &&
    !config.brandPositioning.summary.positioningSentence &&
    !config.brandPositioning.summary.moodSentence &&
    !config.brandPositioning.styleKeywords.length &&
    !config.brandPositioning.moodKeywords.length
  ) {
    return "";
  }

  const summary = config.brandPositioning.summary.positioningSentence;
  const moodSummary = config.brandPositioning.summary.moodSentence;
  const presetLead = preset
    ? `Use a ${preset.name} brand mood with ${preset.styleKeywords.slice(0, 2).join(", ")}.`
    : "";

  return [summary, moodSummary, presetLead].filter(Boolean).join(" ").trim();
};

export const compileNaturalPrompt = (config: PromptConfig) => {
  const parts: string[] = [];
  const brandPrompt = compileBrandPositioningPrompt(config);
  if (brandPrompt) {
    parts.push(brandPrompt);
  }

  if (config.subject.description.trim()) {
    const subjectLead = [
      `A ${config.style.medium} image of ${config.subject.description.trim()}`,
      textOrEmpty(config.subject.pose),
      textOrEmpty(config.subject.expression),
      textOrEmpty(config.subject.action),
    ]
      .filter(Boolean)
      .join(", ");
    parts.push(`${subjectLead}.`);
  }

  const sceneSentence = maybeJoinSentence(
    [
      textOrEmpty(config.scene.location),
      textOrEmpty(config.scene.time),
      textOrEmpty(config.scene.weather),
      textOrEmpty(config.scene.worldSetting),
      config.scene.backgroundDetails.length ? `background details ${joinReadableList(config.scene.backgroundDetails)}` : "",
    ],
    "Scene: "
  );
  if (sceneSentence) parts.push(sceneSentence);

  const styleSentence = maybeJoinSentence(
    [
      textOrEmpty(config.style.artDirection),
      config.style.styleTraits.length ? joinReadableList(config.style.styleTraits) : "",
      textOrEmpty(config.style.rendering),
      textOrEmpty(config.style.mood),
      textOrEmpty(config.style.texture),
      textOrEmpty(config.style.era),
    ],
    "Style: "
  );
  if (styleSentence) parts.push(styleSentence);

  const compositionSentence = maybeJoinSentence(
    [
      textOrEmpty(config.composition.framing),
      textOrEmpty(config.composition.angle),
      textOrEmpty(config.composition.lens),
      textOrEmpty(config.composition.depthOfField),
      textOrEmpty(config.composition.subjectPosition),
      textOrEmpty(config.composition.negativeSpace),
      textOrEmpty(config.composition.perspective),
    ],
    "Composition: "
  );
  if (compositionSentence) parts.push(compositionSentence);

  const lightingSentence = maybeJoinSentence(
    [
      textOrEmpty(config.lighting.type),
      textOrEmpty(config.lighting.direction),
      textOrEmpty(config.lighting.contrast),
      textOrEmpty(config.lighting.shadow),
      textOrEmpty(config.lighting.highlight),
      textOrEmpty(config.lighting.mood),
    ],
    "Lighting: "
  );
  if (lightingSentence) parts.push(lightingSentence);

  const colorSentence = maybeJoinSentence(
    [
      config.color.palette.length ? `palette ${joinReadableList(config.color.palette)}` : "",
      textOrEmpty(config.color.dominantColor) ? `dominant color ${config.color.dominantColor}` : "",
      textOrEmpty(config.color.accentColor) ? `accent color ${config.color.accentColor}` : "",
      textOrEmpty(config.color.temperature),
      config.color.brandColors?.length ? `brand colors ${joinReadableList(config.color.brandColors)}` : "",
    ],
    "Color: "
  );
  if (colorSentence) parts.push(colorSentence);

  if (config.text.includeText) {
    const textSentence = maybeJoinSentence(
      [
        config.text.content ? `include the text "${config.text.content}"` : "include short legible text",
        textOrEmpty(config.text.placement),
        textOrEmpty(config.text.typography),
        textOrEmpty(config.text.legibilityPriority)
          ? `legibility priority ${config.text.legibilityPriority}`
          : "",
        textOrEmpty(config.text.textOverlayMode)
          ? config.text.textOverlayMode === "post-edit"
            ? "leave room for post-edited text overlay"
            : "render the text clearly inside the image"
          : "",
      ],
      "Text: "
    );
    if (textSentence) parts.push(textSentence);
  }

  if (config.constraints.mustInclude.length) {
    parts.push(`Must include: ${joinReadableList(config.constraints.mustInclude)}.`);
  }

  const negativePrompt = compileNegativePrompt(config);
  if (negativePrompt) {
    parts.push(`Avoid ${negativePrompt}.`);
  }

  const referenceBits = mergeUniqueStrings(
    config.references.imageRefs.map((item) => `${item.type} reference ${item.url}`),
    config.references.lockedElements ?? []
  );
  const referenceSentence = maybeJoinSentence(
    [
      config.references.referenceNotes ?? "",
      referenceBits.length ? `keep or follow ${joinReadableList(referenceBits)}` : "",
    ],
    "Reference: "
  );
  if (referenceSentence) parts.push(referenceSentence);

  return parts.join(" ").trim();
};

export const compileNegativePrompt = (config: PromptConfig) =>
  mergeUniqueStrings(
    config.brandPositioning.negativeHints,
    config.constraints.avoid,
    config.constraints.avoidStyle,
    config.constraints.avoidComposition,
    config.color.avoidColors,
    config.constraints.brandRestrictions,
    config.constraints.safetyRestrictions
  ).join(", ");

export const compileOpenAIPayload = (config: PromptConfig) =>
  JSON.stringify(
    {
      prompt: compileNaturalPrompt(config),
      size: config.output.size,
      n: config.output.count,
      quality: config.output.quality,
    },
    null,
    2
  );

export const compileMidjourneyPrompt = (config: PromptConfig) =>
  `${compileNaturalPrompt(config)} --ar ${config.output.aspectRatio}`.trim();

export const compileStableDiffusionPayload = (config: PromptConfig) => {
  const { width, height } = parseSize(config.output.size);

  return JSON.stringify(
    {
      prompt: compileNaturalPrompt(config),
      negative_prompt: compileNegativePrompt(config),
      width,
      height,
      ...(typeof config.output.seed === "number" ? { seed: config.output.seed } : {}),
    },
    null,
    2
  );
};

export const compileModelPrompt = (config: PromptConfig) => {
  switch (config.modelAdapter.targetModel) {
    case "openai":
      return compileOpenAIPayload(config);
    case "midjourney":
      return compileMidjourneyPrompt(config);
    case "stable-diffusion":
      return compileStableDiffusionPayload(config);
    default:
      return JSON.stringify(config, null, 2);
  }
};
