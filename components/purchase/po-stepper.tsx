"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export const STEPS = [
  { id: 1, label: "Supplier Info" },
  { id: 2, label: "Items" },
  { id: 3, label: "Pricing & Notes" },
  { id: 4, label: "Review & Submit" },
] as const;

interface POStepperProps {
  currentStep: number;
  className?: string;
}

export function POStepper({ currentStep, className }: POStepperProps) {
  return (
    <nav aria-label="Progress" className={className}>
      <ol className="flex items-center justify-between">
        {STEPS.map((step, index) => {
          const isComplete = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const isLast = index === STEPS.length - 1;
          return (
            <li
              key={step.id}
              className={cn(
                "relative flex flex-1 items-center",
                !isLast && "after:content-[''] after:absolute after:left-1/2 after:top-5 after:h-0.5 after:w-full after:bg-border"
              )}
            >
              <div className="relative z-10 flex flex-col items-center">
                <span
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors",
                    isComplete &&
                      "border-primary bg-primary text-primary-foreground",
                    isCurrent &&
                      "border-primary bg-background text-primary",
                    !isComplete &&
                      !isCurrent &&
                      "border-muted-foreground/30 bg-background text-muted-foreground"
                  )}
                >
                  {isComplete ? <Check className="h-5 w-5" /> : step.id}
                </span>
                <span
                  className={cn(
                    "mt-2 text-xs font-medium",
                    isCurrent ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
