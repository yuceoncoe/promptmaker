interface PromptSectionProps {
  title: string;
  children: React.ReactNode;
}

export default function PromptSection({ title, children }: PromptSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-stone-900">{title}</h3>
      {children}
    </div>
  );
}
