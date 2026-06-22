import type { KeyboardEvent, MouseEvent } from "react";
import { clamp } from "../../lib/prompt-utils";
import type { BrandPositioningConfig, StyleMoodPreset } from "../../types/promptConfig";

interface BrandPositioningMapProps {
  value: BrandPositioningConfig;
  presets: StyleMoodPreset[];
  onSelectPoint: (point: { x: number; y: number }) => void;
  onApplyPreset: (presetId: string) => void;
}

const STEP = 0.05;

export default function BrandPositioningMap({
  value,
  presets,
  onSelectPoint,
  onApplyPreset,
}: BrandPositioningMapProps) {
  const handlePointer = (event: MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
    const y = clamp(1 - (event.clientY - rect.top) / rect.height, 0, 1);
    onSelectPoint({
      x: Number(x.toFixed(2)),
      y: Number(y.toFixed(2)),
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-stone-900">브랜드 포지셔닝 맵</div>
          <p className="mt-1 text-xs text-stone-500">맵에서 방향을 잡고, 키워드는 세밀하게 조정할 수 있습니다.</p>
        </div>
        <div className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs text-stone-600">
          X {Math.round(value.selectedPoint.x * 100)} / Y {Math.round(value.selectedPoint.y * 100)}
        </div>
      </div>
      <div
        role="button"
        tabIndex={0}
        onClick={handlePointer}
        onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
          if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
          event.preventDefault();
          onSelectPoint({
            x: clamp(
              value.selectedPoint.x + (event.key === "ArrowRight" ? STEP : event.key === "ArrowLeft" ? -STEP : 0),
              0,
              1
            ),
            y: clamp(
              value.selectedPoint.y + (event.key === "ArrowUp" ? STEP : event.key === "ArrowDown" ? -STEP : 0),
              0,
              1
            ),
          });
        }}
        className="relative aspect-[1.15] cursor-crosshair overflow-hidden rounded-[28px] border border-stone-200 bg-[radial-gradient(circle_at_top_left,rgba(248,248,247,0.95),rgba(255,255,255,1)_58%),linear-gradient(180deg,rgba(247,245,241,0.9),rgba(255,255,255,1))] p-4 outline-none focus:ring-2 focus:ring-stone-200"
      >
        <div className="absolute inset-x-1/2 top-0 h-full w-px -translate-x-1/2 bg-stone-200" />
        <div className="absolute inset-y-1/2 left-0 h-px w-full -translate-y-1/2 bg-stone-200" />

        <div className="pointer-events-none absolute left-4 top-4 text-[11px] text-stone-500">Lifestyle / Editorial</div>
        <div className="pointer-events-none absolute right-4 top-4 text-[11px] text-stone-500">Cult / Experimental</div>
        <div className="pointer-events-none absolute left-4 bottom-4 text-[11px] text-stone-500">Accessible / Utility</div>
        <div className="pointer-events-none absolute right-4 bottom-4 text-[11px] text-stone-500">Prestige / Minimal</div>

        <div className="pointer-events-none absolute inset-x-0 bottom-1 flex justify-between px-4 text-[11px] text-stone-500">
          <span>{value.map.xAxis.leftLabel}</span>
          <span>{value.map.xAxis.rightLabel}</span>
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-1 flex flex-col justify-between py-4 text-right text-[11px] text-stone-500">
          <span>{value.map.yAxis.topLabel}</span>
          <span>{value.map.yAxis.bottomLabel}</span>
        </div>

        {presets.map((preset) => {
          const selected = value.selectedPresetId === preset.id;
          const recommended = value.recommendedPresetIds.includes(preset.id);

          return (
            <button
              key={preset.id}
              type="button"
              title={preset.name}
              onClick={(event) => {
                event.stopPropagation();
                onApplyPreset(preset.id);
              }}
              className={[
                "absolute -translate-x-1/2 -translate-y-1/2 rounded-full border px-2.5 py-1 text-[11px] shadow-sm transition",
                selected
                  ? "border-black bg-black text-white"
                  : recommended
                    ? "border-stone-400 bg-white text-stone-900"
                    : "border-stone-200 bg-white/88 text-stone-500 hover:border-stone-300 hover:text-stone-800",
              ].join(" ")}
              style={{
                left: `${preset.centroid.x * 100}%`,
                top: `${(1 - preset.centroid.y) * 100}%`,
              }}
            >
              {preset.name}
            </button>
          );
        })}

        <div
          className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-black shadow-lg"
          style={{
            left: `${value.selectedPoint.x * 100}%`,
            top: `${(1 - value.selectedPoint.y) * 100}%`,
          }}
        />
      </div>
    </div>
  );
}
