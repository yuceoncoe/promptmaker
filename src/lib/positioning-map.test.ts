import { describe, expect, it } from "vitest";
import {
  applyManualKeywordOverrides,
  createSelectedKeywordGroups,
  getNearestPositioningKeywords,
  getRecommendedStyleMoodPresets,
  summarizeBrandPositioning,
} from "./positioning-map";
import { getStyleMoodPresetById, styleMoodPresets } from "./style-mood-presets";

describe("positioning map helpers", () => {
  it("returns utility-led keywords for lower-left map points", () => {
    expect(getNearestPositioningKeywords({ x: 0.2, y: 0.15 }, 3)).toEqual(
      expect.arrayContaining(["Utility", "Trusted", "Accessible"])
    );
  });

  it("returns prestige-led keywords for right-lower map points", () => {
    expect(getNearestPositioningKeywords({ x: 0.76, y: 0.3 }, 3)).toEqual(
      expect.arrayContaining(["Luxury", "Atelier", "Prestige"])
    );
  });

  it("keeps manual keyword additions and removals on top of map recommendations", () => {
    const recommended = ["Trusted", "Prestige", "Luxury", "Atelier", "Collector"];

    expect(
      applyManualKeywordOverrides(recommended, {
        added: ["Editorial"],
        removed: ["Collector"],
      })
    ).toEqual(["Trusted", "Prestige", "Luxury", "Atelier", "Editorial"]);
  });

  it("recommends matching presets from keywords and coordinates", () => {
    const presets = getRecommendedStyleMoodPresets({
      presets: styleMoodPresets,
      selectedKeywords: ["Trusted", "Prestige", "Luxury", "Atelier", "Collector"],
      mapPoint: { x: 0.76, y: 0.34 },
    });

    expect(presets[0]?.id).toBe("refined-classic");
  });

  it("creates grouped keyword selections and summary text", () => {
    const selectedKeywords = ["Trusted", "Prestige", "Luxury", "Editorial"];
    const preset = getStyleMoodPresetById("refined-classic");
    const groups = createSelectedKeywordGroups(selectedKeywords);
    const summary = summarizeBrandPositioning({ selectedKeywords, preset });

    expect(groups.marketPosition).toEqual(expect.arrayContaining(["Prestige", "Luxury"]));
    expect(groups.brandFunction).toEqual(["Trusted"]);
    expect(summary.positioningSentence).toContain("Trusted, Prestige, Luxury, Editorial");
    expect(summary.moodSentence).toContain("feel");
  });
});
