import { describe, expect, it } from "vitest";
import { defaultPromptConfig } from "./default-prompt";
import { analyzePromptQuality } from "./prompt-quality";
import { applyStyleMoodPreset } from "./style-mood-presets";

describe("prompt quality", () => {
  it("creates an error for missing required values", () => {
    const result = analyzePromptQuality(defaultPromptConfig);
    expect(result.issues.some((issue) => issue.level === "error")).toBe(true);
  });

  it("creates a warning for day/night conflicts", () => {
    const result = analyzePromptQuality({
      ...defaultPromptConfig,
      subject: { ...defaultPromptConfig.subject, description: "a product" },
      style: { ...defaultPromptConfig.style, artDirection: "clean" },
      scene: { ...defaultPromptConfig.scene, time: "day", backgroundDetails: ["night city lights"] },
      lighting: { ...defaultPromptConfig.lighting, type: "neon side light" },
    });

    expect(result.issues.some((issue) => issue.id === "day-night-conflict")).toBe(true);
  });

  it("creates an error when text is enabled without content", () => {
    const result = analyzePromptQuality({
      ...defaultPromptConfig,
      subject: { ...defaultPromptConfig.subject, description: "a product" },
      style: { ...defaultPromptConfig.style, artDirection: "clean" },
      text: { ...defaultPromptConfig.text, includeText: true, content: "" },
    });

    expect(result.issues.some((issue) => issue.id === "text-content")).toBe(true);
  });

  it("lowers the score when warnings accumulate", () => {
    const result = analyzePromptQuality({
      ...defaultPromptConfig,
      subject: { ...defaultPromptConfig.subject, description: "a product" },
      style: {
        ...defaultPromptConfig.style,
        artDirection: "clean",
        styleTraits: new Array(12).fill("trait"),
      },
      constraints: {
        ...defaultPromptConfig.constraints,
        mustInclude: new Array(10).fill("must include"),
      },
      scene: { ...defaultPromptConfig.scene, location: "street", time: "day", backgroundDetails: ["night neon"] },
      lighting: { ...defaultPromptConfig.lighting, type: "neon light" },
    });

    expect(result.score).toBeLessThan(100);
  });

  it("warns when a locked preset conflicts with detailed inputs", () => {
    const config = applyStyleMoodPreset(
      {
        ...defaultPromptConfig,
        subject: { ...defaultPromptConfig.subject, description: "a device" },
        style: { ...defaultPromptConfig.style, artDirection: "futuristic campaign", mood: "quiet and subtle" },
      },
      "future-bold"
    );

    const result = analyzePromptQuality({
      ...config,
      brandPositioning: { ...config.brandPositioning, lockPresetToBrand: true },
      lighting: { ...config.lighting, type: "soft natural lighting" },
    });

    expect(result.issues.some((issue) => issue.id === "locked-preset-mood-conflict" || issue.id === "locked-preset-lighting-conflict")).toBe(true);
  });
});
