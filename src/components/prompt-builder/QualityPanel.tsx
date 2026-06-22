import type { PromptQualityResult } from "../../lib/prompt-quality";

interface QualityPanelProps {
  result: PromptQualityResult;
}

const qualityMessage = (score: number) => {
  if (score >= 85) return "프롬프트 구조가 명확합니다. 바로 생성에 사용할 수 있습니다.";
  if (score >= 60) return "사용은 가능하지만 몇 가지 정보를 보완하면 결과가 더 안정적입니다.";
  return "필수 정보가 부족하거나 서로 충돌하는 조건이 있습니다.";
};

export default function QualityPanel({ result }: QualityPanelProps) {
  return (
    <div className="space-y-4 rounded-2xl border border-stone-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-stone-900">Quality Check</h3>
          <p className="mt-1 text-xs leading-5 text-stone-500">{qualityMessage(result.score)}</p>
        </div>
        <div className="text-2xl font-semibold text-stone-900">{result.score}</div>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-stone-200">
        <div className="h-full rounded-full bg-black transition-all" style={{ width: `${result.score}%` }} />
      </div>
      <div className="space-y-3">
        {result.issues.length ? (
          result.issues.map((issue) => (
            <div key={issue.id} className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold uppercase tracking-normal text-stone-500">{issue.level}</span>
                <span className="text-xs text-stone-500">{issue.field}</span>
              </div>
              <p className="mt-2 text-sm text-stone-800">{issue.message}</p>
              {issue.suggestion ? <p className="mt-1 text-xs leading-5 text-stone-500">{issue.suggestion}</p> : null}
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 px-4 py-5 text-sm text-stone-500">
            현재 확인된 이슈가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
