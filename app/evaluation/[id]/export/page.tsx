"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import {
  FileText,
  Download,
  Copy,
  CheckCircle,
  Home,
  RefreshCw,
  Loader2,
} from "lucide-react";
import {
  EvaluationFormData,
  EvaluationType,
  RankLevel,
  CategorizedBullet,
} from "@/lib/types/database";
import {
  generateEESText,
  generateCompactEESText,
  calculateCharCounts,
} from "@/lib/export/ees-formatter";
import { getFormNumber } from "@/lib/validation/evaluation-validator";
import { generateEvaluationPDF, downloadPDF } from "@/lib/export/pdf-generator";
import { generateEvaluationDOCX, downloadDOCX } from "@/lib/export/docx-generator";

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
}

export default function ExportPage() {
  const params = useParams();
  const router = useRouter();
  const evaluationId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [evaluation, setEvaluation] = useState<EvaluationData | null>(null);
  const [activeTab, setActiveTab] = useState<"ees" | "pdf" | "docx">("ees");
  const [copied, setCopied] = useState(false);
  const [eesFormat, setEesFormat] = useState<"full" | "compact">("full");
  const [downloading, setDownloading] = useState<"pdf" | "docx" | null>(null);

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
      setLoading(false);
    };

    loadEvaluation();
  }, [evaluationId, router]);

  // Generate EES text based on format
  const getEESText = () => {
    if (!evaluation) return "";

    if (eesFormat === "compact") {
      return generateCompactEESText(
        evaluation.categorized_bullets,
        evaluation.rater_comments,
        evaluation.senior_rater_comments
      );
    }

    return generateEESText(
      evaluation.evaluation_type,
      evaluation.rank_level,
      evaluation.form_data,
      evaluation.categorized_bullets,
      evaluation.rater_comments,
      evaluation.senior_rater_comments
    );
  };

  const handleCopy = async () => {
    const text = getEESText();
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async (format: "pdf" | "docx") => {
    if (!evaluation) return;

    setDownloading(format);

    try {
      const filename = `${evaluation.duty_title.replace(/[^a-zA-Z0-9]/g, '_')}_${format.toUpperCase()}`;

      if (format === "pdf") {
        const pdfBytes = await generateEvaluationPDF({
          evalType: evaluation.evaluation_type,
          rankLevel: evaluation.rank_level,
          dutyTitle: evaluation.duty_title,
          formData: evaluation.form_data,
          bullets: evaluation.categorized_bullets,
          raterComments: evaluation.rater_comments,
          srComments: evaluation.senior_rater_comments,
        });
        downloadPDF(pdfBytes, `${filename}.pdf`);
      } else {
        const blob = await generateEvaluationDOCX({
          evalType: evaluation.evaluation_type,
          rankLevel: evaluation.rank_level,
          dutyTitle: evaluation.duty_title,
          formData: evaluation.form_data,
          bullets: evaluation.categorized_bullets,
          raterComments: evaluation.rater_comments,
          srComments: evaluation.senior_rater_comments,
        });
        downloadDOCX(blob, `${filename}.docx`);
      }
    } catch (error) {
      console.error(`Error generating ${format}:`, error);
      alert(`Failed to generate ${format.toUpperCase()}. Please try again.`);
    } finally {
      setDownloading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="text-center">
          <RefreshCw className="mx-auto mb-4 h-8 w-8 animate-spin text-blue-500" />
          <p className="text-gray-400">Preparing export...</p>
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

  const formNumber = getFormNumber(evaluation.evaluation_type, evaluation.rank_level);
  const charCounts = calculateCharCounts(
    evaluation.categorized_bullets,
    evaluation.rater_comments,
    evaluation.senior_rater_comments
  );
  const eesText = getEESText();

  return (
    <div className="px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
          <h1 className="mb-2 text-3xl font-bold">Export Evaluation</h1>
          <p className="text-gray-400">
            {formNumber} - {evaluation.duty_title}
          </p>
        </div>

        {/* Format Tabs */}
        <div className="mb-6 flex gap-2 rounded-xl border border-white/10 bg-black shadow-sm p-1">
          <button
            onClick={() => setActiveTab("ees")}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeTab === "ees"
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            EES Text
          </button>
          <button
            onClick={() => setActiveTab("pdf")}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeTab === "pdf"
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            DA Form (PDF)
          </button>
          <button
            onClick={() => setActiveTab("docx")}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeTab === "docx"
                ? "bg-blue-600 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Word (DOCX)
          </button>
        </div>

        {activeTab === "ees" && (
          <div>
            <div className="mb-4 rounded-lg border border-white/10 bg-black shadow-sm p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">
                  Copy and paste directly into EES - formatted with safe line breaks and character limits.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEesFormat("full")}
                    className={`rounded px-3 py-1 text-xs ${
                      eesFormat === "full"
                        ? "bg-blue-600 text-white"
                        : "bg-white/10 text-gray-400"
                    }`}
                  >
                    Full
                  </button>
                  <button
                    onClick={() => setEesFormat("compact")}
                    className={`rounded px-3 py-1 text-xs ${
                      eesFormat === "compact"
                        ? "bg-blue-600 text-white"
                        : "bg-white/10 text-gray-400"
                    }`}
                  >
                    Compact
                  </button>
                </div>
              </div>
            </div>

            {/* Character Count Summary */}
            <div className="mb-4 grid grid-cols-2 gap-4 text-sm">
              <div className="rounded-lg border border-white/10 bg-black shadow-sm p-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Rater Comments</span>
                  <span
                    className={`font-mono ${
                      charCounts.raterCount > charCounts.raterLimit
                        ? "text-red-400"
                        : "text-green-400"
                    }`}
                  >
                    {charCounts.raterCount}/{charCounts.raterLimit}
                  </span>
                </div>
              </div>
              <div className="rounded-lg border border-white/10 bg-black shadow-sm p-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">SR Comments</span>
                  <span
                    className={`font-mono ${
                      charCounts.srCount > charCounts.srLimit
                        ? "text-red-400"
                        : "text-green-400"
                    }`}
                  >
                    {charCounts.srCount}/{charCounts.srLimit}
                  </span>
                </div>
              </div>
            </div>

            {/* EES Text Display */}
            <div className="mb-6 max-h-[500px] overflow-auto rounded-xl border border-white/10 bg-black p-6">
              <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-gray-300">
                {eesText}
              </pre>
            </div>

            <button
              onClick={handleCopy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-4 text-lg font-medium transition-colors hover:bg-blue-700"
            >
              {copied ? (
                <>
                  <CheckCircle className="h-5 w-5" />
                  Copied to Clipboard!
                </>
              ) : (
                <>
                  <Copy className="h-5 w-5" />
                  Copy EES Text
                </>
              )}
            </button>
          </div>
        )}

        {activeTab === "pdf" && (
          <div>
            <div className="mb-4 rounded-lg border border-blue-500/20 bg-blue-500/10 p-4">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 flex-shrink-0 text-blue-400" />
                <div className="text-sm">
                  <p className="font-medium text-blue-400">PDF Export Ready</p>
                  <p className="text-gray-300 mt-1">
                    Download a formatted PDF document containing all evaluation data. This PDF can be printed or saved as a record.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6 rounded-xl border border-white/10 bg-black shadow-sm p-12 text-center">
              <FileText className="mx-auto mb-4 h-16 w-16 text-blue-400" />
              <h3 className="mb-2 text-lg font-semibold">{formNumber}</h3>
              <p className="text-sm text-gray-400">
                Formatted PDF with all evaluation sections
              </p>
            </div>

            <button
              onClick={() => handleDownload("pdf")}
              disabled={downloading === "pdf"}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-4 text-lg font-medium transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {downloading === "pdf" ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="h-5 w-5" />
                  Download PDF
                </>
              )}
            </button>
          </div>
        )}

        {activeTab === "docx" && (
          <div>
            <div className="mb-4 rounded-lg border border-green-500/20 bg-green-500/10 p-4">
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 flex-shrink-0 text-green-400" />
                <div className="text-sm">
                  <p className="font-medium text-green-400">Word Export Ready</p>
                  <p className="text-gray-300 mt-1">
                    Download an editable Word document (.docx) that you can modify in Microsoft Word, Google Docs, or any compatible application.
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-6 rounded-xl border border-white/10 bg-black shadow-sm p-12 text-center">
              <FileText className="mx-auto mb-4 h-16 w-16 text-green-400" />
              <h3 className="mb-2 text-lg font-semibold">Word Document</h3>
              <p className="text-sm text-gray-400">
                Fully editable .docx format compatible with Microsoft Word
              </p>
            </div>

            <button
              onClick={() => handleDownload("docx")}
              disabled={downloading === "docx"}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-6 py-4 text-lg font-medium transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {downloading === "docx" ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Generating DOCX...
                </>
              ) : (
                <>
                  <Download className="h-5 w-5" />
                  Download DOCX
                </>
              )}
            </button>
          </div>
        )}

        {/* Status Notice */}
        <div className="mt-8 rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-center">
          <CheckCircle className="mx-auto mb-2 h-6 w-6 text-green-400" />
          <p className="text-sm font-medium text-green-400">
            Evaluation completed and ready for submission
          </p>
        </div>

        {/* Back to Dashboard */}
        <Link
          href="/dashboard"
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-black shadow-sm px-6 py-3 font-medium transition-colors hover:bg-white/10"
        >
          <Home className="h-5 w-5" />
          Back to Dashboard
        </Link>

        <div className="mt-8 text-center text-sm text-gray-500">
          MilEvalAI - Made for Soldiers by Soldiers
        </div>
      </div>
    </div>
  );
}
