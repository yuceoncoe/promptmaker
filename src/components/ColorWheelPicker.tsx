import React from 'react';

interface ColorWheelPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

const COLOR_CATEGORIES = [
  {
    name: "Monochrome & Neutrals",
    colors: [
      { hex: "#ffffff", label: "pure white" },
      { hex: "#f8fafc", label: "cool off-white" },
      { hex: "#fef3c7", label: "warm cream" },
      { hex: "#e5e7eb", label: "light gray" },
      { hex: "#9ca3af", label: "medium gray" },
      { hex: "#374151", label: "dark charcoal" },
      { hex: "#000000", label: "pure black" },
    ]
  },
  {
    name: "Vibrant & Base",
    colors: [
      { hex: "#ef4444", label: "vibrant red" },
      { hex: "#f97316", label: "vibrant orange" },
      { hex: "#eab308", label: "vibrant yellow" },
      { hex: "#22c55e", label: "vibrant green" },
      { hex: "#06b6d4", label: "vibrant cyan" },
      { hex: "#3b82f6", label: "vibrant blue" },
      { hex: "#a855f7", label: "vibrant purple" },
    ]
  },
  {
    name: "Pastel & Soft",
    colors: [
      { hex: "#fecdd3", label: "pastel pink" },
      { hex: "#fdba74", label: "soft orange" },
      { hex: "#fde047", label: "soft yellow" },
      { hex: "#bbf7d0", label: "pastel green" },
      { hex: "#5eead4", label: "mint green" },
      { hex: "#bfdbfe", label: "pastel blue" },
      { hex: "#c084fc", label: "soft purple" },
    ]
  },
  {
    name: "Deep & Rich",
    colors: [
      { hex: "#7f1d1d", label: "deep burgundy" },
      { hex: "#9a3412", label: "burnt orange" },
      { hex: "#713f12", label: "deep bronze" },
      { hex: "#064e3b", label: "deep forest green" },
      { hex: "#164e63", label: "deep teal" },
      { hex: "#1e3a8a", label: "deep navy" },
      { hex: "#4c1d95", label: "deep plum" },
    ]
  }
];

export const ColorWheelPicker: React.FC<ColorWheelPickerProps> = ({
  label,
  value,
  onChange,
}) => {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-stone-700">{label}</label>
      
      <div className="flex flex-col gap-4 mt-1">
        {COLOR_CATEGORIES.map((category) => (
          <div key={category.name} className="flex flex-col gap-2">
            <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">{category.name}</span>
            <div className="flex flex-wrap items-center gap-3">
              {category.colors.map(({ hex, label: colorLabel }) => (
                <button
                  key={hex}
                  onClick={() => onChange(colorLabel)}
                  className={`h-8 w-8 rounded-full border-2 focus:outline-none focus:ring-2 focus:ring-stone-500 focus:ring-offset-2 transition-all ${
                    value.toLowerCase() === colorLabel.toLowerCase()
                      ? 'border-stone-900 scale-110 shadow-md'
                      : 'border-stone-200 hover:scale-105'
                  }`}
                  style={{ backgroundColor: hex }}
                  title={colorLabel}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      
      {value && (
        <p className="text-xs text-stone-500 mt-2 capitalize">Selected: {value}</p>
      )}
    </div>
  );
};

