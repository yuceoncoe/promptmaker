interface ToggleFieldProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
}

export default function ToggleField({ label, checked, onChange, description }: ToggleFieldProps) {
  return (
    <label className="flex items-start justify-between gap-4 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
      <div>
        <div className="text-sm font-medium text-stone-900">{label}</div>
        {description ? <p className="mt-1 text-xs leading-5 text-stone-500">{description}</p> : null}
      </div>
      <button
        type="button"
        aria-pressed={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={[
          "relative mt-0.5 h-7 w-12 rounded-full transition",
          checked ? "bg-black" : "bg-stone-300",
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-1 h-5 w-5 rounded-full bg-white transition",
            checked ? "left-6" : "left-1",
          ].join(" ")}
        />
      </button>
    </label>
  );
}
