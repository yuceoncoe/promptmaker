import { getChipLabel } from "../data/chipLabels";
import LabelWithBadge from "./LabelWithBadge";

interface TextInputFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  suggestions?: readonly string[];
  caption?: string;
}

export default function TextInputField({
  label,
  value,
  onChange,
  placeholder,
  multiline = false,
  suggestions = [],
  caption,
}: TextInputFieldProps) {
  const commonClassName =
    "w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200";

  return (
    <div className="space-y-3">
      <LabelWithBadge label={label} count={value.trim().length > 0 ? 1 : 0} />
      {multiline ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          rows={4}
          className={commonClassName}
        />
      ) : (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={commonClassName}
        />
      )}
      {suggestions.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion) => {
            const active = value === suggestion;
            return (
              <button
                key={suggestion}
                type="button"
                onClick={() => onChange(active ? "" : suggestion)}
                className={[
                  "rounded-full border px-3 py-1.5 text-sm transition",
                  active
                    ? "border-black bg-black text-white"
                    : "border-stone-200 bg-stone-100 text-stone-700 hover:bg-stone-200",
                ].join(" ")}
              >
                {getChipLabel(suggestion)}
              </button>
            );
          })}
        </div>
      ) : null}
      {caption ? <p className="text-xs leading-5 text-stone-500">{caption}</p> : null}
    </div>
  );
}
