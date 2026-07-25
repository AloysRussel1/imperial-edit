import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

interface StepperProps {
  steps: string[];
  currentStep: number;
}

export function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <ol className="flex items-center justify-between gap-2">
      {steps.map((label, index) => {
        const stepNumber = index + 1;
        const isDone = stepNumber < currentStep;
        const isActive = stepNumber === currentStep;
        return (
          <li key={label} className="flex flex-1 items-center gap-2">
            <div
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-medium transition-colors",
                isDone && "border-imperial-gold bg-imperial-gold text-imperial-black",
                isActive && !isDone && "border-imperial-gold text-imperial-gold",
                !isDone && !isActive && "border-imperial-black/15 text-imperial-black/40"
              )}
            >
              {isDone ? <Check className="h-4 w-4" /> : stepNumber}
            </div>
            <span
              className={cn(
                "hidden text-xs uppercase tracking-wide sm:block",
                isActive ? "text-imperial-black" : "text-imperial-black/40"
              )}
            >
              {label}
            </span>
            {stepNumber < steps.length ? (
              <div className={cn("mx-1 h-px flex-1", isDone ? "bg-imperial-gold" : "bg-imperial-black/10")} />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
