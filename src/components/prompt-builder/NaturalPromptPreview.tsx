interface NaturalPromptPreviewProps {
  prompt: string;
}

export default function NaturalPromptPreview({ prompt }: NaturalPromptPreviewProps) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm leading-7 text-stone-700">
      {prompt || "핵심 대상과 스타일을 입력하면 자연어 프롬프트가 생성됩니다."}
    </div>
  );
}
