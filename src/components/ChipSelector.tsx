import { useMemo, useState } from "react";

interface ChipSelectorProps {
  label: string;
  selected: string[];
  options: readonly string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  allowCustom?: boolean;
}

const normalize = (value: string) => value.trim();

export default function ChipSelector({
  label,
  selected,
  options,
  onChange,
  placeholder = "Add a custom value and press Enter",
  allowCustom = true,
}: ChipSelectorProps) {
  const [draft, setDraft] = useState("");

  const allOptions = useMemo(() => {
    const set = new Set([...options, ...selected].map(normalize).filter(Boolean));
    return Array.from(set);
  }, [options, selected]);

  const toggleChip = (value: string) => {
    const normalized = normalize(value);
    if (!normalized) return;

    const exists = selected.some((item) => item === normalized);
    onChange(exists ? selected.filter((item) => item !== normalized) : [...selected, normalized]);
  };

  const submitCustomChip = () => {
    const normalized = normalize(draft);
    if (!normalized || selected.includes(normalized)) {
      setDraft("");
      return;
    }

    onChange([...selected, normalized]);
    setDraft("");
  };

  return (
    <div className="space-y-3">
      {label ? (
        <div className="flex items-center justify-between gap-3">
          <label className="text-sm font-medium text-stone-800">{label}</label>
          <span className="text-xs text-stone-400">{selected.length} selected</span>
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {allOptions.map((option) => {
          const active = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => toggleChip(option)}
              className={[
                "rounded-full border px-3 py-1.5 text-sm transition",
                active
                  ? "border-black bg-black text-white"
                  : "border-stone-200 bg-stone-100 text-stone-700 hover:bg-stone-200",
              ].join(" ")}
            >
              {option}
            </button>
          );
        })}
      </div>
      {allowCustom ? (
        <div className="flex gap-2">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                submitCustomChip();
              }
            }}
            placeholder={placeholder}
            className="min-w-0 flex-1 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
          />
          <button
            type="button"
            onClick={submitCustomChip}
            className="rounded-xl border border-stone-200 bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-700"
          >
            Add
          </button>
        </div>
      ) : null}
    </div>
  );
}
