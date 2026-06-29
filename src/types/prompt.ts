export interface UnifiedPrompt {
  meta: {
    id?: string;
    title: string;
    purpose: string;
    target_ai?: "midjourney" | "conversational";
  };
  subject: {
    type: string;
    main_object: string[];
    details: string[];
  };
  background: {
    type: "solid" | "environment";
    color: string;
    environment: string[];
    props: string[];
  };
  scene: {
    framing: string;
    composition: string[];
  };
  style: {
    medium: string[];
    aesthetic: string[];
    era: string[];
    mood: string[];
    color_temperature: string[];
    lighting: string[];
  };
  constraints: {
    negative_prompt: string[];
    custom_rules: string;
  };
  midjourney: {
    version: string;
    stylize: number;
    chaos: number;
  };
  final_prompt: string;
}

export const EMPTY_PROMPT: UnifiedPrompt = {
  meta: {
    id: "",
    title: "",
    purpose: "",
    target_ai: "conversational",
  },
  subject: {
    type: "other",
    main_object: [],
    details: [],
  },
  background: {
    type: "solid",
    color: "",
    environment: [],
    props: [],
  },
  scene: {
    framing: "",
    composition: [],
  },
  style: {
    mood: [],
    lighting: [],
    color_temperature: [],
    medium: [],
    aesthetic: [],
    era: [],
  },
  constraints: {
    negative_prompt: [],
    custom_rules: "",
  },
  midjourney: {
    version: "",
    stylize: 100,
    chaos: 0,
  },
  final_prompt: "",
};
