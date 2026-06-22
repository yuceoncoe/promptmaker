export const POSITIONING_KEYWORD_GROUPS = {
  marketPosition: ["Accessible", "Mainstream Pop", "Prestige", "Luxury", "Collector"],
  brandFunction: ["Utility", "Trusted", "Lifestyle", "Campaign"],
  visualExpression: ["Minimal", "Playful", "Editorial", "Statement"],
  culturalEdge: ["Atelier", "Cult", "Avant-Garde", "Experimental"],
} as const;

export const POSITIONING_KEYWORD_COORDINATES = {
  Accessible: { x: 0.1, y: 0.35 },
  Utility: { x: 0.2, y: 0.15 },
  Trusted: { x: 0.25, y: 0.2 },
  "Mainstream Pop": { x: 0.25, y: 0.75 },
  Campaign: { x: 0.45, y: 0.8 },
  Lifestyle: { x: 0.45, y: 0.65 },
  Playful: { x: 0.35, y: 0.9 },
  Prestige: { x: 0.65, y: 0.3 },
  Minimal: { x: 0.55, y: 0.2 },
  Luxury: { x: 0.75, y: 0.25 },
  Atelier: { x: 0.78, y: 0.35 },
  Collector: { x: 0.82, y: 0.4 },
  Editorial: { x: 0.7, y: 0.65 },
  Statement: { x: 0.8, y: 0.8 },
  Cult: { x: 0.88, y: 0.7 },
  "Avant-Garde": { x: 0.93, y: 0.82 },
  Experimental: { x: 0.95, y: 0.9 },
} as const;

export type PositioningKeyword = keyof typeof POSITIONING_KEYWORD_COORDINATES;
export type PositioningKeywordGroup = keyof typeof POSITIONING_KEYWORD_GROUPS;

export const POSITIONING_KEYWORDS = Object.keys(POSITIONING_KEYWORD_COORDINATES) as PositioningKeyword[];

export const getKeywordGroup = (keyword: string): PositioningKeywordGroup | null => {
  for (const [group, keywords] of Object.entries(POSITIONING_KEYWORD_GROUPS) as Array<
    [PositioningKeywordGroup, readonly string[]]
  >) {
    if (keywords.includes(keyword)) return group;
  }

  return null;
};
