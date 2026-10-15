import { Check, X } from "lucide-react";
import { cx } from "@/components/ui";

export const passwordRules = [
  { label: "co najmniej 8 znaków", test: (v: string) => v.length >= 8 },
  { label: "co najmniej jedna litera", test: (v: string) => /[a-zA-Z]/.test(v) },
  { label: "co najmniej jedna cyfra", test: (v: string) => /\d/.test(v) },
];

/** Lista reguł hasła z podświetleniem spełnionych — używana przy rejestracji i resecie hasła. */
export default function PasswordRulesList({ password }: { password: string }) {
  return (
    <ul className="mt-1.5 grid gap-1">
      {passwordRules.map((rule) => {
        const ok = rule.test(password);
        return (
          <li
            key={rule.label}
            className={cx(
              "flex items-center gap-1.5 text-xs",
              ok ? "text-emerald-700" : "text-slate-500",
            )}
          >
            {ok ? (
              <Check className="size-3.5 shrink-0" />
            ) : (
              <X className="size-3.5 shrink-0 text-slate-300" />
            )}
            {rule.label}
          </li>
        );
      })}
    </ul>
  );
}
