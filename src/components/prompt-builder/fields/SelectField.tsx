interface SelectFieldProps<T extends string> {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: Array<{ label: string; value: T }>;
  caption?: string;
}

export default function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
  caption,
}: SelectFieldProps<T>) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-stone-800">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {caption ? <p className="text-xs leading-5 text-stone-500">{caption}</p> : null}
    </div>
  );
}
