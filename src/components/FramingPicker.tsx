import React from "react";

interface FramingPickerProps {
  value: string;
  onChange: (value: string) => void;
}

const ASPECT_RATIOS = [
  { label: "21:9 Cinematic", ratio: "21:9", cssRatio: "21 / 9" },
  { label: "16:9 Widescreen", ratio: "16:9", cssRatio: "16 / 9" },
  { label: "4:3 Standard", ratio: "4:3", cssRatio: "4 / 3" },
  { label: "1:1 Square", ratio: "1:1", cssRatio: "1 / 1" },
  { label: "3:4 Portrait", ratio: "3:4", cssRatio: "3 / 4" },
  { label: "9:16 Vertical", ratio: "9:16", cssRatio: "9 / 16" },
];

export default function FramingPicker({ value, onChange }: FramingPickerProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-medium text-stone-800">Framing / Aspect Ratio</label>
        {value && <span className="text-xs text-stone-400">{value}</span>}
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {ASPECT_RATIOS.map((item) => {
          const isSelected = value === item.ratio;
          
          const [w, h] = item.cssRatio.split(" / ").map(Number);
          const isWide = w > h;
          const baseSize = 24;
          let iconWidth, iconHeight;
          
          if (w === h) {
            iconWidth = baseSize;
            iconHeight = baseSize;
          } else if (isWide) {
            iconHeight = baseSize;
            iconWidth = baseSize * (w / h);
          } else {
            iconWidth = baseSize;
            iconHeight = baseSize * (h / w);
          }

          return (
            <button
              key={item.ratio}
              onClick={() => onChange(isSelected ? "" : item.ratio)}
              className={`flex flex-col items-center justify-center rounded-xl border p-2 transition-colors ${
                isSelected
                  ? "border-black bg-stone-100"
                  : "border-stone-200 bg-white hover:bg-stone-50"
              }`}
            >
              <div className="flex h-12 w-full items-center justify-center">
                <div
                  className={`border-2 rounded-[2px] ${
                    isSelected ? "border-black bg-black/5" : "border-stone-300 bg-stone-100"
                  }`}
                  style={{
                    width: `${iconWidth}px`,
                    height: `${iconHeight}px`,
                  }}
                />
              </div>
              <span
                className={`mt-2 text-[10px] font-medium leading-tight text-center ${
                  isSelected ? "text-black" : "text-stone-500"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
