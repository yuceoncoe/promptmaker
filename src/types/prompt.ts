export interface UnifiedPrompt {
  meta: {
    title: string;
    purpose: string;
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
  final_prompt: string;
}

export const EMPTY_PROMPT: UnifiedPrompt = {
  meta: {
    id: "",
    title: "",
    purpose: "",
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
  final_prompt: "",
};
