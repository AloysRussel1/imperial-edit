import { cn } from "@/lib/utils";

type StrengthLabel = "Faible" | "Moyen" | "Fort";

function computeStrength(password: string): { score: number; label: StrengthLabel } {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  const label: StrengthLabel = score <= 2 ? "Faible" : score <= 3 ? "Moyen" : "Fort";
  return { score, label };
}

const STRENGTH_STYLES: Record<StrengthLabel, { bar: string; text: string }> = {
  Faible: { bar: "bg-red-600", text: "text-red-700" },
  Moyen: { bar: "bg-amber-500", text: "text-amber-700" },
  Fort: { bar: "bg-emerald-600", text: "text-emerald-700" },
};

interface PasswordStrengthMeterProps {
  password: string;
}

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  if (!password) return null;

  const { score, label } = computeStrength(password);
  const percent = Math.min((score / 5) * 100, 100);
  const styles = STRENGTH_STYLES[label];

  return (
    <div className="space-y-1">
      <div className="flex h-1.5 w-full gap-1 overflow-hidden rounded-full bg-imperial-black/10">
        <div
          className={cn("h-full rounded-full transition-all duration-300", styles.bar)}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className={cn("text-xs font-medium", styles.text)}>Force du mot de passe : {label}</p>
    </div>
  );
}
