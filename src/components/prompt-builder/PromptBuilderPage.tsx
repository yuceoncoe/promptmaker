import { useEffect, useMemo, useState } from "react";
import Toast from "../Toast";
import BrandPositioningPresetBar from "./BrandPositioningPresetBar";
import ExportPanel from "./ExportPanel";
import JsonPreview from "./JsonPreview";
import NaturalPromptPreview from "./NaturalPromptPreview";
import NegativePromptPreview from "./NegativePromptPreview";
import PromptForm from "./PromptForm";
import QualityPanel from "./QualityPanel";
import { defaultPromptConfig } from "../../lib/default-prompt";
import {
  applyManualKeywordOverrides,
  createSelectedKeywordGroups,
  getNearestPositioningKeywords,
  getRecommendedStyleMoodPresets,
  getSelectedKeywordsFlat,
  summarizeBrandPositioning,
} from "../../lib/positioning-map";
import { compileNaturalPrompt, compileNegativePrompt } from "../../lib/prompt-compiler";
import { samplePromptConfig, getPromptPresetById } from "../../lib/prompt-presets";
import { analyzePromptQuality } from "../../lib/prompt-quality";
import { promptSchema } from "../../lib/prompt-schema";
import { clearPromptConfig, loadPromptConfig, savePromptConfig } from "../../lib/prompt-storage";
import { clamp, deepClone, uniqueStrings } from "../../lib/prompt-utils";
import {
  applyStyleMoodPreset,
  getFeaturedStyleMoodPresets,
  getStyleMoodPresetById,
  styleMoodPresets,
} from "../../lib/style-mood-presets";
import type { PositioningKeyword } from "../../lib/positioning-keywords";
import type { BrandPositioningConfig, PromptConfig } from "../../types/promptConfig";

type ToastState = {
  message: string;
  type: "success" | "error";
} | null;

const createEmptyManualOverrides = () => ({
  added: [] as string[],
  removed: [] as string[],
});

const deriveManualKeywordOverrides = (brandPositioning: BrandPositioningConfig) => {
  const existing = brandPositioning.manualKeywordOverrides;
  if (existing && (existing.added.length || existing.removed.length)) {
    return {
      added: uniqueStrings(existing.added),
      removed: uniqueStrings(existing.removed),
    };
  }

  const recommendedKeywords = getNearestPositioningKeywords(brandPositioning.selectedPoint, 5);
  const selectedKeywords = getSelectedKeywordsFlat(brandPositioning.selectedKeywords);

  if (!selectedKeywords.length) {
    return createEmptyManualOverrides();
  }

  return {
    added: uniqueStrings(selectedKeywords.filter((keyword) => !(recommendedKeywords as readonly string[]).includes(keyword))),
    removed: uniqueStrings(recommendedKeywords.filter((keyword) => !selectedKeywords.includes(keyword))),
  };
};

const normalizePromptConfig = (sourceConfig: PromptConfig): PromptConfig => {
  const nextConfig = deepClone(sourceConfig);
  const point = {
    x: Number(clamp(nextConfig.brandPositioning.selectedPoint.x, 0, 1).toFixed(2)),
    y: Number(clamp(nextConfig.brandPositioning.selectedPoint.y, 0, 1).toFixed(2)),
  };
  const manualKeywordOverrides = deriveManualKeywordOverrides({
    ...nextConfig.brandPositioning,
    selectedPoint: point,
  });
  const recommendedKeywords = getNearestPositioningKeywords(point, 5);
  const selectedKeywords = applyManualKeywordOverrides(recommendedKeywords, manualKeywordOverrides);
  const recommendedPresets = getRecommendedStyleMoodPresets({
    presets: styleMoodPresets,
    selectedKeywords,
    mapPoint: point,
    limit: 3,
  });
  const recommendedPresetId = recommendedPresets[0]?.id ?? null;
  const selectedPresetCandidate =
    nextConfig.brandPositioning.presetSource === "manual"
      ? nextConfig.brandPositioning.selectedPresetId
      : recommendedPresetId;
  const selectedPreset = selectedPresetCandidate ? getStyleMoodPresetById(selectedPresetCandidate) : undefined;
  const presetSource =
    selectedPreset && nextConfig.brandPositioning.presetSource === "manual"
      ? "manual"
      : recommendedPresetId
        ? "recommended"
        : "none";
  const baseConfig = selectedPreset ? applyStyleMoodPreset(nextConfig, selectedPreset.id) : nextConfig;
  const summary = summarizeBrandPositioning({
    selectedKeywords,
    preset: selectedPreset,
  });

  return {
    ...baseConfig,
    brandPositioning: {
      ...baseConfig.brandPositioning,
      map: {
        xAxis: {
          ...defaultPromptConfig.brandPositioning.map.xAxis,
          value: point.x,
        },
        yAxis: {
          ...defaultPromptConfig.brandPositioning.map.yAxis,
          value: point.y,
        },
      },
      selectedKeywords: createSelectedKeywordGroups(selectedKeywords),
      recommendedPresetIds: recommendedPresets.map((preset) => preset.id),
      recommendedPresetId,
      selectedPresetId: selectedPreset?.id ?? null,
      presetSource,
      selectedQuadrant: selectedPreset?.quadrant,
      selectedPoint: point,
      appliedPresetName: selectedPreset?.name,
      styleKeywords: selectedPreset ? [...selectedPreset.styleKeywords] : [],
      moodKeywords: selectedPreset ? [...selectedPreset.moodKeywords] : [],
      visualKeywords: selectedPreset ? [...selectedPreset.visualKeywords] : [],
      paletteHints: selectedPreset ? [...selectedPreset.paletteHints] : [],
      lightingHints: selectedPreset ? [...selectedPreset.lightingHints] : [],
      compositionHints: selectedPreset ? [...selectedPreset.compositionHints] : [],
      negativeHints: selectedPreset ? [...selectedPreset.negativeHints] : [],
      summary,
      manualKeywordOverrides,
    },
  };
};

export default function PromptBuilderPage() {
  const [config, setConfig] = useState<PromptConfig>(() => normalizePromptConfig(loadPromptConfig()));
  const [selectedPromptPresetId, setSelectedPromptPresetId] = useState<string>();
  const [toast, setToast] = useState<ToastState>(null);

  useEffect(() => {
    savePromptConfig(config);
  }, [config]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const naturalPrompt = useMemo(() => compileNaturalPrompt(config), [config]);
  const negativePrompt = useMemo(() => compileNegativePrompt(config), [config]);
  const qualityResult = useMemo(() => analyzePromptQuality(config), [config]);
  const featuredPresets = useMemo(() => getFeaturedStyleMoodPresets(), []);
  const recommendedKeywords = useMemo(
    () => getNearestPositioningKeywords(config.brandPositioning.selectedPoint, 5),
    [config.brandPositioning.selectedPoint]
  );
  const recommendedPresets = useMemo(
    () =>
      config.brandPositioning.recommendedPresetIds
        .map((presetId) => getStyleMoodPresetById(presetId))
        .filter((preset): preset is NonNullable<typeof preset> => Boolean(preset)),
    [config.brandPositioning.recommendedPresetIds]
  );

  const showToast = (message: string, type: "success" | "error") => setToast({ message, type });

  const updateConfig = (nextConfig: PromptConfig) => {
    const normalized = normalizePromptConfig(nextConfig);
    setConfig({
      ...normalized,
      meta: {
        ...normalized.meta,
        updatedAt: new Date().toISOString(),
      },
    });
  };

  const handleApplyStylePreset = (presetId: string) => {
    updateConfig({
      ...config,
      brandPositioning: {
        ...config.brandPositioning,
        selectedPresetId: presetId,
        presetSource: "manual",
      },
    });
    showToast("브랜드 스타일 / 무드 프리셋이 적용되었습니다.", "success");
  };

  const handleResetToRecommended = () => {
    updateConfig({
      ...config,
      brandPositioning: {
        ...config.brandPositioning,
        selectedPresetId: config.brandPositioning.recommendedPresetId,
        presetSource: "recommended",
      },
    });
    showToast("추천 프리셋으로 되돌렸습니다.", "success");
  };

  const handleSelectPoint = (point: { x: number; y: number }) => {
    updateConfig({
      ...config,
      brandPositioning: {
        ...config.brandPositioning,
        selectedPoint: point,
      },
    });
  };

  const handleToggleKeyword = (keyword: PositioningKeyword) => {
    const recommended = getNearestPositioningKeywords(config.brandPositioning.selectedPoint, 5);
    const selected = getSelectedKeywordsFlat(config.brandPositioning.selectedKeywords);
    const manualOverrides = config.brandPositioning.manualKeywordOverrides ?? createEmptyManualOverrides();
    const isSelected = selected.includes(keyword);
    const isRecommended = recommended.includes(keyword);
    let nextAdded = [...manualOverrides.added];
    let nextRemoved = [...manualOverrides.removed];

    if (isSelected) {
      nextAdded = nextAdded.filter((item) => item !== keyword);
      nextRemoved = isRecommended ? uniqueStrings([...nextRemoved, keyword]) : nextRemoved.filter((item) => item !== keyword);
    } else {
      nextRemoved = nextRemoved.filter((item) => item !== keyword);
      nextAdded = isRecommended ? nextAdded.filter((item) => item !== keyword) : uniqueStrings([...nextAdded, keyword]);
    }

    updateConfig({
      ...config,
      brandPositioning: {
        ...config.brandPositioning,
        manualKeywordOverrides: {
          added: nextAdded,
          removed: nextRemoved,
        },
      },
    });
  };

  const handleSelectPromptPreset = (presetId: string) => {
    if (!presetId) {
      setSelectedPromptPresetId(undefined);
      return;
    }

    const preset = getPromptPresetById(presetId);
    if (!preset) return;
    setSelectedPromptPresetId(presetId);
    updateConfig(deepClone(preset.config));
    showToast("프리셋이 적용되었습니다.", "success");
  };

  const copyText = async (text: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(successMessage, "success");
    } catch {
      showToast("복사에 실패했습니다. 다시 시도해 주세요.", "error");
    }
  };

  const handleReset = () => {
    clearPromptConfig();
    setSelectedPromptPresetId(undefined);
    updateConfig(deepClone(defaultPromptConfig));
    showToast("새 프롬프트가 준비되었습니다.", "success");
  };

  const handleLoadSample = () => {
    setSelectedPromptPresetId("fashion-editorial");
    updateConfig(deepClone(samplePromptConfig));
    showToast("샘플 프롬프트를 불러왔습니다.", "success");
  };

  const handleImport = async (file: File | null) => {
    if (!file) return;

    try {
      const raw = await file.text();
      const parsed = JSON.parse(raw) as unknown;
      const result = promptSchema.safeParse(parsed);
      if (!result.success) {
        showToast("JSON 형식이 맞지 않습니다.", "error");
        return;
      }

      setSelectedPromptPresetId(undefined);
      updateConfig(result.data as PromptConfig);
      showToast("JSON을 불러왔습니다.", "success");
    } catch {
      showToast("파일을 읽지 못했습니다. 다시 시도해 주세요.", "error");
    }
  };

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${config.meta.title || "image-prompt"}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("JSON을 다운로드했습니다.", "success");
  };

  return (
    <div className="min-h-screen bg-stone-25 text-stone-900">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-6 rounded-[28px] border border-stone-200 bg-white px-6 py-5 shadow-panel">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-normal text-stone-500">Image Prompt JSON Builder</p>
              <h1 className="mt-2 text-2xl font-semibold text-stone-950">브랜드 포지셔닝부터 시작하는 구조화 이미지 프롬프트 빌더</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
                포지셔닝 맵, 키워드, 무드 프리셋을 한 흐름으로 연결해 구조화 JSON과 자연어 프롬프트를 함께 다듬을 수 있습니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={handleReset} className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-700 transition hover:border-stone-300 hover:text-stone-900">
                새 프롬프트
              </button>
              <button type="button" onClick={handleLoadSample} className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-700 transition hover:border-stone-300 hover:text-stone-900">
                샘플 불러오기
              </button>
              <button type="button" onClick={() => copyText(JSON.stringify(config, null, 2), "JSON을 복사했습니다.")} className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-700 transition hover:border-stone-300 hover:text-stone-900">
                JSON 복사
              </button>
              <button type="button" onClick={() => copyText(naturalPrompt, "자연어 프롬프트를 복사했습니다.")} className="rounded-xl border border-stone-200 bg-stone-900 px-4 py-2.5 text-sm text-white transition hover:bg-stone-700">
                자연어 프롬프트 복사
              </button>
            </div>
          </div>
        </header>

        <div className="space-y-6">
          <BrandPositioningPresetBar
            value={config.brandPositioning}
            allPresets={styleMoodPresets}
            featuredPresets={featuredPresets}
            recommendedPresets={recommendedPresets}
            recommendedKeywords={recommendedKeywords}
            onApplyPreset={handleApplyStylePreset}
            onResetToRecommended={handleResetToRecommended}
            onSelectPoint={handleSelectPoint}
            onToggleKeyword={handleToggleKeyword}
            onChange={(brandPositioning) => updateConfig({ ...config, brandPositioning })}
          />

          <main className="grid gap-6 lg:grid-cols-[minmax(0,1.08fr)_420px]">
            <PromptForm
              config={config}
              selectedPromptPresetId={selectedPromptPresetId}
              onChange={updateConfig}
              onSelectPromptPreset={handleSelectPromptPreset}
            />

            <aside className="space-y-5 self-start lg:sticky lg:top-6">
              <QualityPanel result={qualityResult} />

              <section className="space-y-3 rounded-[28px] border border-stone-200 bg-white p-5 shadow-panel">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-sm font-semibold text-stone-900">Natural Prompt Preview</h2>
                  <button type="button" onClick={() => copyText(naturalPrompt, "자연어 프롬프트를 복사했습니다.")} className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 transition hover:border-stone-300 hover:text-stone-900">
                    복사
                  </button>
                </div>
                <NaturalPromptPreview prompt={naturalPrompt} />
              </section>

              <section className="space-y-3 rounded-[28px] border border-stone-200 bg-white p-5 shadow-panel">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-sm font-semibold text-stone-900">Negative Prompt Preview</h2>
                  <button type="button" onClick={() => copyText(negativePrompt, "네거티브 프롬프트를 복사했습니다.")} className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 transition hover:border-stone-300 hover:text-stone-900">
                    복사
                  </button>
                </div>
                <NegativePromptPreview prompt={negativePrompt} />
              </section>

              <section className="space-y-3 rounded-[28px] border border-stone-200 bg-white p-5 shadow-panel">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-sm font-semibold text-stone-900">JSON Preview</h2>
                  <div className="flex gap-2">
                    <button type="button" onClick={handleDownload} className="rounded-xl border border-stone-200 bg-stone-900 px-3 py-2 text-sm text-white transition hover:bg-stone-700">
                      다운로드
                    </button>
                    <label className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 transition hover:border-stone-300 hover:text-stone-900">
                      불러오기
                      <input
                        type="file"
                        accept=".json,application/json"
                        className="hidden"
                        onChange={(event) => {
                          handleImport(event.target.files?.[0] ?? null);
                          event.currentTarget.value = "";
                        }}
                      />
                    </label>
                  </div>
                </div>
                <JsonPreview config={config} />
              </section>

              <ExportPanel config={config} onCopy={copyText} />
            </aside>
          </main>
        </div>
      </div>

      {toast ? (
        <div className="pointer-events-none fixed bottom-5 right-5 z-50">
          <Toast message={toast.message} type={toast.type} />
        </div>
      ) : null}
    </div>
  );
}
