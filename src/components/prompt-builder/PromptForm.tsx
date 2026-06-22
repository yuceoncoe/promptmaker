import AccordionSection from "../AccordionSection";
import { chipOptions } from "../../data/chipOptions";
import { deepClone, uniqueStrings } from "../../lib/prompt-utils";
import { promptPresets } from "../../lib/prompt-presets";
import type { PromptConfig, PromptImageReference } from "../../types/promptConfig";
import TagInput from "./TagInput";
import TextInputField from "./fields/TextInputField";
import SelectField from "./fields/SelectField";
import ToggleField from "./fields/ToggleField";

interface PromptFormProps {
  config: PromptConfig;
  selectedPromptPresetId?: string;
  onChange: (config: PromptConfig) => void;
  onSelectPromptPreset: (presetId: string) => void;
}

const flattenedStyling = Object.values(chipOptions.concept.styling).flat();

const subjectTypeOptions = [
  { label: "제품", value: "product" },
  { label: "인물", value: "person" },
  { label: "오브젝트", value: "object" },
  { label: "캐릭터", value: "character" },
  { label: "공간", value: "space" },
  { label: "추상", value: "abstract" },
  { label: "동물", value: "animal" },
  { label: "기타", value: "other" },
] as const;

const mediumOptions = [
  { label: "Photorealistic", value: "photorealistic" },
  { label: "Illustration", value: "illustration" },
  { label: "3D", value: "3d" },
  { label: "Vector", value: "vector" },
  { label: "Watercolor", value: "watercolor" },
  { label: "Pixel Art", value: "pixel-art" },
  { label: "Anime", value: "anime" },
  { label: "Other", value: "other" },
] as const;

const aspectRatioOptions = [
  { label: "1:1", value: "1:1" },
  { label: "4:5", value: "4:5" },
  { label: "3:4", value: "3:4" },
  { label: "16:9", value: "16:9" },
  { label: "9:16", value: "9:16" },
  { label: "Custom", value: "custom" },
] as const;

const formatOptions = [
  { label: "PNG", value: "png" },
  { label: "JPG", value: "jpg" },
  { label: "WEBP", value: "webp" },
] as const;

const qualityOptions = [
  { label: "Draft", value: "draft" },
  { label: "Standard", value: "standard" },
  { label: "High", value: "high" },
] as const;

const modelOptions = [
  { label: "Generic", value: "generic" },
  { label: "OpenAI", value: "openai" },
  { label: "Midjourney", value: "midjourney" },
  { label: "Stable Diffusion", value: "stable-diffusion" },
  { label: "Other", value: "other" },
] as const;

export default function PromptForm({
  config,
  selectedPromptPresetId,
  onChange,
  onSelectPromptPreset,
}: PromptFormProps) {
  const setConfig = (nextConfig: PromptConfig) => onChange(deepClone(nextConfig));

  const patchSection = <
    K extends keyof Pick<
      PromptConfig,
      | "meta"
      | "brief"
      | "subject"
      | "scene"
      | "style"
      | "composition"
      | "lighting"
      | "color"
      | "text"
      | "constraints"
      | "references"
      | "output"
    >,
    F extends keyof PromptConfig[K]
  >(
    section: K,
    field: F,
    value: PromptConfig[K][F]
  ) => {
    setConfig({
      ...config,
      [section]: {
        ...config[section],
        [field]: value,
      },
    });
  };

  const patchModelTarget = (targetModel: PromptConfig["modelAdapter"]["targetModel"]) => {
    const modelAdapterMap = {
      generic: {
        targetModel: "generic",
        promptFormat: "structured-json",
        supportsNegativePrompt: true,
        supportsSeed: false,
        supportsImageReference: false,
      },
      openai: {
        targetModel: "openai",
        promptFormat: "natural-language",
        supportsNegativePrompt: false,
        supportsSeed: false,
        supportsImageReference: false,
      },
      midjourney: {
        targetModel: "midjourney",
        promptFormat: "model-specific",
        supportsNegativePrompt: false,
        supportsSeed: false,
        supportsImageReference: true,
      },
      "stable-diffusion": {
        targetModel: "stable-diffusion",
        promptFormat: "model-specific",
        supportsNegativePrompt: true,
        supportsSeed: true,
        supportsImageReference: true,
      },
      other: {
        targetModel: "other",
        promptFormat: "model-specific",
        supportsNegativePrompt: true,
        supportsSeed: true,
        supportsImageReference: true,
      },
    } as const;

    setConfig({
      ...config,
      modelAdapter: modelAdapterMap[targetModel],
    });
  };

  const updateReference = (index: number, patch: Partial<PromptImageReference>) => {
    patchSection(
      "references",
      "imageRefs",
      config.references.imageRefs.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item))
    );
  };

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-stone-200 bg-white px-5 py-5 shadow-panel">
        <div className="space-y-3">
          <label className="text-sm font-medium text-stone-800">일반 프롬프트 프리셋</label>
          <select
            value={selectedPromptPresetId ?? ""}
            onChange={(event) => onSelectPromptPreset(event.target.value)}
            className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
          >
            <option value="">직접 구성</option>
            {promptPresets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>
          {selectedPromptPresetId ? (
            <p className="text-xs leading-5 text-stone-500">
              {promptPresets.find((preset) => preset.id === selectedPromptPresetId)?.description}
            </p>
          ) : null}
        </div>
      </section>

      <AccordionSection title="기본 정보" defaultOpen>
        <div className="space-y-4">
          <TextInputField label="프롬프트 제목" value={config.meta.title} onChange={(value) => patchSection("meta", "title", value)} />
          <div className="grid gap-4 md:grid-cols-2">
            <TextInputField
              label="목적"
              value={config.brief.purpose}
              onChange={(value) => patchSection("brief", "purpose", value)}
              suggestions={["Instagram campaign", "SNS thumbnail", "product hero", "app onboarding"]}
            />
            <TextInputField
              label="플랫폼"
              value={config.brief.platform}
              onChange={(value) => patchSection("brief", "platform", value)}
              suggestions={["Instagram feed", "YouTube thumbnail", "web hero", "app onboarding"]}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <TextInputField label="타깃 오디언스" value={config.brief.targetAudience} onChange={(value) => patchSection("brief", "targetAudience", value)} />
            <TextInputField label="브랜드 톤" value={config.brief.brandTone} onChange={(value) => patchSection("brief", "brandTone", value)} />
          </div>
          <TextInputField
            label="브랜드 맥락"
            value={config.brief.brandContext ?? ""}
            onChange={(value) => patchSection("brief", "brandContext", value)}
            multiline
          />
        </div>
      </AccordionSection>

      <AccordionSection title="이미지의 핵심 대상" defaultOpen>
        <div className="space-y-4">
          <SelectField label="대상 타입" value={config.subject.type} onChange={(value) => patchSection("subject", "type", value)} options={[...subjectTypeOptions]} />
          <TextInputField
            label="핵심 대상 설명"
            value={config.subject.description}
            onChange={(value) => patchSection("subject", "description", value)}
            placeholder="a premium skincare bottle on a stone pedestal"
          />
          <div className="grid gap-4 md:grid-cols-3">
            <TextInputField label="자세" value={config.subject.pose ?? ""} onChange={(value) => patchSection("subject", "pose", value)} />
            <TextInputField label="표정" value={config.subject.expression ?? ""} onChange={(value) => patchSection("subject", "expression", value)} />
            <TextInputField label="행동" value={config.subject.action ?? ""} onChange={(value) => patchSection("subject", "action", value)} />
          </div>
          <TagInput
            label="세부 요소"
            values={config.subject.details}
            onChange={(value) => patchSection("subject", "details", value)}
            suggestions={uniqueStrings([...chipOptions.object.main_object, ...chipOptions.object.shape])}
          />
        </div>
      </AccordionSection>

      <AccordionSection title="배경과 장면 설정">
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <TextInputField label="장소" value={config.scene.location} onChange={(value) => patchSection("scene", "location", value)} suggestions={["studio set", "modern urban street", "abstract digital studio", "gallery space"]} />
            <TextInputField label="시간대" value={config.scene.time} onChange={(value) => patchSection("scene", "time", value)} suggestions={["day", "blue hour", "night", "sunset", "morning"]} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <TextInputField label="날씨" value={config.scene.weather ?? ""} onChange={(value) => patchSection("scene", "weather", value)} />
            <TextInputField label="세계관" value={config.scene.worldSetting ?? ""} onChange={(value) => patchSection("scene", "worldSetting", value)} />
          </div>
          <TagInput label="배경 디테일" values={config.scene.backgroundDetails} onChange={(value) => patchSection("scene", "backgroundDetails", value)} suggestions={["wet asphalt", "soft neon reflections", "stone pedestal", "blurred city lights", "clean backdrop"]} />
        </div>
      </AccordionSection>

      <AccordionSection title="스타일">
        <div className="space-y-4">
          <SelectField label="매체" value={config.style.medium} onChange={(value) => patchSection("style", "medium", value)} options={[...mediumOptions]} />
          <TextInputField
            label="아트 디렉션"
            value={config.style.artDirection}
            onChange={(value) => patchSection("style", "artDirection", value)}
            caption="특정 작가명을 직접 입력하기보다 색감, 질감, 구도, 분위기 같은 시각적 특징으로 작성하는 것을 권장합니다."
          />
          <TagInput label="스타일 특성" values={config.style.styleTraits} onChange={(value) => patchSection("style", "styleTraits", value)} suggestions={uniqueStrings(flattenedStyling)} />
          <div className="grid gap-4 md:grid-cols-2">
            <TextInputField label="렌더링" value={config.style.rendering ?? ""} onChange={(value) => patchSection("style", "rendering", value)} />
            <TextInputField label="무드" value={config.style.mood} onChange={(value) => patchSection("style", "mood", value)} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <TextInputField label="질감" value={config.style.texture ?? ""} onChange={(value) => patchSection("style", "texture", value)} />
            <TextInputField label="시대감" value={config.style.era ?? ""} onChange={(value) => patchSection("style", "era", value)} />
          </div>
        </div>
      </AccordionSection>

      <AccordionSection title="구도와 카메라">
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <TextInputField label="프레이밍" value={config.composition.framing} onChange={(value) => patchSection("composition", "framing", value)} suggestions={["close-up", "medium shot", "wide shot", "full body"]} />
            <TextInputField label="앵글" value={config.composition.angle} onChange={(value) => patchSection("composition", "angle", value)} suggestions={["eye level", "low angle", "top-down", "slightly low angle"]} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <TextInputField label="렌즈" value={config.composition.lens ?? ""} onChange={(value) => patchSection("composition", "lens", value)} />
            <TextInputField label="심도" value={config.composition.depthOfField ?? ""} onChange={(value) => patchSection("composition", "depthOfField", value)} suggestions={["shallow", "deep"]} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <TextInputField label="피사체 위치" value={config.composition.subjectPosition} onChange={(value) => patchSection("composition", "subjectPosition", value)} suggestions={["center", "left third", "right third", "rule of thirds"]} />
            <TextInputField label="여백" value={config.composition.negativeSpace ?? ""} onChange={(value) => patchSection("composition", "negativeSpace", value)} suggestions={["ample", "moderate", "tight"]} />
          </div>
          <TextInputField label="시점" value={config.composition.perspective ?? ""} onChange={(value) => patchSection("composition", "perspective", value)} suggestions={["front view", "side view", "isometric", "three-quarter view"]} />
        </div>
      </AccordionSection>

      <AccordionSection title="조명">
        <div className="space-y-4">
          <TextInputField label="조명 타입" value={config.lighting.type} onChange={(value) => patchSection("lighting", "type", value)} suggestions={uniqueStrings(Array.from(chipOptions.lighting.primary_light))} />
          <div className="grid gap-4 md:grid-cols-2">
            <TextInputField label="조명 방향" value={config.lighting.direction ?? ""} onChange={(value) => patchSection("lighting", "direction", value)} suggestions={["front light", "side light", "back light", "top light", "rim light"]} />
            <SelectField label="대비" value={config.lighting.contrast ?? "medium"} onChange={(value) => patchSection("lighting", "contrast", value)} options={[{ label: "Low", value: "low" }, { label: "Medium", value: "medium" }, { label: "High", value: "high" }]} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <TextInputField label="그림자" value={config.lighting.shadow ?? ""} onChange={(value) => patchSection("lighting", "shadow", value)} />
            <TextInputField label="하이라이트" value={config.lighting.highlight ?? ""} onChange={(value) => patchSection("lighting", "highlight", value)} />
          </div>
          <TextInputField label="조명 무드" value={config.lighting.mood ?? ""} onChange={(value) => patchSection("lighting", "mood", value)} />
        </div>
      </AccordionSection>

      <AccordionSection title="컬러 시스템">
        <div className="space-y-4">
          <TagInput label="팔레트" values={config.color.palette} onChange={(value) => patchSection("color", "palette", value)} suggestions={uniqueStrings([...chipOptions.color_palette.primary, ...chipOptions.color_palette.accent])} />
          <div className="grid gap-4 md:grid-cols-2">
            <TextInputField label="대표 컬러" value={config.color.dominantColor} onChange={(value) => patchSection("color", "dominantColor", value)} />
            <TextInputField label="포인트 컬러" value={config.color.accentColor ?? ""} onChange={(value) => patchSection("color", "accentColor", value)} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <SelectField label="색온도" value={config.color.temperature ?? "neutral"} onChange={(value) => patchSection("color", "temperature", value)} options={[{ label: "Warm", value: "warm" }, { label: "Cool", value: "cool" }, { label: "Neutral", value: "neutral" }]} />
            <TagInput label="브랜드 컬러" values={config.color.brandColors ?? []} onChange={(value) => patchSection("color", "brandColors", value)} suggestions={["#111111", "#F8F8F8", "#C0C0C0", "#0F62FE"]} />
          </div>
          <TagInput label="피해야 할 컬러" values={config.color.avoidColors ?? []} onChange={(value) => patchSection("color", "avoidColors", value)} suggestions={["harsh neon green", "oversaturated red", "muddy brown"]} />
        </div>
      </AccordionSection>

      <AccordionSection title="텍스트 포함 여부">
        <div className="space-y-4">
          <ToggleField label="이미지 안에 텍스트 포함" checked={config.text.includeText} onChange={(checked) => patchSection("text", "includeText", checked)} description="직접 생성할 텍스트인지, 후편집으로 얹을 텍스트인지 분리해서 제어합니다." />
          <div className="grid gap-4 md:grid-cols-2">
            <TextInputField label="텍스트 내용" value={config.text.content} onChange={(value) => patchSection("text", "content", value)} />
            <SelectField label="언어" value={config.text.language ?? "none"} onChange={(value) => patchSection("text", "language", value)} options={[{ label: "None", value: "none" }, { label: "Korean", value: "ko" }, { label: "English", value: "en" }, { label: "Multi", value: "multi" }]} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <TextInputField label="배치" value={config.text.placement ?? ""} onChange={(value) => patchSection("text", "placement", value)} />
            <TextInputField label="타이포그래피" value={config.text.typography ?? ""} onChange={(value) => patchSection("text", "typography", value)} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <SelectField label="가독성 우선순위" value={config.text.legibilityPriority ?? "medium"} onChange={(value) => patchSection("text", "legibilityPriority", value)} options={[{ label: "Low", value: "low" }, { label: "Medium", value: "medium" }, { label: "High", value: "high" }]} />
            <SelectField label="텍스트 처리 방식" value={config.text.textOverlayMode ?? "post-edit"} onChange={(value) => patchSection("text", "textOverlayMode", value)} options={[{ label: "Generate In Image", value: "generate-in-image" }, { label: "Post Edit", value: "post-edit" }]} />
          </div>
        </div>
      </AccordionSection>

      <AccordionSection title="금지 요소 / 네거티브 프롬프트">
        <div className="space-y-4">
          <TagInput label="반드시 포함할 요소" values={config.constraints.mustInclude} onChange={(value) => patchSection("constraints", "mustInclude", value)} />
          <TagInput label="피해야 할 요소" values={config.constraints.avoid} onChange={(value) => patchSection("constraints", "avoid", value)} suggestions={["blurry", "low resolution", "watermark", "random text", "distorted hands", "extra fingers"]} />
          <div className="grid gap-4 md:grid-cols-2">
            <TagInput label="피해야 할 스타일" values={config.constraints.avoidStyle ?? []} onChange={(value) => patchSection("constraints", "avoidStyle", value)} />
            <TagInput label="피해야 할 구도" values={config.constraints.avoidComposition ?? []} onChange={(value) => patchSection("constraints", "avoidComposition", value)} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <TagInput label="브랜드 제한" values={config.constraints.brandRestrictions ?? []} onChange={(value) => patchSection("constraints", "brandRestrictions", value)} suggestions={["avoid competitor logo", "avoid direct logo close-up"]} />
            <TagInput label="안전 제한" values={config.constraints.safetyRestrictions ?? []} onChange={(value) => patchSection("constraints", "safetyRestrictions", value)} suggestions={["avoid explicit imagery", "avoid violent imagery"]} />
          </div>
        </div>
      </AccordionSection>

      <AccordionSection title="출력 설정">
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <SelectField label="비율" value={config.output.aspectRatio} onChange={(value) => patchSection("output", "aspectRatio", value)} options={[...aspectRatioOptions]} />
            <TextInputField label="크기" value={config.output.size} onChange={(value) => patchSection("output", "size", value)} placeholder="1024x1024" />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <TextInputField label="개수" value={String(config.output.count)} onChange={(value) => patchSection("output", "count", Math.min(4, Math.max(1, Number(value) || 1)))} />
            <SelectField label="포맷" value={config.output.format} onChange={(value) => patchSection("output", "format", value)} options={[...formatOptions]} />
            <SelectField label="품질" value={config.output.quality} onChange={(value) => patchSection("output", "quality", value)} options={[...qualityOptions]} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <ToggleField label="투명 배경" checked={config.output.transparentBackground} onChange={(checked) => patchSection("output", "transparentBackground", checked)} />
            <SelectField label="타깃 모델" value={config.modelAdapter.targetModel} onChange={patchModelTarget} options={[...modelOptions]} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <TextInputField label="Seed" value={config.output.seed?.toString() ?? ""} onChange={(value) => patchSection("output", "seed", value.trim() ? Number(value) : undefined)} />
            <TextInputField label="Variation Strength" value={config.output.variationStrength?.toString() ?? ""} onChange={(value) => patchSection("output", "variationStrength", value.trim() ? Number(value) : undefined)} />
          </div>
        </div>
      </AccordionSection>

      <AccordionSection title="참조 이미지 / 레퍼런스">
        <div className="space-y-4">
          {config.references.imageRefs.length ? (
            config.references.imageRefs.map((reference, index) => (
              <div key={`${reference.type}-${index}`} className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                <div className="grid gap-4 md:grid-cols-[160px_minmax(0,1fr)_120px_auto]">
                  <select
                    value={reference.type}
                    onChange={(event) => updateReference(index, { type: event.target.value as PromptImageReference["type"] })}
                    className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
                  >
                    {["style", "pose", "character", "product", "color", "composition", "other"].map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <input
                    value={reference.url}
                    onChange={(event) => updateReference(index, { url: event.target.value })}
                    placeholder="reference-style-01.png"
                    className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
                  />
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    value={reference.influence}
                    onChange={(event) => updateReference(index, { influence: Number(event.target.value) })}
                    className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
                  />
                  <button type="button" onClick={() => patchSection("references", "imageRefs", config.references.imageRefs.filter((_, itemIndex) => itemIndex !== index))} className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 transition hover:bg-rose-100">
                    삭제
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-stone-200 bg-white px-4 py-5 text-sm text-stone-500">
              아직 추가된 레퍼런스가 없습니다.
            </div>
          )}
          <button
            type="button"
            onClick={() => patchSection("references", "imageRefs", [...config.references.imageRefs, { type: "style", url: "", influence: 0.5 }])}
            className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-700 transition hover:border-stone-300 hover:text-stone-900"
          >
            레퍼런스 추가
          </button>
          <TextInputField label="레퍼런스 메모" value={config.references.referenceNotes ?? ""} onChange={(value) => patchSection("references", "referenceNotes", value)} multiline />
          <TagInput label="유지 요소" values={config.references.lockedElements ?? []} onChange={(value) => patchSection("references", "lockedElements", value)} suggestions={["outfit silhouette", "short bob hairstyle", "product shape"]} />
        </div>
      </AccordionSection>
    </div>
  );
}
