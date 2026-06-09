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

const legacyPositioningSet = new Set<string>(Object.keys(legacyPositioningPointMap));
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
    return !legacyPositioningSet.has(normalized) && !invalidLegacyMoodSet.has(normalized);
  });

const inferPositioningPointFromMood = (values: string[]): PositioningPoint | null => {
  const legacyValue = values.find((value) => legacyPositioningSet.has(value));
  return legacyValue ? legacyPositioningPointMap[legacyValue] : null;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const allDefinedMoodSet = new Set<string>(chipOptions.concept.mood.brand_personality);

const getMoodRecommendations = (point: PositioningPoint | null) => {
  if (!point) return [];

  return [...moodProfiles]
    .map((profile) => ({
      id: profile.id,
      score: 1 - Math.hypot(point.x - profile.x, point.y - profile.y) / 2.5,
    }))
    .filter((item) => allDefinedMoodSet.has(item.id))
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
    texture: { ...next.texture, ...(source.texture as object) },
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
  merged.object.details = Array.isArray(merged.object.details) ? merged.object.details : [];
  merged.composition.layout = Array.isArray(merged.composition.layout) ? merged.composition.layout : [];
  merged.texture.package_surface = Array.isArray(merged.texture.package_surface) ? merged.texture.package_surface : [];
  merged.texture.typography = Array.isArray(merged.texture.typography) ? merged.texture.typography : [];
  merged.texture.stickers = Array.isArray(merged.texture.stickers) ? merged.texture.stickers : [];
  merged.texture.objects = Array.isArray(merged.texture.objects) ? merged.texture.objects : [];
  merged.color_palette.primary = Array.isArray(merged.color_palette.primary) ? merged.color_palette.primary : [];
  merged.color_palette.accent = Array.isArray(merged.color_palette.accent) ? merged.color_palette.accent : [];
  merged.text_elements.bottom_labels = Array.isArray(merged.text_elements.bottom_labels) ? merged.text_elements.bottom_labels : [];

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

    return {
      suggested: filtered,
      "all moods": chipOptions.concept.mood.brand_personality,
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
      "concept" | "object" | "composition" | "texture" | "lighting" | "background" | "color_palette" | "text_elements"
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
                ? "Add a custom mood that matches this positioning"
                : "Choose a positioning first or add a custom mood"
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
          />
          <TextInputField
            label="Shape"
            value={prompt.object.shape}
            onChange={(value) => patchNestedSection("object", "shape", value)}
            placeholder="vertical rectangular pouch with heat-sealed edges"
          />
          <GroupedChipSelector
            label="Details"
            selected={prompt.object.details}
            groups={chipOptions.object.details}
            onChange={(value) => patchNestedSection("object", "details", value)}
            placeholder="Add a custom detail and press Enter"
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
      title: "Texture",
      content: (
        <div className="space-y-4">
          <ChipSelector
            label="Package Surface"
            selected={prompt.texture.package_surface}
            options={chipOptions.texture.package_surface}
            onChange={(value) => patchNestedSection("texture", "package_surface", value)}
          />
          <ChipSelector
            label="Typography"
            selected={prompt.texture.typography}
            options={chipOptions.texture.typography}
            onChange={(value) => patchNestedSection("texture", "typography", value)}
          />
          <ChipSelector
            label="Stickers"
            selected={prompt.texture.stickers}
            options={chipOptions.texture.stickers}
            onChange={(value) => patchNestedSection("texture", "stickers", value)}
          />
          <ChipSelector
            label="Objects"
            selected={prompt.texture.objects}
            options={chipOptions.texture.objects}
            onChange={(value) => patchNestedSection("texture", "objects", value)}
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
