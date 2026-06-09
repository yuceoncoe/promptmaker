import type { InsideObject } from "../types/prompt";

interface NestedObjectListProps {
  items: InsideObject[];
  onChange: (items: InsideObject[]) => void;
}

const emptyItem = (): InsideObject => ({
  name: "",
  description: "",
  material: "",
});

export default function NestedObjectList({ items, onChange }: NestedObjectListProps) {
  const updateItem = (index: number, key: keyof InsideObject, value: string) => {
    onChange(items.map((item, itemIndex) => (itemIndex === index ? { ...item, [key]: value } : item)));
  };

  const deleteItem = (index: number) => {
    onChange(items.filter((_, itemIndex) => itemIndex !== index));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-medium text-stone-800">Inside Objects</label>
        <button
          type="button"
          onClick={() => onChange([...items, emptyItem()])}
          className="rounded-xl border border-stone-200 bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-700"
        >
          Add Object
        </button>
      </div>
      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-stone-200 bg-stone-50 px-4 py-6 text-sm text-stone-500">
            Add nested objects when the prompt needs internal items or layered elements.
          </div>
        ) : null}
        {items.map((item, index) => (
          <div key={`${index}-${item.name}`} className="rounded-xl border border-stone-200 bg-stone-50 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-medium text-stone-800">Object {index + 1}</h3>
              <button
                type="button"
                onClick={() => deleteItem(index)}
                className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-600 transition hover:border-stone-300 hover:text-stone-900"
              >
                Delete
              </button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <input
                value={item.name}
                onChange={(event) => updateItem(index, "name", event.target.value)}
                placeholder="Name"
                className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
              />
              <input
                value={item.material}
                onChange={(event) => updateItem(index, "material", event.target.value)}
                placeholder="Material"
                className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
              />
            </div>
            <textarea
              value={item.description}
              onChange={(event) => updateItem(index, "description", event.target.value)}
              placeholder="Description"
              rows={3}
              className="mt-3 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-stone-400 focus:ring-2 focus:ring-stone-200"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
