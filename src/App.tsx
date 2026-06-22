import { useEffect, useMemo, useRef, useState } from "react";
import AccordionSection from "./components/AccordionSection";
import CameraViewPicker from "./components/CameraViewPicker";
import ChipSelector from "./components/ChipSelector";
import GroupedChipSelector from "./components/GroupedChipSelector";
import PositioningMap, { type PositioningPoint } from "./components/PositioningMap";
import ResultPanel from "./components/ResultPanel";
import TextInputField from "./components/TextInputField";
import Toast from "./components/Toast";
import { chipOptions, moodProfiles, positioningMap, aesthetic_groups, era_groups, medium_groups, mood_groups } from "./data/chipOptions";
import { EMPTY_PROMPT, type UnifiedPrompt } from "./types/prompt";
import { buildFinalPrompt } from "./utils/buildFinalPrompt";
import { calculateQualityScore } from "./utils/calculateQualityScore";
import { downloadJson } from "./utils/downloadJson";

const STORAGE_KEY = "visual-prompt-maker:v3";
const UI_STORAGE_KEY = "visual-prompt-maker-ui:v3";

type ToastState = {
  message: string;
  type: "success" | "error";
} | null;

const deepClone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export default function App() {
  const [prompt, setPrompt] = useState<UnifiedPrompt>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const mergedScene = { ...EMPTY_PROMPT.scene, ...(parsed.scene || {}) };
        if (typeof mergedScene.composition === "string") {
          mergedScene.composition = mergedScene.composition ? [mergedScene.composition] : [];
        }
        return { ...deepClone(EMPTY_PROMPT), ...parsed, meta: { ...EMPTY_PROMPT.meta, ...(parsed.meta || {}) }, subject: { ...EMPTY_PROMPT.subject, ...(parsed.subject || {}) }, scene: mergedScene, style: { ...EMPTY_PROMPT.style, ...(parsed.style || {}) }, constraints: { ...EMPTY_PROMPT.constraints, ...(parsed.constraints || {}) } };
      }
      return deepClone(EMPTY_PROMPT);
    } catch {
      return deepClone(EMPTY_PROMPT);
    }
  });

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

  const moodRecommendations = useMemo(() => {
    if (!selectedPositioningPoint) return [];
    const allMoods = new Set<string>(chipOptions.concept.mood.brand_personality);
    return moodProfiles
      .map((profile) => ({
        id: profile.id,
        score: 1 - Math.hypot(selectedPositioningPoint.x - profile.x, selectedPositioningPoint.y - profile.y) / 2.5,
      }))
      .filter((item) => allMoods.has(item.id.trim().toLowerCase()))
      .filter((item) => item.score > 0.2)
      .sort((left, right) => right.score - left.score)
      .slice(0, 10);
  }, [selectedPositioningPoint]);

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
        style: {
          ...current.style,
          mood: [],
        },
      }));
      return;
    }

    const stronglyRecommended = moodRecommendations.slice(0, Math.min(5, moodRecommendations.length)).map((item) => item.id);

    setPrompt((current) => {
      const nextMood = stronglyRecommended;
      const moodUnchanged =
        nextMood.length === current.style.mood.length &&
        nextMood.every((item, index) => item === current.style.mood[index]);

      if (moodUnchanged) {
        return current;
      }

      return {
        ...current,
        style: {
          ...current.style,
          mood: nextMood,
        },
      };
    });
  }, [moodRecommendations, selectedPositioningPoint]);

  // Merge legacy chipOptions for suggestions
  const mergedLightingOptions = useMemo(() => [
    ...chipOptions.lighting.primary_light,
    ...chipOptions.lighting.reflection,
    ...chipOptions.lighting.secondary_light,
    ...chipOptions.lighting.emissive,
    ...chipOptions.lighting.shadow
  ], []);

  const mergedBackgroundOptions = useMemo(() => [
    ...chipOptions.background.color,
    ...chipOptions.background.style,
    ...chipOptions.background.surface,
    ...chipOptions.background.purpose
  ], []);

  const subjectDetailsGroups = useMemo(() => ({
    "Material": chipOptions.object.material,
    "Finish": chipOptions.object.finish
  }), []);

  const filteredMoodGroups = useMemo(() => {
    const suggested = moodRecommendations.map((item) => item.id);
    const baseGroups = { ...mood_groups };
    return {
      ...(suggested.length > 0 ? { suggested } : {}),
      ...baseGroups,
    };
  }, [moodRecommendations]);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
  };

  const patchNestedSection = <
    K extends keyof Pick<UnifiedPrompt, "meta" | "subject" | "scene" | "style" | "constraints">,
    F extends keyof UnifiedPrompt[K]
  >(
    section: K,
    field: F,
    value: UnifiedPrompt[K][F]
  ) => {
    setPrompt((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [field]: value,
      },
    }));
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
      const parsed = JSON.parse(raw) as UnifiedPrompt;
      const mergedScene = { ...EMPTY_PROMPT.scene, ...(parsed.scene || {}) };
      if (typeof mergedScene.composition === "string") {
        mergedScene.composition = mergedScene.composition ? [mergedScene.composition] : [];
      }
      const newPrompt = { ...deepClone(EMPTY_PROMPT), ...parsed, scene: mergedScene };
      setPrompt({ ...newPrompt, final_prompt: buildFinalPrompt(newPrompt) });
      setSelectedPositioningPoint(null);
      showToast("JSON imported successfully.", "success");
    } catch {
      showToast("Import failed. Please use a valid JSON file.", "error");
    }
  };

  const handleReset = () => {
    setPrompt(deepClone(EMPTY_PROMPT));
    setSelectedPositioningPoint(null);
    showToast("Prompt reset to empty schema.", "success");
  };

  const sections = [
    {
      title: "Subject",
      content: (
        <div className="space-y-4">
          <TextInputField
            label="Subject Type"
            value={prompt.subject.type}
            onChange={(value) => patchNestedSection("subject", "type", value)}
            placeholder="product, person, abstract, etc."
          />
          <TextInputField
            label="Main Object"
            value={prompt.subject.main_object}
            onChange={(value) => patchNestedSection("subject", "main_object", value)}
            placeholder="glossy black semi-transparent plastic pouch"
          />
          <GroupedChipSelector
            label="Subject Details (Material, Texture, Shape)"
            selected={prompt.subject.details}
            groups={subjectDetailsGroups}
            onChange={(val) => patchNestedSection("subject", "details", val)}
          />
        </div>
      ),
    },
    {
      title: "Concept & Style",
      content: (
        <div className="space-y-4">
          <PositioningMap value={selectedPositioningPoint} options={positioningMap} onChange={setSelectedPositioningPoint} />
          <GroupedChipSelector
            label="Mood & Personality"
            selected={prompt.style.mood}
            groups={filteredMoodGroups}
            onChange={(val) => patchNestedSection("style", "mood", val)}
            collapsibleSections={{ "all moods": Object.keys(mood_groups) }}
            placeholder="포지셔닝을 기반으로 브랜드 무드를 선택하세요"
          />
          <GroupedChipSelector
            label="Medium & Form"
            selected={prompt.style.medium}
            groups={medium_groups}
            onChange={(val) => patchNestedSection("style", "medium", val)}
            placeholder="e.g. Photography, 3D Render, Illustration, Cinematic"
          />
          <GroupedChipSelector
            label="Aesthetic / Art Direction"
            selected={prompt.style.aesthetic}
            groups={aesthetic_groups}
            onChange={(val) => patchNestedSection("style", "aesthetic", val)}
            placeholder="e.g. industrial, minimalist, bauhaus"
          />
          <GroupedChipSelector
            label="Era / Time Period"
            selected={prompt.style.era}
            groups={era_groups}
            onChange={(val) => patchNestedSection("style", "era", val)}
            placeholder="e.g. y2k, 90s, retro-futuristic"
          />
        </div>
      ),
    },
    {
      title: "Scene & Composition",
      content: (
        <div className="space-y-4">
          <TextInputField
            label="Background"
            value={prompt.scene.background}
            onChange={(value) => patchNestedSection("scene", "background", value)}
            suggestions={mergedBackgroundOptions}
            placeholder="e.g. Minimalist white studio, Natural outdoor lighting"
          />
          <CameraViewPicker
             value={prompt.scene.composition.find(item => (chipOptions.composition.view as readonly string[]).includes(item)) || "front view"}
             onConfirm={(newView) => {
               const next = prompt.scene.composition.filter(item => !(chipOptions.composition.view as readonly string[]).includes(item));
               next.push(newView);
               patchNestedSection("scene", "composition", next);
             }}
          />
          <GroupedChipSelector
            label="Additional Composition Details"
            selected={prompt.scene.composition}
            groups={chipOptions.composition}
            onChange={(val) => patchNestedSection("scene", "composition", val)}
            placeholder="e.g. Center framed, high angle"
          />
        </div>
      ),
    },
    {
      title: "Lighting & Color",
      content: (
        <div className="space-y-4">
          <ChipSelector
            label="Lighting Setup"
            selected={prompt.style.lighting}
            options={mergedLightingOptions}
            onChange={(val) => patchNestedSection("style", "lighting", val)}
            placeholder="e.g. Soft studio lighting, Dramatic rim light, Cinematic"
          />
          <ChipSelector
            label="Color Palette"
            selected={prompt.style.color_palette}
            options={[...chipOptions.color_palette.primary, ...chipOptions.color_palette.accent]}
            onChange={(val) => patchNestedSection("style", "color_palette", val)}
          />
        </div>
      ),
    },
    {
      title: "Constraints",
      content: (
        <div className="space-y-4">
          <ChipSelector
            label="Negative Prompt"
            selected={prompt.constraints.negative_prompt}
            options={chipOptions.negative_prompt}
            onChange={(val) => patchNestedSection("constraints", "negative_prompt", val)}
          />
          <TextInputField
            label="Aspect Ratio"
            value={prompt.constraints.aspect_ratio}
            onChange={(value) => patchNestedSection("constraints", "aspect_ratio", value)}
            placeholder="e.g. 1:1, 16:9, 9:16"
          />
        </div>
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
              Schema locked to <span className="font-medium text-stone-900">UnifiedPrompt</span>
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
