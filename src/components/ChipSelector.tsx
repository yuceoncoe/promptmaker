import { useMemo, useState, useEffect, useRef } from "react";
import { getChipLabel } from "../data/chipLabels";
import LabelWithBadge from "./LabelWithBadge";

interface ChipSelectorProps {
  label: string;
  selected: string[];
  options: readonly string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  allowCustom?: boolean;
  includeSelectedInOptions?: boolean;
  onAddCustom?: (value: string) => void;
  singleSelect?: boolean;
}

const normalize = (value: string) => value.trim();

export default function ChipSelector({
  label,
  selected,
  options,
  onChange,
  placeholder = "Add a custom value and press Enter",
  allowCustom = true,
  includeSelectedInOptions = true,
  onAddCustom,
  singleSelect = false,
}: ChipSelectorProps) {
  const [draft, setDraft] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isModalOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isModalOpen]);

  const allOptions = useMemo(() => {
    const source = includeSelectedInOptions ? [...options, ...selected] : [...options];
    const set = new Set(source.map(normalize).filter(Boolean));
    return Array.from(set);
  }, [includeSelectedInOptions, options, selected]);

  const toggleChip = (value: string) => {
    const normalized = normalize(value);
    if (!normalized) return;

    const exists = selected.some((item) => item === normalized);
    if (exists) {
      onChange(selected.filter((item) => item !== normalized));
    } else {
      onChange(singleSelect ? [normalized] : [...selected, normalized]);
    }
  };

  const submitCustomChip = () => {
    const normalized = normalize(draft);
    if (!normalized || selected.includes(normalized)) {
      setDraft("");
      return;
    }

    if (onAddCustom) {
      onAddCustom(normalized);
    } else {
      onChange(singleSelect ? [normalized] : [...selected, normalized]);
    }
    
    setDraft("");
    setIsModalOpen(false);
  };

  const activeCount = selected.filter((item) => allOptions.includes(item)).length;

  return (
    <div className="space-y-3">
      <LabelWithBadge label={label} count={activeCount} />
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
              {getChipLabel(option)}
            </button>
          );
        })}
        {allowCustom && (
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="rounded-full border border-dashed border-stone-300 px-3 py-1.5 text-sm text-stone-500 transition hover:bg-stone-50 hover:text-stone-900"
          >
            + 직접 추가
          </button>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-bold text-stone-900">커스텀 항목 추가</h3>
            <input
              ref={inputRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  submitCustomChip();
                } else if (event.key === "Escape") {
                  setIsModalOpen(false);
                }
              }}
              placeholder={placeholder}
              className="w-full rounded-xl border border-stone-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
            />
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl px-4 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-100"
              >
                취소
              </button>
              <button
                type="button"
                onClick={submitCustomChip}
                className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-800"
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
