import { useRef } from "react";

export interface PositioningPoint {
  x: number;
  y: number;
}

interface PositioningRegion {
  id: string;
  title: string;
  description: string;
  x: number;
  y: number;
}

interface PositioningMapProps {
  value: PositioningPoint | null;
  options: readonly PositioningRegion[];
  onChange: (value: PositioningPoint) => void;
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export default function PositioningMap({ value, options, onChange }: PositioningMapProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);

  const updateFromClientPoint = (clientX: number, clientY: number) => {
    if (!mapRef.current) return;
    const rect = mapRef.current.getBoundingClientRect();
    const x = clamp((clientX - rect.left) / rect.width, 0, 1) * 2 - 1;
    const y = (1 - clamp((clientY - rect.top) / rect.height, 0, 1)) * 2 - 1;
    onChange({
      x: Number(x.toFixed(2)),
      y: Number(y.toFixed(2)),
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-medium text-stone-800">Positioning Map</label>
        <span className="text-xs text-stone-400">
          {value ? "Click to reposition" : "Click anywhere on the map"}
        </span>
      </div>
      <div className="rounded-2xl border border-stone-200 bg-white p-3">
        <div
          ref={mapRef}
          role="button"
          tabIndex={0}
          onClick={(event) => updateFromClientPoint(event.clientX, event.clientY)}
          onKeyDown={(event) => {
            if (!value) {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onChange({ x: 0, y: 0 });
              }
              return;
            }

            const step = 0.12;
            if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
              event.preventDefault();
              onChange({
                x: clamp(value.x + (event.key === "ArrowRight" ? step : event.key === "ArrowLeft" ? -step : 0), -1, 1),
                y: clamp(value.y + (event.key === "ArrowUp" ? step : event.key === "ArrowDown" ? -step : 0), -1, 1),
              });
            }
          }}
          className="relative aspect-square cursor-crosshair overflow-hidden rounded-2xl border border-stone-200 bg-[linear-gradient(180deg,rgba(245,245,245,0.95),rgba(255,255,255,1)),linear-gradient(90deg,rgba(248,248,248,0.95),rgba(255,255,255,1))] outline-none focus:ring-2 focus:ring-stone-200"
        >
          <div className="absolute inset-x-1/2 top-0 h-full w-px -translate-x-1/2 bg-stone-200" />
          <div className="absolute inset-y-1/2 left-0 h-px w-full -translate-y-1/2 bg-stone-200" />

          <div className="pointer-events-none absolute left-[calc(50%+10px)] top-3 text-[11px] text-stone-400">
            Expressive character
          </div>
          <div className="pointer-events-none absolute left-[calc(50%+10px)] bottom-3 text-[11px] text-stone-400">
            Functional clarity
          </div>
          <div className="pointer-events-none absolute left-3 top-[calc(50%+10px)] text-[11px] text-stone-400">
            Familiar
          </div>
          <div className="pointer-events-none absolute right-3 top-[calc(50%+10px)] text-[11px] text-stone-400">
            Insider
          </div>

          {options.map((option) => (
            <div
              key={option.id}
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/90 px-2 py-1 text-[11px] font-medium text-stone-500 shadow-sm"
              style={{
                left: `${((option.x + 1) / 2) * 100}%`,
                top: `${(1 - (option.y + 1) / 2) * 100}%`,
              }}
            >
              {option.title}
            </div>
          ))}

          {value ? (
            <div
              className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-black shadow-lg"
              style={{
                left: `${((value.x + 1) / 2) * 100}%`,
                top: `${(1 - (value.y + 1) / 2) * 100}%`,
              }}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
