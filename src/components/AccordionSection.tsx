import { useState } from "react";

interface AccordionSectionProps {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  badgeCount?: number;
  children: React.ReactNode;
}

export default function AccordionSection({
  title,
  description,
  defaultOpen = true,
  badgeCount = 0,
  children,
}: AccordionSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className="rounded-2xl border border-stone-200 bg-white shadow-panel">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-stone-900">{title}</h2>
            {badgeCount > 0 ? (
              <span className="inline-flex items-center justify-center rounded-full border border-black bg-black px-2.5 py-0.5 text-[11px] font-medium text-white transition">
                {badgeCount}
              </span>
            ) : null}
          </div>
          {description ? <p className="mt-1 text-sm text-stone-500">{description}</p> : null}
        </div>
        <span className="text-xl leading-none text-stone-400">{isOpen ? "−" : "+"}</span>
      </button>
      {isOpen ? <div className="border-t border-stone-100 px-5 py-5">{children}</div> : null}
    </section>
  );
}
