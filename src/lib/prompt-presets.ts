import { defaultPromptConfig } from "./default-prompt";
import { deepClone } from "./prompt-utils";
import { applyStyleMoodPreset } from "./style-mood-presets";
import type { PromptConfig, PromptPreset } from "../types/promptConfig";

type PromptConfigOverrides = {
  [K in keyof PromptConfig]?: Partial<PromptConfig[K]>;
};

const createPresetConfig = (
  presetId: PromptPreset["id"],
  styleMoodPresetId: string,
  overrides: PromptConfigOverrides
) => {
  const base = applyStyleMoodPreset(deepClone(defaultPromptConfig), styleMoodPresetId);

  return {
    id: presetId,
    config: {
      ...base,
      ...overrides,
      meta: { ...base.meta, ...(overrides.meta ?? {}) },
      brandPositioning: { ...base.brandPositioning, ...(overrides.brandPositioning ?? {}) },
      brief: { ...base.brief, ...(overrides.brief ?? {}) },
      subject: { ...base.subject, ...(overrides.subject ?? {}) },
      scene: { ...base.scene, ...(overrides.scene ?? {}) },
      style: { ...base.style, ...(overrides.style ?? {}) },
      composition: { ...base.composition, ...(overrides.composition ?? {}) },
      lighting: { ...base.lighting, ...(overrides.lighting ?? {}) },
      color: { ...base.color, ...(overrides.color ?? {}) },
      text: { ...base.text, ...(overrides.text ?? {}) },
      constraints: { ...base.constraints, ...(overrides.constraints ?? {}) },
      references: { ...base.references, ...(overrides.references ?? {}) },
      output: { ...base.output, ...(overrides.output ?? {}) },
      modelAdapter: { ...base.modelAdapter, ...(overrides.modelAdapter ?? {}) },
    },
  };
};

const fashionEditorial = createPresetConfig("fashion-editorial", "balanced-premium", {
  meta: { title: "Urban Luxury Fashion Editorial" },
  brief: {
    purpose: "Instagram fashion campaign",
    targetAudience: "women in their 20s and 30s",
    platform: "Instagram feed",
    brandTone: "minimal, premium, confident",
  },
  subject: {
    type: "person",
    description: "a young woman wearing a black oversized jacket",
    pose: "standing confidently",
    expression: "calm and sophisticated",
    action: "looking toward the camera",
    details: ["short bob hair", "silver earrings", "natural makeup"],
  },
  scene: {
    location: "modern urban street",
    time: "blue hour",
    weather: "light rain",
    worldSetting: "realistic contemporary city",
    backgroundDetails: ["wet asphalt", "soft neon reflections", "blurred city lights"],
  },
  style: {
    medium: "photorealistic",
    artDirection: "minimal luxury fashion editorial",
    styleTraits: ["premium", "cinematic", "clean composition", "realistic fabric texture"],
    rendering: "high detail",
    mood: "elegant, calm, premium",
  },
  composition: {
    framing: "medium shot",
    angle: "slightly low angle",
    lens: "50mm",
    depthOfField: "shallow",
    subjectPosition: "center",
    negativeSpace: "moderate",
    perspective: "front view",
  },
  lighting: {
    type: "soft cinematic lighting",
    direction: "side light",
    contrast: "medium",
    shadow: "soft shadow",
    highlight: "subtle rim light",
    mood: "elegant and calm",
  },
  color: {
    palette: ["black", "silver", "deep blue", "soft white"],
    dominantColor: "black",
    accentColor: "silver",
    temperature: "cool",
    brandColors: ["#111111", "#C0C0C0"],
    avoidColors: ["harsh neon green", "oversaturated red"],
  },
  output: {
    aspectRatio: "1:1",
    size: "1024x1024",
    count: 4,
    format: "png",
    quality: "high",
    transparentBackground: false,
    variationStrength: 0.35,
  },
});

export const samplePromptConfig = fashionEditorial.config;

export const promptPresets: PromptPreset[] = [
  {
    ...fashionEditorial,
    name: "패션 화보",
    description: "도시적이고 프리미엄한 패션 에디토리얼 비주얼",
    category: "fashion",
    recommendedStyleMoodPresetId: "balanced-premium",
  },
  {
    ...createPresetConfig("product-studio-cut", "modern-minimal", {
      meta: { title: "Premium Product Studio Cut" },
      brief: {
        purpose: "e-commerce hero image",
        targetAudience: "design-conscious online shoppers",
        platform: "product detail page",
        brandTone: "clean, smart, premium",
      },
      subject: {
        type: "product",
        description: "a premium skincare bottle with a weighted cap",
        details: ["frosted glass body", "subtle embossed logo area", "clean pump silhouette"],
      },
      scene: {
        location: "minimal studio set",
        time: "day",
        backgroundDetails: ["clean stone pedestal", "soft tonal backdrop"],
      },
      style: {
        medium: "photorealistic",
        artDirection: "modern minimal product photography",
        styleTraits: ["crisp edges", "soft reflections", "quiet premium"],
        rendering: "high detail",
        mood: "clear, calm, polished",
      },
      color: {
        palette: ["white", "cool gray", "soft blue"],
        dominantColor: "white",
        temperature: "neutral",
        brandColors: ["#F8F8F8", "#BFC8D6"],
        avoidColors: ["neon pink"],
      },
      text: {
        includeText: false,
        content: "",
        language: "none",
        placement: "",
        typography: "",
        legibilityPriority: "medium",
        textOverlayMode: "post-edit",
      },
    }),
    name: "제품 스튜디오 컷",
    description: "제품 중심의 미니멀 스튜디오 이미지를 빠르게 구성합니다.",
    category: "product",
    recommendedStyleMoodPresetId: "modern-minimal",
  },
  {
    ...createPresetConfig("app-hero-image", "modern-minimal", {
      meta: { title: "App Hero Image" },
      brief: {
        purpose: "app onboarding hero visual",
        targetAudience: "mobile-first tech users",
        platform: "mobile app onboarding",
        brandTone: "clear, efficient, modern",
      },
      subject: {
        type: "object",
        description: "a sleek mobile device floating above a soft gradient surface",
        details: ["glowing UI card", "precise geometry", "subtle reflections"],
      },
      scene: {
        location: "abstract digital studio",
        time: "day",
        worldSetting: "near-future product interface world",
        backgroundDetails: ["soft blue gradient", "clean negative space", "depth layers"],
      },
      composition: {
        framing: "wide shot",
        angle: "slightly top-down angle",
        subjectPosition: "left third",
        negativeSpace: "large",
        perspective: "isometric view",
      },
      text: {
        includeText: true,
        content: "Move with clarity",
        language: "en",
        placement: "right side",
        typography: "modern sans-serif",
        legibilityPriority: "high",
        textOverlayMode: "post-edit",
      },
    }),
    name: "앱 히어로 이미지",
    description: "앱 온보딩이나 프로덕트 페이지에 맞는 테크 감성 히어로 비주얼",
    category: "ui",
    recommendedStyleMoodPresetId: "modern-minimal",
  },
  {
    ...createPresetConfig("character-concept-art", "future-bold", {
      meta: { title: "Character Concept Art" },
      brief: {
        purpose: "character concept pitch",
        targetAudience: "creative team and stakeholders",
        platform: "concept deck",
        brandTone: "bold, imaginative, energetic",
      },
      subject: {
        type: "character",
        description: "a futuristic courier character in modular utility wear",
        pose: "leaning forward in motion",
        expression: "focused and resilient",
        action: "stepping into bright city light",
        details: ["translucent visor", "magnetic sling bag", "layered fabric armor"],
      },
      scene: {
        location: "elevated transit platform",
        time: "night",
        weather: "mist",
        worldSetting: "near-future city",
        backgroundDetails: ["neon rails", "dense atmosphere", "light trails"],
      },
      style: {
        medium: "illustration",
        artDirection: "futuristic concept art with campaign energy",
        styleTraits: ["dynamic silhouettes", "bold color contrast", "graphic lighting"],
        rendering: "painterly high detail",
        mood: "energetic, disruptive, cinematic",
      },
      output: {
        aspectRatio: "3:4",
        size: "1024x1365",
        count: 2,
        format: "png",
        quality: "high",
        transparentBackground: false,
        variationStrength: 0.45,
      },
    }),
    name: "캐릭터 콘셉트 아트",
    description: "강한 존재감의 캐릭터 콘셉트 이미지를 구성합니다.",
    category: "character",
    recommendedStyleMoodPresetId: "future-bold",
  },
  {
    ...createPresetConfig("brand-campaign-visual", "future-bold", {
      meta: { title: "Brand Campaign Visual" },
      brief: {
        purpose: "brand campaign key visual",
        targetAudience: "broad premium audience",
        platform: "OOH and digital campaign",
        brandTone: "confident, premium, high-impact",
      },
      subject: {
        type: "product",
        description: "a premium wearable device presented as a hero object",
        details: ["glossy metal finish", "architectural silhouette", "floating accessory elements"],
      },
      scene: {
        location: "campaign set",
        time: "night",
        worldSetting: "stylized commercial world",
        backgroundDetails: ["graphic light beams", "controlled smoke", "glossy floor reflections"],
      },
      text: {
        includeText: true,
        content: "OWN THE MOMENT",
        language: "en",
        placement: "top left",
        typography: "bold modern sans-serif",
        legibilityPriority: "high",
        textOverlayMode: "generate-in-image",
      },
      output: {
        aspectRatio: "16:9",
        size: "1600x900",
        count: 2,
        format: "png",
        quality: "high",
        transparentBackground: false,
        variationStrength: 0.4,
      },
    }),
    name: "브랜드 캠페인 비주얼",
    description: "브랜드 캠페인용 고임팩트 키 비주얼을 생성합니다.",
    category: "brand",
    recommendedStyleMoodPresetId: "future-bold",
  },
  {
    ...createPresetConfig("sns-thumbnail", "balanced-premium", {
      meta: { title: "SNS Thumbnail" },
      brief: {
        purpose: "social thumbnail",
        targetAudience: "fast-scrolling social audience",
        platform: "Instagram story",
        brandTone: "approachable, catchy, polished",
      },
      subject: {
        type: "product",
        description: "a featured product arranged with graphic props",
        details: ["high color contrast", "bold focal point", "quick-read layout"],
      },
      scene: {
        location: "studio tabletop",
        time: "day",
        backgroundDetails: ["clean color block backdrop", "soft shadow", "space for headline"],
      },
      composition: {
        framing: "close-up",
        angle: "front angle",
        subjectPosition: "center",
        negativeSpace: "high",
        perspective: "front view",
      },
      text: {
        includeText: true,
        content: "NEW DROP",
        language: "en",
        placement: "top left",
        typography: "bold sans-serif",
        legibilityPriority: "high",
        textOverlayMode: "generate-in-image",
      },
      output: {
        aspectRatio: "9:16",
        size: "1080x1920",
        count: 3,
        format: "png",
        quality: "standard",
        transparentBackground: false,
        variationStrength: 0.3,
      },
    }),
    name: "SNS 썸네일",
    description: "짧은 주목 시간에 맞춘 썸네일형 비주얼 프리셋",
    category: "social",
    recommendedStyleMoodPresetId: "balanced-premium",
  },
];

export const getPromptPresetById = (id: string) => promptPresets.find((preset) => preset.id === id);
