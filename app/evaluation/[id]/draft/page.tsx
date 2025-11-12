"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Plus, X, Sparkles, FileText, ArrowRight } from "lucide-react";

export default function BulletDraftPage() {
  const params = useParams();
  const router = useRouter();
  const evaluationId = params.id as string;

  const [bullets, setBullets] = useState<string[]>([""]);
  const [loading, setLoading] = useState(false);
  const [showExamples, setShowExamples] = useState(false);

  // Load existing bullets if any
  useEffect(() => {
    const loadBullets = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("evaluations")
        .select("raw_bullets")
        .eq("id", evaluationId)
        .single();

      if (data?.raw_bullets) {
        const rawBullets = data.raw_bullets as string[];
        if (rawBullets.length > 0) {
          setBullets(rawBullets);
        }
      }
    };

    loadBullets();
  }, [evaluationId]);

  const addBullet = () => {
    setBullets([...bullets, ""]);
  };

  const removeBullet = (index: number) => {
    if (bullets.length === 1) return; // Keep at least one bullet
    setBullets(bullets.filter((_, i) => i !== index));
  };

  const updateBullet = (index: number, value: string) => {
    const newBullets = [...bullets];
    newBullets[index] = value;
    setBullets(newBullets);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const lines = text
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      if (lines.length > 0) {
        setBullets([...bullets.filter((b) => b.length > 0), ...lines]);
      }
    } catch (error) {
      console.error("Failed to read clipboard:", error);
    }
  };

  const handleSaveAndContinue = async () => {
    const validBullets = bullets.filter((b) => b.trim().length > 0);

    if (validBullets.length === 0) {
      alert("Please add at least one bullet.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      // Save raw bullets
      const { error } = await supabase
        .from("evaluations")
        .update({
          raw_bullets: validBullets,
          status: "bullets_draft",
        })
        .eq("id", evaluationId);

      if (error) throw error;

      // Navigate to AI categorization page
      router.push(`/evaluation/${evaluationId}/categorize`);
    } catch (error) {
      console.error("Error saving bullets:", error);
      alert("Failed to save bullets. Please try again.");
      setLoading(false);
    }
  };

  const exampleBullets = [
    "Led 15-soldier team through 6-month deployment, maintaining 100% mission readiness",
    "Trained 25 junior NCOs on advanced tactical operations, achieving 95% certification rate",
    "Managed $2M equipment inventory with zero losses during high-tempo operations",
    "Coordinated with 5 sister units to execute successful joint training exercise",
    "Mentored 12 soldiers resulting in 8 promotions and 4 school selections",
  ];

  return (
    <div className="min-h-screen bg-black px-4 py-8 text-white">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">Enter Your Accomplishments</h1>
          <p className="text-gray-400">
            List your performance highlights in your own words. Don't worry about
            categories—AI will organize them later.
          </p>
        </div>

        {/* Examples Button */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => setShowExamples(!showExamples)}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm transition-colors hover:bg-white/10"
          >
            <FileText className="h-4 w-4" />
            {showExamples ? "Hide" : "Show"} Examples
          </button>
          <button
            onClick={handlePaste}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm transition-colors hover:bg-white/10"
          >
            <FileText className="h-4 w-4" />
            Paste from Clipboard
          </button>
        </div>

        {/* Example Bullets */}
        {showExamples && (
          <div className="mb-6 rounded-xl border border-blue-500/20 bg-blue-500/10 p-6">
            <h3 className="mb-3 text-sm font-semibold text-blue-400">
              Example Bullets:
            </h3>
            <ul className="space-y-2 text-sm text-gray-300">
              {exampleBullets.map((example, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-blue-400">•</span>
                  <span>{example}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Guidance */}
        <div className="mb-6 rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-gray-400">
          <strong className="text-white">Tips:</strong> Use short, results-oriented
          bullets. Include numbers and measurable outcomes when possible. Keep it
          simple—AI will enhance and categorize later.
        </div>

        {/* Bullet Input Fields */}
        <div className="space-y-4">
          {bullets.map((bullet, index) => (
            <div
              key={index}
              className="group relative rounded-xl border border-white/10 bg-white/5 p-4 transition-colors hover:border-white/20"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-gray-400">Bullet {index + 1}</span>
                {bullets.length > 1 && (
                  <button
                    onClick={() => removeBullet(index)}
                    className="text-gray-400 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <textarea
                value={bullet}
                onChange={(e) => updateBullet(index, e.target.value)}
                placeholder="Describe an accomplishment or performance highlight..."
                className="w-full resize-none rounded-lg border-0 bg-transparent p-0 text-white placeholder-gray-500 focus:outline-none focus:ring-0"
                rows={3}
              />
              <div className="mt-2 text-xs text-gray-500">
                {bullet.length} characters
              </div>
            </div>
          ))}
        </div>

        {/* Add Bullet Button */}
        <button
          onClick={addBullet}
          className="mt-4 w-full rounded-xl border border-dashed border-white/20 bg-white/5 py-4 text-sm font-medium text-gray-400 transition-colors hover:border-white/30 hover:text-white"
        >
          <Plus className="mx-auto h-5 w-5" />
        </button>

        {/* Continue Button */}
        <div className="mt-8 rounded-xl border border-blue-500/20 bg-blue-500/10 p-6">
          <div className="mb-4 flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-blue-400" />
            <div>
              <h3 className="font-semibold text-blue-400">
                Ready for AI Enhancement
              </h3>
              <p className="text-sm text-gray-400">
                AI will categorize and enhance your bullets with better grammar and
                tone
              </p>
            </div>
          </div>
          <button
            onClick={handleSaveAndContinue}
            disabled={loading || bullets.every((b) => b.trim().length === 0)}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Saving..." : "Continue to AI Categorization"}
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>

        {/* Autosave Indicator */}
        <div className="mt-4 text-center text-xs text-gray-500">
          Changes are automatically saved
        </div>
      </div>
    </div>
  );
}

