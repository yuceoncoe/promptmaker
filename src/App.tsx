import { useEffect, useMemo, useRef, useState } from "react";
import AccordionSection from "./components/AccordionSection";
import ChipSelector from "./components/ChipSelector";
import GroupedChipSelector from "./components/GroupedChipSelector";
import NestedObjectList from "./components/NestedObjectList";
import PositioningMap, { type PositioningPoint } from "./components/PositioningMap";
import PresetSelector from "./components/PresetSelector";
import ResultPanel from "./components/ResultPanel";
import TextInputField from "./components/TextInputField";
import Toast from "./components/Toast";
import { chipOptions, legacyPositioningPointMap, moodProfiles, positioningMap } from "./data/chipOptions";
import { presets } from "./data/presets";
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
const allDefinedObjectDetailSet = createOptionSet(chipOptions.object.details);
const objectSurfaceSet = createOptionSet(chipOptions.object.surface);
const compositionViewSet = createOptionSet(chipOptions.composition.view);
const compositionAngleSet = createOptionSet(chipOptions.composition.angle);
const compositionPlacementSet = createOptionSet(chipOptions.composition.placement);
const compositionFramingSet = createOptionSet(chipOptions.composition.framing);
const compositionLayoutSet = createOptionSet(chipOptions.composition.layout);
const compositionBalanceSet = createOptionSet(chipOptions.composition.balance);
const compositionDepthSet = createOptionSet(chipOptions.composition.depth);
const lightingMainLightSet = createOptionSet(chipOptions.lighting.main_light);
const lightingHighlightSet = createOptionSet(chipOptions.lighting.highlight);
const lightingGlowSet = createOptionSet(chipOptions.lighting.glow);
const lightingShadowSet = createOptionSet(chipOptions.lighting.shadow);
const lightingMoodSet = createOptionSet(chipOptions.lighting.mood);
const lightingRenderingStyleSet = createOptionSet(chipOptions.lighting.rendering_style);
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

const sanitizeMoodValues = (values: string[]) =>
  values.filter((value) => {
    const normalized = value.trim().toLowerCase();
    return !legacyPositioningSet.has(normalized) && !invalidLegacyMoodSet.has(normalized) && allDefinedMoodSet.has(normalized);
  });
const sanitizeOptionValues = (values: string[], allowed: Set<string>) =>
  values.filter((value) => allowed.has(value.trim().toLowerCase()));
const sanitizeOptionValue = (value: string, allowed: Set<string>) => (allowed.has(value.trim().toLowerCase()) ? value : "");

const inferPositioningPointFromMood = (values: string[]): PositioningPoint | null => {
  const legacyValue = values.find((value) => legacyPositioningSet.has(value));
  return legacyValue ? legacyPositioningPointMap[legacyValue] : null;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const getMoodRecommendations = (point: PositioningPoint | null) => {
  if (!point) return [];

  return [...moodProfiles]
    .map((profile) => ({
      id: profile.id,
      score: 1 - Math.hypot(point.x - profile.x, point.y - profile.y) / 2.5,
    }))
    .filter((item) => allDefinedMoodSet.has(item.id.trim().toLowerCase()))
    .filter((item) => item.score > 0.2)
    .sort((left, right) => right.score - left.score)
    .slice(0, 10);
};

const getStrongMoodRecommendations = (recommendations: { id: string; score: number }[]) =>
  recommendations.slice(0, Math.min(5, recommendations.length)).map((item) => item.id);

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
  merged.object.details = Array.isArray(merged.object.details)
    ? sanitizeOptionValues(merged.object.details, allDefinedObjectDetailSet)
    : [];
  const legacyTexture = source.texture as
    | {
        surface?: unknown;
        package_surface?: unknown;
      }
    | undefined;
  merged.object.surface = sanitizeOptionValues(
    [
      ...(Array.isArray(merged.object.surface) ? merged.object.surface : []),
      ...(Array.isArray(legacyTexture?.surface) ? legacyTexture.surface.filter((item): item is string => typeof item === "string") : []),
      ...(Array.isArray(legacyTexture?.package_surface)
        ? legacyTexture.package_surface.filter((item): item is string => typeof item === "string")
        : []),
    ],
    objectSurfaceSet
  );
  merged.composition.view = sanitizeOptionValue(merged.composition.view, compositionViewSet);
  merged.composition.angle = sanitizeOptionValue(merged.composition.angle, compositionAngleSet);
  merged.composition.placement = sanitizeOptionValue(merged.composition.placement, compositionPlacementSet);
  merged.composition.framing = sanitizeOptionValue(merged.composition.framing, compositionFramingSet);
  merged.composition.layout = Array.isArray(merged.composition.layout)
    ? sanitizeOptionValues(merged.composition.layout, compositionLayoutSet)
    : [];
  merged.composition.balance = sanitizeOptionValue(merged.composition.balance, compositionBalanceSet);
  merged.composition.depth = sanitizeOptionValue(merged.composition.depth, compositionDepthSet);
  merged.lighting.main_light = sanitizeOptionValue(merged.lighting.main_light, lightingMainLightSet);
  merged.lighting.highlight = sanitizeOptionValue(merged.lighting.highlight, lightingHighlightSet);
  merged.lighting.glow = sanitizeOptionValue(merged.lighting.glow, lightingGlowSet);
  merged.lighting.shadow = sanitizeOptionValue(merged.lighting.shadow, lightingShadowSet);
  merged.lighting.mood = sanitizeOptionValue(merged.lighting.mood, lightingMoodSet);
  merged.lighting.rendering_style = sanitizeOptionValue(merged.lighting.rendering_style, lightingRenderingStyleSet);
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

  useEffect(() => {
    const positioningKey = selectedPositioningPoint
      ? `${selectedPositioningPoint.x.toFixed(2)}:${selectedPositioningPoint.y.toFixed(2)}`
      : "";

    if (positioningKey === previousPositioningKeyRef.current) {
      return;
    }

    previousPositioningKeyRef.current = positioningKey;

    if (!selectedPositioningPoint || moodRecommendations.length === 0) {
      setPrompt((current) => ({
        ...current,
        concept: {
          ...current.concept,
          mood: [],
        },
      }));
      return;
    }

    const stronglyRecommended = getStrongMoodRecommendations(moodRecommendations);

    setPrompt((current) => {
      const nextMood = stronglyRecommended;
      const unchanged =
        nextMood.length === current.concept.mood.length &&
        nextMood.every((item, index) => item === current.concept.mood[index]);

      if (unchanged) {
        return current;
      }

      return {
        ...current,
        concept: {
          ...current.concept,
          mood: nextMood,
        },
      };
    });
  }, [moodRecommendations, selectedPositioningPoint]);

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
    const nextMood =
      selectedPositioningPoint && moodRecommendations.length > 0
        ? getStrongMoodRecommendations(moodRecommendations)
        : sanitizeMoodValues(rawPreset.concept.mood);
    const nextPrompt = {
      ...rawPreset,
      concept: {
        ...rawPreset.concept,
        mood: nextMood,
      },
    };
    setSelectedPreset(presetName);
    setPrompt(nextPrompt);
    showToast(`${presetName} preset applied.`, "success");
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
          <PresetSelector value={selectedPreset} onChange={applyPreset} />
          <TextInputField
            label="Title"
            value={prompt.concept.title}
            onChange={(value) => patchNestedSection("concept", "title", value)}
            placeholder="Premium Branding Package"
          />
          <TextInputField
            label="Description"
            value={prompt.concept.description}
            onChange={(value) => patchNestedSection("concept", "description", value)}
            placeholder="Describe the overall concept"
            multiline
          />
          <PositioningMap value={selectedPositioningPoint} options={positioningMap} onChange={setSelectedPositioningPoint} />
          <GroupedChipSelector
            label="Mood"
            selected={prompt.concept.mood}
            groups={filteredMoodGroups}
            onChange={handleMoodChange}
            collapsibleGroups={["all moods"]}
            placeholder={
              selectedPositioningPoint
                ? "현재 포지셔닝에 어울리는 무드를 직접 추가해보세요"
                : "포지셔닝을 먼저 고르거나 무드를 직접 추가해보세요"
            }
          />
        </div>
      ),
    },
    {
      title: "Object",
      content: (
        <div className="space-y-4">
          <TextInputField
            label="Main Object"
            value={prompt.object.main_object}
            onChange={(value) => patchNestedSection("object", "main_object", value)}
            placeholder="glossy black semi-transparent plastic pouch"
            caption="제품이나 핵심 피사체 자체를 적어주세요. 소재 + 제품 유형처럼 구체적인 명사구로 쓰면 좋아요."
          />
          <TextInputField
            label="Shape"
            value={prompt.object.shape}
            onChange={(value) => patchNestedSection("object", "shape", value)}
            placeholder="vertical rectangular pouch with heat-sealed edges"
            caption="실루엣이나 구조를 한 줄로 설명해 주세요. 비율, 형태, 구조적 특징이 드러나면 좋습니다."
          />
          <GroupedChipSelector
            label="Details"
            selected={prompt.object.details}
            groups={chipOptions.object.details}
            onChange={(value) => patchNestedSection("object", "details", value)}
            placeholder="커스텀 디테일을 입력하고 Enter를 누르세요"
          />
          <ChipSelector
            label="Surface"
            selected={prompt.object.surface}
            options={chipOptions.object.surface}
            onChange={(value) => patchNestedSection("object", "surface", value)}
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
          <TextInputField
            label="View"
            value={prompt.composition.view}
            onChange={(value) => patchNestedSection("composition", "view", value)}
            suggestions={chipOptions.composition.view}
          />
          <TextInputField
            label="Angle"
            value={prompt.composition.angle}
            onChange={(value) => patchNestedSection("composition", "angle", value)}
            suggestions={chipOptions.composition.angle}
          />
          <TextInputField
            label="Placement"
            value={prompt.composition.placement}
            onChange={(value) => patchNestedSection("composition", "placement", value)}
            suggestions={chipOptions.composition.placement}
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
            label="Balance"
            value={prompt.composition.balance}
            onChange={(value) => patchNestedSection("composition", "balance", value)}
            suggestions={chipOptions.composition.balance}
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
          <TextInputField
            label="Mood"
            value={prompt.lighting.mood}
            onChange={(value) => patchNestedSection("lighting", "mood", value)}
            suggestions={chipOptions.lighting.mood}
          />
          <TextInputField
            label="Rendering Style"
            value={prompt.lighting.rendering_style}
            onChange={(value) => patchNestedSection("lighting", "rendering_style", value)}
            suggestions={chipOptions.lighting.rendering_style}
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
