import { cx } from "@/components/ui";
import type { ComponentProps } from "react";

/** Pojedyncze pole formularza logowania/rejestracji. */
export default function AuthField({
  label,
  hint,
  className,
  ...props
}: { label: string; hint?: string } & ComponentProps<"input">) {
  return (
    <div>
      <label htmlFor={props.id} className="mb-1.5 block text-sm font-semibold text-ink">
        {label}
      </label>
      <input
        {...props}
        className={cx(
          "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-ink placeholder:text-slate-400 transition focus:outline-2 focus:-outline-offset-1 focus:outline-brand-600",
          className,
        )}
      />
      {hint ? <p className="mt-1.5 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}
