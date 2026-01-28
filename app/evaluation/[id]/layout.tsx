"use client";

import { useParams, usePathname } from "next/navigation";
import EvaluationBreadcrumbs, { EvaluationStep } from "@/components/evaluation-breadcrumbs";
import AppHeader from "@/components/app-header";

export default function EvaluationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const evaluationId = params.id as string;

  // Determine current step from pathname
  const getCurrentStep = (): EvaluationStep | null => {
    if (pathname.includes("/predecessor")) return "predecessor";
    if (pathname.includes("/admin")) return "admin";
    if (pathname.includes("/bullets")) return "bullets";
    if (pathname.includes("/rater")) return "rater";
    if (pathname.includes("/senior-rater")) return "senior-rater";
    if (pathname.includes("/review")) return "review";
    if (pathname.includes("/export")) return "export";
    return null;
  };

  const currentStep = getCurrentStep();

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="sticky top-0 z-40 bg-black">
        <AppHeader />
        {currentStep && (
          <EvaluationBreadcrumbs
            evaluationId={evaluationId}
            currentStep={currentStep}
          />
        )}
      </div>
      <div>
        {children}
      </div>
    </div>
  );
}
