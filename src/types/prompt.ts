export interface InsideObject {
  name: string;
  description: string;
  material: string;
}

export interface VisualPrompt {
  prompt_type: string;
  concept: {
    mood: string[];
    styling: string[];
  };
  object: {
    main_object: string;
    shape: string;
    material: string[];
    details: string[];
    texture: string[];
    inside_objects: InsideObject[];
  };
  composition: {
    view: string;
    framing: string;
    layout: string[];
    depth: string;
  };
  lighting: {
    primary_light: string;
    reflection: string;
    secondary_light: string;
    emissive: string;
    shadow: string;
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
    mood: [],
    styling: [],
  },
  object: {
    main_object: "",
    shape: "",
    material: [],
    details: [],
    texture: [],
    inside_objects: [],
  },
  composition: {
    view: "",
    framing: "",
    layout: [],
    depth: "",
  },
  lighting: {
    primary_light: "",
    reflection: "",
    secondary_light: "",
    emissive: "",
    shadow: "",
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
