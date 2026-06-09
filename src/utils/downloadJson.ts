import type { VisualPrompt } from "../types/prompt";

export const downloadJson = (data: VisualPrompt, fileName = "visual-prompt.json") => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};
