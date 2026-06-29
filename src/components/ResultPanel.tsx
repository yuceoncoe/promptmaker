import { useState } from "react";
import JsonPreview from "./JsonPreview";
import RangeSliderField from "./RangeSliderField";
import SelectField from "./SelectField";
import type { UnifiedPrompt } from "../types/prompt";

interface ResultPanelProps {
  prompt: UnifiedPrompt;
  score: number;
  onTargetAiChange: (ai: "midjourney" | "conversational") => void;
  onMidjourneyParamChange: (field: keyof UnifiedPrompt["midjourney"], value: any) => void;
  onCopyJson: () => void;
  onCopyPrompt: () => void;
  onDownload: () => void;
  onReset: () => void;
}

export default function ResultPanel({
  prompt,
  score,
  onTargetAiChange,
  onMidjourneyParamChange,
  onCopyJson,
  onCopyPrompt,
  onDownload,
  onReset,
}: ResultPanelProps) {
  const [jsonOpen, setJsonOpen] = useState(false);
  const [promptOpen, setPromptOpen] = useState(false);
  const jsonPreviewLine = JSON.stringify(prompt).slice(0, 140);
  const promptPreviewLine = prompt.final_prompt || "Your final prompt will appear here as you fill in the sections.";

  return (
    <aside className="self-start rounded-[28px] border border-stone-200 bg-white p-5 shadow-panel lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-auto flex flex-col gap-5">
      <div className="flex bg-stone-100 p-1 rounded-xl border border-stone-200">
         <button
           className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${prompt.meta?.target_ai !== "conversational" ? "bg-white shadow-sm text-stone-900 ring-1 ring-stone-900/5" : "text-stone-500 hover:text-stone-700"}`}
           onClick={() => onTargetAiChange("midjourney")}
         >
           Midjourney
         </button>
         <button
           className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${prompt.meta?.target_ai === "conversational" ? "bg-white shadow-sm text-stone-900 ring-1 ring-stone-900/5" : "text-stone-500 hover:text-stone-700"}`}
           onClick={() => onTargetAiChange("conversational")}
         >
           DALL-E / Gemini
         </button>
      </div>

      {prompt.meta?.target_ai === "midjourney" && (
        <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 space-y-4">
          <SelectField
            label="Version"
            value={prompt.midjourney?.version || ""}
            onChange={(value) => onMidjourneyParamChange("version", value)}
            options={[
              { value: "", label: "Default" },
              { value: "--v 6.0", label: "v6.0" },
              { value: "--v 5.2", label: "v5.2" },
              { value: "--niji 6", label: "Niji 6" },
            ]}
          />
          <RangeSliderField
            label="Stylize (--s)"
            value={prompt.midjourney?.stylize ?? 100}
            onChange={(value) => onMidjourneyParamChange("stylize", value)}
            min={0}
            max={1000}
            step={10}
          />
          <RangeSliderField
            label="Chaos (--c)"
            value={prompt.midjourney?.chaos ?? 0}
            onChange={(value) => onMidjourneyParamChange("chaos", value)}
            min={0}
            max={100}
            step={5}
          />
        </div>
      )}

      <div className="space-y-5">
        <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-stone-900">Prompt Quality Score</h2>
            <span className="text-lg font-semibold text-stone-900">{score}</span>
          </div>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-stone-200">
            <div
              className="h-full rounded-full bg-stone-900 transition-all"
              style={{ width: `${score}%` }}
            />
          </div>
        </div>

        {prompt.meta?.target_ai !== "midjourney" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-stone-900">JSON Preview</h3>
              <button
                type="button"
                onClick={onCopyJson}
                className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 transition hover:border-stone-300 hover:text-stone-900"
              >
                Copy JSON
              </button>
            </div>
            <div className="relative group">
              <button
                type="button"
                onClick={() => setJsonOpen((value) => !value)}
                className={`absolute right-2 bottom-2 z-10 flex h-7 w-7 items-center justify-center rounded-lg transition-colors bg-white/10 text-stone-400 hover:bg-white/20 hover:text-stone-200`}
                aria-label={jsonOpen ? "Collapse JSON Preview" : "Expand JSON Preview"}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-200 ${jsonOpen ? "rotate-180" : ""}`}>
                  <path d="m6 9 6 6 6-6"/>
                </svg>
              </button>
              {jsonOpen ? (
                <JsonPreview prompt={prompt} />
              ) : (
                <div
                  className="cursor-pointer rounded-2xl border border-stone-800 bg-stone-950 px-4 py-3 pr-10 text-xs text-stone-400 transition-colors hover:bg-stone-900"
                  onClick={() => setJsonOpen(true)}
                >
                  <div className="overflow-hidden text-ellipsis whitespace-nowrap">{jsonPreviewLine}...</div>
                </div>
              )}
            </div>
          </div>
        )}


        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-stone-900">Final Prompt Preview</h3>
            <button
              type="button"
              onClick={onCopyPrompt}
              className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 transition hover:border-stone-300 hover:text-stone-900"
            >
              Copy Prompt
            </button>
          </div>
          <div className="relative group">
            <button
              type="button"
              onClick={() => setPromptOpen((value) => !value)}
              className="absolute right-2 bottom-2 z-10 flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-stone-400 transition-colors hover:bg-white/20 hover:text-stone-200"
              aria-label={promptOpen ? "Collapse Prompt Preview" : "Expand Prompt Preview"}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-200 ${promptOpen ? "rotate-180" : ""}`}>
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </button>
            {promptOpen ? (
              <div className="rounded-2xl border border-stone-800 bg-stone-950 p-4 pb-12 text-sm leading-7 text-stone-300">
                {promptPreviewLine}
              </div>
            ) : (
              <div
                className="cursor-pointer rounded-2xl border border-stone-800 bg-stone-950 px-4 py-3 pr-10 text-xs text-stone-400 transition-colors hover:bg-stone-900"
                onClick={() => setPromptOpen(true)}
              >
                <div className="overflow-hidden text-ellipsis whitespace-nowrap">{promptPreviewLine}</div>
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={onDownload}
            className="rounded-xl border border-stone-200 bg-stone-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-stone-700"
          >
            Download JSON
          </button>
          <button
            type="button"
            onClick={onReset}
            className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
          >
            Reset
          </button>
        </div>
      </div>
    </aside>
  );
}
