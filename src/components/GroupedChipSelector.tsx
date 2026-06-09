import { useMemo, useState } from "react";
import ChipSelector from "./ChipSelector";

interface GroupedChipSelectorProps {
  label: string;
  selected: string[];
  groups: Record<string, readonly string[]>;
  onChange: (value: string[]) => void;
  placeholder?: string;
  collapsibleGroups?: string[];
}

export default function GroupedChipSelector({
  label,
  selected,
  groups,
  onChange,
  placeholder,
  collapsibleGroups = [],
}: GroupedChipSelectorProps) {
  const [customDraft, setCustomDraft] = useState("");
  const [groupDrafts, setGroupDrafts] = useState<Record<string, string>>({});
  const [groupAssignments, setGroupAssignments] = useState<Record<string, string>>({});
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(collapsibleGroups.map((groupName) => [groupName, false]))
  );
  const knownOptions = useMemo(
    () => new Set(Object.values(groups).flatMap((options) => options.map((option) => option.trim()))),
    [groups]
  );
  const customSelected = selected.filter((item) => !knownOptions.has(item.trim()));

  const addGroupedCustomValue = (groupName: string) => {
    const normalized = (groupDrafts[groupName] ?? "").trim();
    if (!normalized || selected.includes(normalized)) {
      setGroupDrafts((current) => ({ ...current, [groupName]: "" }));
      return;
    }

    setGroupAssignments((current) => ({ ...current, [normalized]: groupName }));
    onChange([...selected, normalized]);
    setGroupDrafts((current) => ({ ...current, [groupName]: "" }));
  };

  const addCustomValue = () => {
    const normalized = customDraft.trim();
    if (!normalized || selected.includes(normalized)) {
      setCustomDraft("");
      return;
    }

    onChange([...selected, normalized]);
    setCustomDraft("");
  };

  const removeCustomValue = (value: string) => {
    setGroupAssignments((current) => {
      const next = { ...current };
      delete next[value];
      return next;
    });
    onChange(selected.filter((item) => item !== value));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-medium text-stone-800">{label}</label>
        <span className="text-xs text-stone-400">{selected.length} selected</span>
      </div>
      {Object.entries(groups).map(([groupName, options]) => {
        const groupedCustomOptions = customSelected.filter((item) => groupAssignments[item] === groupName);
        const combinedOptions = [...options, ...groupedCustomOptions];

        return (
        <div key={groupName} className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="text-xs font-semibold uppercase tracking-normal text-stone-500">{groupName}</div>
            {collapsibleGroups.includes(groupName) ? (
              <button
                type="button"
                onClick={() =>
                  setOpenGroups((current) => ({
                    ...current,
                    [groupName]: !current[groupName],
                  }))
                }
                className="rounded-lg border border-stone-200 bg-white px-2.5 py-1 text-xs text-stone-600 transition hover:border-stone-300 hover:text-stone-900"
              >
                {openGroups[groupName] ? "숨기기" : "보기"}
              </button>
            ) : null}
          </div>
          {!collapsibleGroups.includes(groupName) || openGroups[groupName] ? (
            combinedOptions.length > 0 ? (
              <ChipSelector label="" selected={selected} options={combinedOptions} onChange={onChange} allowCustom={false} />
            ) : (
              <div className="rounded-xl border border-dashed border-stone-200 bg-white px-3 py-4 text-sm text-stone-500">
                아직 추천 항목이 없습니다.
              </div>
            )
          ) : (
            <div className="rounded-xl border border-dashed border-stone-200 bg-white px-3 py-4 text-sm text-stone-500">
              펼치면 전체 항목을 볼 수 있습니다.
            </div>
          )}
          {!collapsibleGroups.includes(groupName) || openGroups[groupName] ? (
            <div className="mt-3 flex gap-2">
              <input
                value={groupDrafts[groupName] ?? ""}
                onChange={(event) =>
                  setGroupDrafts((current) => ({
                    ...current,
                    [groupName]: event.target.value,
                  }))
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addGroupedCustomValue(groupName);
                  }
                }}
                placeholder={placeholder}
                className="min-w-0 flex-1 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
              />
              <button
                type="button"
                onClick={() => addGroupedCustomValue(groupName)}
                className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
              >
                추가
              </button>
            </div>
          ) : null}
        </div>
      )})}
      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-3">
        <div className="mb-3 text-xs font-semibold uppercase tracking-normal text-stone-500">custom</div>
        {customSelected.length > 0 ? (
          <div className="mb-3 flex flex-wrap gap-2">
            {customSelected.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => removeCustomValue(item)}
                className="rounded-full border border-black bg-black px-3 py-1.5 text-sm text-white transition hover:bg-stone-800"
              >
                {item}
              </button>
            ))}
          </div>
        ) : (
          <div className="mb-3 rounded-xl border border-dashed border-stone-200 bg-white px-3 py-4 text-sm text-stone-500">
            아직 추가한 커스텀 항목이 없습니다.
          </div>
        )}
        <div className="flex gap-2">
          <input
            value={customDraft}
            onChange={(event) => setCustomDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                addCustomValue();
              }
            }}
            placeholder={placeholder}
            className="min-w-0 flex-1 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
          />
          <button
            type="button"
            onClick={addCustomValue}
            className="rounded-xl border border-stone-200 bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-700"
          >
            추가
          </button>
        </div>
      </div>
    </div>
  );
}
