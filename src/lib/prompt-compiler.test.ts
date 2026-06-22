import { describe, expect, it } from "vitest";
import { defaultPromptConfig } from "./default-prompt";
import { compileNaturalPrompt, compileNegativePrompt } from "./prompt-compiler";
import { applyStyleMoodPreset } from "./style-mood-presets";

describe("prompt compiler", () => {
  it("includes the subject description in the natural prompt", () => {
    const config = {
      ...defaultPromptConfig,
      subject: { ...defaultPromptConfig.subject, description: "a premium skincare bottle" },
      style: { ...defaultPromptConfig.style, artDirection: "clean product photography" },
    };

    expect(compileNaturalPrompt(config)).toContain("a premium skincare bottle");
  });

  it("includes art direction in the natural prompt", () => {
    const config = {
      ...defaultPromptConfig,
      subject: { ...defaultPromptConfig.subject, description: "a premium skincare bottle" },
      style: { ...defaultPromptConfig.style, artDirection: "minimal luxury" },
    };

    expect(compileNaturalPrompt(config)).toContain("minimal luxury");
  });

  it("includes avoid constraints in the negative prompt", () => {
    const config = {
      ...defaultPromptConfig,
      constraints: { ...defaultPromptConfig.constraints, avoid: ["blurry", "watermark"] },
    };

    expect(compileNegativePrompt(config)).toContain("blurry");
  });

  it("removes duplicate negative prompt entries", () => {
    const config = {
      ...defaultPromptConfig,
      constraints: { ...defaultPromptConfig.constraints, avoid: ["watermark", "watermark"] },
      color: { ...defaultPromptConfig.color, avoidColors: ["watermark"] },
    };

    expect(compileNegativePrompt(config)).toBe("watermark");
  });

  it("adds brand positioning guidance when a preset is selected", () => {
    const config = applyStyleMoodPreset(
      {
        ...defaultPromptConfig,
        subject: { ...defaultPromptConfig.subject, description: "a wearable device" },
        style: { ...defaultPromptConfig.style, artDirection: "premium campaign visual" },
      },
      "balanced-premium"
    );

    expect(compileNaturalPrompt(config)).toContain("Balanced Premium");
  });
});
