import { defaultPromptConfig } from "./default-prompt";
import { deepClone } from "./prompt-utils";
import { promptSchema } from "./prompt-schema";
import type { PromptConfig } from "../types/promptConfig";

export const STORAGE_KEY = "image-prompt-json-builder:v1";

export const loadPromptConfig = () => {
  if (typeof window === "undefined") {
    return deepClone(defaultPromptConfig);
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return deepClone(defaultPromptConfig);
    const parsed = JSON.parse(raw) as unknown;
    const result = promptSchema.safeParse(parsed);
    return result.success ? (result.data as PromptConfig) : deepClone(defaultPromptConfig);
  } catch {
    return deepClone(defaultPromptConfig);
  }
};

export const savePromptConfig = (config: PromptConfig) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
};

export const clearPromptConfig = () => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
};
