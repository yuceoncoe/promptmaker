import { useMemo, useState } from "react";
import {
  compileMidjourneyPrompt,
  compileNaturalPrompt,
  compileOpenAIPayload,
  compileStableDiffusionPayload,
} from "../../lib/prompt-compiler";
import type { PromptConfig } from "../../types/promptConfig";

type ExportFormat =
  | "structured-json"
  | "natural-language"
  | "openai-json"
  | "midjourney-text"
  | "stable-diffusion-json";

interface ExportPanelProps {
  config: PromptConfig;
  onCopy: (text: string, successMessage: string) => void;
}

export default function ExportPanel({ config, onCopy }: ExportPanelProps) {
  const [format, setFormat] = useState<ExportFormat>("structured-json");

  const content = useMemo(() => {
    switch (format) {
      case "natural-language":
        return compileNaturalPrompt(config);
      case "openai-json":
        return compileOpenAIPayload(config);
      case "midjourney-text":
        return compileMidjourneyPrompt(config);
      case "stable-diffusion-json":
        return compileStableDiffusionPayload(config);
      default:
        return JSON.stringify(config, null, 2);
    }
  }, [config, format]);

  return (
    <div className="space-y-4 rounded-2xl border border-stone-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-stone-900">Export</h3>
        <button
          type="button"
          onClick={() => onCopy(content, "복사되었습니다.")}
          className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 transition hover:border-stone-300 hover:text-stone-900"
        >
          복사
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {[
          ["structured-json", "Structured JSON"],
          ["natural-language", "Natural Language"],
          ["openai-json", "OpenAI-like JSON"],
          ["midjourney-text", "Midjourney-like Text"],
          ["stable-diffusion-json", "Stable Diffusion-like JSON"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFormat(value as ExportFormat)}
            className={[
              "rounded-full border px-3 py-1.5 text-sm transition",
              format === value
                ? "border-black bg-black text-white"
                : "border-stone-200 bg-stone-100 text-stone-700 hover:bg-stone-200",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
      </div>
      <pre className="max-h-[18rem] overflow-auto rounded-2xl bg-stone-950 p-4 text-xs leading-6 text-stone-100">
        <code>{content || "내보낼 내용이 아직 없습니다."}</code>
      </pre>
    </div>
  );
}
