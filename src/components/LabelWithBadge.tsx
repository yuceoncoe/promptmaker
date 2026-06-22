export default function LabelWithBadge({
  label,
  count = 0,
}: {
  label: string;
  count?: number;
}) {
  if (!label) return null;
  return (
    <div className="flex min-h-[24px] items-center gap-2">
      <label className="text-sm font-medium text-stone-800">{label}</label>
      {count > 0 ? (
        <span className="inline-flex items-center justify-center rounded-full border border-black bg-black px-2.5 py-0.5 text-[11px] font-medium text-white transition">
          {count}
        </span>
      ) : null}
    </div>
  );
}
