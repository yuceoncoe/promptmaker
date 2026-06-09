import { useState, useRef } from "react";
import JsonPreview from "./JsonPreview";
import type { VisualPrompt } from "../types/prompt";

interface ResultPanelProps {
  prompt: VisualPrompt;
  score: number;
  onCopyJson: () => void;
  onCopyPrompt: () => void;
  onDownload: () => void;
  onImport: (file: File | null) => void;
  onReset: () => void;
}

export default function ResultPanel({
  prompt,
  score,
  onCopyJson,
  onCopyPrompt,
  onDownload,
  onImport,
  onReset,
}: ResultPanelProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
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
            <button
              type="button"
              onClick={() => setJsonOpen((value) => !value)}
              className="flex items-center gap-2 text-left text-sm font-semibold text-stone-900"
            >
              <span>JSON Preview</span>
              <span className="text-stone-400">{jsonOpen ? "Hide" : "Show"}</span>
            </button>
            <button
              type="button"
              onClick={onCopyJson}
              className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 transition hover:border-stone-300 hover:text-stone-900"
            >
              Copy JSON
            </button>
          </div>
          {jsonOpen ? (
            <JsonPreview prompt={prompt} />
          ) : (
            <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-xs text-stone-500">
              <div className="overflow-hidden text-ellipsis whitespace-nowrap">{jsonPreviewLine}...</div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setPromptOpen((value) => !value)}
              className="flex items-center gap-2 text-left text-sm font-semibold text-stone-900"
            >
              <span>Final Prompt Preview</span>
              <span className="text-stone-400">{promptOpen ? "Hide" : "Show"}</span>
            </button>
            <button
              type="button"
              onClick={onCopyPrompt}
              className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 transition hover:border-stone-300 hover:text-stone-900"
            >
              Copy Prompt
            </button>
          </div>
          {promptOpen ? (
            <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm leading-7 text-stone-700">
              {promptPreviewLine}
            </div>
          ) : (
            <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-xs text-stone-500">
              <div className="overflow-hidden text-ellipsis whitespace-nowrap">{promptPreviewLine}</div>
            </div>
          )}
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
            onClick={onDownload}
            className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 transition hover:border-stone-300 hover:text-stone-900"
          >
            Export JSON
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 transition hover:border-stone-300 hover:text-stone-900"
          >
            Import JSON
          </button>
          <button
            type="button"
            onClick={onReset}
            className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
          >
            Reset
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={(event) => {
              onImport(event.target.files?.[0] ?? null);
              event.currentTarget.value = "";
            }}
            className="hidden"
          />
        </div>
      </div>
    </aside>
  );
}
