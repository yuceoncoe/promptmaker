import type { UnifiedPrompt } from "../types/prompt";

interface JsonPreviewProps {
  prompt: UnifiedPrompt;
}

export default function JsonPreview({ prompt }: JsonPreviewProps) {
  return (
    <pre className="max-h-[26rem] overflow-auto rounded-2xl border border-stone-800 bg-stone-950 p-4 pb-12 text-xs leading-6 text-stone-300">
      <code>{JSON.stringify(prompt, null, 2)}</code>
    </pre>
  );
}
