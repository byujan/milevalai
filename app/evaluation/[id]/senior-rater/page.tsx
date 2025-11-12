"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Sparkles, RotateCw, ArrowRight } from "lucide-react";

export default function SeniorRaterCommentsPage() {
  const params = useParams();
  const router = useRouter();
  const evaluationId = params.id as string;

  const [comments, setComments] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [evaluationData, setEvaluationData] = useState<any>(null);

  useEffect(() => {
    loadEvaluation();
  }, [evaluationId]);

  const loadEvaluation = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("evaluations")
        .select("*")
        .eq("id", evaluationId)
        .single();

      if (error) throw error;

      setEvaluationData(data);

      // Load existing comments or generate new ones
      if (data.senior_rater_comments) {
        setComments(data.senior_rater_comments);
      } else {
        // Auto-generate on first load
        await generateComments(data);
      }
    } catch (error) {
      console.error("Error loading evaluation:", error);
    }
  };

  const generateComments = async (evalData?: any) => {
    const data = evalData || evaluationData;
    if (!data) return;

    setGenerating(true);

    try {
      // Generate with proper NCOER/OER language and tone
      const response = await fetch("/api/ai/senior-rater", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raterComments: data.rater_comments || "",
          bullets: data.categorized_bullets || [],
          rankLevel: data.rank_level,
          evaluationType: data.evaluation_type || 'NCOER',
        }),
      });

      if (!response.ok) throw new Error("Generation failed");

      const { comments: generatedComments } = await response.json();
      setComments(generatedComments);
    } catch (error) {
      console.error("Error generating comments:", error);
      alert("Failed to generate comments. Make sure Ollama is running.");
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveAndContinue = async () => {
    if (!comments.trim()) {
      alert("Please add senior rater comments.");
      return;
    }

    setSaving(true);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("evaluations")
        .update({
          senior_rater_comments: comments,
          status: "senior_rater_complete",
        })
        .eq("id", evaluationId);

      if (error) throw error;

      router.push(`/evaluation/${evaluationId}/review`);
    } catch (error) {
      console.error("Error saving comments:", error);
      alert("Failed to save comments. Please try again.");
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-black px-4 py-8 text-white">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">Senior Rater Comments</h1>
          <p className="text-gray-400">
            AI-generated strategic-level comments. Edit as needed.
          </p>
        </div>

        {/* AI Generation Status */}
        {generating && (
          <div className="mb-6 rounded-xl border border-blue-500/20 bg-blue-500/10 p-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-400 border-t-transparent"></div>
              <div>
                <h3 className="font-semibold text-blue-400">
                  AI is Generating Senior Rater Comments...
                </h3>
                <p className="text-sm text-gray-400">
                  Creating strategic perspective based on rater comments and bullets
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Rater Comments Reference */}
        {evaluationData?.rater_comments && (
          <div className="mb-6 rounded-lg border border-white/10 bg-white/5 p-4">
            <h3 className="mb-2 text-sm font-semibold text-gray-400">
              Rater Comments (Reference):
            </h3>
            <p className="text-sm text-gray-300">{evaluationData.rater_comments}</p>
          </div>
        )}

        {/* Comments Editor */}
        <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-400" />
              <h3 className="font-semibold">Senior Rater Comments</h3>
            </div>
            <button
              onClick={() => generateComments()}
              disabled={generating}
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCw className="h-4 w-4" />
              Regenerate
            </button>
          </div>

          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            className="w-full resize-none rounded-lg border border-white/10 bg-black p-4 text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            rows={12}
            placeholder="Senior rater comments will appear here..."
          />

          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-gray-400">{comments.split(/\s+/).filter(w => w).length} words</span>
            <span className="text-gray-500">
              Recommended: 150-200 words
            </span>
          </div>
        </div>

        {/* Guidelines */}
        <div className="mb-6 rounded-lg border border-white/10 bg-white/5 p-4">
          <h3 className="mb-3 text-sm font-semibold">Senior Rater Comment Guidelines:</h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li className="flex items-start gap-2">
              <span className="text-blue-400">•</span>
              <span>Build on but don't repeat rater comments</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">•</span>
              <span>Provide strategic-level perspective</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">•</span>
              <span>Highlight potential and readiness for next level</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">•</span>
              <span>Use strong, confident language</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">•</span>
              <span>Keep to 150-200 words</span>
            </li>
          </ul>
        </div>

        {/* Continue Button */}
        <button
          onClick={handleSaveAndContinue}
          disabled={saving || !comments.trim()}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-4 text-lg font-medium transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving..." : "Continue to Review & Export"}
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

