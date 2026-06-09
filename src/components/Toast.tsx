interface ToastProps {
  message: string;
  type: "success" | "error";
}

export default function Toast({ message, type }: ToastProps) {
  return (
    <div
      className={[
        "rounded-2xl border px-4 py-3 text-sm shadow-lg",
        type === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
          : "border-rose-200 bg-rose-50 text-rose-900",
      ].join(" ")}
    >
      {message}
    </div>
  );
}
