import { useEffect, useMemo, useRef, useState } from "react";
import AccordionSection from "./components/AccordionSection";
import LabelWithBadge from "./components/LabelWithBadge";
import CameraViewPicker from "./components/CameraViewPicker";
import ChipSelector from "./components/ChipSelector";
import GroupedChipSelector from "./components/GroupedChipSelector";
import PositioningMap, { type PositioningPoint } from "./components/PositioningMap";
import PresetSelector from "./components/PresetSelector";
import ResultPanel from "./components/ResultPanel";
import TextInputField from "./components/TextInputField";
import Toast from "./components/Toast";
import { chipOptions, legacyPositioningPointMap, moodProfiles, positioningMap, stylingProfiles } from "./data/chipOptions";
import { presetLabels, presets } from "./data/presets";
import { EMPTY_PROMPT, type VisualPrompt } from "./types/prompt";
import { buildFinalPrompt } from "./utils/buildFinalPrompt";
import { calculateQualityScore } from "./utils/calculateQualityScore";
import { downloadJson } from "./utils/downloadJson";

const STORAGE_KEY = "visual-prompt-maker:v1";
const UI_STORAGE_KEY = "visual-prompt-maker-ui:v1";

type ToastState = {
  message: string;
  type: "success" | "error";
} | null;

const conceptStyleOptions = {
  medium: ["사진", "3D", "일러스트", "수채화", "애니메이션", "픽셀아트"],
  art_direction: ["미니멀", "럭셔리", "키치", "빈티지", "시네마틱", "에디토리얼", "퓨처리스틱", "그래픽"],
  rendering: ["사실적", "매트페인팅", "클레이 렌더", "벡터", "하이글로스 3D", "필름 그레인", "핸드페인팅"],
  era: ["90년대", "Y2K", "미래적", "바로크", "동시대", "레트로퓨처리즘", "빈티지"],
} as const;

const legacyStylingToConceptStyle: Record<
  string,
  Partial<VisualPrompt["concept"]["style"]>
> = {
  "hero product shot": { medium: "사진", rendering: "사실적" },
  "premium packshot": { medium: "사진", art_direction: "럭셔리", rendering: "사실적" },
  "high-end e-commerce photography": { medium: "사진", rendering: "사실적" },
  "catalog minimal": { art_direction: "미니멀" },
  "utilitarian design": { art_direction: "미니멀" },
  "apple-style keynote render": { medium: "3D", art_direction: "미니멀", rendering: "사실적" },
  "campaign key visual": { art_direction: "시네마틱" },
  "fashion campaign object": { medium: "사진", art_direction: "시네마틱", rendering: "사실적" },
  "glossy acrylic pop": { medium: "3D", art_direction: "키치", rendering: "하이글로스 3D" },
  "y2k aesthetic": { era: "Y2K", art_direction: "키치" },
  "soft modernism": { art_direction: "미니멀" },
  "quiet luxury": { art_direction: "럭셔리" },
  "archival quality finish": { art_direction: "에디토리얼", rendering: "필름 그레인" },
  "gallery display": { art_direction: "에디토리얼" },
  "art book minimalism": { art_direction: "에디토리얼" },
  "editorial still life": { medium: "사진", art_direction: "에디토리얼", rendering: "사실적" },
  "graphic poster aesthetic": { medium: "일러스트", art_direction: "그래픽", rendering: "벡터" },
  surreal: { art_direction: "시네마틱", rendering: "매트페인팅" },
  "retro-futurism": { art_direction: "퓨처리스틱", era: "레트로퓨처리즘" },
  vaporwave: { art_direction: "키치", era: "Y2K" },
  "memphis design": { art_direction: "키치", era: "90년대" },
  "avant-garde installation": { art_direction: "에디토리얼" },
  bauhaus: { art_direction: "그래픽", era: "빈티지" },
};

const deepClone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const flattenOptionValues = (source: readonly string[] | Record<string, readonly string[]>) =>
  Array.isArray(source) ? [...source] : Object.values(source).flatMap((group) => [...group]);
const createOptionSet = (source: readonly string[] | Record<string, readonly string[]>) =>
  new Set(flattenOptionValues(source).map((item) => item.trim().toLowerCase()));

const legacyPositioningSet = new Set<string>(Object.keys(legacyPositioningPointMap));
const allDefinedMoodSet = createOptionSet(chipOptions.concept.mood.brand_personality);
const allDefinedStylingSet = new Set(
  [...flattenOptionValues(chipOptions.concept.styling), ...Object.values(conceptStyleOptions).flat()].map((item) =>
    item.trim().toLowerCase()
  )
);
const compositionViewSet = createOptionSet(chipOptions.composition.view);
const compositionFramingSet = createOptionSet(chipOptions.composition.framing);
const compositionLayoutSet = createOptionSet(chipOptions.composition.layout);
const compositionDepthSet = createOptionSet(chipOptions.composition.depth);
const lightingPrimaryLightSet = createOptionSet(chipOptions.lighting.primary_light);
const lightingReflectionSet = createOptionSet(chipOptions.lighting.reflection);
const lightingSecondaryLightSet = createOptionSet(chipOptions.lighting.secondary_light);
const lightingEmissiveSet = createOptionSet(chipOptions.lighting.emissive);
const lightingShadowSet = createOptionSet(chipOptions.lighting.shadow);
const backgroundColorSet = createOptionSet(chipOptions.background.color);
const backgroundStyleSet = createOptionSet(chipOptions.background.style);
const backgroundSurfaceSet = createOptionSet(chipOptions.background.surface);
const backgroundPurposeSet = createOptionSet(chipOptions.background.purpose);
const colorPrimarySet = createOptionSet(chipOptions.color_palette.primary);
const colorAccentSet = createOptionSet(chipOptions.color_palette.accent);
const colorContrastSet = createOptionSet(chipOptions.color_palette.contrast);
const textTopLeftSet = createOptionSet(chipOptions.text_elements.top_left_text);
const textPriceLabelSet = createOptionSet(chipOptions.text_elements.price_label);
const textBottomLabelSet = createOptionSet(chipOptions.text_elements.bottom_labels);
const textDirectionSet = createOptionSet(chipOptions.text_elements.text_direction);
const textNoteSet = createOptionSet(chipOptions.text_elements.note);
const styleKeywordSet = createOptionSet(chipOptions.style_keywords);
const negativePromptSet = createOptionSet(chipOptions.negative_prompt);
const subjectPresetDetailSet = new Set([...chipOptions.object.material, ...chipOptions.object.texture].map((item) => item.trim().toLowerCase()));
const invalidLegacyMoodSet = new Set<string>([
  "mass maket",
  "mass market",
  "mass-market",
  "expressive",
  "restrained",
  "niche",
  "familiar",
  "insider",
  "functional clarity",
  "expressive character",
]);
const legacyStylingAliasMap: Record<string, string> = {
  "layered object styling": "campaign key visual",
  "premium product styling": "premium packshot",
  "playful graphic styling": "pop art",
  "minimal industrial styling": "dieter rams style",
  "editorial sculptural styling": "editorial still life",
  "luxury beauty styling": "quiet luxury",
  "sport-driven styling": "fashion campaign object",
  "retail-ready styling": "high-end e-commerce photography",
  "gallery display styling": "gallery display",
  "technical product styling": "apple-style keynote render",
  "graphic image-making": "graphic poster aesthetic",
  "retail shelf impact": "high-end e-commerce photography",
  "luxury beauty campaign": "quiet luxury",
  "sport performance": "fashion campaign object",
  "youth culture": "y2k aesthetic",
  "tech launch": "apple-style keynote render",
  "design-forward catalog": "catalog minimal",
  "playful brand world": "glossy acrylic pop",
  "sculptural minimalism": "soft modernism",
  "collector appeal": "archival quality finish",
};
const legacyObjectMaterialAliasMap: Record<string, string[]> = {
  aluminum: ["aluminum"],
  "brushed aluminum": ["aluminum"],
  "anodized aluminum": ["aluminum"],
  plastic: ["plastic"],
  "glossy black plastic": ["plastic"],
  "soft-touch polymer": ["plastic"],
  "satin polymer": ["plastic"],
  acrylic: ["acrylic"],
  glass: ["glass"],
  "frosted glass": ["glass"],
  ceramic: ["ceramic"],
  "coated paperboard": ["paperboard"],
  "cardboard / paperboard": ["paperboard"],
  paperboard: ["paperboard"],
  vinyl: ["vinyl"],
  "semi-transparent vinyl": ["vinyl"],
  "vinyl / polymer": ["vinyl"],
  "powder-coated metal": ["steel"],
  steel: ["steel"],
  foil: ["foil"],
};
const legacyObjectTextureAliasMap: Record<string, string[]> = {
  "glossy plastic film": ["high-gloss"],
  "high-gloss": ["high-gloss"],
  matte: ["matte"],
  "matte ceramic surface": ["matte"],
  brushed: ["brushed"],
  "fine brushed grain": ["brushed"],
  sandblasted: ["sandblasted"],
  "sandblasted aluminum texture": ["sandblasted"],
  frosted: ["frosted"],
  ribbed: ["ribbed"],
  "ribbed translucent plastic": ["ribbed"],
  "soft-touch": ["soft-touch"],
  "soft-touch plastic": ["soft-touch"],
  wrinkled: ["wrinkled"],
  "wrinkled vinyl texture": ["wrinkled"],
  embossed: ["embossed"],
  "transparent acrylic": ["high-gloss"],
  "translucent paper": ["matte"],
  "fingerprint-resistant coating": ["matte"],
  "powder-coated finish": ["matte"],
  "coated cardboard texture": ["matte"],
  "satin lacquer finish": ["high-gloss"],
};
const legacyCompositionViewAliasMap: Record<string, string> = {
  "front-facing product shot": "front view",
  "centered composition": "front view",
  "straight-on angle": "front view",
  "eye-level angle": "front view",
  "3/4 front view": "three-quarter front right view",
  "slightly elevated angle": "high-angle three-quarter right view",
  "side profile product shot": "right profile view",
  "top-down angle": "bird's-eye view",
  "overhead angle": "overhead view",
  "slightly top-down angle": "high-angle front view",
  "dramatic low angle": "low-angle front view",
  "isometric product view": "isometric right view",
  "close-up product shot": "macro close-up view",
  "macro detail crop": "macro close-up view",
  "close macro angle": "macro close-up view",
  "flat lay arrangement": "flat lay",
  "tilted perspective angle": "three-quarter front right view",
  "three-quarter front view": "three-quarter front right view",
  "slightly top-down view": "high-angle three-quarter right view",
  "low-angle view": "low-angle three-quarter right view",
  "isometric view": "isometric right view",
  "side profile view": "right profile view",
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
const legacyCompositionLayoutAliasMap: Record<string, string[]> = {
  "centered in frame": ["centered hero composition"],
  "floating object": ["floating object composition"],
  "placed on clean desk": ["object-focused layout"],
  "product fills most of the frame": ["full-frame product emphasis"],
  "anchored near lower third": ["lower-third anchored composition"],
  "offset to one side": ["off-center composition"],
  "presented as hero object": ["centered hero composition"],
  "arranged in a structured grid": ["structured grid layout"],
  "asymmetric but balanced layout": ["asymmetrical composition"],
  "graphic poster-like arrangement": ["graphic poster arrangement"],
  "grid-based product layout": ["structured grid layout"],
  "catalog-style arrangement": ["catalog arrangement"],
  "museum-display composition": ["museum display composition"],
  "symmetrical balance": ["symmetrical composition"],
  "asymmetric balance": ["asymmetrical composition"],
  "editorial balance": ["editorial composition"],
  "dynamic balance": ["dynamic composition"],
  "modular grid balance": ["structured grid layout"],
  "weighted off-center balance": ["off-center composition"],
};

const sanitizeMoodValues = (values: string[]) =>
  values.filter((value) => {
    const normalized = value.trim().toLowerCase();
    return !legacyPositioningSet.has(normalized) && !invalidLegacyMoodSet.has(normalized) && allDefinedMoodSet.has(normalized);
  });
const normalizeStylingValue = (value: string) => legacyStylingAliasMap[value.trim().toLowerCase()] ?? value;
const sanitizeOptionValues = (values: string[], allowed: Set<string>) =>
  values.filter((value) => allowed.has(value.trim().toLowerCase()));
const sanitizeOptionValue = (value: string, allowed: Set<string>) => (allowed.has(value.trim().toLowerCase()) ? value : "");
const sanitizeStylingValues = (values: string[]) =>
  sanitizeOptionValues(values.map(normalizeStylingValue), allDefinedStylingSet);
const emptyConceptStyle = (): VisualPrompt["concept"]["style"] => ({
  medium: "",
  art_direction: "",
  rendering: "",
  era: "",
});
const normalizeConceptStyle = (
  style: Partial<VisualPrompt["concept"]["style"]> | undefined,
  stylingValues: string[]
): VisualPrompt["concept"]["style"] => {
  const next = {
    ...emptyConceptStyle(),
    ...style,
  };

  stylingValues.forEach((value) => {
    const mapped = legacyStylingToConceptStyle[value.trim().toLowerCase()];
    if (!mapped) return;
    next.medium = next.medium || mapped.medium || "";
    next.art_direction = next.art_direction || mapped.art_direction || "";
    next.rendering = next.rendering || mapped.rendering || "";
    next.era = next.era || mapped.era || "";
  });

  return next;
};
const buildStructuredStyling = (style: VisualPrompt["concept"]["style"]) =>
  [style.medium, style.art_direction, style.rendering, style.era].map((item) => item.trim()).filter(Boolean);
const expandLegacyObjectValues = (values: string[], aliasMap: Record<string, string[]>) =>
  values.flatMap((value) => aliasMap[value.trim().toLowerCase()] ?? [value]);
const normalizeCompositionViewValue = (value: string) => legacyCompositionViewAliasMap[value.trim().toLowerCase()] ?? value;
const normalizeLightingEmissiveValue = (value: string) => {
  const normalized = value.trim().toLowerCase();
  return normalized === "no glow" || normalized === "no accent lighting" || normalized === "no emissive effect" ? "" : value;
};
const readStringCandidate = (source: unknown, keys: string[]) => {
  if (!source || typeof source !== "object") {
    return "";
  }

  const record = source as Record<string, unknown>;
  const match = keys.find((key) => typeof record[key] === "string" && record[key].trim().length > 0);
  return match ? (record[match] as string) : "";
};

const readLegacyLightingValue = (
  source: Record<string, unknown>,
  fieldValue: string,
  nestedKeys: string[],
  topLevelKeys: string[]
) => {
  if (fieldValue.trim().length > 0) {
    return fieldValue;
  }

  return readStringCandidate(source.lighting, nestedKeys) || readStringCandidate(source, topLevelKeys);
};

const inferPositioningPointFromMood = (values: string[]): PositioningPoint | null => {
  const legacyValue = values.find((value) => legacyPositioningSet.has(value));
  return legacyValue ? legacyPositioningPointMap[legacyValue] : null;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const getPositionedRecommendations = (
  point: PositioningPoint | null,
  profiles: readonly { id: string; x: number; y: number }[],
  allowed: Set<string>,
  limit = 10
) => {
  if (!point) return [];

  return [...profiles]
    .map((profile) => ({
      id: profile.id,
      score: 1 - Math.hypot(point.x - profile.x, point.y - profile.y) / 2.5,
    }))
    .filter((item) => allowed.has(item.id.trim().toLowerCase()))
    .filter((item) => item.score > 0.2)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);
};

const getMoodRecommendations = (point: PositioningPoint | null) =>
  getPositionedRecommendations(point, moodProfiles, allDefinedMoodSet);

const getStylingRecommendations = (point: PositioningPoint | null) =>
  getPositionedRecommendations(point, stylingProfiles, allDefinedStylingSet, 6);

const getStrongMoodRecommendations = (recommendations: { id: string; score: number }[]) =>
  recommendations.slice(0, Math.min(5, recommendations.length)).map((item) => item.id);

const inferPositioningPointFromPreset = (moodValues: string[], stylingValues: string[]): PositioningPoint | null => {
  const moodMatches = moodProfiles.filter((profile) => moodValues.includes(profile.id));
  const stylingMatches = stylingProfiles.filter((profile) => stylingValues.includes(profile.id));
  const matches = [...moodMatches, ...stylingMatches];

  if (matches.length === 0) {
    return inferPositioningPointFromMood(moodValues);
  }

  const averageX = matches.reduce((sum, item) => sum + item.x, 0) / matches.length;
  const averageY = matches.reduce((sum, item) => sum + item.y, 0) / matches.length;

  return {
    x: Number(clamp(averageX, -1, 1).toFixed(2)),
    y: Number(clamp(averageY, -1, 1).toFixed(2)),
  };
};

const mergePrompt = (input: unknown): VisualPrompt => {
  const next = deepClone(EMPTY_PROMPT);
  if (!input || typeof input !== "object") {
    return next;
  }

  const source = input as Record<string, unknown>;
  const sourceConcept = (source.concept as Record<string, unknown> | undefined) ?? {};
  const merged: VisualPrompt = {
    ...next,
    ...source,
    concept: {
      ...next.concept,
      ...sourceConcept,
      style: {
        ...next.concept.style,
        ...((sourceConcept.style as Record<string, unknown> | undefined) ?? {}),
      },
    },
    object: {
      ...next.object,
      ...(source.object as object),
      inside_objects: Array.isArray((source.object as VisualPrompt["object"] | undefined)?.inside_objects)
        ? ((source.object as VisualPrompt["object"]).inside_objects ?? []).map((item) => ({
            name: typeof item?.name === "string" ? item.name : "",
            description: typeof item?.description === "string" ? item.description : "",
            material: typeof item?.material === "string" ? item.material : "",
          }))
        : [],
    },
    composition: { ...next.composition, ...(source.composition as object) },
    lighting: { ...next.lighting, ...(source.lighting as object) },
    background: { ...next.background, ...(source.background as object) },
    color_palette: { ...next.color_palette, ...(source.color_palette as object) },
    text_elements: { ...next.text_elements, ...(source.text_elements as object) },
    style_keywords: Array.isArray(source.style_keywords) ? source.style_keywords.filter((item): item is string => typeof item === "string") : [],
    negative_prompt: Array.isArray(source.negative_prompt) ? source.negative_prompt.filter((item): item is string => typeof item === "string") : [],
    final_prompt: typeof source.final_prompt === "string" ? source.final_prompt : "",
  };

  merged.prompt_type = "structured_visual_prompt";
  merged.concept.mood = Array.isArray(merged.concept.mood) ? sanitizeMoodValues(merged.concept.mood) : [];
  const rawSubjectDetails = Array.isArray(merged.object.details)
    ? merged.object.details.filter((item): item is string => typeof item === "string")
    : [];
  merged.concept.styling = sanitizeStylingValues([
    ...(Array.isArray(merged.concept.styling) ? merged.concept.styling : []),
    ...rawSubjectDetails.filter((item) => allDefinedStylingSet.has(item.trim().toLowerCase())),
  ]);
  merged.concept.style = normalizeConceptStyle(
    {
      medium: typeof merged.concept.style.medium === "string" ? merged.concept.style.medium : "",
      art_direction: typeof merged.concept.style.art_direction === "string" ? merged.concept.style.art_direction : "",
      rendering: typeof merged.concept.style.rendering === "string" ? merged.concept.style.rendering : "",
      era: typeof merged.concept.style.era === "string" ? merged.concept.style.era : "",
    },
    merged.concept.styling
  );
  merged.concept.styling = buildStructuredStyling(merged.concept.style);
  const legacyTexture = source.texture as
    | {
        surface?: unknown;
        package_surface?: unknown;
      }
    | undefined;
  const rawObjectMaterial = Array.isArray(merged.object.material)
    ? merged.object.material.filter((item): item is string => typeof item === "string")
    : [];
  const rawObjectTexture = Array.isArray(merged.object.texture)
    ? merged.object.texture.filter((item): item is string => typeof item === "string")
    : [];
  const legacyObjectSurface = Array.isArray((source.object as { surface?: unknown[] } | undefined)?.surface)
    ? ((source.object as { surface?: unknown[] }).surface ?? []).filter((item): item is string => typeof item === "string")
    : [];
  const legacyTextureValues = [
    ...rawObjectTexture,
    ...legacyObjectSurface,
    ...(Array.isArray(legacyTexture?.surface) ? legacyTexture.surface.filter((item): item is string => typeof item === "string") : []),
    ...(Array.isArray(legacyTexture?.package_surface)
      ? legacyTexture.package_surface.filter((item): item is string => typeof item === "string")
      : []),
  ];
  const supportingObjectDetails = merged.object.inside_objects.flatMap((item) =>
    [item.description || item.name, item.material].filter((value) => value.trim().length > 0)
  );
  merged.object.details = Array.from(
    new Set(
      [
        ...rawSubjectDetails,
        ...expandLegacyObjectValues(rawObjectMaterial, legacyObjectMaterialAliasMap),
        ...expandLegacyObjectValues(legacyTextureValues, legacyObjectTextureAliasMap),
        ...supportingObjectDetails,
      ]
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );
  merged.object.material = [];
  merged.object.texture = [];
  merged.object.inside_objects = [];
  const legacyCompositionAngle =
    typeof (source.composition as { angle?: unknown } | undefined)?.angle === "string"
      ? (source.composition as { angle: string }).angle
      : "";
  merged.composition.view = sanitizeOptionValue(
    normalizeCompositionViewValue(merged.composition.view) || normalizeCompositionViewValue(legacyCompositionAngle),
    compositionViewSet
  );
  merged.composition.framing = sanitizeOptionValue(merged.composition.framing, compositionFramingSet);
  const legacyCompositionPlacement =
    typeof (source.composition as { placement?: unknown } | undefined)?.placement === "string"
      ? (source.composition as { placement: string }).placement
      : "";
  const legacyCompositionBalance =
    typeof (source.composition as { balance?: unknown } | undefined)?.balance === "string"
      ? (source.composition as { balance: string }).balance
      : "";
  const rawCompositionLayout = Array.isArray(merged.composition.layout)
    ? merged.composition.layout.filter((item): item is string => typeof item === "string")
    : [];
  merged.composition.layout = sanitizeOptionValues(
    expandLegacyObjectValues(
      [legacyCompositionPlacement, ...rawCompositionLayout, legacyCompositionBalance].filter(Boolean),
      legacyCompositionLayoutAliasMap
    ),
    compositionLayoutSet
  );
  merged.composition.depth = sanitizeOptionValue(merged.composition.depth, compositionDepthSet);
  const rawLightingPrimaryLight = readLegacyLightingValue(
    source,
    merged.lighting.primary_light,
    ["primary_light", "primaryLight", "setup", "main_light", "mainLight", "light", "main", "key_light", "keyLight"],
    [
      "lighting_primary_light",
      "lightingPrimaryLight",
      "lighting_setup",
      "lightingSetup",
      "lighting_main_light",
      "lightingMainLight",
      "light",
      "key_light",
      "keyLight",
    ]
  );
  const rawLightingReflection = readLegacyLightingValue(
    source,
    merged.lighting.reflection,
    ["reflection", "reflections", "surface_response", "surfaceResponse", "surface", "highlight", "highlights"],
    [
      "lighting_reflection",
      "lightingReflection",
      "lighting_highlight",
      "lightingHighlight",
      "lighting_surface",
      "lightingSurface",
      "reflection",
      "reflections",
      "highlight",
      "highlights",
    ]
  );
  const rawLightingSecondaryLight = readLegacyLightingValue(
    source,
    merged.lighting.secondary_light,
    ["secondary_light", "secondaryLight", "support_light", "supportLight", "rim_light", "rimLight", "fill_light", "fillLight"],
    [
      "lighting_secondary_light",
      "lightingSecondaryLight",
      "lighting_support_light",
      "lightingSupportLight",
      "secondary_light",
      "secondaryLight",
      "support_light",
      "supportLight",
      "rim_light",
      "rimLight",
      "fill_light",
      "fillLight",
    ]
  );
  const rawLightingEmissive = readLegacyLightingValue(
    source,
    merged.lighting.emissive,
    ["emissive", "emissive_effect", "emissiveEffect", "glow", "glow_effect", "glowEffect", "bloom"],
    [
      "lighting_emissive",
      "lightingEmissive",
      "lighting_glow",
      "lightingGlow",
      "emissive",
      "emissive_effect",
      "emissiveEffect",
      "glow",
      "glow_effect",
      "glowEffect",
      "bloom",
    ]
  );
  const legacyLightingAccent = readStringCandidate(source.lighting, ["accent", "accent_light", "accentLight"]);
  const rawLightingShadow = readLegacyLightingValue(
    source,
    merged.lighting.shadow,
    ["shadow", "shadows", "shadow_type", "shadowType"],
    ["lighting_shadow", "lightingShadow", "shadow", "shadows", "shadow_type", "shadowType"]
  );
  const normalizedLightingPrimaryLight = sanitizeOptionValue(rawLightingPrimaryLight, lightingPrimaryLightSet);
  const normalizedLightingReflection = sanitizeOptionValue(rawLightingReflection, lightingReflectionSet);
  const normalizedLightingSecondaryLight =
    sanitizeOptionValue(rawLightingSecondaryLight, lightingSecondaryLightSet) ||
    sanitizeOptionValue(legacyLightingAccent, lightingSecondaryLightSet);
  const normalizedLightingEmissive =
    sanitizeOptionValue(normalizeLightingEmissiveValue(rawLightingEmissive), lightingEmissiveSet) ||
    sanitizeOptionValue(normalizeLightingEmissiveValue(legacyLightingAccent), lightingEmissiveSet);
  const normalizedLightingShadow = sanitizeOptionValue(rawLightingShadow, lightingShadowSet);
  merged.lighting.primary_light = normalizedLightingPrimaryLight;
  merged.lighting.reflection = normalizedLightingReflection;
  merged.lighting.secondary_light = normalizedLightingSecondaryLight;
  merged.lighting.emissive = normalizedLightingEmissive;
  merged.lighting.shadow = normalizedLightingShadow;
  merged.background.color = sanitizeOptionValue(merged.background.color, backgroundColorSet);
  merged.background.style = sanitizeOptionValue(merged.background.style, backgroundStyleSet);
  merged.background.surface = sanitizeOptionValue(merged.background.surface, backgroundSurfaceSet);
  merged.background.purpose = sanitizeOptionValue(merged.background.purpose, backgroundPurposeSet);
  merged.color_palette.primary = Array.isArray(merged.color_palette.primary)
    ? sanitizeOptionValues(merged.color_palette.primary, colorPrimarySet)
    : [];
  merged.color_palette.accent = Array.isArray(merged.color_palette.accent)
    ? sanitizeOptionValues(merged.color_palette.accent, colorAccentSet)
    : [];
  merged.color_palette.contrast = sanitizeOptionValue(merged.color_palette.contrast, colorContrastSet);
  merged.text_elements.top_left_text = sanitizeOptionValue(merged.text_elements.top_left_text, textTopLeftSet);
  merged.text_elements.price_label = sanitizeOptionValue(merged.text_elements.price_label, textPriceLabelSet);
  merged.text_elements.bottom_labels = Array.isArray(merged.text_elements.bottom_labels)
    ? sanitizeOptionValues(merged.text_elements.bottom_labels, textBottomLabelSet)
    : [];
  merged.text_elements.text_direction = sanitizeOptionValue(merged.text_elements.text_direction, textDirectionSet);
  merged.text_elements.note = sanitizeOptionValue(merged.text_elements.note, textNoteSet);
  merged.style_keywords = sanitizeOptionValues(merged.style_keywords, styleKeywordSet);
  merged.negative_prompt = sanitizeOptionValues(merged.negative_prompt, negativePromptSet);

  merged.concept = {
    mood: merged.concept.mood,
    styling: merged.concept.styling,
    style: merged.concept.style,
  };
  merged.object = {
    main_object: merged.object.main_object,
    shape: merged.object.shape,
    material: merged.object.material,
    details: merged.object.details,
    texture: merged.object.texture,
    inside_objects: merged.object.inside_objects,
  };
  merged.composition = {
    view: merged.composition.view,
    framing: merged.composition.framing,
    layout: merged.composition.layout,
    depth: merged.composition.depth,
  };
  merged.lighting = {
    primary_light: merged.lighting.primary_light,
    reflection: merged.lighting.reflection,
    secondary_light: merged.lighting.secondary_light,
    emissive: merged.lighting.emissive,
    shadow: merged.lighting.shadow,
  };

  return merged;
};

function SubjectDetailsField({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (value: string[]) => void;
}) {
  const [supportingDraft, setSupportingDraft] = useState("");
  const supportingSubjects = selected.filter((item) => !subjectPresetDetailSet.has(item.trim().toLowerCase()));

  const addSupportingSubject = () => {
    const normalized = supportingDraft.trim();
    if (!normalized || selected.includes(normalized)) {
      setSupportingDraft("");
      return;
    }

    onChange([...selected, normalized]);
    setSupportingDraft("");
  };

  const removeSupportingSubject = (value: string) => {
    onChange(selected.filter((item) => item !== value));
  };

  return (
    <div className="space-y-5">
      <label className="text-sm font-medium text-stone-800">Details</label>
      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
        <div className="space-y-6">
          <ChipSelector
            label="Material"
            selected={selected}
            options={chipOptions.object.material}
            onChange={onChange}
            includeSelectedInOptions={false}
          />
          <ChipSelector
            label="Surface Finish"
            selected={selected}
            options={chipOptions.object.texture}
            onChange={onChange}
            includeSelectedInOptions={false}
          />
          <div className="space-y-3 border-t border-stone-200 pt-5">
            <LabelWithBadge label="Supporting subject" count={supportingSubjects.length} />
            {supportingSubjects.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {supportingSubjects.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => removeSupportingSubject(item)}
                    className="rounded-full border border-black bg-black px-3 py-1.5 text-sm text-white transition hover:bg-stone-800"
                  >
                    {item}
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-stone-200 bg-white px-3 py-4 text-sm text-stone-500">
                직접 추가한 서포팅 서브젝트가 없습니다.
              </div>
            )}
            <div className="flex gap-2">
              <input
                value={supportingDraft}
                onChange={(event) => setSupportingDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addSupportingSubject();
                  }
                }}
                placeholder="서포팅 서브젝트를 입력하고 Enter를 누르세요"
                className="min-w-0 flex-1 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
              />
              <button
                type="button"
                onClick={addSupportingSubject}
                className="rounded-xl border border-stone-200 bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-700"
              >
                추가
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [prompt, setPrompt] = useState<VisualPrompt>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? mergePrompt(JSON.parse(saved)) : deepClone(EMPTY_PROMPT);
    } catch {
      return deepClone(EMPTY_PROMPT);
    }
  });
  const [selectedPreset, setSelectedPreset] = useState("Start Empty");
  const [selectedPositioningPoint, setSelectedPositioningPoint] = useState<PositioningPoint | null>(() => {
    try {
      const raw = localStorage.getItem(UI_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Partial<PositioningPoint>;
      if (typeof parsed.x !== "number" || typeof parsed.y !== "number") return null;
      return {
        x: clamp(parsed.x, -1, 1),
        y: clamp(parsed.y, -1, 1),
      };
    } catch {
      return null;
    }
  });
  const [toast, setToast] = useState<ToastState>(null);
  const previousPositioningKeyRef = useRef("");
  const skipNextPositioningSyncRef = useRef(false);

  useEffect(() => {
    const withFinal = { ...prompt, final_prompt: buildFinalPrompt(prompt) };
    if (withFinal.final_prompt !== prompt.final_prompt) {
      setPrompt(withFinal);
    }
  }, [prompt]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prompt));
  }, [prompt]);

  useEffect(() => {
    if (!selectedPositioningPoint) {
      localStorage.removeItem(UI_STORAGE_KEY);
      return;
    }

    localStorage.setItem(UI_STORAGE_KEY, JSON.stringify(selectedPositioningPoint));
  }, [selectedPositioningPoint]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const score = useMemo(() => calculateQualityScore(prompt), [prompt]);
  const moodRecommendations = useMemo(
    () => getMoodRecommendations(selectedPositioningPoint),
    [selectedPositioningPoint]
  );
  const stylingRecommendations = useMemo(
    () => getStylingRecommendations(selectedPositioningPoint),
    [selectedPositioningPoint]
  );
  const recommendedConceptStyle = useMemo(
    () => normalizeConceptStyle(undefined, stylingRecommendations.map((item) => item.id)),
    [stylingRecommendations]
  );
  const filteredMoodGroups = useMemo(() => {
    const filtered = moodRecommendations.map((item) => item.id);
    const allMoodsSorted = [...chipOptions.concept.mood.brand_personality].sort((left, right) =>
      left.localeCompare(right)
    );

    return {
      suggested: filtered,
      "all moods": allMoodsSorted,
    };
  }, [moodRecommendations]);

  const handleMoodChange = (value: string[]) => {
    patchNestedSection("concept", "mood", value);
  };
  const handleConceptStyleChange = (
    field: keyof VisualPrompt["concept"]["style"],
    value: string
  ) => {
    setPrompt((current) => {
      const nextStyle = {
        ...current.concept.style,
        [field]: value,
      };

      return {
        ...current,
        concept: {
          ...current.concept,
          style: nextStyle,
          styling: buildStructuredStyling(nextStyle),
        },
      };
    });
  };

  useEffect(() => {
    const positioningKey = selectedPositioningPoint
      ? `${selectedPositioningPoint.x.toFixed(2)}:${selectedPositioningPoint.y.toFixed(2)}`
      : "";

    if (positioningKey === previousPositioningKeyRef.current) {
      return;
    }

    previousPositioningKeyRef.current = positioningKey;

    if (skipNextPositioningSyncRef.current) {
      skipNextPositioningSyncRef.current = false;
      return;
    }

    if (!selectedPositioningPoint || moodRecommendations.length === 0) {
      setPrompt((current) => ({
        ...current,
        concept: {
          ...current.concept,
          mood: [],
          styling: [],
          style: emptyConceptStyle(),
        },
      }));
      return;
    }

    const stronglyRecommended = getStrongMoodRecommendations(moodRecommendations);

    setPrompt((current) => {
      const nextMood = stronglyRecommended;
      const nextStyle = recommendedConceptStyle;
      const nextStyling = buildStructuredStyling(nextStyle);
      const moodUnchanged =
        nextMood.length === current.concept.mood.length &&
        nextMood.every((item, index) => item === current.concept.mood[index]);
      const styleUnchanged =
        nextStyle.medium === current.concept.style.medium &&
        nextStyle.art_direction === current.concept.style.art_direction &&
        nextStyle.rendering === current.concept.style.rendering &&
        nextStyle.era === current.concept.style.era;
      const stylingUnchanged =
        nextStyling.length === current.concept.styling.length &&
        nextStyling.every((item, index) => item === current.concept.styling[index]);

      if (moodUnchanged && styleUnchanged && stylingUnchanged) {
        return current;
      }

      return {
        ...current,
        concept: {
          ...current.concept,
          mood: nextMood,
          style: nextStyle,
          styling: nextStyling,
        },
      };
    });
  }, [moodRecommendations, recommendedConceptStyle, selectedPositioningPoint]);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
  };

  const updateSection = <K extends keyof VisualPrompt>(key: K, value: VisualPrompt[K]) => {
    setPrompt((current) => ({ ...current, [key]: value }));
  };

  const patchNestedSection = <
    K extends keyof Pick<
      VisualPrompt,
      "concept" | "object" | "composition" | "lighting" | "background" | "color_palette" | "text_elements"
    >,
    F extends keyof VisualPrompt[K]
  >(
    section: K,
    field: F,
    value: VisualPrompt[K][F]
  ) => {
    setPrompt((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [field]: value,
      },
    }));
  };

  const applyPreset = (presetName: string) => {
    const rawPreset = deepClone(presets[presetName] ?? EMPTY_PROMPT);
    const nextMood = sanitizeMoodValues(rawPreset.concept.mood);
    const nextStyling = sanitizeStylingValues(rawPreset.concept.styling);
    const nextStyle = normalizeConceptStyle(rawPreset.concept.style, nextStyling);
    const nextPositioningPoint = inferPositioningPointFromPreset(nextMood, nextStyling);
    const nextPrompt: VisualPrompt = {
      ...prompt,
      composition: rawPreset.composition,
      lighting: rawPreset.lighting,
      background: rawPreset.background,
      color_palette: rawPreset.color_palette,
      text_elements: rawPreset.text_elements,
      style_keywords: rawPreset.style_keywords,
      negative_prompt: rawPreset.negative_prompt,
      concept: {
        ...prompt.concept,
        mood: nextMood,
        style: nextStyle,
        styling: buildStructuredStyling(nextStyle),
      },
    };
    skipNextPositioningSyncRef.current = true;
    previousPositioningKeyRef.current = nextPositioningPoint
      ? `${nextPositioningPoint.x.toFixed(2)}:${nextPositioningPoint.y.toFixed(2)}`
      : "";
    setSelectedPreset(presetName);
    setSelectedPositioningPoint(nextPositioningPoint);
    setPrompt(nextPrompt);
    showToast(`${presetLabels[presetName] ?? presetName} preset applied.`, "success");
  };

  const copyText = async (text: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(successMessage, "success");
    } catch {
      showToast("Clipboard copy failed.", "error");
    }
  };

  const handleImport = async (file: File | null) => {
    if (!file) return;

    try {
      const raw = await file.text();
      const parsed = JSON.parse(raw) as unknown;
      const merged = mergePrompt(parsed);
      const parsedMood =
        parsed &&
        typeof parsed === "object" &&
        "concept" in parsed &&
        parsed.concept &&
        typeof parsed.concept === "object" &&
        Array.isArray((parsed.concept as { mood?: unknown[] }).mood)
          ? (parsed.concept as { mood: unknown[] }).mood.filter((item): item is string => typeof item === "string")
          : [];
      previousPositioningKeyRef.current = "";
      setPrompt({ ...merged, final_prompt: buildFinalPrompt(merged) });
      setSelectedPositioningPoint(inferPositioningPointFromMood(parsedMood));
      setSelectedPreset("Start Empty");
      showToast("JSON imported successfully.", "success");
    } catch {
      showToast("Import failed. Please use a valid JSON file.", "error");
    }
  };

  const handleReset = () => {
    previousPositioningKeyRef.current = "";
    setPrompt(deepClone(EMPTY_PROMPT));
    setSelectedPreset("Start Empty");
    setSelectedPositioningPoint(null);
    showToast("Prompt reset to empty schema.", "success");
  };

  const sections = [
    {
      title: "Concept",
      content: (
        <div className="space-y-4">
          <PositioningMap value={selectedPositioningPoint} options={positioningMap} onChange={setSelectedPositioningPoint} />
          <GroupedChipSelector
            label="Mood"
            selected={prompt.concept.mood}
            groups={filteredMoodGroups}
            onChange={handleMoodChange}
            collapsibleSections={{ "all moods": ["all moods"] }}
            placeholder={
              selectedPositioningPoint
                ? "현재 포지셔닝에 어울리는 무드를 직접 추가해보세요"
                : "포지셔닝을 먼저 고르거나 무드를 직접 추가해보세요"
            }
          />
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <label className="text-sm font-medium text-stone-800">Style</label>
              <span className="text-xs text-stone-400">4 fields</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <TextInputField
                label="Medium"
                value={prompt.concept.style.medium}
                onChange={(value) => handleConceptStyleChange("medium", value)}
                suggestions={conceptStyleOptions.medium}
                placeholder="사진, 3D, 일러스트"
              />
              <TextInputField
                label="Art Direction"
                value={prompt.concept.style.art_direction}
                onChange={(value) => handleConceptStyleChange("art_direction", value)}
                suggestions={conceptStyleOptions.art_direction}
                placeholder="미니멀, 럭셔리, 키치"
              />
              <TextInputField
                label="Rendering"
                value={prompt.concept.style.rendering}
                onChange={(value) => handleConceptStyleChange("rendering", value)}
                suggestions={conceptStyleOptions.rendering}
                placeholder="사실적, 매트페인팅, 클레이 렌더"
              />
              <TextInputField
                label="Era"
                value={prompt.concept.style.era}
                onChange={(value) => handleConceptStyleChange("era", value)}
                suggestions={conceptStyleOptions.era}
                placeholder="90년대, Y2K, 미래적"
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Subject",
      content: (
        <div className="space-y-4">
          <TextInputField
            label="Subject"
            value={prompt.object.main_object}
            onChange={(value) => patchNestedSection("object", "main_object", value)}
            placeholder="glossy black semi-transparent plastic pouch"
            caption="메인 요소를 적어주세요."
          />
          <TextInputField
            label="Subject Description"
            value={prompt.object.shape}
            onChange={(value) => patchNestedSection("object", "shape", value)}
            placeholder="vertical rectangular pouch with heat-sealed edges, premium product hero object"
            caption="요소에 대한 상세 설명을 적어주세요."
          />
          <SubjectDetailsField
            selected={prompt.object.details}
            onChange={(value) => patchNestedSection("object", "details", value)}
          />
        </div>
      ),
    },
    {
      title: "Composition",
      content: (
        <div className="space-y-4">
          <CameraViewPicker
            value={prompt.composition.view}
            onConfirm={(value) => patchNestedSection("composition", "view", value)}
          />
          <TextInputField
            label="Framing"
            value={prompt.composition.framing}
            onChange={(value) => patchNestedSection("composition", "framing", value)}
            suggestions={chipOptions.composition.framing}
          />
          <ChipSelector
            label="Layout"
            selected={prompt.composition.layout}
            options={chipOptions.composition.layout}
            onChange={(value) => patchNestedSection("composition", "layout", value)}
          />
          <TextInputField
            label="Depth"
            value={prompt.composition.depth}
            onChange={(value) => patchNestedSection("composition", "depth", value)}
            suggestions={chipOptions.composition.depth}
          />
        </div>
      ),
    },
    {
      title: "Lighting",
      content: (
        <div className="space-y-4">
          <TextInputField
            label="Primary Light"
            value={prompt.lighting.primary_light}
            onChange={(value) => patchNestedSection("lighting", "primary_light", value)}
            suggestions={chipOptions.lighting.primary_light}
            caption="광원의 방향, 세기, 전체 조명 성격처럼 장면의 기본 세팅을 정합니다."
          />
          <TextInputField
            label="Reflection"
            value={prompt.lighting.reflection}
            onChange={(value) => patchNestedSection("lighting", "reflection", value)}
            suggestions={chipOptions.lighting.reflection}
            caption="재질 위에 맺히는 반사와 하이라이트의 성격을 고릅니다."
          />
          <TextInputField
            label="Secondary Light"
            value={prompt.lighting.secondary_light}
            onChange={(value) => patchNestedSection("lighting", "secondary_light", value)}
            suggestions={chipOptions.lighting.secondary_light}
            caption="림라이트나 필라이트처럼 주광원 외에 형태를 보조하는 추가 광원을 다룹니다."
          />
          <TextInputField
            label="Emissive"
            value={prompt.lighting.emissive}
            onChange={(value) => patchNestedSection("lighting", "emissive", value)}
            suggestions={chipOptions.lighting.emissive}
            caption="자체 발광, LED 느낌, 빛 번짐처럼 광원 효과에 가까운 요소를 다룹니다."
          />
          <TextInputField
            label="Shadow"
            value={prompt.lighting.shadow}
            onChange={(value) => patchNestedSection("lighting", "shadow", value)}
            suggestions={chipOptions.lighting.shadow}
            caption="그림자의 깊이, 경계, 접지감처럼 물체가 놓이는 느낌을 정리합니다."
          />
        </div>
      ),
    },
    {
      title: "Background",
      content: (
        <div className="space-y-4">
          <TextInputField
            label="Color"
            value={prompt.background.color}
            onChange={(value) => patchNestedSection("background", "color", value)}
            suggestions={chipOptions.background.color}
          />
          <TextInputField
            label="Style"
            value={prompt.background.style}
            onChange={(value) => patchNestedSection("background", "style", value)}
            suggestions={chipOptions.background.style}
          />
          <TextInputField
            label="Surface"
            value={prompt.background.surface}
            onChange={(value) => patchNestedSection("background", "surface", value)}
            suggestions={chipOptions.background.surface}
          />
          <TextInputField
            label="Purpose"
            value={prompt.background.purpose}
            onChange={(value) => patchNestedSection("background", "purpose", value)}
            suggestions={chipOptions.background.purpose}
          />
        </div>
      ),
    },
    {
      title: "Color Palette",
      content: (
        <div className="space-y-4">
          <ChipSelector
            label="Primary"
            selected={prompt.color_palette.primary}
            options={chipOptions.color_palette.primary}
            onChange={(value) => patchNestedSection("color_palette", "primary", value)}
          />
          <ChipSelector
            label="Accent"
            selected={prompt.color_palette.accent}
            options={chipOptions.color_palette.accent}
            onChange={(value) => patchNestedSection("color_palette", "accent", value)}
          />
          <TextInputField
            label="Contrast"
            value={prompt.color_palette.contrast}
            onChange={(value) => patchNestedSection("color_palette", "contrast", value)}
            suggestions={chipOptions.color_palette.contrast}
          />
        </div>
      ),
    },
    {
      title: "Text Elements",
      content: (
        <div className="space-y-4">
          <TextInputField
            label="Top Left Text"
            value={prompt.text_elements.top_left_text}
            onChange={(value) => patchNestedSection("text_elements", "top_left_text", value)}
            suggestions={chipOptions.text_elements.top_left_text}
          />
          <TextInputField
            label="Price Label"
            value={prompt.text_elements.price_label}
            onChange={(value) => patchNestedSection("text_elements", "price_label", value)}
            suggestions={chipOptions.text_elements.price_label}
          />
          <ChipSelector
            label="Bottom Labels"
            selected={prompt.text_elements.bottom_labels}
            options={chipOptions.text_elements.bottom_labels}
            onChange={(value) => patchNestedSection("text_elements", "bottom_labels", value)}
          />
          <TextInputField
            label="Text Direction"
            value={prompt.text_elements.text_direction}
            onChange={(value) => patchNestedSection("text_elements", "text_direction", value)}
            suggestions={chipOptions.text_elements.text_direction}
          />
          <TextInputField
            label="Note"
            value={prompt.text_elements.note}
            onChange={(value) => patchNestedSection("text_elements", "note", value)}
            suggestions={chipOptions.text_elements.note}
          />
        </div>
      ),
    },
    {
      title: "Style Keywords",
      content: (
        <ChipSelector
          label="Style Keywords"
          selected={prompt.style_keywords}
          options={chipOptions.style_keywords}
          onChange={(value) => updateSection("style_keywords", value)}
        />
      ),
    },
    {
      title: "Negative Prompt",
      content: (
        <ChipSelector
          label="Negative Prompt"
          selected={prompt.negative_prompt}
          options={chipOptions.negative_prompt}
          onChange={(value) => updateSection("negative_prompt", value)}
        />
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-stone-25 text-stone-900">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 rounded-[28px] border border-stone-200 bg-white px-6 py-5 shadow-panel">
          <p className="text-sm font-medium uppercase tracking-normal text-stone-500">Visual Prompt Maker</p>
          <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-stone-950">Structured prompt builder for image generation</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
                Build consistent JSON prompts, shape the final English prompt automatically, and keep reusable visual language in one place.
              </p>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600">
              Schema locked to <span className="font-medium text-stone-900">structured_visual_prompt</span>
            </div>
          </div>
        </header>

        <main className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_420px]">
          <div className="space-y-4">
            <section className="rounded-2xl border border-stone-200 bg-white px-5 py-5 shadow-panel">
              <PresetSelector value={selectedPreset} onChange={applyPreset} />
            </section>
            {sections.map((section, index) => (
              <AccordionSection key={section.title} title={section.title} defaultOpen={index < 3}>
                {section.content}
              </AccordionSection>
            ))}
          </div>

          <ResultPanel
            prompt={prompt}
            score={score}
            onCopyJson={() => copyText(JSON.stringify(prompt, null, 2), "JSON copied to clipboard.")}
            onCopyPrompt={() => copyText(prompt.final_prompt, "Final prompt copied to clipboard.")}
            onDownload={() => {
              downloadJson(prompt);
              showToast("JSON downloaded.", "success");
            }}
            onImport={handleImport}
            onReset={handleReset}
          />
        </main>
      </div>

      {toast ? (
        <div className="pointer-events-none fixed bottom-5 right-5 z-50">
          <Toast message={toast.message} type={toast.type} />
        </div>
      ) : null}
    </div>
  );
}
