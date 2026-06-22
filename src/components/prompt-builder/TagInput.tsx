import { useMemo, useState } from "react";
import { uniqueStrings } from "../../lib/prompt-utils";

interface TagInputProps {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  suggestions?: readonly string[];
  caption?: string;
}

export default function TagInput({
  label,
  values,
  onChange,
  placeholder = "값을 입력하고 Enter를 누르세요",
  suggestions = [],
  caption,
}: TagInputProps) {
  const [draft, setDraft] = useState("");

  const allSuggestions = useMemo(() => uniqueStrings([...suggestions, ...values]), [suggestions, values]);

  const addTag = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onChange(uniqueStrings([...values, trimmed]));
    setDraft("");
  };

  const removeTag = (value: string) => {
    onChange(values.filter((item) => item.toLowerCase() !== value.toLowerCase()));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-medium text-stone-800">{label}</label>
        <span className="text-xs text-stone-400">{values.length} items</span>
      </div>
      {values.length ? (
        <div className="flex flex-wrap gap-2">
          {values.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => removeTag(value)}
              className="rounded-full border border-black bg-black px-3 py-1.5 text-sm text-white transition hover:bg-stone-800"
            >
              {value}
            </button>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-stone-200 bg-white px-3 py-4 text-sm text-stone-500">
          아직 추가된 항목이 없습니다.
        </div>
      )}
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addTag(draft);
            }
          }}
          placeholder={placeholder}
          className="min-w-0 flex-1 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
        />
        <button
          type="button"
          onClick={() => addTag(draft)}
          className="rounded-xl border border-stone-200 bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-700"
        >
          추가
        </button>
      </div>
      {allSuggestions.length ? (
        <div className="flex flex-wrap gap-2">
          {allSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => addTag(suggestion)}
              className="rounded-full border border-stone-200 bg-stone-100 px-3 py-1.5 text-sm text-stone-700 transition hover:bg-stone-200"
            >
              {suggestion}
            </button>
          ))}
        </div>
      ) : null}
      {caption ? <p className="text-xs leading-5 text-stone-500">{caption}</p> : null}
    </div>
  );
}
