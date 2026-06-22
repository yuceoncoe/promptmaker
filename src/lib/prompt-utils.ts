import type { PromptConfig } from "../types/promptConfig";

export const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export const normalizeString = (value: string) => value.trim();

export const uniqueStrings = (values: string[]) => {
  const seen = new Set<string>();
  const result: string[] = [];

  values.forEach((value) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    result.push(trimmed);
  });

  return result;
};

export const mergeUniqueStrings = (...groups: Array<string[] | undefined>) =>
  uniqueStrings(groups.flatMap((group) => group ?? []));

export const parseSize = (size: string) => {
  const match = size.trim().match(/^(\d+)\s*x\s*(\d+)$/i);
  if (!match) {
    return { width: 1024, height: 1024 };
  }

  return {
    width: Number(match[1]),
    height: Number(match[2]),
  };
};

export const deepClone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export const hasAnyKeyword = (text: string, keywords: string[]) => {
  const normalized = text.trim().toLowerCase();
  return keywords.some((keyword) => normalized.includes(keyword.toLowerCase()));
};

export const joinReadableList = (items: string[], separator = ", ") =>
  uniqueStrings(items).join(separator);

export const maybeJoinSentence = (parts: string[], prefix = "", suffix = ".") => {
  const filtered = parts.map((part) => part.trim()).filter(Boolean);
  if (!filtered.length) return "";
  return `${prefix}${filtered.join(", ")}${suffix}`;
};

export const createModelAdapter = (targetModel: PromptConfig["modelAdapter"]["targetModel"]) => {
  if (targetModel === "openai") {
    return {
      targetModel,
      promptFormat: "natural-language" as const,
      supportsNegativePrompt: false,
      supportsSeed: false,
      supportsImageReference: false,
    };
  }

  if (targetModel === "midjourney") {
    return {
      targetModel,
      promptFormat: "model-specific" as const,
      supportsNegativePrompt: false,
      supportsSeed: false,
      supportsImageReference: true,
    };
  }

  if (targetModel === "stable-diffusion") {
    return {
      targetModel,
      promptFormat: "model-specific" as const,
      supportsNegativePrompt: true,
      supportsSeed: true,
      supportsImageReference: true,
    };
  }

  return {
    targetModel,
    promptFormat: "structured-json" as const,
    supportsNegativePrompt: true,
    supportsSeed: targetModel === "other",
    supportsImageReference: targetModel === "other",
  };
};
