interface NegativePromptPreviewProps {
  prompt: string;
}

export default function NegativePromptPreview({ prompt }: NegativePromptPreviewProps) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm leading-7 text-stone-700">
      {prompt || "네거티브 프롬프트가 아직 비어 있습니다."}
    </div>
  );
}
