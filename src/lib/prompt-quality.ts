import { getStyleMoodPresetById } from "./style-mood-presets";
import { hasAnyKeyword, mergeUniqueStrings } from "./prompt-utils";
import type { PromptConfig } from "../types/promptConfig";

export type PromptQualityLevel = "info" | "warning" | "error";

export type PromptQualityIssue = {
  id: string;
  level: PromptQualityLevel;
  field: string;
  message: string;
  suggestion?: string;
};

export type PromptQualityResult = {
  score: number;
  issues: PromptQualityIssue[];
};

const pushIssue = (
  issues: PromptQualityIssue[],
  id: string,
  level: PromptQualityLevel,
  field: string,
  message: string,
  suggestion?: string
) => {
  issues.push({ id, level, field, message, suggestion });
};

export const analyzePromptQuality = (config: PromptConfig): PromptQualityResult => {
  const issues: PromptQualityIssue[] = [];
  const selectedKeywordCount =
    config.brandPositioning.selectedKeywords.marketPosition.length +
    config.brandPositioning.selectedKeywords.brandFunction.length +
    config.brandPositioning.selectedKeywords.visualExpression.length +
    config.brandPositioning.selectedKeywords.culturalEdge.length;
  const sceneText = mergeUniqueStrings([config.scene.location, config.scene.time, config.scene.weather ?? ""], config.scene.backgroundDetails).join(
    " "
  );
  const styleMoodText = `${config.style.mood} ${config.brief.brandTone}`.trim();
  const colorText = mergeUniqueStrings(config.color.palette, config.color.brandColors, [config.color.dominantColor, config.color.accentColor ?? ""]).join(
    " "
  );

  if (!config.subject.description.trim()) {
    pushIssue(issues, "subject-description", "error", "subject.description", "핵심 대상 설명이 비어 있습니다.", "무엇을 보여줄지 한 문장으로 명확히 적어 주세요.");
  }
  if (!config.style.artDirection.trim()) {
    pushIssue(issues, "style-art-direction", "error", "style.artDirection", "아트 디렉션 정보가 비어 있습니다.", "미니멀, 럭셔리, 캠페인형 같은 방향성을 적어 주세요.");
  }
  if (!config.output.size.trim()) {
    pushIssue(issues, "output-size", "error", "output.size", "출력 크기가 비어 있습니다.", "예: 1024x1024");
  }
  if (!config.output.aspectRatio.trim()) {
    pushIssue(issues, "output-ratio", "error", "output.aspectRatio", "비율 정보가 비어 있습니다.");
  }
  if (config.text.includeText && !config.text.content.trim()) {
    pushIssue(issues, "text-content", "error", "text.content", "텍스트 포함이 켜져 있지만 내용이 비어 있습니다.", "짧고 명확한 문구를 입력해 주세요.");
  }

  if (hasAnyKeyword(sceneText, ["day", "morning", "afternoon", "낮", "아침"]) && hasAnyKeyword(`${sceneText} ${config.lighting.type}`, ["night", "neon", "밤"])) {
    pushIssue(issues, "day-night-conflict", "warning", "scene.time", "장면 시간대와 조명 키워드가 충돌할 수 있습니다.", "낮 장면이면 네온/밤 키워드를 줄이거나 시간을 다시 맞춰 주세요.");
  }

  if (config.color.temperature === "warm" && hasAnyKeyword(`${colorText} ${styleMoodText}`, ["cool", "blue", "icy", "차가운"])) {
    pushIssue(issues, "color-temperature-conflict", "warning", "color.temperature", "따뜻한 색온도와 차가운 팔레트 키워드가 함께 강조되고 있습니다.", "warm 또는 cool 중 한 방향을 더 분명하게 정리해 주세요.");
  }

  if (config.output.transparentBackground && (config.scene.location.trim() || config.scene.backgroundDetails.length > 1)) {
    pushIssue(issues, "transparent-background-conflict", "warning", "output.transparentBackground", "투명 배경과 상세한 장면 설명이 함께 들어가 있습니다.", "배경을 비워 둘지, 장면을 유지할지 한쪽을 정리해 주세요.");
  }

  if (config.style.styleTraits.length >= 12) {
    pushIssue(issues, "style-traits-overload", "warning", "style.styleTraits", "스타일 특성이 너무 많아 결과가 산만해질 수 있습니다.", "핵심 특성 5~8개 수준으로 압축해 보세요.");
  }

  if (config.constraints.mustInclude.length >= 10) {
    pushIssue(issues, "must-include-overload", "warning", "constraints.mustInclude", "반드시 포함해야 할 요소가 너무 많습니다.", "우선순위가 높은 요소만 남기면 안정적입니다.");
  }

  if (!config.brandPositioning.selectedPresetId) {
    pushIssue(
      issues,
      "preset-missing",
      "info",
      "brandPositioning.selectedPresetId",
      "브랜드 포지셔닝 프리셋이 선택되지 않았습니다.",
      "상단 프리셋을 먼저 선택하면 더 일관된 프롬프트를 만들 수 있습니다."
    );
  }

  if (selectedKeywordCount <= 2) {
    pushIssue(
      issues,
      "keyword-count-low",
      "warning",
      "brandPositioning.selectedKeywords",
      "브랜드 포지셔닝 키워드가 2개 이하입니다. 이미지 방향이 다소 일반적으로 생성될 수 있습니다."
    );
  }

  if (selectedKeywordCount >= 8) {
    pushIssue(
      issues,
      "keyword-count-high",
      "warning",
      "brandPositioning.selectedKeywords",
      "브랜드 포지셔닝 키워드가 8개 이상입니다. 스타일 방향이 흐려질 수 있습니다."
    );
  }

  const preset = config.brandPositioning.selectedPresetId
    ? getStyleMoodPresetById(config.brandPositioning.selectedPresetId)
    : undefined;

  const selectedKeywords = [
    ...config.brandPositioning.selectedKeywords.marketPosition,
    ...config.brandPositioning.selectedKeywords.brandFunction,
    ...config.brandPositioning.selectedKeywords.visualExpression,
    ...config.brandPositioning.selectedKeywords.culturalEdge,
  ];

  if (preset && config.brandPositioning.lockPresetToBrand) {
    const keywordOverlap = preset.positioningKeywords.filter((keyword) => selectedKeywords.includes(keyword)).length;

    if (keywordOverlap / Math.max(preset.positioningKeywords.length, 1) < 0.26) {
      pushIssue(
        issues,
        "preset-keyword-alignment-low",
        "warning",
        "brandPositioning.selectedPresetId",
        "선택한 스타일 / 무드 프리셋과 브랜드 포지셔닝 키워드의 연결성이 낮습니다."
      );
    }

    const styleConflict =
      config.style.mood.trim().length > 0 &&
      !preset.moodKeywords.some((keyword) => config.style.mood.toLowerCase().includes(keyword.toLowerCase())) &&
      hasAnyKeyword(config.style.mood, ["quiet", "subtle", "calm", "차분", "절제", "soft"]);

    if (styleConflict && preset.id === "future-bold") {
      pushIssue(
        issues,
        "locked-preset-mood-conflict",
        "warning",
        "style.mood",
        "선택한 프리셋의 에너지와 현재 무드 표현이 어긋나고 있습니다.",
        "프리셋 잠금을 유지한다면 더 역동적인 무드 키워드로 조정해 주세요."
      );
    }

    const lightingConflict =
      config.lighting.type.trim().length > 0 &&
      !preset.lightingHints.some((hint) => config.lighting.type.toLowerCase().includes(hint.toLowerCase().split(" ")[0]));

    if (lightingConflict) {
      pushIssue(
        issues,
        "locked-preset-lighting-conflict",
        "warning",
        "lighting.type",
        "프리셋 조명 힌트와 현재 조명 설정이 다를 수 있습니다.",
        "프리셋 잠금이 중요하다면 조명 톤을 다시 맞춰 주세요."
      );
    }

    const paletteConflict =
      config.color.palette.length > 0 &&
      preset.id === "refined-classic" &&
      hasAnyKeyword(config.color.palette.join(" "), ["neon", "electric", "vivid"]);

    if (paletteConflict) {
      pushIssue(
        issues,
        "locked-preset-palette-conflict",
        "warning",
        "color.palette",
        "Refined Classic 프리셋과 강한 네온 팔레트가 충돌합니다.",
        "아이보리, 웜 그레이, 딥 브라운 계열로 정리해 보세요."
      );
    }

    const coordinateDistance = Math.hypot(
      config.brandPositioning.selectedPoint.x - preset.centroid.x,
      config.brandPositioning.selectedPoint.y - preset.centroid.y
    );

    if (coordinateDistance > 0.38) {
      pushIssue(
        issues,
        "preset-coordinate-distance",
        "warning",
        "brandPositioning.selectedPoint",
        "현재 맵 좌표는 선택한 프리셋의 일반적인 위치와 거리가 있습니다. 의도된 대비인지 확인하세요."
      );
    }
  }

  if (preset?.id === "future-bold" && hasAnyKeyword(config.style.mood, ["calm", "quiet", "subtle", "차분"])) {
    pushIssue(
      issues,
      "future-bold-calm-conflict",
      "warning",
      "style.mood",
      "Future Bold 프리셋에 비해 현재 무드가 지나치게 차분합니다.",
      "energetic, bold, disruptive 같은 표현을 보강해 보세요."
    );
  }

  if (preset?.id === "refined-classic" && hasAnyKeyword(config.color.palette.join(" "), ["neon", "electric", "vivid"])) {
    pushIssue(
      issues,
      "refined-classic-neon-conflict",
      "warning",
      "color.palette",
      "Refined Classic 프리셋에서 네온 계열 팔레트가 과하게 느껴질 수 있습니다."
    );
  }

  if (preset?.id === "modern-minimal" && config.style.styleTraits.length >= 10) {
    pushIssue(
      issues,
      "modern-minimal-overload",
      "warning",
      "style.styleTraits",
      "Modern Minimal 프리셋에는 현재 스타일 특성이 너무 많습니다.",
      "형태, 여백, 정밀감 중심으로 압축해 주세요."
    );
  }

  if (hasAnyKeyword(config.style.artDirection, [" by ", "style of ", "in the style of"])) {
    pushIssue(
      issues,
      "living-artist-warning",
      "warning",
      "style.artDirection",
      "특정 작가명 직접 모방보다 시각적 특징 중심의 표현을 권장합니다.",
      "색감, 질감, 구도, 분위기 키워드로 바꿔 적어 보세요."
    );
  }

  if (
    selectedKeywords.includes("Minimal") &&
    selectedKeywords.includes("Statement")
  ) {
    pushIssue(
      issues,
      "keyword-direction-conflict-minimal-statement",
      "warning",
      "brandPositioning.selectedKeywords",
      "Minimal과 Statement가 함께 선택되었습니다. 의도적으로 절제와 선언성을 함께 쓰는지 확인하세요."
    );
  }

  if (
    selectedKeywords.includes("Accessible") &&
    selectedKeywords.includes("Avant-Garde")
  ) {
    pushIssue(
      issues,
      "keyword-direction-conflict-accessible-avant-garde",
      "warning",
      "brandPositioning.selectedKeywords",
      "Accessible과 Avant-Garde가 함께 선택되었습니다. 대중성과 실험성이 동시에 필요한 맥락인지 확인하세요."
    );
  }

  const score = Math.max(
    0,
    100 -
      issues.filter((issue) => issue.level === "error").length * 20 -
      issues.filter((issue) => issue.level === "warning").length * 8 -
      issues.filter((issue) => issue.level === "info").length * 2
  );

  return {
    score: Math.min(score, 100),
    issues: issues.sort((left, right) => {
      const order: Record<PromptQualityLevel, number> = { error: 0, warning: 1, info: 2 };
      return order[left.level] - order[right.level];
    }),
  };
};
