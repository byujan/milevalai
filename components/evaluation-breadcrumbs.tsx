"use client";

import Link from "next/link";
import { Check } from "lucide-react";

export type EvaluationStep =
  | "predecessor"
  | "admin"
  | "bullets"
  | "rater"
  | "senior-rater"
  | "review"
  | "export";

interface Step {
  id: EvaluationStep;
  name: string;
  href: (id: string) => string;
}

const steps: Step[] = [
  { id: "predecessor", name: "Upload Predecessor", href: (id) => `/evaluation/${id}/predecessor` },
  { id: "admin", name: "Admin Data", href: (id) => `/evaluation/${id}/admin` },
  { id: "bullets", name: "Bullets", href: (id) => `/evaluation/${id}/bullets` },
  { id: "rater", name: "Rater", href: (id) => `/evaluation/${id}/rater` },
  { id: "senior-rater", name: "Senior Rater", href: (id) => `/evaluation/${id}/senior-rater` },
  { id: "review", name: "Review", href: (id) => `/evaluation/${id}/review` },
  { id: "export", name: "Export", href: (id) => `/evaluation/${id}/export` },
];

interface EvaluationBreadcrumbsProps {
  evaluationId: string;
  currentStep: EvaluationStep;
  completedSteps?: EvaluationStep[];
}

export default function EvaluationBreadcrumbs({
  evaluationId,
  currentStep,
  completedSteps = [],
}: EvaluationBreadcrumbsProps) {
  const currentStepIndex = steps.findIndex((step) => step.id === currentStep);

  return (
    <nav aria-label="Progress" className="bg-black border-b border-white/10 py-4 w-full">
      <ol role="list" className="flex items-center justify-center gap-2 flex-wrap px-4">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id) || index < currentStepIndex;
          const isCurrent = step.id === currentStep;
          const isAccessible = index <= currentStepIndex;

          return (
            <li key={step.id} className="flex items-center gap-2">
              {index > 0 && (
                <div
                  className={`h-0.5 w-8 ${
                    isCompleted ? "bg-green-600" : "bg-white/20"
                  }`}
                />
              )}
              {isAccessible ? (
                <Link
                  href={step.href(evaluationId)}
                  className={`group flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isCurrent
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/50"
                      : isCompleted
                      ? "bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/20"
                      : "bg-white/5 text-white hover:bg-white/10 border border-white/10"
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                      isCurrent
                        ? "bg-white text-blue-600"
                        : isCompleted
                        ? "bg-green-600 text-white"
                        : "bg-white/20 text-white"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      index + 1
                    )}
                  </span>
                  <span className="hidden sm:inline whitespace-nowrap">{step.name}</span>
                </Link>
              ) : (
                <div
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 cursor-not-allowed opacity-50"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/5 text-xs text-gray-600">
                    {index + 1}
                  </span>
                  <span className="hidden sm:inline whitespace-nowrap">{step.name}</span>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
