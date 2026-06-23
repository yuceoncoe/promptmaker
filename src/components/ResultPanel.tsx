import { useState } from "react";
import JsonPreview from "./JsonPreview";
import type { UnifiedPrompt } from "../types/prompt";

interface ResultPanelProps {
  prompt: UnifiedPrompt;
  score: number;
  onCopyJson: () => void;
  onCopyPrompt: () => void;
  onDownload: () => void;
  onReset: () => void;
}

export default function ResultPanel({
  prompt,
  score,
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
    <aside className="self-start rounded-[28px] border border-stone-200 bg-white p-5 shadow-panel lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-auto">
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
