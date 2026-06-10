import { presetLabels, presetNames } from "../data/presets";

interface PresetSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function PresetSelector({ value, onChange }: PresetSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-stone-800">Preset</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
      >
        {presetNames.map((presetName) => (
          <option key={presetName} value={presetName}>
            {presetLabels[presetName] ?? presetName}
          </option>
        ))}
      </select>
    </div>
  );
}
