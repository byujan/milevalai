"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ThumbsUp, ThumbsDown, RotateCw, Pencil, Plus, ArrowRight } from "lucide-react";

type Bullet = {
  id: string;
  content: string;
  category?: string;
};

export default function BulletsPage() {
  const params = useParams();
  const router = useRouter();
  const evaluationId = params.id as string;

  const [bullets, setBullets] = useState<Bullet[]>([
    {
      id: "1",
      content: "Exceeded all leadership expectations; executed 12 training events achieving 100% certification.",
    },
    {
      id: "2",
      content: "Demonstrated tactical competence; optimized readiness through effective team development.",
    },
    {
      id: "3",
      content: "Consistently placed the organization's objectives above personal interest, earning the respect of peers.",
    },
  ]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [style, setStyle] = useState<"concise" | "narrative">("concise");

  const handleEdit = (bullet: Bullet) => {
    setEditingId(bullet.id);
    setEditContent(bullet.content);
  };

  const handleSaveEdit = (id: string) => {
    setBullets(bullets.map(b => b.id === id ? { ...b, content: editContent } : b));
    setEditingId(null);
    setEditContent("");
  };

  const handleRegenerate = async (id: string) => {
    // TODO: Implement AI regeneration
    console.log("Regenerating bullet:", id);
  };

  const handleAddBullet = () => {
    const newBullet: Bullet = {
      id: Date.now().toString(),
      content: "",
    };
    setBullets([...bullets, newBullet]);
    setEditingId(newBullet.id);
    setEditContent("");
  };

  const handleNext = async () => {
    setLoading(true);
    
    const supabase = createClient();
    
    // Save bullets to database
    const { error } = await supabase
      .from("evaluations")
      .update({ 
        bullets: bullets,
        status: "bullets_complete" 
      })
      .eq("id", evaluationId);

    if (error) {
      console.error("Error saving bullets:", error);
      alert("Error saving bullets. Please try again.");
      setLoading(false);
      return;
    }

    router.push(`/evaluation/${evaluationId}/narrative`);
  };

  return (
    <div className="min-h-screen bg-black px-4 py-8 text-white">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">Generate Performance Bullets</h1>
          <p className="text-gray-400">
            Summarize performance using concise, results-focused statements.
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
        <div className="mb-8">
          <label className="mb-3 block text-sm font-medium text-gray-300">
            Length
          </label>
          <input
            type="range"
            min="0"
            max="100"
            defaultValue="40"
            className="w-full accent-blue-500"
          />
        </div>

        {/* Maintain Tone Checkbox */}
        <div className="mb-8">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              defaultChecked
              className="h-5 w-5 rounded border-white/10 bg-white/5 text-blue-600 focus:ring-2 focus:ring-blue-500/20"
            />
            <span className="text-sm text-gray-300">
              Maintain consistent tone with Senior Rater
            </span>
          </label>
        </div>

        {/* Bullets List */}
        <div className="space-y-4">
          {bullets.map((bullet) => (
            <div
              key={bullet.id}
              className="rounded-xl border border-white/10 bg-white/5 p-6"
            >
              {editingId === bullet.id ? (
                <div>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="mb-4 w-full rounded-lg border border-white/10 bg-white/5 p-4 text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    rows={3}
                    placeholder="Enter bullet content..."
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveEdit(bullet.id)}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium hover:bg-white/10"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="mb-4 text-lg">{bullet.content}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(bullet)}
                      className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleRegenerate(bullet.id)}
                      className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
                    >
                      <RotateCw className="h-4 w-4" />
                      Regenerate
                    </button>
                    <button className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10">
                      <ThumbsUp className="h-4 w-4" />
                    </button>
                    <button className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10">
                      <ThumbsDown className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add Bullet Button */}
        <button
          onClick={handleAddBullet}
          className="mt-4 w-full rounded-xl border border-dashed border-white/20 bg-white/5 px-6 py-4 text-sm font-medium text-gray-400 transition-colors hover:border-white/30 hover:text-white"
        >
          <Plus className="mx-auto h-5 w-5" />
        </button>

        {/* Next Button */}
        <button
          onClick={handleNext}
          disabled={loading}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-4 text-lg font-medium transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Save & Continue
          <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

