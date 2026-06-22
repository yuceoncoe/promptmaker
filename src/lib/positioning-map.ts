import { POSITIONING_KEYWORD_COORDINATES, POSITIONING_KEYWORD_GROUPS, type PositioningKeyword } from "./positioning-keywords";
import { uniqueStrings } from "./prompt-utils";
import type { BrandPositioningConfig, StyleMoodPreset } from "../types/promptConfig";

const euclideanDistance = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

export const getNearestPositioningKeywords = (point: { x: number; y: number }, limit = 5) =>
  (Object.entries(POSITIONING_KEYWORD_COORDINATES) as Array<[PositioningKeyword, { x: number; y: number }]>)
    .map(([keyword, coordinates]) => ({
      keyword,
      distance: euclideanDistance(point, coordinates),
    }))
    .sort((left, right) => left.distance - right.distance)
    .slice(0, limit)
    .map((item) => item.keyword);

export const createSelectedKeywordGroups = (keywords: string[]) => ({
  marketPosition: keywords.filter((keyword) => (POSITIONING_KEYWORD_GROUPS.marketPosition as readonly string[]).includes(keyword)),
  brandFunction: keywords.filter((keyword) => (POSITIONING_KEYWORD_GROUPS.brandFunction as readonly string[]).includes(keyword)),
  visualExpression: keywords.filter((keyword) => (POSITIONING_KEYWORD_GROUPS.visualExpression as readonly string[]).includes(keyword)),
  culturalEdge: keywords.filter((keyword) => (POSITIONING_KEYWORD_GROUPS.culturalEdge as readonly string[]).includes(keyword)),
});

const flattenSelectedKeywords = (selection: BrandPositioningConfig["selectedKeywords"]) => [
  ...selection.marketPosition,
  ...selection.brandFunction,
  ...selection.visualExpression,
  ...selection.culturalEdge,
];

export const getSelectedKeywordsFlat = flattenSelectedKeywords;

export const applyManualKeywordOverrides = (
  recommendedKeywords: string[],
  overrides?: BrandPositioningConfig["manualKeywordOverrides"]
) => {
  const added = overrides?.added ?? [];
  const removed = overrides?.removed ?? [];

  return uniqueStrings([
    ...recommendedKeywords.filter((keyword) => !removed.includes(keyword)),
    ...added.filter((keyword) => !removed.includes(keyword)),
  ]);
};

export const getRecommendedStyleMoodPresets = ({
  presets,
  selectedKeywords,
  mapPoint,
  limit = 3,
}: {
  presets: StyleMoodPreset[];
  selectedKeywords: string[];
  mapPoint: { x: number; y: number };
  limit?: number;
}) =>
  [...presets]
    .map((preset) => {
      const overlapCount = preset.positioningKeywords.filter((keyword) => selectedKeywords.includes(keyword)).length;
      const overlapScore = overlapCount / Math.max(preset.positioningKeywords.length, 1);
      const distance = euclideanDistance(mapPoint, preset.centroid);
      const distanceScore = Math.max(0, 1 - distance);

      return {
        preset,
        score: overlapScore * 0.7 + distanceScore * 0.3,
      };
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map((item) => item.preset);

export const summarizeBrandPositioning = ({
  selectedKeywords,
  preset,
}: {
  selectedKeywords: string[];
  preset?: StyleMoodPreset;
}) => {
  if (!selectedKeywords.length && !preset) {
    return {
      positioningSentence: "",
      moodSentence: "",
    };
  }

  const positioningSentence = selectedKeywords.length
    ? `A brand direction centered on ${selectedKeywords.join(", ")}.`
    : "";
  const moodSentence = preset
    ? `The resulting image direction should feel ${preset.mood}.`
    : "";

  return {
    positioningSentence,
    moodSentence,
  };
};
