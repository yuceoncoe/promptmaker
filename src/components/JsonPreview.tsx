import type { VisualPrompt } from "../types/prompt";

interface JsonPreviewProps {
  prompt: VisualPrompt;
}

export default function JsonPreview({ prompt }: JsonPreviewProps) {
  return (
    <pre className="max-h-[26rem] overflow-auto rounded-2xl bg-stone-950 p-4 text-xs leading-6 text-stone-100">
      <code>{JSON.stringify(prompt, null, 2)}</code>
    </pre>
  );
}
