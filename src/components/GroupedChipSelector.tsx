import { useMemo, useState } from "react";
import ChipSelector from "./ChipSelector";

interface GroupedChipSelectorProps {
  label: string;
  selected: string[];
  groups: Record<string, readonly string[]>;
  onChange: (value: string[]) => void;
  placeholder?: string;
  collapsibleSections?: Record<string, string[]>;
  singleSelect?: boolean;
}

export default function GroupedChipSelector({
  label,
  selected,
  groups,
  onChange,
  placeholder,
  collapsibleSections = {},
  singleSelect = false,
}: GroupedChipSelectorProps) {
  const [groupAssignments, setGroupAssignments] = useState<Record<string, string>>({});
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(
    Object.fromEntries(Object.keys(collapsibleSections).map((sectionName) => [sectionName, false]))
  );

  const knownOptions = useMemo(
    () => new Set(Object.values(groups).flatMap((options) => options.map((option) => option.trim()))),
    [groups]
  );
  
  const customSelected = selected.filter((item) => !knownOptions.has(item.trim()));
  const unassignedCustom = customSelected.filter((item) => !groupAssignments[item]);

  const sectionGroupNames = new Set(Object.values(collapsibleSections).flat());
  const standaloneGroups = Object.entries(groups).filter(([groupName]) => !sectionGroupNames.has(groupName));

  const fallbackGroupName = standaloneGroups.length > 0 
    ? standaloneGroups[0][0] 
    : Object.keys(groups)[0];

  const addCustomValueToGroup = (groupName: string, value: string) => {
    const normalized = value.trim();
    if (!normalized || selected.includes(normalized)) return;

    setGroupAssignments((current) => ({
      ...current,
      [normalized]: groupName,
    }));
    onChange(singleSelect ? [normalized] : [...selected, normalized]);
  };

  return (
    <div className="space-y-4">
      <label className="text-sm font-medium text-stone-800">{label}</label>
      <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
        <div className="space-y-6">
          {standaloneGroups.map(([groupName, options]) => {
            const groupedCustomOptions = customSelected.filter((item) => groupAssignments[item] === groupName);
            const combinedOptions = groupName === fallbackGroupName 
              ? [...options, ...groupedCustomOptions, ...unassignedCustom]
              : [...options, ...groupedCustomOptions];

            return (
              <div key={groupName} className="space-y-3">
                <div className="flex min-h-[24px] items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-normal text-stone-500">{groupName}</span>
                  {selected.filter((item) => combinedOptions.includes(item)).length > 0 ? (
                    <span className="inline-flex items-center justify-center rounded-full border border-black bg-black px-2.5 py-0.5 text-[11px] font-medium text-white transition">
                      {selected.filter((item) => combinedOptions.includes(item)).length}
                    </span>
                  ) : null}
                </div>
                <ChipSelector
                  label=""
                  selected={selected}
                  options={combinedOptions}
                  onChange={onChange}
                  allowCustom={true}
                  onAddCustom={(val) => addCustomValueToGroup(groupName, val)}
                  includeSelectedInOptions={false}
                  placeholder={placeholder}
                  singleSelect={singleSelect}
                />
              </div>
            );
          })}
          {Object.entries(collapsibleSections).map(([sectionName, nestedGroupNames]) => (
            <div key={sectionName} className="space-y-3">
              <button
                type="button"
                onClick={() =>
                  setOpenSections((current) => ({
                    ...current,
                    [sectionName]: !current[sectionName],
                  }))
                }
                className="flex w-full items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white px-3 py-2 text-left"
              >
                <span className="text-xs font-semibold uppercase tracking-normal text-stone-500">{sectionName}</span>
                <span className="text-xs text-stone-500">{openSections[sectionName] ? "숨기기" : "보기"}</span>
              </button>
              {openSections[sectionName] ? (
                <div className="space-y-6 rounded-xl border border-stone-200 bg-white p-4">
                  {nestedGroupNames.map((groupName) => {
                    const options = groups[groupName] ?? [];
                    const groupedCustomOptions = customSelected.filter((item) => groupAssignments[item] === groupName);
                    const combinedOptions = groupName === fallbackGroupName
                      ? [...options, ...groupedCustomOptions, ...unassignedCustom]
                      : [...options, ...groupedCustomOptions];

                    return (
                      <div key={groupName} className="space-y-3">
                        <div className="flex min-h-[24px] items-center gap-2">
                          <span className="text-xs font-semibold uppercase tracking-normal text-stone-500">{groupName}</span>
                          {selected.filter((item) => combinedOptions.includes(item)).length > 0 ? (
                            <span className="inline-flex items-center justify-center rounded-full border border-black bg-black px-2.5 py-0.5 text-[11px] font-medium text-white transition">
                              {selected.filter((item) => combinedOptions.includes(item)).length}
                            </span>
                          ) : null}
                        </div>
                        <ChipSelector
                          label=""
                          selected={selected}
                          options={combinedOptions}
                          onChange={onChange}
                          allowCustom={true}
                          onAddCustom={(val) => addCustomValueToGroup(groupName, val)}
                          includeSelectedInOptions={false}
                          placeholder={placeholder}
                          singleSelect={singleSelect}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
