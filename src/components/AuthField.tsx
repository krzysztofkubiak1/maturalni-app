"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cx } from "@/components/ui";
import type { ComponentProps } from "react";

/** Pojedyncze pole formularza logowania/rejestracji. Pole hasła dostaje oczko do podglądu. */
export default function AuthField({
  label,
  hint,
  className,
  ...props
}: { label: string; hint?: string } & ComponentProps<"input">) {
  const [visible, setVisible] = useState(false);
  const isPassword = props.type === "password";

  return (
    <div>
      <label htmlFor={props.id} className="mb-1.5 block text-sm font-semibold text-ink">
        {label}
      </label>
      <div className="relative">
        <input
          {...props}
          type={isPassword && visible ? "text" : props.type}
          className={cx(
            "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-ink placeholder:text-slate-400 transition focus:outline-2 focus:-outline-offset-1 focus:outline-brand-600",
            isPassword && "pr-11",
            className,
          )}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Ukryj hasło" : "Pokaż hasło"}
            className="absolute inset-y-0 right-0 grid w-11 place-items-center text-slate-400 transition hover:text-slate-600"
          >
            {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        ) : null}
      </div>
      {hint ? <p className="mt-1.5 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}
