import { describe, expect, it } from "vitest";
import { defaultPromptConfig } from "./default-prompt";
import { promptSchema } from "./prompt-schema";

describe("promptSchema", () => {
  it("accepts the default config", () => {
    const config = {
      ...defaultPromptConfig,
      subject: { ...defaultPromptConfig.subject, description: "a premium skincare bottle" },
      style: { ...defaultPromptConfig.style, artDirection: "clean product photography" },
    };

    expect(promptSchema.safeParse(config).success).toBe(true);
  });

  it("rejects an empty subject description", () => {
    const config = {
      ...defaultPromptConfig,
      style: { ...defaultPromptConfig.style, artDirection: "clean product photography" },
      subject: { ...defaultPromptConfig.subject, description: "" },
    };

    expect(promptSchema.safeParse(config).success).toBe(false);
  });

  it("rejects output.count above 4", () => {
    const config = {
      ...defaultPromptConfig,
      subject: { ...defaultPromptConfig.subject, description: "a product" },
      style: { ...defaultPromptConfig.style, artDirection: "clean" },
      output: { ...defaultPromptConfig.output, count: 5 },
    };

    expect(promptSchema.safeParse(config).success).toBe(false);
  });

  it("rejects reference influence above 1", () => {
    const config = {
      ...defaultPromptConfig,
      subject: { ...defaultPromptConfig.subject, description: "a product" },
      style: { ...defaultPromptConfig.style, artDirection: "clean" },
      references: {
        ...defaultPromptConfig.references,
        imageRefs: [{ type: "style", url: "ref.png", influence: 1.2 }],
      },
    };

    expect(promptSchema.safeParse(config).success).toBe(false);
  });

  it("rejects brand positioning points outside 0-1", () => {
    const config = {
      ...defaultPromptConfig,
      subject: { ...defaultPromptConfig.subject, description: "a product" },
      style: { ...defaultPromptConfig.style, artDirection: "clean" },
      brandPositioning: {
        ...defaultPromptConfig.brandPositioning,
        selectedPoint: { x: 1.2, y: 0.5 },
      },
    };

    expect(promptSchema.safeParse(config).success).toBe(false);
  });

  it("keeps default map labels populated", () => {
    expect(defaultPromptConfig.brandPositioning.map.xAxis.leftLabel).not.toBe("");
    expect(defaultPromptConfig.brandPositioning.map.xAxis.rightLabel).not.toBe("");
    expect(defaultPromptConfig.brandPositioning.map.yAxis.bottomLabel).not.toBe("");
    expect(defaultPromptConfig.brandPositioning.map.yAxis.topLabel).not.toBe("");
  });
});
