"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { CheckIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StepperProps {
  steps: { label: string; description?: string }[];
  currentStep: number;
  className?: string;
}

export function Stepper({
  steps,
  currentStep,
  className,
}: StepperProps) {
  return (
    <div className={cn("flex w-full items-center gap-2", className)}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;
        const isLast = index === steps.length - 1;

        return (
          <React.Fragment key={index}>
            <div className="flex flex-col items-center flex-1">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors",
                  isCompleted
                    ? "border-primary bg-primary text-primary-foreground"
                    : isActive
                    ? "border-primary text-primary"
                    : "border-muted-foreground/30 text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <CheckIcon className="size-4" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <span
                className={cn(
                  "mt-2 text-[10px] font-medium uppercase tracking-wider text-center",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div
                className={cn(
                  "h-0.5 flex-1 transition-colors",
                  isCompleted ? "bg-primary" : "bg-muted-foreground/20"
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export function StepperButtons({
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  onFinish,
  isPending = false,
  nextLabel = "Next",
  prevLabel = "Back",
  finishLabel = "Finish",
}: {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  onFinish: () => void;
  isPending?: boolean;
  nextLabel?: string;
  prevLabel?: string;
  finishLabel?: string;
}) {
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <div className="flex justify-end gap-2">
      {!isFirstStep && (
        <Button variant="outline" onClick={onPrevious} disabled={isPending}>
          {prevLabel}
        </Button>
      )}
      {isLastStep ? (
        <Button onClick={onFinish} disabled={isPending}>
          {isPending && <Loader2Icon className="mr-2 size-3.5 animate-spin" />}
          {finishLabel}
        </Button>
      ) : (
        <Button onClick={onNext} disabled={isPending}>
          {nextLabel}
        </Button>
      )}
    </div>
  );
}
