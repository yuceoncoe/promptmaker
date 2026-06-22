import { z } from "zod";
import { uniqueStrings } from "./prompt-utils";

const uniqueStringArraySchema = z.array(z.string()).transform(uniqueStrings);
const paletteArraySchema = z.array(z.string()).max(8).transform(uniqueStrings);

export const promptSchema = z.object({
  meta: z.object({
    title: z.string().trim().min(1),
    version: z.string().trim().min(1),
    language: z.enum(["ko", "en"]),
    createdBy: z.string().optional(),
    updatedAt: z.string().optional(),
  }),
  brandPositioning: z.object({
    map: z.object({
      xAxis: z.object({
        leftLabel: z.string().trim().min(1),
        rightLabel: z.string().trim().min(1),
        value: z.number().min(0).max(1),
      }),
      yAxis: z.object({
        bottomLabel: z.string().trim().min(1),
        topLabel: z.string().trim().min(1),
        value: z.number().min(0).max(1),
      }),
    }),
    selectedKeywords: z.object({
      marketPosition: uniqueStringArraySchema,
      brandFunction: uniqueStringArraySchema,
      visualExpression: uniqueStringArraySchema,
      culturalEdge: uniqueStringArraySchema,
    }),
    recommendedPresetIds: uniqueStringArraySchema,
    recommendedPresetId: z.string().nullable(),
    selectedPresetId: z.string().nullable(),
    presetSource: z.enum(["recommended", "manual", "none"]),
    selectedQuadrant: z
      .enum(["refined-classic", "modern-minimal", "expressive-heritage", "future-bold", "balanced-premium"])
      .optional(),
    selectedPoint: z.object({
      x: z.number().min(0).max(1),
      y: z.number().min(0).max(1),
    }),
    appliedPresetName: z.string().optional(),
    styleKeywords: uniqueStringArraySchema,
    moodKeywords: uniqueStringArraySchema,
    visualKeywords: uniqueStringArraySchema,
    paletteHints: uniqueStringArraySchema,
    lightingHints: uniqueStringArraySchema,
    compositionHints: uniqueStringArraySchema,
    negativeHints: uniqueStringArraySchema,
    customNotes: z.string().optional(),
    lockPresetToBrand: z.boolean(),
    summary: z.object({
      positioningSentence: z.string(),
      moodSentence: z.string(),
    }),
    manualKeywordOverrides: z
      .object({
        added: uniqueStringArraySchema,
        removed: uniqueStringArraySchema,
      })
      .optional(),
  }),
  brief: z.object({
    purpose: z.string(),
    targetAudience: z.string(),
    platform: z.string(),
    brandTone: z.string(),
    brandContext: z.string().optional(),
  }),
  subject: z.object({
    type: z.enum(["person", "animal", "product", "space", "character", "object", "abstract", "other"]),
    description: z.string().trim().min(1),
    pose: z.string().optional(),
    expression: z.string().optional(),
    action: z.string().optional(),
    details: uniqueStringArraySchema,
  }),
  scene: z.object({
    location: z.string(),
    time: z.string(),
    weather: z.string().optional(),
    worldSetting: z.string().optional(),
    backgroundDetails: uniqueStringArraySchema,
  }),
  style: z.object({
    medium: z.enum(["photorealistic", "illustration", "3d", "vector", "watercolor", "pixel-art", "anime", "other"]),
    artDirection: z.string().trim().min(1),
    styleTraits: uniqueStringArraySchema,
    rendering: z.string().optional(),
    mood: z.string(),
    texture: z.string().optional(),
    era: z.string().optional(),
  }),
  composition: z.object({
    framing: z.string(),
    angle: z.string(),
    lens: z.string().optional(),
    depthOfField: z.string().optional(),
    subjectPosition: z.string(),
    negativeSpace: z.string().optional(),
    perspective: z.string().optional(),
  }),
  lighting: z.object({
    type: z.string(),
    direction: z.string().optional(),
    contrast: z.enum(["low", "medium", "high"]).optional(),
    shadow: z.string().optional(),
    highlight: z.string().optional(),
    mood: z.string().optional(),
  }),
  color: z.object({
    palette: paletteArraySchema,
    dominantColor: z.string(),
    accentColor: z.string().optional(),
    temperature: z.enum(["warm", "cool", "neutral"]).optional(),
    brandColors: uniqueStringArraySchema.optional(),
    avoidColors: uniqueStringArraySchema.optional(),
  }),
  text: z.object({
    includeText: z.boolean(),
    content: z.string(),
    language: z.enum(["ko", "en", "multi", "none"]).optional(),
    placement: z.string().optional(),
    typography: z.string().optional(),
    legibilityPriority: z.enum(["low", "medium", "high"]).optional(),
    textOverlayMode: z.enum(["generate-in-image", "post-edit"]).optional(),
  }),
  constraints: z.object({
    mustInclude: uniqueStringArraySchema,
    avoid: uniqueStringArraySchema,
    avoidStyle: uniqueStringArraySchema.optional(),
    avoidComposition: uniqueStringArraySchema.optional(),
    brandRestrictions: uniqueStringArraySchema.optional(),
    safetyRestrictions: uniqueStringArraySchema.optional(),
  }),
  references: z.object({
    imageRefs: z.array(
      z.object({
        type: z.enum(["style", "pose", "character", "product", "color", "composition", "other"]),
        url: z.string(),
        influence: z.number().min(0).max(1),
      })
    ),
    referenceNotes: z.string().optional(),
    lockedElements: uniqueStringArraySchema.optional(),
  }),
  output: z.object({
    aspectRatio: z.enum(["1:1", "4:5", "3:4", "16:9", "9:16", "custom"]),
    size: z.string().trim().min(1),
    count: z.number().min(1).max(4),
    format: z.enum(["png", "jpg", "webp"]),
    quality: z.enum(["draft", "standard", "high"]),
    transparentBackground: z.boolean(),
    seed: z.number().int().optional(),
    variationStrength: z.number().min(0).max(1).optional(),
  }),
  modelAdapter: z.object({
    targetModel: z.enum(["generic", "openai", "midjourney", "stable-diffusion", "other"]),
    promptFormat: z.enum(["structured-json", "natural-language", "model-specific"]),
    supportsNegativePrompt: z.boolean(),
    supportsSeed: z.boolean(),
    supportsImageReference: z.boolean(),
  }),
});
