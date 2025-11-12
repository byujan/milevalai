"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AlertTriangle, CheckCircle, ArrowRight } from "lucide-react";

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const evaluationId = params.id as string;
  const [loading, setLoading] = useState(false);

  const issues = [
    {
      category: "Formatting & Length",
      items: [
        { type: "success", text: "All sections within DA form word limits." },
        { type: "success", text: "Line breaks formatted correctly for EES." },
        { type: "warning", text: "One bullet in 'Leads' exceeds 350 characters." },
      ],
    },
    {
      category: "Language & Tone",
      items: [
        { type: "success", text: "Tone aligned across Rater/Senior Rater." },
        { type: "warning", text: "Detected repetitive use of 'exceptional' (4 times). Suggest variation." },
      ],
    },
    {
      category: "Regulation & Compliance",
      items: [
        { type: "success", text: "Complies with AR 623-3 restrictions." },
        { type: "warning", text: "Remove predictive phrasing in one bullet." },
      ],
    },
  ];

  const handleFixAutomatically = () => {
    // TODO: Implement automatic fixes
    console.log("Fixing issues automatically...");
  };

  const handleExport = async () => {
    setLoading(true);
    
    const supabase = createClient();
    
    // Update evaluation status
    const { error } = await supabase
      .from("evaluations")
      .update({ status: "completed" })
      .eq("id", evaluationId);

    if (error) {
      console.error("Error updating evaluation:", error);
    }

    router.push(`/evaluation/${evaluationId}/export`);
  };

  return (
    <div className="min-h-screen bg-black px-4 py-8 text-white">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10">
            <CheckCircle className="h-8 w-8 text-blue-400" />
          </div>
          <h1 className="mb-2 text-3xl font-bold">Review & Validation</h1>
          <p className="text-gray-400">
            Check your evaluation for accuracy, formatting, and compliance before export.
          </p>
        </div>

        {/* Issues List */}
        <div className="mb-8 space-y-6">
          {issues.map((section, idx) => (
            <div key={idx} className="rounded-xl border border-white/10 bg-white/5 p-6">
              <h2 className="mb-4 text-lg font-semibold">{section.category}</h2>
              <div className="space-y-3">
                {section.items.map((item, itemIdx) => (
                  <div key={itemIdx} className="flex items-start gap-3">
                    {item.type === "success" ? (
                      <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-400" />
                    ) : (
                      <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-400" />
                    )}
                    <p className="text-sm text-gray-300">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="mb-6 flex gap-4">
          <button
            onClick={handleFixAutomatically}
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-6 py-3 font-medium transition-colors hover:bg-white/10"
          >
            Fix Automatically
          </button>
          <button
            onClick={() => router.push(`/evaluation/${evaluationId}/bullets`)}
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-6 py-3 font-medium transition-colors hover:bg-white/10"
          >
            Edit Manually
          </button>
        </div>

        {/* Status Summary */}
        <div className="mb-6 rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-center">
          <CheckCircle className="mx-auto mb-2 h-6 w-6 text-green-400" />
          <p className="text-sm font-medium text-green-400">
            All required sections complete | DA form ready for export.
          </p>
        </div>

        {/* Export Button */}
        <button
          onClick={handleExport}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-4 text-lg font-medium transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Export Evaluation
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

