import { useEffect, useMemo, useRef, useState } from "react";
import AccordionSection from "./components/AccordionSection";
import CameraViewPicker from "./components/CameraViewPicker";
import ChipSelector from "./components/ChipSelector";
import GroupedChipSelector from "./components/GroupedChipSelector";
import NestedObjectList from "./components/NestedObjectList";
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

const deepClone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const flattenOptionValues = (source: readonly string[] | Record<string, readonly string[]>) =>
  Array.isArray(source) ? [...source] : Object.values(source).flatMap((group) => [...group]);
const createOptionSet = (source: readonly string[] | Record<string, readonly string[]>) =>
  new Set(flattenOptionValues(source).map((item) => item.trim().toLowerCase()));

const legacyPositioningSet = new Set<string>(Object.keys(legacyPositioningPointMap));
const allDefinedMoodSet = createOptionSet(chipOptions.concept.mood.brand_personality);
const allDefinedStylingSet = createOptionSet(chipOptions.concept.styling);
const allDefinedObjectMaterialSet = createOptionSet(chipOptions.object.material);
const allDefinedObjectDetailSet = createOptionSet(chipOptions.object.details);
const objectTextureSet = createOptionSet(chipOptions.object.texture);
const compositionViewSet = createOptionSet(chipOptions.composition.view);
const compositionFramingSet = createOptionSet(chipOptions.composition.framing);
const compositionLayoutSet = createOptionSet(chipOptions.composition.layout);
const compositionDepthSet = createOptionSet(chipOptions.composition.depth);
const lightingMainLightSet = createOptionSet(chipOptions.lighting.main_light);
const lightingHighlightSet = createOptionSet(chipOptions.lighting.highlight);
const lightingGlowSet = createOptionSet(chipOptions.lighting.glow);
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
const legacyObjectDetailAliasMap: Record<string, string[]> = {
  "faceted sculptural silhouette": ["gem-cut faceted edges"],
  "thin beveled edge body": ["chamfered edges"],
  "soft curved monoblock form": ["seamless monoblock form"],
  "rounded capsule-like consumer device shape": ["pill-shaped contour"],
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
const expandLegacyObjectValues = (values: string[], aliasMap: Record<string, string[]>) =>
  values.flatMap((value) => aliasMap[value.trim().toLowerCase()] ?? [value]);
const normalizeCompositionViewValue = (value: string) => legacyCompositionViewAliasMap[value.trim().toLowerCase()] ?? value;

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

const getStrongStylingRecommendations = (recommendations: { id: string; score: number }[]) =>
  recommendations.slice(0, Math.min(3, recommendations.length)).map((item) => item.id);

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
  const merged: VisualPrompt = {
    ...next,
    ...source,
    concept: { ...next.concept, ...(source.concept as object) },
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
  const rawObjectDetails = Array.isArray(merged.object.details)
    ? merged.object.details.filter((item): item is string => typeof item === "string")
    : [];
  merged.concept.styling = sanitizeStylingValues([
    ...(Array.isArray(merged.concept.styling) ? merged.concept.styling : []),
    ...rawObjectDetails.filter((item) => allDefinedStylingSet.has(item.trim().toLowerCase())),
  ]);
  merged.object.material = sanitizeOptionValues(
    expandLegacyObjectValues(
      [
      ...(Array.isArray(merged.object.material) ? merged.object.material : []),
      ...rawObjectDetails.filter((item) => allDefinedObjectMaterialSet.has(item.trim().toLowerCase())),
      ],
      legacyObjectMaterialAliasMap
    ),
    allDefinedObjectMaterialSet
  );
  merged.object.details = sanitizeOptionValues(
    expandLegacyObjectValues(rawObjectDetails, legacyObjectDetailAliasMap),
    allDefinedObjectDetailSet
  );
  const legacyTexture = source.texture as
    | {
        surface?: unknown;
        package_surface?: unknown;
      }
    | undefined;
  const rawObjectTexture = Array.isArray(merged.object.texture)
    ? merged.object.texture.filter((item): item is string => typeof item === "string")
    : [];
  const legacyObjectSurface = Array.isArray((source.object as { surface?: unknown[] } | undefined)?.surface)
    ? ((source.object as { surface?: unknown[] }).surface ?? []).filter((item): item is string => typeof item === "string")
    : [];
  merged.object.texture = sanitizeOptionValues(
    expandLegacyObjectValues(
      [
        ...rawObjectTexture,
        ...legacyObjectSurface,
        ...(Array.isArray(legacyTexture?.surface) ? legacyTexture.surface.filter((item): item is string => typeof item === "string") : []),
        ...(Array.isArray(legacyTexture?.package_surface)
          ? legacyTexture.package_surface.filter((item): item is string => typeof item === "string")
          : []),
      ],
      legacyObjectTextureAliasMap
    ),
    objectTextureSet
  );
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
  merged.lighting.main_light = sanitizeOptionValue(merged.lighting.main_light, lightingMainLightSet);
  merged.lighting.highlight = sanitizeOptionValue(merged.lighting.highlight, lightingHighlightSet);
  merged.lighting.glow = sanitizeOptionValue(merged.lighting.glow, lightingGlowSet);
  merged.lighting.shadow = sanitizeOptionValue(merged.lighting.shadow, lightingShadowSet);
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
    main_light: merged.lighting.main_light,
    highlight: merged.lighting.highlight,
    glow: merged.lighting.glow,
    shadow: merged.lighting.shadow,
  };

  return merged;
};

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
  const filteredStylingGroups = useMemo(() => {
    const filtered = stylingRecommendations.map((item) => item.id);
    const groupedStyling = Object.fromEntries(
      Object.entries(chipOptions.concept.styling).map(([groupName, options]) => [
        groupName,
        [...options].sort((left, right) => left.localeCompare(right)),
      ])
    );

    return {
      suggested: filtered,
      ...groupedStyling,
    };
  }, [stylingRecommendations]);

  const handleMoodChange = (value: string[]) => {
    patchNestedSection("concept", "mood", value);
  };

  const handleStylingChange = (value: string[]) => {
    patchNestedSection("concept", "styling", value);
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
        },
      }));
      return;
    }

    const stronglyRecommended = getStrongMoodRecommendations(moodRecommendations);
    const stronglyRecommendedStyling = getStrongStylingRecommendations(stylingRecommendations);

    setPrompt((current) => {
      const nextMood = stronglyRecommended;
      const nextStyling = stronglyRecommendedStyling;
      const moodUnchanged =
        nextMood.length === current.concept.mood.length &&
        nextMood.every((item, index) => item === current.concept.mood[index]);
      const stylingUnchanged =
        nextStyling.length === current.concept.styling.length &&
        nextStyling.every((item, index) => item === current.concept.styling[index]);

      if (moodUnchanged && stylingUnchanged) {
        return current;
      }

      return {
        ...current,
        concept: {
          ...current.concept,
          mood: nextMood,
          styling: nextStyling,
        },
      };
    });
  }, [moodRecommendations, selectedPositioningPoint, stylingRecommendations]);

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
        styling: nextStyling,
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
          <GroupedChipSelector
            label="Styling"
            selected={prompt.concept.styling}
            groups={filteredStylingGroups}
            onChange={handleStylingChange}
            collapsibleSections={{
              "all styling": [
                "industrial modernism",
                "graphic and art direction",
                "trend and digital culture",
                "commercial image types",
                "material and sensory tone",
              ],
            }}
            placeholder={
              selectedPositioningPoint
                ? "현재 포지셔닝에 어울리는 스타일링을 직접 추가해보세요"
                : "포지셔닝을 먼저 고르거나 스타일링을 직접 추가해보세요"
            }
          />
        </div>
      ),
    },
    {
      title: "Subject",
      content: (
        <div className="space-y-4">
          <TextInputField
            label="Primary Subject"
            value={prompt.object.main_object}
            onChange={(value) => patchNestedSection("object", "main_object", value)}
            placeholder="glossy black semi-transparent plastic pouch"
            caption="실제로 화면에 등장하는 핵심 피사체를 적어주세요. Concept가 전체 방향이라면, 여기서는 무엇을 보여줄지를 구체적으로 씁니다."
          />
          <TextInputField
            label="Shape"
            value={prompt.object.shape}
            onChange={(value) => patchNestedSection("object", "shape", value)}
            placeholder="vertical rectangular pouch with heat-sealed edges"
            caption="같은 피사체라도 형태와 구조가 다르면 이미지가 크게 달라집니다. 실루엣, 비율, 구조를 보충해 주세요."
          />
          <GroupedChipSelector
            label="Details"
            selected={prompt.object.details}
            groups={chipOptions.object.details}
            onChange={(value) => patchNestedSection("object", "details", value)}
            placeholder="커스텀 디테일을 입력하고 Enter를 누르세요"
          />
          <ChipSelector
            label="Material"
            selected={prompt.object.material}
            options={chipOptions.object.material}
            onChange={(value) => patchNestedSection("object", "material", value)}
          />
          <ChipSelector
            label="Surface Finish"
            selected={prompt.object.texture}
            options={chipOptions.object.texture}
            onChange={(value) => patchNestedSection("object", "texture", value)}
          />
          <NestedObjectList
            items={prompt.object.inside_objects}
            onChange={(value) => patchNestedSection("object", "inside_objects", value)}
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
            label="Main Light"
            value={prompt.lighting.main_light}
            onChange={(value) => patchNestedSection("lighting", "main_light", value)}
            suggestions={chipOptions.lighting.main_light}
          />
          <TextInputField
            label="Highlight"
            value={prompt.lighting.highlight}
            onChange={(value) => patchNestedSection("lighting", "highlight", value)}
            suggestions={chipOptions.lighting.highlight}
          />
          <TextInputField
            label="Glow"
            value={prompt.lighting.glow}
            onChange={(value) => patchNestedSection("lighting", "glow", value)}
            suggestions={chipOptions.lighting.glow}
          />
          <TextInputField
            label="Shadow"
            value={prompt.lighting.shadow}
            onChange={(value) => patchNestedSection("lighting", "shadow", value)}
            suggestions={chipOptions.lighting.shadow}
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
