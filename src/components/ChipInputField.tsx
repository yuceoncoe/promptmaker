import React, { useState, KeyboardEvent } from 'react';
import { getChipLabel } from "../data/chipLabels";

const XMarkIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const PlusIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

interface ChipInputFieldProps {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  suggestions?: readonly string[];
  caption?: string;
}

export default function ChipInputField({
  label,
  value,
  onChange,
  placeholder,
  suggestions = [],
  caption,
}: ChipInputFieldProps) {
  const [inputValue, setInputValue] = useState("");

  const handleAdd = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInputValue("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  const handleRemove = (chipToRemove: string) => {
    onChange(value.filter((chip) => chip !== chipToRemove));
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (value.includes(suggestion)) {
      handleRemove(suggestion);
    } else {
      onChange([...value, suggestion]);
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-stone-800">{label}</label>
      
      {/* Selected Chips */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((chip) => (
            <div
              key={chip}
              className="flex items-center gap-1.5 rounded-full bg-stone-900 px-3 py-1 text-sm text-white shadow-sm"
            >
              <span>{getChipLabel(chip)}</span>
              <button
                type="button"
                onClick={() => handleRemove(chip)}
                className="rounded-full p-0.5 hover:bg-stone-700 transition-colors"
                aria-label={`Remove ${chip}`}
              >
                <XMarkIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Field with Add Button */}
      <div className="relative flex items-center">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleAdd}
          placeholder={placeholder}
          className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 pr-12 text-sm text-stone-900 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
        />
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleAdd}
          disabled={!inputValue.trim()}
          className="absolute right-1.5 p-1.5 text-stone-400 hover:text-stone-900 disabled:opacity-50 transition-colors"
          aria-label="Add"
        >
          <PlusIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-1">
          {suggestions.map((suggestion) => {
            const active = value.includes(suggestion);
            return (
              <button
                key={suggestion}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSuggestionClick(suggestion);
                }}
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
      )}

      {caption && <p className="text-xs leading-5 text-stone-500 mt-1">{caption}</p>}
    </div>
  );
}
