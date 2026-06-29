import { useEffect, useMemo, useRef, useState } from "react";
import AccordionSection from "./components/AccordionSection";
import CameraViewPicker from "./components/CameraViewPicker";
import { ColorWheelPicker } from "./components/ColorWheelPicker";
import GroupedChipSelector from "./components/GroupedChipSelector";
import PositioningMap, { type PositioningPoint } from "./components/PositioningMap";
import ResultPanel from "./components/ResultPanel";
import SelectField from "./components/SelectField";
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

import ChipInputField from "./components/ChipInputField";
import FramingPicker from "./components/FramingPicker";

export default function App() {
  const [prompt, setPrompt] = useState<UnifiedPrompt>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        
        const mergedSubject = { ...EMPTY_PROMPT.subject, ...(parsed.subject || {}) };
        if (typeof mergedSubject.main_object === "string") {
          mergedSubject.main_object = mergedSubject.main_object ? (mergedSubject.main_object as string).split(",").map(s => s.trim()).filter(Boolean) : [];
        }
        
        const mergedScene = { ...EMPTY_PROMPT.scene, ...(parsed.scene || {}) };
        if (typeof mergedScene.composition === "string") {
          mergedScene.composition = mergedScene.composition ? [(mergedScene.composition as string)] : [];
        } else if (Array.isArray(mergedScene.composition)) {
          const OBSOLETE_FRAMING = [
            "vertical framing",
            "square framing",
            "generous whitespace",
            "tight editorial crop",
            "ultra-tight macro crop",
            "full-bleed framing",
            "wide landscape framing",
          ];
          mergedScene.composition = mergedScene.composition.filter((item: string) => !OBSOLETE_FRAMING.includes(item));
        }
        
        const mergedBackground = { ...EMPTY_PROMPT.background, ...(parsed.background || {}) };
        // Migrate legacy scene.background if exists
        if (parsed.scene && 'background' in parsed.scene && parsed.scene.background && !parsed.background) {
           mergedBackground.type = "environment";
           mergedBackground.environment = parsed.scene.background as any;
        }
        
        if (typeof mergedBackground.environment === "string") {
           mergedBackground.environment = mergedBackground.environment ? (mergedBackground.environment as string).split(",").map(s => s.trim()).filter(Boolean) : [];
        }
        if (typeof mergedBackground.props === "string") {
           mergedBackground.props = mergedBackground.props ? (mergedBackground.props as string).split(",").map(s => s.trim()).filter(Boolean) : [];
        }

        const mergedConstraints = { ...EMPTY_PROMPT.constraints, ...(parsed.constraints || {}) };
        
        // Migrate legacy constraints.aspect_ratio to scene.framing
        if (parsed.constraints && 'aspect_ratio' in parsed.constraints) {
          mergedScene.framing = mergedScene.framing || (parsed.constraints as any).aspect_ratio;
        }

        const mergedStyle = { ...EMPTY_PROMPT.style, ...(parsed.style || {}) };
        if (Array.isArray(mergedStyle.lighting)) {
          const OBSOLETE_LIGHTING = [
            "soft studio lighting", "strong overhead studio light", "large softbox from upper left",
            "diffused commercial lighting", "bright catalog lighting", "moody spotlight lighting",
            "strong glossy highlights", "soft premium highlights", "long reflective highlights",
            "clean product reflections", "crisp metallic highlights", "subtle satin highlights",
            "glass-like specular highlights", "soft ambient fill lighting", "sharp directional rim lighting",
            "warm internal glow", "subtle LED glow", "neon edge glow", "soft ambient bloom", "screen-lit glow",
            "soft natural shadow", "deep product shadow", "minimal shadow", "dramatic shadow",
            "sharp directional shadow", "diffused floor shadow", "floating contact shadow"
          ];
          mergedStyle.lighting = mergedStyle.lighting.filter((item: string) => !OBSOLETE_LIGHTING.includes(item));
        }

        return {
          ...deepClone(EMPTY_PROMPT),
          ...parsed,
          meta: { ...EMPTY_PROMPT.meta, ...(parsed.meta || {}) },
          subject: mergedSubject,
          background: mergedBackground,
          scene: mergedScene,
          style: mergedStyle,
          constraints: mergedConstraints,
          midjourney: { ...EMPTY_PROMPT.midjourney, ...(parsed.midjourney || {}) },
        };
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

  // Legacy lighting chipOptions have been refactored.

  const mergedBackgroundOptions = useMemo(() => [
    ...chipOptions.background.environment
  ], []);

  const mergedPropsOptions = useMemo(() => [
    ...chipOptions.background.props
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
    K extends keyof Pick<UnifiedPrompt, "meta" | "subject" | "background" | "scene" | "style" | "constraints" | "midjourney">,
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
          <SelectField
            label="Subject Type"
            value={prompt.subject.type}
            onChange={(value) => patchNestedSection("subject", "type", value)}
            options={[
              { label: "Product", value: "product" },
              { label: "Person / Portrait", value: "person" },
              { label: "Architecture / Interior", value: "architecture" },
              { label: "Landscape / Nature", value: "landscape" },
              { label: "Food / Culinary", value: "food" },
              { label: "Abstract / Conceptual", value: "abstract" },
              { label: "Animal", value: "animal" },
              { label: "Vehicle", value: "vehicle" },
              { label: "Fashion / Apparel", value: "fashion" },
              { label: "Other", value: "other" },
            ]}
            placeholder="Select a subject type..."
          />
          <ChipInputField
            label="Main Object"
            value={prompt.subject.main_object}
            onChange={(value) => patchNestedSection("subject", "main_object", value)}
            placeholder="e.g. glossy black plastic pouch, coffee cup"
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
            singleSelect={true}
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
          <CameraViewPicker
             value={prompt.scene.composition.find(item => (chipOptions.composition.view as readonly string[]).includes(item)) || "front view"}
             onConfirm={(newView) => {
               const next = prompt.scene.composition.filter(item => !(chipOptions.composition.view as readonly string[]).includes(item));
               next.push(newView);
               patchNestedSection("scene", "composition", next);
             }}
          />
          <FramingPicker
            value={prompt.scene.framing}
            onChange={(value) => patchNestedSection("scene", "framing", value)}
          />
          <GroupedChipSelector
            label="Additional Composition Details"
            selected={prompt.scene.composition.filter(item => !(chipOptions.composition.view as readonly string[]).includes(item))}
            groups={(() => { const { view, ...rest } = chipOptions.composition; return rest; })()}
            onChange={(val) => {
              const viewItems = prompt.scene.composition.filter(item => (chipOptions.composition.view as readonly string[]).includes(item));
              patchNestedSection("scene", "composition", [...viewItems, ...val]);
            }}
            placeholder="e.g. Center framed, high angle"
          />
        </div>
      ),
    },
    {
      title: "Background",
      content: (
        <div className="space-y-4">
          <div className="flex bg-stone-100 p-1 rounded-lg w-fit">
            <button
              onClick={() => patchNestedSection("background", "type", "solid")}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                prompt.background.type === "solid"
                  ? "bg-white shadow text-stone-900"
                  : "text-stone-500 hover:text-stone-700"
              }`}
            >
              Solid Color
            </button>
            <button
              onClick={() => patchNestedSection("background", "type", "environment")}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                prompt.background.type === "environment"
                  ? "bg-white shadow text-stone-900"
                  : "text-stone-500 hover:text-stone-700"
              }`}
            >
              Environment
            </button>
          </div>

          {prompt.background.type === "solid" ? (
            <ColorWheelPicker
              label="Background Color"
              value={prompt.background.color}
              onChange={(value) => patchNestedSection("background", "color", value)}
            />
          ) : (
            <ChipInputField
              label="Environment / Atmosphere"
              value={prompt.background.environment}
              onChange={(value) => patchNestedSection("background", "environment", value)}
              placeholder="e.g. Minimalist white studio, Natural outdoor lighting"
              suggestions={mergedBackgroundOptions}
            />
          )}

          <ChipInputField
            label="Additional Props / Objects"
            value={prompt.background.props}
            onChange={(value) => patchNestedSection("background", "props", value)}
            placeholder="e.g. Wooden pedestal, Floating geometric shapes"
            suggestions={mergedPropsOptions}
          />
        </div>
      ),
    },
    {
      title: "Lighting & Color",
      content: (
        <div className="space-y-4">
          <GroupedChipSelector
            label="Lighting Setup"
            selected={prompt.style.lighting}
            groups={chipOptions.lighting}
            onChange={(val) => patchNestedSection("style", "lighting", val)}
            placeholder="e.g. Soft studio lighting, Dramatic rim light, Cinematic"
          />
          <GroupedChipSelector
            label="Color Temperature & Tones"
            selected={prompt.style.color_temperature}
            groups={chipOptions.color_temperature}
            onChange={(val) => patchNestedSection("style", "color_temperature", val)}
            placeholder="e.g. Warm golden hues, Teal and orange cinematic grading"
          />
        </div>
      ),
    },
    {
      title: "Constraints",
      content: (
        <div className="space-y-4">
          <GroupedChipSelector
            label={prompt.meta?.target_ai === "conversational" ? "Exclusion Instructions" : "Negative Prompt (--no)"}
            selected={prompt.constraints.negative_prompt}
            groups={chipOptions.negative_prompt}
            onChange={(val) => patchNestedSection("constraints", "negative_prompt", val)}
            placeholder={prompt.meta?.target_ai === "conversational" ? "Select elements to explicitly avoid..." : "Select negative prompts to avoid..."}
          />
          <TextInputField
            label="Custom Rules & Parameters"
            value={prompt.constraints.custom_rules}
            onChange={(value) => patchNestedSection("constraints", "custom_rules", value)}
            placeholder="e.g. Include negative space for text on the right side"
            multiline
          />
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-stone-25 text-stone-900">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 rounded-[28px] border border-stone-200 bg-white px-6 py-5 shadow-panel flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-normal text-stone-500">Visual Prompt Maker</p>
            <div className="mt-2">
              <h1 className="text-2xl font-semibold text-stone-950">Structured prompt builder for image generation</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
                Build consistent JSON prompts, shape the final English prompt automatically, and keep reusable visual language in one place.
              </p>
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
            onTargetAiChange={(ai) => patchNestedSection("meta", "target_ai", ai)}
            onMidjourneyParamChange={(field, value) => patchNestedSection("midjourney", field, value)}
            onCopyJson={() => copyText(JSON.stringify(prompt, null, 2), "JSON copied to clipboard.")}
            onCopyPrompt={() => copyText(prompt.final_prompt, "Final prompt copied to clipboard.")}
            onDownload={() => {
              downloadJson(prompt);
              showToast("JSON downloaded.", "success");
            }}
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
