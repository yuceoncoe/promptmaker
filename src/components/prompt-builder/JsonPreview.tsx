import type { PromptConfig } from "../../types/promptConfig";

interface JsonPreviewProps {
  config: PromptConfig;
}

export default function JsonPreview({ config }: JsonPreviewProps) {
  return (
    <pre className="max-h-[24rem] overflow-auto rounded-2xl bg-stone-950 p-4 text-xs leading-6 text-stone-100">
      <code>{JSON.stringify(config, null, 2)}</code>
    </pre>
  );
}
