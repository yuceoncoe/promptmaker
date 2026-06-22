import BrandPositioningMap from "./BrandPositioningMap";
import StyleMoodPresetCard from "./StyleMoodPresetCard";
import TextInputField from "./fields/TextInputField";
import ToggleField from "./fields/ToggleField";
import { POSITIONING_KEYWORD_GROUPS, type PositioningKeyword, type PositioningKeywordGroup } from "../../lib/positioning-keywords";
import { getSelectedKeywordsFlat } from "../../lib/positioning-map";
import type { BrandPositioningConfig, StyleMoodPreset } from "../../types/promptConfig";

interface BrandPositioningPresetBarProps {
  value: BrandPositioningConfig;
  allPresets: StyleMoodPreset[];
  featuredPresets: StyleMoodPreset[];
  recommendedPresets: StyleMoodPreset[];
  recommendedKeywords: string[];
  onApplyPreset: (presetId: string) => void;
  onResetToRecommended: () => void;
  onSelectPoint: (point: { x: number; y: number }) => void;
  onToggleKeyword: (keyword: PositioningKeyword) => void;
  onChange: (nextValue: BrandPositioningConfig) => void;
}

const GROUP_LABELS: Record<PositioningKeywordGroup, string> = {
  marketPosition: "시장 포지션",
  brandFunction: "브랜드 기능",
  visualExpression: "시각 표현",
  culturalEdge: "문화적 결",
};

const PRESET_SOURCE_LABEL: Record<BrandPositioningConfig["presetSource"], string> = {
  none: "미선택",
  recommended: "추천 적용",
  manual: "수동 선택",
};

export default function BrandPositioningPresetBar({
  value,
  allPresets,
  featuredPresets,
  recommendedPresets,
  recommendedKeywords,
  onApplyPreset,
  onResetToRecommended,
  onSelectPoint,
  onToggleKeyword,
  onChange,
}: BrandPositioningPresetBarProps) {
  const selectedKeywords = getSelectedKeywordsFlat(value.selectedKeywords);

  return (
    <section className="rounded-[28px] border border-stone-200 bg-white p-5 shadow-panel">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)]">
        <BrandPositioningMap
          value={value}
          presets={allPresets}
          onSelectPoint={onSelectPoint}
          onApplyPreset={onApplyPreset}
        />

        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-stone-900">무드 & 스타일 연결</h2>
              <p className="mt-1 text-sm text-stone-500">
                포지셔닝 맵에서 브랜드 결을 잡고, 추천 프리셋으로 스타일과 무드를 빠르게 맞춥니다.
              </p>
            </div>
            <div className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs text-stone-600">
              {PRESET_SOURCE_LABEL[value.presetSource]}
            </div>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-stone-900">
                  {value.appliedPresetName ?? "프리셋 미선택"}
                </div>
                <p className="mt-1 text-xs leading-5 text-stone-500">
                  {value.summary.positioningSentence || "맵에서 방향을 잡으면 포지셔닝 요약이 여기에 정리됩니다."}
                </p>
                {value.summary.moodSentence ? (
                  <p className="mt-1 text-xs leading-5 text-stone-500">{value.summary.moodSentence}</p>
                ) : null}
              </div>
              {value.presetSource === "manual" && value.recommendedPresetId ? (
                <button
                  type="button"
                  onClick={onResetToRecommended}
                  className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 transition hover:border-stone-300 hover:text-stone-900"
                >
                  추천으로 되돌리기
                </button>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-medium text-stone-900">추천 프리셋</h3>
              <div className="text-xs text-stone-500">맵 좌표와 키워드 조합 기반</div>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {recommendedPresets.map((preset) => (
                <StyleMoodPresetCard
                  key={preset.id}
                  preset={preset}
                  selected={value.selectedPresetId === preset.id}
                  recommended
                  onClick={() => onApplyPreset(preset.id)}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-stone-900">포지셔닝 키워드</h3>
            <p className="text-xs text-stone-500">프리셋과 맵 좌표를 바탕으로 잡힌 키워드를 아래에서 미세 조정합니다.</p>
            <div className="grid gap-3 md:grid-cols-2">
              {(Object.entries(POSITIONING_KEYWORD_GROUPS) as Array<[PositioningKeywordGroup, readonly string[]]>).map(
                ([group, keywords]) => (
                  <div key={group} className="rounded-2xl border border-stone-200 p-3">
                    <div className="text-xs font-medium text-stone-500">{GROUP_LABELS[group]}</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {keywords.map((keyword) => {
                        const selected = selectedKeywords.includes(keyword);
                        const recommended = recommendedKeywords.includes(keyword);

                        return (
                          <button
                            key={keyword}
                            type="button"
                            onClick={() => onToggleKeyword(keyword as PositioningKeyword)}
                            className={[
                              "rounded-full border px-3 py-1.5 text-xs transition",
                              selected
                                ? "border-black bg-black text-white"
                                : recommended
                                  ? "border-stone-300 bg-stone-100 text-stone-800"
                                  : "border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:text-stone-900",
                            ].join(" ")}
                          >
                            {keyword}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-stone-900">대표 프리셋</h3>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {featuredPresets.map((preset) => (
                <StyleMoodPresetCard
                  key={preset.id}
                  preset={preset}
                  selected={value.selectedPresetId === preset.id}
                  onClick={() => onApplyPreset(preset.id)}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium text-stone-900">전체 프리셋</h3>
            <div className="grid gap-3 xl:grid-cols-2">
              {allPresets.map((preset) => (
                <StyleMoodPresetCard
                  key={preset.id}
                  preset={preset}
                  selected={value.selectedPresetId === preset.id}
                  recommended={value.recommendedPresetIds.includes(preset.id)}
                  onClick={() => onApplyPreset(preset.id)}
                />
              ))}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <ToggleField
              label="브랜드 프리셋 고정"
              checked={value.lockPresetToBrand}
              onChange={(checked) => onChange({ ...value, lockPresetToBrand: checked })}
              description="세부 입력이 포지셔닝 프리셋과 크게 어긋나면 품질 검사에서 warning을 표시합니다."
            />
            <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
              <div className="text-sm font-medium text-stone-900">현재 선택된 키워드</div>
              <p className="mt-1 text-xs leading-5 text-stone-500">
                {selectedKeywords.length ? selectedKeywords.join(", ") : "맵을 클릭하면 자동으로 추천 키워드가 채워집니다."}
              </p>
            </div>
          </div>

          <TextInputField
            label="커스텀 브랜드 메모"
            value={value.customNotes ?? ""}
            onChange={(customNotes) => onChange({ ...value, customNotes })}
            multiline
            placeholder="브랜드 가이드나 이번 작업에서 꼭 지켜야 할 톤을 적어 주세요."
          />
        </div>
      </div>
    </section>
  );
}
