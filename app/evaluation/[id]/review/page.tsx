"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Edit2,
  User,
  Users,
  Briefcase,
  Activity,
  FileText,
  Star,
  RefreshCw,
} from "lucide-react";
import {
  EvaluationFormData,
  EvaluationType,
  RankLevel,
  CategorizedBullet,
  ValidationResult,
  ValidationError,
} from "@/lib/types/database";
import {
  validateEvaluation,
  checkProhibitedContent,
  getFormNumber,
} from "@/lib/validation/evaluation-validator";

interface EvaluationData {
  id: string;
  duty_title: string;
  evaluation_type: EvaluationType;
  rank_level: RankLevel;
  status: string;
  form_data: EvaluationFormData | null;
  categorized_bullets: CategorizedBullet[] | null;
  rater_comments: string | null;
  senior_rater_comments: string | null;
  narrative: string | null;
}

// Section state type
interface SectionState {
  partI: boolean;
  partII: boolean;
  partIII: boolean;
  partIV: boolean;
  partV: boolean;
}

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const evaluationId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationData | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [narrativeWarnings, setNarrativeWarnings] = useState<ValidationError[]>([]);

  // Section expansion state - will be auto-expanded if errors exist
  const [expanded, setExpanded] = useState<SectionState>({
    partI: false,
    partII: false,
    partIII: false,
    partIV: true,
    partV: true,
  });

  // Auto-expand sections with errors
  useEffect(() => {
    if (!validation) return;

    const hasErrorInSection = (sectionFields: string[]) => {
      return validation.errors.some(error =>
        sectionFields.some(field => error.field.startsWith(field))
      );
    };

    // Check which sections have errors and expand them
    setExpanded(prev => ({
      partI: hasErrorInSection(['rated_personnel', 'period_covered', 'reason_for_submission']) || prev.partI,
      partII: hasErrorInSection(['rating_chain']) || prev.partII,
      partIII: hasErrorInSection(['duty_description']) || prev.partIII,
      partIV: hasErrorInSection(['fitness', 'rater_assessment']) || prev.partIV,
      partV: hasErrorInSection(['senior_rater_assessment']) || prev.partV,
    }));
  }, [validation]);

  // Load evaluation data
  useEffect(() => {
    const loadEvaluation = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("evaluations")
        .select("*")
        .eq("id", evaluationId)
        .single();

      if (error) {
        console.error("Error loading evaluation:", error);
        router.push("/dashboard");
        return;
      }

      setEvaluation(data as EvaluationData);

      // Run validation
      if (data.form_data) {
        const result = validateEvaluation(
          data.form_data as EvaluationFormData,
          data.evaluation_type,
          data.rank_level
        );
        setValidation(result);
      }

      // Check narratives for prohibited content
      const warnings: ValidationError[] = [];
      if (data.rater_comments) {
        warnings.push(...checkProhibitedContent(data.rater_comments).map(e => ({
          ...e,
          field: 'rater_comments',
        })));
      }
      if (data.senior_rater_comments) {
        warnings.push(...checkProhibitedContent(data.senior_rater_comments).map(e => ({
          ...e,
          field: 'senior_rater_comments',
        })));
      }
      setNarrativeWarnings(warnings);

      setLoading(false);
    };

    loadEvaluation();
  }, [evaluationId, router]);

  // Toggle section
  const toggleSection = (section: keyof SectionState) => {
    setExpanded((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Handle export
  const handleExport = async () => {
    setSaving(true);

    const supabase = createClient();
    const { error } = await supabase
      .from("evaluations")
      .update({ status: "completed" })
      .eq("id", evaluationId);

    if (error) {
      console.error("Error updating evaluation:", error);
    }

    router.push(`/evaluation/${evaluationId}/export`);
  };

  // Calculate overall readiness
  const getReadinessStatus = () => {
    if (!validation) return { ready: false, message: "Validating..." };

    const criticalErrors = validation.errors.filter((e) => e.severity === "error");
    const hasRaterComments = !!evaluation?.rater_comments;
    const hasSRComments = !!evaluation?.senior_rater_comments;
    const hasBullets = (evaluation?.categorized_bullets?.length || 0) > 0;

    if (criticalErrors.length > 0) {
      return {
        ready: false,
        message: `${criticalErrors.length} critical error(s) must be fixed`,
      };
    }

    if (!hasRaterComments) {
      return { ready: false, message: "Rater comments are required" };
    }

    if (!hasSRComments) {
      return { ready: false, message: "Senior Rater comments are required" };
    }

    if (!hasBullets) {
      return { ready: false, message: "At least one bullet is required" };
    }

    return {
      ready: true,
      message: `Ready for export${validation.warnings.length > 0 ? ` (${validation.warnings.length} warning(s))` : ""}`,
    };
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="text-center">
          <RefreshCw className="mx-auto mb-4 h-8 w-8 animate-spin text-blue-500" />
          <p className="text-gray-400">Loading evaluation for review...</p>
        </div>
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <p className="text-gray-400">Evaluation not found</p>
      </div>
    );
  }

  const formData = evaluation.form_data;
  const readiness = getReadinessStatus();
  const formNumber = getFormNumber(evaluation.evaluation_type, evaluation.rank_level);

  return (
    <div className="px-4 py-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <Link
          href={`/evaluation/${evaluationId}/senior-rater`}
          className="mb-8 inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Senior Rater
        </Link>

        <div className="mb-8">
          <div className="mb-4 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
              <FileText className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Review & Validation</h1>
              <p className="text-gray-400">
                {formNumber} - {evaluation.duty_title}
              </p>
            </div>
          </div>
        </div>

        {/* Validation Summary */}
        <div
          className={`mb-8 rounded-xl border p-6 ${
            readiness.ready
              ? "border-green-500/20 bg-green-500/10"
              : "border-yellow-500/20 bg-yellow-500/10"
          }`}
        >
          <div className="flex items-center gap-3">
            {readiness.ready ? (
              <CheckCircle className="h-6 w-6 text-green-400" />
            ) : (
              <AlertTriangle className="h-6 w-6 text-yellow-400" />
            )}
            <div>
              <p className={`font-semibold ${readiness.ready ? "text-green-400" : "text-yellow-400"}`}>
                {readiness.ready ? "Ready for Export" : "Action Required"}
              </p>
              <p className="text-sm text-gray-300">{readiness.message}</p>
            </div>
          </div>
        </div>

        {/* Validation Errors */}
        {validation && validation.errors.length > 0 && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-6">
            <h3 className="mb-4 flex items-center gap-2 font-semibold text-red-400">
              <XCircle className="h-5 w-5" />
              Errors ({validation.errors.length})
            </h3>
            <ul className="space-y-2">
              {validation.errors.map((error, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-400" />
                  <div>
                    <span className="text-gray-300">{error.message}</span>
                    {error.reference && (
                      <span className="ml-2 text-xs text-gray-500">({error.reference})</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Validation Warnings */}
        {((validation && validation.warnings.length > 0) || narrativeWarnings.length > 0) && (
          <div className="mb-6 rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-6">
            <h3 className="mb-4 flex items-center gap-2 font-semibold text-yellow-400">
              <AlertTriangle className="h-5 w-5" />
              Warnings ({(validation?.warnings.length || 0) + narrativeWarnings.length})
            </h3>
            <ul className="space-y-2">
              {validation?.warnings.map((warning, idx) => (
                <li key={`v-${idx}`} className="flex items-start gap-2 text-sm">
                  <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-yellow-400" />
                  <div>
                    <span className="text-gray-300">{warning.message}</span>
                    {warning.reference && (
                      <span className="ml-2 text-xs text-gray-500">({warning.reference})</span>
                    )}
                  </div>
                </li>
              ))}
              {narrativeWarnings.map((warning, idx) => (
                <li key={`n-${idx}`} className="flex items-start gap-2 text-sm">
                  <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-yellow-400" />
                  <span className="text-gray-300">{warning.message}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Part I - Administrative Data */}
        <section className="mb-4 rounded-xl border border-white/10 bg-black shadow-sm overflow-hidden">
          <button
            onClick={() => toggleSection("partI")}
            className="flex w-full items-center justify-between p-4 text-left"
          >
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-blue-400" />
              <span className="font-semibold">Part I - Administrative Data</span>
            </div>
            <div className="flex items-center gap-2">
              {formData?.rated_personnel?.name ? (
                <CheckCircle className="h-4 w-4 text-green-400" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-yellow-400" />
              )}
              {expanded.partI ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
          </button>
          {expanded.partI && (
            <div className="border-t border-white/10 p-4">
              <div className="grid gap-4 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-400">Name:</span>
                    <p className="font-medium">{formData?.rated_personnel?.name || "Not entered"}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">DODID:</span>
                    <p className="font-medium">{formData?.rated_personnel?.dodid || "Not entered"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <span className="text-gray-400">Rank:</span>
                    <p className="font-medium">{formData?.rated_personnel?.rank || evaluation.rank_level}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Component:</span>
                    <p className="font-medium">{formData?.rated_personnel?.component || "Not entered"}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">UIC:</span>
                    <p className="font-medium">{formData?.rated_personnel?.uic || "Not entered"}</p>
                  </div>
                </div>
                <div>
                  <span className="text-gray-400">Unit/Organization:</span>
                  <p className="font-medium">{formData?.rated_personnel?.unit_org_station || "Not entered"}</p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <span className="text-gray-400">Period From:</span>
                    <p className="font-medium">{formData?.period_covered?.from_date || "Not entered"}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Period Thru:</span>
                    <p className="font-medium">{formData?.period_covered?.thru_date || "Not entered"}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Rated Months:</span>
                    <p className="font-medium">{formData?.period_covered?.rated_months || 0}</p>
                  </div>
                </div>
              </div>
              <Link
                href={`/evaluation/${evaluationId}/admin`}
                className="mt-4 inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
              >
                <Edit2 className="h-4 w-4" />
                Edit Admin Data
              </Link>
            </div>
          )}
        </section>

        {/* Part II - Rating Chain */}
        <section className="mb-4 rounded-xl border border-white/10 bg-black shadow-sm overflow-hidden">
          <button
            onClick={() => toggleSection("partII")}
            className="flex w-full items-center justify-between p-4 text-left"
          >
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-green-400" />
              <span className="font-semibold">Part II - Rating Chain</span>
            </div>
            <div className="flex items-center gap-2">
              {formData?.rating_chain?.rater?.name && formData?.rating_chain?.senior_rater?.name ? (
                <CheckCircle className="h-4 w-4 text-green-400" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-yellow-400" />
              )}
              {expanded.partII ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
          </button>
          {expanded.partII && (
            <div className="border-t border-white/10 p-4">
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="mb-2 font-medium text-green-400">Rater</h4>
                  <div className="grid grid-cols-2 gap-4 rounded-lg bg-black/20 p-3">
                    <div>
                      <span className="text-gray-400">Name:</span>
                      <p className="font-medium">{formData?.rating_chain?.rater?.name || "Not entered"}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Rank:</span>
                      <p className="font-medium">{formData?.rating_chain?.rater?.rank || "Not entered"}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Position:</span>
                      <p className="font-medium">{formData?.rating_chain?.rater?.position || "Not entered"}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Email:</span>
                      <p className="font-medium">{formData?.rating_chain?.rater?.email || "Not entered"}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="mb-2 font-medium text-blue-400">Senior Rater</h4>
                  <div className="grid grid-cols-2 gap-4 rounded-lg bg-black/20 p-3">
                    <div>
                      <span className="text-gray-400">Name:</span>
                      <p className="font-medium">{formData?.rating_chain?.senior_rater?.name || "Not entered"}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Rank:</span>
                      <p className="font-medium">{formData?.rating_chain?.senior_rater?.rank || "Not entered"}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Position:</span>
                      <p className="font-medium">{formData?.rating_chain?.senior_rater?.position || "Not entered"}</p>
                    </div>
                    <div>
                      <span className="text-gray-400">Email:</span>
                      <p className="font-medium">{formData?.rating_chain?.senior_rater?.email || "Not entered"}</p>
                    </div>
                  </div>
                </div>
              </div>
              <Link
                href={`/evaluation/${evaluationId}/admin`}
                className="mt-4 inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
              >
                <Edit2 className="h-4 w-4" />
                Edit Rating Chain
              </Link>
            </div>
          )}
        </section>

        {/* Part III - Duty Description */}
        <section className="mb-4 rounded-xl border border-white/10 bg-black shadow-sm overflow-hidden">
          <button
            onClick={() => toggleSection("partIII")}
            className="flex w-full items-center justify-between p-4 text-left"
          >
            <div className="flex items-center gap-3">
              <Briefcase className="h-5 w-5 text-purple-400" />
              <span className="font-semibold">Part III - Duty Description</span>
            </div>
            <div className="flex items-center gap-2">
              {formData?.duty_description?.principal_duty_title ? (
                <CheckCircle className="h-4 w-4 text-green-400" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-yellow-400" />
              )}
              {expanded.partIII ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
          </button>
          {expanded.partIII && (
            <div className="border-t border-white/10 p-4">
              <div className="space-y-4 text-sm">
                <div>
                  <span className="text-gray-400">Principal Duty Title:</span>
                  <p className="font-medium">{formData?.duty_description?.principal_duty_title || evaluation.duty_title}</p>
                </div>
                <div>
                  <span className="text-gray-400">Significant Duties:</span>
                  <p className="font-medium whitespace-pre-wrap">{formData?.duty_description?.significant_duties || "Not entered"}</p>
                </div>
                {formData?.duty_description?.areas_of_emphasis && (
                  <div>
                    <span className="text-gray-400">Areas of Emphasis:</span>
                    <p className="font-medium">{formData.duty_description.areas_of_emphasis}</p>
                  </div>
                )}
                {formData?.duty_description?.appointed_duties && (
                  <div>
                    <span className="text-gray-400">Appointed Duties:</span>
                    <p className="font-medium">{formData.duty_description.appointed_duties}</p>
                  </div>
                )}
              </div>
              <Link
                href={`/evaluation/${evaluationId}/admin`}
                className="mt-4 inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
              >
                <Edit2 className="h-4 w-4" />
                Edit Duty Description
              </Link>
            </div>
          )}
        </section>

        {/* Part IV - Rater Assessment */}
        <section className="mb-4 rounded-xl border border-white/10 bg-black shadow-sm overflow-hidden">
          <button
            onClick={() => toggleSection("partIV")}
            className="flex w-full items-center justify-between p-4 text-left"
          >
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-orange-400" />
              <span className="font-semibold">Part IV - Rater Assessment</span>
            </div>
            <div className="flex items-center gap-2">
              {evaluation.rater_comments ? (
                <CheckCircle className="h-4 w-4 text-green-400" />
              ) : (
                <XCircle className="h-4 w-4 text-red-400" />
              )}
              {expanded.partIV ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
          </button>
          {expanded.partIV && (
            <div className="border-t border-white/10 p-4">
              {/* Bullets by Category */}
              {evaluation.categorized_bullets && evaluation.categorized_bullets.length > 0 && (
                <div className="mb-4">
                  <h4 className="mb-3 font-medium text-gray-300">Performance Bullets ({evaluation.categorized_bullets.length})</h4>
                  <div className="space-y-2">
                    {evaluation.categorized_bullets.map((bullet, idx) => (
                      <div key={idx} className="flex items-start gap-3 rounded-lg bg-black/20 p-3 text-sm">
                        <span className="flex-shrink-0 rounded bg-blue-500/20 px-2 py-0.5 text-xs text-blue-400">
                          {bullet.category}
                        </span>
                        <p className="text-gray-300">{bullet.enhanced}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rater Comments */}
              <div>
                <h4 className="mb-2 font-medium text-gray-300">Rater Comments</h4>
                {evaluation.rater_comments ? (
                  <div className="rounded-lg bg-black/20 p-4 text-sm">
                    <p className="whitespace-pre-wrap text-gray-300">{evaluation.rater_comments}</p>
                    <p className="mt-2 text-xs text-gray-500">
                      {evaluation.rater_comments.split(/\s+/).length} words
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-red-400">Rater comments not generated</p>
                )}
              </div>

              <Link
                href={`/evaluation/${evaluationId}/rater`}
                className="mt-4 inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
              >
                <Edit2 className="h-4 w-4" />
                Edit Rater Comments
              </Link>
            </div>
          )}
        </section>

        {/* Part V - Senior Rater Assessment */}
        <section className="mb-8 rounded-xl border border-white/10 bg-black shadow-sm overflow-hidden">
          <button
            onClick={() => toggleSection("partV")}
            className="flex w-full items-center justify-between p-4 text-left"
          >
            <div className="flex items-center gap-3">
              <Star className="h-5 w-5 text-yellow-400" />
              <span className="font-semibold">Part V - Senior Rater Assessment</span>
            </div>
            <div className="flex items-center gap-2">
              {evaluation.senior_rater_comments ? (
                <CheckCircle className="h-4 w-4 text-green-400" />
              ) : (
                <XCircle className="h-4 w-4 text-red-400" />
              )}
              {expanded.partV ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
          </button>
          {expanded.partV && (
            <div className="border-t border-white/10 p-4">
              <div>
                <h4 className="mb-2 font-medium text-gray-300">Senior Rater Comments</h4>
                {evaluation.senior_rater_comments ? (
                  <div className="rounded-lg bg-black/20 p-4 text-sm">
                    <p className="whitespace-pre-wrap text-gray-300">{evaluation.senior_rater_comments}</p>
                    <p className="mt-2 text-xs text-gray-500">
                      {evaluation.senior_rater_comments.split(/\s+/).length} words
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-red-400">Senior Rater comments not generated</p>
                )}
              </div>

              <Link
                href={`/evaluation/${evaluationId}/senior-rater`}
                className="mt-4 inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
              >
                <Edit2 className="h-4 w-4" />
                Edit Senior Rater Comments
              </Link>
            </div>
          )}
        </section>

        {/* Export Button */}
        <button
          onClick={handleExport}
          disabled={saving || !readiness.ready}
          className={`flex w-full items-center justify-center gap-2 rounded-xl px-6 py-4 text-lg font-medium transition-colors ${
            readiness.ready
              ? "bg-blue-600 hover:bg-blue-700"
              : "cursor-not-allowed bg-gray-600 opacity-50"
          }`}
        >
          {saving ? (
            <>
              <RefreshCw className="h-5 w-5 animate-spin" />
              Preparing Export...
            </>
          ) : (
            <>
              Continue to Export
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </button>

        {!readiness.ready && (
          <p className="mt-4 text-center text-sm text-gray-400">
            Complete all required sections before exporting
          </p>
        )}
      </div>
    </div>
  );
}
