interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  placeholder?: string;
  caption?: string;
}

export default function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  caption,
}: SelectFieldProps) {
  const commonClassName =
    "w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200 appearance-none";

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-stone-800">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={commonClassName}
        >
          {placeholder && (
            <option value="" disabled className="text-stone-400">
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-stone-500">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </div>
      </div>
      {caption ? <p className="text-xs leading-5 text-stone-500">{caption}</p> : null}
    </div>
  );
}
