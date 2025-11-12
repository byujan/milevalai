"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { FileText, Download, Copy, CheckCircle, Home } from "lucide-react";

export default function ExportPage() {
  const params = useParams();
  const evaluationId = params.id as string;
  
  const [activeTab, setActiveTab] = useState<"ees" | "pdf" | "docx">("ees");
  const [copied, setCopied] = useState(false);

  const eesText = `Character: Demonstrated integrity, adhered to Army Values during complex missions.
Presence: Maintained peak military appearance, instilled pride in subordinates.
Intellect: Exercised sound judgment in stressful situations, adhered to ethical standards.
Leads: Guided platoon to 100% mission success.
Develops: Guided platoon to 25 successful operations.
Achieves: Guided platoon to 100% proficiency rate.`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(eesText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (format: "pdf" | "docx") => {
    // TODO: Implement actual download logic
    console.log(`Downloading as ${format}...`);
  };

  return (
    <div className="min-h-screen bg-black px-4 py-8 text-white">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
          <h1 className="mb-2 text-3xl font-bold">Export Evaluation</h1>
          <p className="text-gray-400">
            Choose your preferred format to copy or download your completed evaluation.
          </p>
        </div>

        {/* Format Tabs */}
        <div className="mb-6 flex gap-2 rounded-xl border border-white/10 bg-white/5 p-1">
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
            <div className="mb-4 rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-gray-400">
              Copy and paste directly into EES—formatted with safe line breaks and
              character limits.
            </div>

            <div className="mb-6 rounded-xl border border-white/10 bg-black p-6">
              <div className="mb-4 space-y-3 font-mono text-sm leading-relaxed">
                {eesText.split("\n").map((line, idx) => (
                  <div key={idx}>
                    <strong className="text-blue-400">{line.split(":")[0]}:</strong>
                    <span className="text-gray-300">{line.split(":")[1]}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleCopy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-4 text-lg font-medium transition-colors hover:bg-blue-700"
            >
              {copied ? (
                <>
                  <CheckCircle className="h-5 w-5" />
                  Copied!
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
            <div className="mb-4 rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-gray-400">
              Download a pre-filled DA Form as PDF, ready for review and submission.
            </div>

            <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-12 text-center">
              <FileText className="mx-auto mb-4 h-16 w-16 text-gray-500" />
              <h3 className="mb-2 text-lg font-semibold">DA Form Preview</h3>
              <p className="text-sm text-gray-400">
                Your evaluation formatted according to official DA requirements
              </p>
            </div>

            <button
              onClick={() => handleDownload("pdf")}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-4 text-lg font-medium transition-colors hover:bg-blue-700"
            >
              <Download className="h-5 w-5" />
              Download PDF
            </button>
          </div>
        )}

        {activeTab === "docx" && (
          <div>
            <div className="mb-4 rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-gray-400">
              Download as an editable Word document for further customization.
            </div>

            <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-12 text-center">
              <FileText className="mx-auto mb-4 h-16 w-16 text-gray-500" />
              <h3 className="mb-2 text-lg font-semibold">Word Document</h3>
              <p className="text-sm text-gray-400">
                Fully editable .docx format compatible with Microsoft Word
              </p>
            </div>

            <button
              onClick={() => handleDownload("docx")}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-4 text-lg font-medium transition-colors hover:bg-blue-700"
            >
              <Download className="h-5 w-5" />
              Download DOCX
            </button>
          </div>
        )}

        {/* Status Notice */}
        <div className="mt-8 rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-center">
          <CheckCircle className="mx-auto mb-2 h-6 w-6 text-green-400" />
          <p className="text-sm font-medium text-green-400">
            Evaluation successfully validated and ready for submission.
          </p>
        </div>

        {/* Back to Dashboard */}
        <Link
          href="/dashboard"
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 font-medium transition-colors hover:bg-white/10"
        >
          <Home className="h-5 w-5" />
          Back to Dashboard
        </Link>

        <div className="mt-8 text-center text-sm text-gray-500">
          © 2025 MilEvalAI - Made for Soldiers by Soldiers
        </div>
      </div>
    </div>
  );
}
