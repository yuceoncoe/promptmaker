import { joinReadableList } from "../../lib/prompt-utils";
import type { StyleMoodPreset } from "../../types/promptConfig";

interface StyleMoodPresetCardProps {
  preset: StyleMoodPreset;
  selected: boolean;
  onClick: () => void;
  recommended?: boolean;
}

export default function StyleMoodPresetCard({
  preset,
  selected,
  onClick,
  recommended = false,
}: StyleMoodPresetCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "min-w-[250px] rounded-2xl border p-4 text-left transition",
        selected
          ? "border-black bg-black text-white"
          : "border-stone-200 bg-white text-stone-900 hover:border-stone-300",
      ].join(" ")}
    >
      <div className="flex flex-wrap items-center gap-2">
        <div className="text-sm font-semibold">{preset.name}</div>
        {recommended ? (
          <span className={["rounded-full px-2 py-1 text-[10px]", selected ? "bg-white/15 text-white" : "bg-stone-100 text-stone-700"].join(" ")}>
            추천
          </span>
        ) : null}
        {preset.featured ? (
          <span className={["rounded-full px-2 py-1 text-[10px]", selected ? "bg-white/15 text-white" : "bg-stone-100 text-stone-700"].join(" ")}>
            대표
          </span>
        ) : null}
      </div>
      <p className={["mt-2 text-sm leading-6", selected ? "text-stone-200" : "text-stone-600"].join(" ")}>
        {preset.description}
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {preset.positioningKeywords.slice(0, 4).map((keyword) => (
          <span
            key={keyword}
            className={[
              "rounded-full px-2 py-1 text-[11px]",
              selected ? "bg-white/10 text-stone-200" : "bg-stone-100 text-stone-600",
            ].join(" ")}
          >
            {keyword}
          </span>
        ))}
      </div>
      <div className={["mt-3 text-xs leading-5", selected ? "text-stone-300" : "text-stone-500"].join(" ")}>
        무드: {preset.mood}
      </div>
      <div className={["mt-1 text-xs leading-5", selected ? "text-stone-300" : "text-stone-500"].join(" ")}>
        스타일: {joinReadableList(preset.styleKeywords.slice(0, 2))}
      </div>
    </button>
  );
}
