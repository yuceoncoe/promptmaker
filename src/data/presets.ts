import { EMPTY_PROMPT, type VisualPrompt } from "../types/prompt";

const withPrompt = (prompt: Omit<VisualPrompt, "final_prompt">): VisualPrompt => ({
  ...prompt,
  final_prompt: "",
});

type StylePresetConfig = {
  mood: string[];
  styling: string[];
  composition: VisualPrompt["composition"];
  lighting: VisualPrompt["lighting"];
  background: VisualPrompt["background"];
  color_palette: VisualPrompt["color_palette"];
  text_elements: VisualPrompt["text_elements"];
  style_keywords: string[];
  negative_prompt: string[];
};

const createStylePreset = (config: StylePresetConfig) =>
  withPrompt({
    ...EMPTY_PROMPT,
    prompt_type: "structured_visual_prompt",
    concept: {
      ...EMPTY_PROMPT.concept,
      mood: config.mood,
      styling: config.styling,
    },
    composition: config.composition,
    lighting: config.lighting,
    background: config.background,
    color_palette: config.color_palette,
    text_elements: config.text_elements,
    style_keywords: config.style_keywords,
    negative_prompt: config.negative_prompt,
  });

export const presets: Record<string, VisualPrompt> = {
  "Start Empty": EMPTY_PROMPT,
  Accessible: createStylePreset({
    mood: ["friendly", "warm", "trustworthy", "dependable", "practical"],
    styling: ["hero product shot", "catalog minimal"],
    composition: {
      view: "front view",
      framing: "generous whitespace",
      layout: ["centered hero composition", "object-focused layout", "symmetrical composition"],
      depth: "shallow depth of field",
    },
    lighting: {
      primary_light: "soft studio lighting",
      reflection: "soft premium highlights",
      secondary_light: "",
      emissive: "",
      shadow: "soft natural shadow",
    },
    background: {
      color: "warm white background",
      style: "minimal studio background",
      surface: "smooth desk surface",
      purpose: "keep the focus on the product",
    },
    color_palette: {
      primary: ["warm white", "soft beige"],
      accent: [],
      contrast: "premium neutral contrast",
    },
    text_elements: {
      top_left_text: "minimal product description",
      price_label: "editable graphic label",
      bottom_labels: [],
      text_direction: "aligned with product perspective",
      note: "keep copy minimal and intentional",
    },
    style_keywords: ["clean composition", "premium product mockup", "commercial product photography", "brand world consistency"],
    negative_prompt: ["messy composition", "low resolution", "watermark", "brand logo", "excessive noise"],
  }),
  Utility: createStylePreset({
    mood: ["practical", "intelligent", "clean", "technical", "dependable"],
    styling: ["utilitarian design", "apple-style keynote render"],
    composition: {
      view: "three-quarter right view",
      framing: "generous whitespace",
      layout: ["centered hero composition", "object-focused layout", "symmetrical composition"],
      depth: "shallow depth of field",
    },
    lighting: {
      primary_light: "soft studio lighting",
      reflection: "clean product reflections",
      secondary_light: "",
      emissive: "subtle LED glow",
      shadow: "soft natural shadow",
    },
    background: {
      color: "light gray background",
      style: "clean commercial set",
      surface: "smooth desk surface",
      purpose: "highlight premium industrial design",
    },
    color_palette: {
      primary: ["matte silver", "charcoal gray"],
      accent: [],
      contrast: "subtle monochrome contrast",
    },
    text_elements: {
      top_left_text: "technical specification line",
      price_label: "",
      bottom_labels: [],
      text_direction: "aligned with product perspective",
      note: "avoid overexplaining the product",
    },
    style_keywords: ["technical product look", "clean composition", "high detail", "catalog-grade lighting"],
    negative_prompt: ["cheap plastic look", "messy composition", "incorrect perspective", "watermark", "brand logo"],
  }),
  Trusted: createStylePreset({
    mood: ["trustworthy", "dependable", "clean", "serious", "intelligent"],
    styling: ["hero product shot", "premium packshot"],
    composition: {
      view: "front view",
      framing: "vertical framing",
      layout: ["centered hero composition", "object-focused layout", "symmetrical composition"],
      depth: "deep product shadow",
    },
    lighting: {
      primary_light: "diffused commercial lighting",
      reflection: "soft premium highlights",
      secondary_light: "",
      emissive: "",
      shadow: "soft natural shadow",
    },
    background: {
      color: "warm white background",
      style: "minimal studio background",
      surface: "smooth desk surface",
      purpose: "make the object stand out",
    },
    color_palette: {
      primary: ["warm white", "charcoal gray"],
      accent: ["soft beige"],
      contrast: "premium neutral contrast",
    },
    text_elements: {
      top_left_text: "minimal product description",
      price_label: "editable graphic label",
      bottom_labels: [],
      text_direction: "printed on the front surface",
      note: "avoid overexplaining the product",
    },
    style_keywords: ["premium product mockup", "clean composition", "commercial product photography", "catalog-grade lighting"],
    negative_prompt: ["messy composition", "washed out colors", "watermark", "brand logo", "excessive noise"],
  }),
  "Mainstream Pop": createStylePreset({
    mood: ["bold", "energetic", "vibrant", "loud", "cheerful"],
    styling: ["high-end e-commerce photography", "fashion campaign object"],
    composition: {
      view: "low-angle front view",
      framing: "vertical framing",
      layout: ["full-frame product emphasis", "graphic poster arrangement", "dynamic composition"],
      depth: "layered depth",
    },
    lighting: {
      primary_light: "strong overhead studio light",
      reflection: "strong glossy highlights",
      secondary_light: "",
      emissive: "neon edge glow",
      shadow: "dramatic shadow",
    },
    background: {
      color: "dark charcoal background",
      style: "clean commercial set",
      surface: "matte studio floor",
      purpose: "create strong color contrast",
    },
    color_palette: {
      primary: ["charcoal gray"],
      accent: ["bright yellow", "deep red", "electric blue"],
      contrast: "strong contrast between black and neon colors",
    },
    text_elements: {
      top_left_text: "bold campaign headline",
      price_label: "fictional price sticker",
      bottom_labels: ["BRANDING", "VISUAL"],
      text_direction: "floating over the package",
      note: "use fictional typography only",
    },
    style_keywords: ["retail campaign energy", "bold typography", "commercial product photography", "brand world consistency"],
    negative_prompt: ["flat illustration", "low resolution", "washed out colors", "watermark", "brand logo"],
  }),
  Campaign: createStylePreset({
    mood: ["bold", "graphic", "energetic", "confident", "upbeat"],
    styling: ["campaign key visual", "hero product shot"],
    composition: {
      view: "three-quarter right view",
      framing: "square framing",
      layout: ["centered hero composition", "asymmetrical composition", "layered object composition", "editorial composition"],
      depth: "layered depth",
    },
    lighting: {
      primary_light: "cinematic high contrast lighting",
      reflection: "strong glossy highlights",
      secondary_light: "",
      emissive: "warm internal glow",
      shadow: "deep product shadow",
    },
    background: {
      color: "pure black background",
      style: "minimal studio background",
      surface: "floating product shot",
      purpose: "create strong color contrast",
    },
    color_palette: {
      primary: ["glossy black", "charcoal gray"],
      accent: ["neon green", "bright yellow"],
      contrast: "strong contrast between black and neon colors",
    },
    text_elements: {
      top_left_text: "bold campaign headline",
      price_label: "neon price label",
      bottom_labels: ["LOGO", "GRAPHICS", "SOCIAL"],
      text_direction: "attached as sticker labels",
      note: "let typography support the layout rhythm",
    },
    style_keywords: ["modern branding package", "high contrast lighting", "contemporary visual identity", "brand world consistency"],
    negative_prompt: ["flat illustration", "cartoon style", "low resolution", "watermark", "excessive noise"],
  }),
  Playful: createStylePreset({
    mood: ["playful", "quirky", "cheerful", "cute", "modern"],
    styling: ["glossy acrylic pop", "y2k aesthetic"],
    composition: {
      view: "slightly top-down right view",
      framing: "square framing",
      layout: ["centered hero composition", "layered object composition", "graphic poster arrangement", "dynamic composition"],
      depth: "layered depth",
    },
    lighting: {
      primary_light: "soft studio lighting",
      reflection: "strong glossy highlights",
      secondary_light: "",
      emissive: "warm internal glow",
      shadow: "minimal shadow",
    },
    background: {
      color: "warm white background",
      style: "soft gradient background",
      surface: "floating product shot",
      purpose: "make the object stand out",
    },
    color_palette: {
      primary: ["warm white"],
      accent: ["soft pink", "bright yellow", "electric blue"],
      contrast: "warm and cool color contrast",
    },
    text_elements: {
      top_left_text: "short brand message",
      price_label: "editable graphic label",
      bottom_labels: ["TYPE", "VISUAL"],
      text_direction: "floating over the package",
      note: "use fictional typography only",
    },
    style_keywords: ["youth culture visual language", "brand world consistency", "clean composition", "contemporary visual identity"],
    negative_prompt: ["washed out colors", "watermark", "brand logo", "excessive noise", "generic stock-photo look"],
  }),
  Prestige: createStylePreset({
    mood: ["premium", "polished", "refined", "sophisticated", "confident"],
    styling: ["premium packshot", "apple-style keynote render"],
    composition: {
      view: "three-quarter right view",
      framing: "generous whitespace",
      layout: ["centered hero composition", "object-focused layout", "symmetrical composition"],
      depth: "shallow depth of field",
    },
    lighting: {
      primary_light: "soft studio lighting",
      reflection: "clean product reflections",
      secondary_light: "",
      emissive: "subtle LED glow",
      shadow: "soft natural shadow",
    },
    background: {
      color: "light gray background",
      style: "clean commercial set",
      surface: "smooth desk surface",
      purpose: "highlight premium industrial design",
    },
    color_palette: {
      primary: ["matte silver", "charcoal gray", "soft beige"],
      accent: [],
      contrast: "premium neutral contrast",
    },
    text_elements: {
      top_left_text: "technical specification line",
      price_label: "",
      bottom_labels: [],
      text_direction: "aligned with product perspective",
      note: "keep copy minimal and intentional",
    },
    style_keywords: ["premium product mockup", "technical product look", "high detail", "commercial product photography"],
    negative_prompt: ["cheap plastic look", "messy composition", "watermark", "brand logo", "human hands"],
  }),
  Minimal: createStylePreset({
    mood: ["minimal", "clean", "calm", "understated", "sleek"],
    styling: ["soft modernism", "catalog minimal"],
    composition: {
      view: "slightly top-down right view",
      framing: "generous whitespace",
      layout: ["object-focused layout", "editorial composition"],
      depth: "shallow depth of field",
    },
    lighting: {
      primary_light: "large softbox from upper left",
      reflection: "soft premium highlights",
      secondary_light: "",
      emissive: "",
      shadow: "soft natural shadow",
    },
    background: {
      color: "warm white background",
      style: "minimal studio background",
      surface: "smooth desk surface",
      purpose: "keep the focus on the product",
    },
    color_palette: {
      primary: ["warm white", "soft beige", "charcoal gray"],
      accent: [],
      contrast: "subtle monochrome contrast",
    },
    text_elements: {
      top_left_text: "minimal product description",
      price_label: "",
      bottom_labels: [],
      text_direction: "aligned with product perspective",
      note: "keep copy minimal and intentional",
    },
    style_keywords: ["clean composition", "premium product mockup", "catalog-grade lighting", "gallery display sensibility"],
    negative_prompt: ["overly cluttered background", "loud colors", "watermark", "brand logo", "excessive noise"],
  }),
  Luxury: createStylePreset({
    mood: ["luxurious", "elegant", "timeless", "tasteful", "sophisticated"],
    styling: ["quiet luxury", "archival quality finish"],
    composition: {
      view: "macro close-up view",
      framing: "tight editorial crop",
      layout: ["centered hero composition", "object-focused layout", "symmetrical composition"],
      depth: "shallow depth of field",
    },
    lighting: {
      primary_light: "soft studio lighting",
      reflection: "long reflective highlights",
      secondary_light: "",
      emissive: "",
      shadow: "soft natural shadow",
    },
    background: {
      color: "warm white background",
      style: "soft gradient background",
      surface: "reflective acrylic surface",
      purpose: "make the object stand out",
    },
    color_palette: {
      primary: ["warm white", "soft beige"],
      accent: ["soft pink"],
      contrast: "subtle monochrome contrast",
    },
    text_elements: {
      top_left_text: "small editorial typography",
      price_label: "",
      bottom_labels: [],
      text_direction: "printed on the front surface",
      note: "keep copy minimal and intentional",
    },
    style_keywords: ["quiet luxury aesthetic", "editorial product photography", "high detail", "premium product mockup"],
    negative_prompt: ["cheap plastic look", "messy composition", "watermark", "brand logo", "human hands"],
  }),
  Atelier: createStylePreset({
    mood: ["artisanal", "refined", "understated", "elegant", "organic"],
    styling: ["gallery display", "art book minimalism"],
    composition: {
      view: "slightly top-down right view",
      framing: "generous whitespace",
      layout: ["centered hero composition", "museum display composition", "editorial composition"],
      depth: "transparent surface depth",
    },
    lighting: {
      primary_light: "large softbox from upper left",
      reflection: "soft premium highlights",
      secondary_light: "",
      emissive: "",
      shadow: "soft natural shadow",
    },
    background: {
      color: "warm white background",
      style: "minimal studio background",
      surface: "reflective acrylic surface",
      purpose: "keep the focus on the product",
    },
    color_palette: {
      primary: ["soft beige", "warm white", "charcoal gray"],
      accent: [],
      contrast: "premium neutral contrast",
    },
    text_elements: {
      top_left_text: "quiet luxury wordmark",
      price_label: "",
      bottom_labels: ["OBJECT"],
      text_direction: "aligned with product perspective",
      note: "keep copy minimal and intentional",
    },
    style_keywords: ["gallery display sensibility", "clean composition", "material-driven close-up", "quiet luxury aesthetic"],
    negative_prompt: ["loud colors", "messy composition", "watermark", "brand logo", "excessive noise"],
  }),
  Editorial: createStylePreset({
    mood: ["artful", "dramatic", "graphic", "aspirational", "iconic"],
    styling: ["editorial still life", "graphic poster aesthetic"],
    composition: {
      view: "low-angle front view",
      framing: "tight editorial crop",
      layout: ["centered hero composition", "graphic poster arrangement", "dynamic composition"],
      depth: "layered depth",
    },
    lighting: {
      primary_light: "cinematic high contrast lighting",
      reflection: "long reflective highlights",
      secondary_light: "",
      emissive: "neon edge glow",
      shadow: "dramatic shadow",
    },
    background: {
      color: "dark charcoal background",
      style: "editorial black backdrop",
      surface: "no visible surface",
      purpose: "make the object stand out",
    },
    color_palette: {
      primary: ["charcoal gray", "dark smoke"],
      accent: ["vivid orange", "electric blue"],
      contrast: "warm and cool color contrast",
    },
    text_elements: {
      top_left_text: "small editorial typography",
      price_label: "",
      bottom_labels: [],
      text_direction: "floating over the package",
      note: "text may be abstract or placeholder",
    },
    style_keywords: ["editorial product photography", "contemporary visual identity", "bold typography", "clean composition"],
    negative_prompt: ["flat illustration", "cartoon style", "dull lighting", "watermark", "washed out colors"],
  }),
  Experimental: createStylePreset({
    mood: ["daring", "dramatic", "futuristic", "quirky", "graphic"],
    styling: ["surreal", "campaign key visual"],
    composition: {
      view: "three-quarter right view",
      framing: "full-bleed framing",
      layout: ["off-center composition", "layered object composition", "graphic poster arrangement", "dynamic composition"],
      depth: "stacked foreground-background depth",
    },
    lighting: {
      primary_light: "cinematic high contrast lighting",
      reflection: "strong glossy highlights",
      secondary_light: "",
      emissive: "neon edge glow",
      shadow: "dramatic shadow",
    },
    background: {
      color: "pure black background",
      style: "editorial black backdrop",
      surface: "floating product shot",
      purpose: "amplify contrast and visual disruption",
    },
    color_palette: {
      primary: ["dark smoke", "charcoal gray"],
      accent: ["electric blue", "vivid orange", "bright yellow"],
      contrast: "strong contrast between black and neon colors",
    },
    text_elements: {
      top_left_text: "bold campaign headline",
      price_label: "",
      bottom_labels: ["VISUAL", "TYPE"],
      text_direction: "floating over the package",
      note: "let typography support the layout rhythm",
    },
    style_keywords: ["contemporary visual identity", "high contrast lighting", "bold typography", "ultra realistic 3D render"],
    negative_prompt: ["generic stock-photo look", "washed out colors", "watermark", "brand logo", "low resolution"],
  }),
};

export const presetNames = Object.keys(presets);

export const presetLabels: Record<string, string> = {
  "Start Empty": "Start Empty",
  Accessible: "Accessible / Friendly Clarity",
  Utility: "Utility / Function First",
  Trusted: "Trusted / Competent Packshot",
  "Mainstream Pop": "Mainstream Pop / Retail Impact",
  Campaign: "Campaign / Broad Appeal",
  Playful: "Playful / Youth Culture",
  Prestige: "Prestige / Premium Launch",
  Minimal: "Minimal / Sculptural Minimalism",
  Luxury: "Luxury / Quiet Prestige",
  Atelier: "Atelier / Craft-Led Display",
  Editorial: "Editorial / Image-Led Still Life",
  Experimental: "Experimental / Concept Visual",
};
