"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { RotateCw, Settings, ArrowRight } from "lucide-react";

export default function NarrativePage() {
  const params = useParams();
  const router = useRouter();
  const evaluationId = params.id as string;

  const [style, setStyle] = useState<"concise" | "narrative">("concise");
  const [maintainTone, setMaintainTone] = useState(true);
  const [length, setLength] = useState(60);
  const [narrative, setNarrative] = useState(
    "Demonstrated exceptional leadership, guiding the platoon through complex operations with outstanding results; sets the standard for peers and subordinates alike."
  );
  const [loading, setLoading] = useState(false);

  const handleRegenerate = async () => {
    // TODO: Implement AI regeneration
    console.log("Regenerating narrative...");
  };

  const handleNext = async () => {
    setLoading(true);
    
    const supabase = createClient();
    
    // Save narrative to database
    const { error } = await supabase
      .from("evaluations")
      .update({ 
        narrative: narrative,
        status: "narrative_complete" 
      })
      .eq("id", evaluationId);

    if (error) {
      console.error("Error saving narrative:", error);
      alert("Error saving narrative. Please try again.");
      setLoading(false);
      return;
    }

    router.push(`/evaluation/${evaluationId}/review`);
  };

  return (
    <div className="min-h-screen bg-black px-4 py-8 text-white">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">Summary Narrative</h1>
          <p className="text-gray-400">
            Craft a strong summary narrative reflecting performance and leadership.
          </p>
        </div>

        {/* Style Selector */}
        <div className="mb-6 flex gap-4">
          <button
            onClick={() => setStyle("concise")}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
              style === "concise"
                ? "border-blue-500 bg-blue-500/10 text-blue-400"
                : "border-white/10 bg-white/5 text-gray-400 hover:border-white/20"
            }`}
          >
            Concise & Strong
          </button>
          <button
            onClick={() => setStyle("narrative")}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
              style === "narrative"
                ? "border-blue-500 bg-blue-500/10 text-blue-400"
                : "border-white/10 bg-white/5 text-gray-400 hover:border-white/20"
            }`}
          >
            Narrative & Impactful
          </button>
        </div>

        {/* Length Slider */}
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium text-gray-300">Length</label>
            <span className="text-xs text-gray-500">
              {length < 33 ? "Short" : length < 66 ? "Medium" : "Long"}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={length}
            onChange={(e) => setLength(Number(e.target.value))}
            className="w-full accent-blue-500"
          />
        </div>

        {/* Maintain Tone Checkbox */}
        <div className="mb-8">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={maintainTone}
              onChange={(e) => setMaintainTone(e.target.checked)}
              className="h-5 w-5 rounded border-white/10 bg-white/5 text-blue-600 focus:ring-2 focus:ring-blue-500/20"
            />
            <span className="text-sm text-gray-300">
              Maintain consistent tone with Senior Rater
            </span>
          </label>
        </div>

        {/* Narrative Content */}
        <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-6">
          <textarea
            value={narrative}
            onChange={(e) => setNarrative(e.target.value)}
            className="mb-4 w-full resize-none rounded-lg border border-white/10 bg-white/5 p-4 text-lg leading-relaxed text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            rows={6}
          />
          
          <div className="flex items-center justify-between border-t border-white/10 pt-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-green-400">✓</span>
              <span className="text-gray-400">
                Tone aligned | 85% word count within DA guidelines
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleRegenerate}
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
              >
                <RotateCw className="h-4 w-4" />
                Regenerate
              </button>
              <button className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10">
                <Settings className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Next Button */}
        <button
          onClick={handleNext}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-4 text-lg font-medium transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Save & Continue
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

