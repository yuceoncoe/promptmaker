export interface InsideObject {
  name: string;
  description: string;
  material: string;
}

export interface VisualPrompt {
  prompt_type: string;
  concept: {
    title: string;
    description: string;
    mood: string[];
    styling: string[];
  };
  object: {
    main_object: string;
    shape: string;
    material: string[];
    details: string[];
    surface: string[];
    inside_objects: InsideObject[];
  };
  composition: {
    view: string;
    angle: string;
    placement: string;
    framing: string;
    layout: string[];
    balance: string;
    depth: string;
  };
  lighting: {
    main_light: string;
    highlight: string;
    glow: string;
    shadow: string;
    mood: string;
    rendering_style: string;
  };
  background: {
    color: string;
    style: string;
    surface: string;
    purpose: string;
  };
  color_palette: {
    primary: string[];
    accent: string[];
    contrast: string;
  };
  text_elements: {
    top_left_text: string;
    price_label: string;
    bottom_labels: string[];
    text_direction: string;
    note: string;
  };
  style_keywords: string[];
  negative_prompt: string[];
  final_prompt: string;
}

export const EMPTY_PROMPT: VisualPrompt = {
  prompt_type: "structured_visual_prompt",
  concept: {
    title: "",
    description: "",
    mood: [],
    styling: [],
  },
  object: {
    main_object: "",
    shape: "",
    material: [],
    details: [],
    surface: [],
    inside_objects: [],
  },
  composition: {
    view: "",
    angle: "",
    placement: "",
    framing: "",
    layout: [],
    balance: "",
    depth: "",
  },
  lighting: {
    main_light: "",
    highlight: "",
    glow: "",
    shadow: "",
    mood: "",
    rendering_style: "",
  },
  background: {
    color: "",
    style: "",
    surface: "",
    purpose: "",
  },
  color_palette: {
    primary: [],
    accent: [],
    contrast: "",
  },
  text_elements: {
    top_left_text: "",
    price_label: "",
    bottom_labels: [],
    text_direction: "",
    note: "",
  },
  style_keywords: [],
  negative_prompt: [],
  final_prompt: "",
};
