export interface UnifiedPrompt {
  meta: {
    title: string;
    purpose: string;
  };
  subject: {
    type: string;
    main_object: string;
    details: string[];
  };
  scene: {
    background: string;
    composition: string[];
  };
  style: {
    medium: string[];
    aesthetic: string[];
    era: string[];
    mood: string[];
    color_palette: string[];
    lighting: string[];
  };
  constraints: {
    negative_prompt: string[];
    aspect_ratio: string;
  };
  final_prompt: string;
}

export const EMPTY_PROMPT: UnifiedPrompt = {

  meta: {
    title: "",
    purpose: "",
  },
  subject: {
    type: "product",
    main_object: "",
    details: [],
  },
  scene: {
    background: "",
    composition: [],
  },
  style: {
    medium: [],
    aesthetic: [],
    era: [],
    mood: [],
    color_palette: [],
    lighting: [],
  },
  constraints: {
    negative_prompt: [],
    aspect_ratio: "1:1",
  },
  final_prompt: "",
};
