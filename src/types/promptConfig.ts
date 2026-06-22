export type PromptConfig = {
  meta: PromptMeta;
  brandPositioning: BrandPositioningConfig;
  brief: PromptBrief;
  subject: PromptSubject;
  scene: PromptScene;
  style: PromptStyle;
  composition: PromptComposition;
  lighting: PromptLighting;
  color: PromptColor;
  text: PromptText;
  constraints: PromptConstraints;
  references: PromptReferences;
  output: PromptOutput;
  modelAdapter: PromptModelAdapter;
};

export type PromptMeta = {
  title: string;
  version: string;
  language: "ko" | "en";
  createdBy?: string;
  updatedAt?: string;
};

export type BrandPositioningQuadrant =
  | "refined-classic"
  | "modern-minimal"
  | "expressive-heritage"
  | "future-bold"
  | "balanced-premium";

export type BrandPositioningConfig = {
  map: {
    xAxis: {
      leftLabel: string;
      rightLabel: string;
      value: number;
    };
    yAxis: {
      bottomLabel: string;
      topLabel: string;
      value: number;
    };
  };
  selectedKeywords: {
    marketPosition: string[];
    brandFunction: string[];
    visualExpression: string[];
    culturalEdge: string[];
  };
  recommendedPresetIds: string[];
  recommendedPresetId: string | null;
  selectedPresetId: string | null;
  presetSource: "recommended" | "manual" | "none";
  selectedQuadrant?: BrandPositioningQuadrant;
  selectedPoint: {
    x: number;
    y: number;
  };
  appliedPresetName?: string;
  styleKeywords: string[];
  moodKeywords: string[];
  visualKeywords: string[];
  paletteHints: string[];
  lightingHints: string[];
  compositionHints: string[];
  negativeHints: string[];
  customNotes?: string;
  lockPresetToBrand: boolean;
  summary: {
    positioningSentence: string;
    moodSentence: string;
  };
  manualKeywordOverrides?: {
    added: string[];
    removed: string[];
  };
};

export type PromptBrief = {
  purpose: string;
  targetAudience: string;
  platform: string;
  brandTone: string;
  brandContext?: string;
};

export type PromptSubject = {
  type: "person" | "animal" | "product" | "space" | "character" | "object" | "abstract" | "other";
  description: string;
  pose?: string;
  expression?: string;
  action?: string;
  details: string[];
};

export type PromptScene = {
  location: string;
  time: string;
  weather?: string;
  worldSetting?: string;
  backgroundDetails: string[];
};

export type PromptStyle = {
  medium: "photorealistic" | "illustration" | "3d" | "vector" | "watercolor" | "pixel-art" | "anime" | "other";
  artDirection: string;
  styleTraits: string[];
  rendering?: string;
  mood: string;
  texture?: string;
  era?: string;
};

export type PromptComposition = {
  framing: string;
  angle: string;
  lens?: string;
  depthOfField?: string;
  subjectPosition: string;
  negativeSpace?: string;
  perspective?: string;
};

export type PromptLighting = {
  type: string;
  direction?: string;
  contrast?: "low" | "medium" | "high";
  shadow?: string;
  highlight?: string;
  mood?: string;
};

export type PromptColor = {
  palette: string[];
  dominantColor: string;
  accentColor?: string;
  temperature?: "warm" | "cool" | "neutral";
  brandColors?: string[];
  avoidColors?: string[];
};

export type PromptText = {
  includeText: boolean;
  content: string;
  language?: "ko" | "en" | "multi" | "none";
  placement?: string;
  typography?: string;
  legibilityPriority?: "low" | "medium" | "high";
  textOverlayMode?: "generate-in-image" | "post-edit";
};

export type PromptConstraints = {
  mustInclude: string[];
  avoid: string[];
  avoidStyle?: string[];
  avoidComposition?: string[];
  brandRestrictions?: string[];
  safetyRestrictions?: string[];
};

export type PromptReferences = {
  imageRefs: PromptImageReference[];
  referenceNotes?: string;
  lockedElements?: string[];
};

export type PromptImageReference = {
  type: "style" | "pose" | "character" | "product" | "color" | "composition" | "other";
  url: string;
  influence: number;
};

export type PromptOutput = {
  aspectRatio: "1:1" | "4:5" | "3:4" | "16:9" | "9:16" | "custom";
  size: string;
  count: number;
  format: "png" | "jpg" | "webp";
  quality: "draft" | "standard" | "high";
  transparentBackground: boolean;
  seed?: number;
  variationStrength?: number;
};

export type PromptModelAdapter = {
  targetModel: "generic" | "openai" | "midjourney" | "stable-diffusion" | "other";
  promptFormat: "structured-json" | "natural-language" | "model-specific";
  supportsNegativePrompt: boolean;
  supportsSeed: boolean;
  supportsImageReference: boolean;
};

export type PromptPreset = {
  id: string;
  name: string;
  description: string;
  category: "fashion" | "product" | "brand" | "character" | "ui" | "social";
  recommendedStyleMoodPresetId?: string;
  config: PromptConfig;
};

export type StyleMoodPreset = {
  id: string;
  name: string;
  description: string;
  positioningKeywords: string[];
  mood: string;
  centroid: {
    x: number;
    y: number;
  };
  featured?: boolean;
  group:
    | "accessibleAndUtility"
    | "modernAndPremium"
    | "luxuryAndCraft"
    | "boldAndExperimental";
  promptPatch: {
    brief?: Partial<PromptBrief>;
    style?: Partial<PromptStyle>;
    lighting?: Partial<PromptLighting>;
    color?: Partial<PromptColor>;
    composition?: Partial<PromptComposition>;
    constraints?: Partial<PromptConstraints>;
  };
  quadrant: BrandPositioningQuadrant;
  position: {
    x: number;
    y: number;
  };
  styleKeywords: string[];
  moodKeywords: string[];
  visualKeywords: string[];
  paletteHints: string[];
  lightingHints: string[];
  compositionHints: string[];
  negativeHints: string[];
};
