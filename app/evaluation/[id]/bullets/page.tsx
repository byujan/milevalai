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

  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [loading, setLoading] = useState(true); // Start with loading true
  const [regenerating, setRegenerating] = useState<string | null>(null);
  const [evaluationData, setEvaluationData] = useState<any>(null);
  const [style, setStyle] = useState<"concise" | "narrative">("concise");

  // Load evaluation data and bullets on mount
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
        setLoading(false);
        return;
      }

      setEvaluationData(data);

      // Load bullets from database - try multiple sources
      let loadedBullets: Bullet[] = [];

      // 1. Try to load from 'bullets' field (legacy)
      if (data.bullets && Array.isArray(data.bullets) && data.bullets.length > 0) {
        console.log("📦 Loading bullets from 'bullets' field:", data.bullets.length);
        loadedBullets = data.bullets.map((bullet: any, index: number) => ({
          id: bullet.id || `bullet-${index}`,
          content: bullet.content || bullet,
          category: bullet.category,
        }));
      }
      // 2. Try to load from 'categorized_bullets' field (v1.6 flow)
      else if (data.categorized_bullets && Array.isArray(data.categorized_bullets) && data.categorized_bullets.length > 0) {
        console.log("📦 Loading bullets from 'categorized_bullets' field:", data.categorized_bullets.length);
        loadedBullets = data.categorized_bullets.map((bullet: any, index: number) => ({
          id: bullet.id || `bullet-${index}`,
          content: bullet.enhanced || bullet.content || bullet.original || bullet,
          category: bullet.category,
        }));
      }
      // 3. Fall back to default bullets if nothing exists
      else {
        console.log("📦 No bullets in database, using default bullets");
        loadedBullets = [
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
        ];
      }

      setBullets(loadedBullets);
      setLoading(false);
    };
    loadEvaluation();
  }, [evaluationId]);

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
    if (!evaluationData) {
      alert("Evaluation data not loaded yet. Please try again.");
      return;
    }

    const bullet = bullets.find(b => b.id === id);
    if (!bullet) {
      console.error("❌ Bullet not found:", id);
      return;
    }

    console.log("🔄 Regenerating bullet:", {
      id,
      originalContent: bullet.content.substring(0, 50) + "...",
      category: bullet.category || "Achieves",
      evaluationType: evaluationData.evaluation_type,
      rankLevel: evaluationData.rank_level
    });

    setRegenerating(id);

    try {
      // Determine category based on bullet content (or default to "Achieves")
      const category = bullet.category || "Achieves";

      // Call AI enhance endpoint with proper NCOER/OER tone
      const response = await fetch("/api/ai/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bullet: bullet.content,
          category: category,
          rankLevel: evaluationData.rank_level,
          evaluationType: evaluationData.evaluation_type || 'NCOER',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to regenerate bullet");
      }

      const { enhanced } = await response.json();
      console.log("✅ Bullet regenerated:", {
        id,
        originalLength: bullet.content.length,
        enhancedLength: enhanced.length,
        enhancedPreview: enhanced.substring(0, 50) + "..."
      });

      // Update bullet with regenerated content
      const updatedBullets = bullets.map(b => 
        b.id === id ? { ...b, content: enhanced } : b
      );
      setBullets(updatedBullets);
      
      console.log("📝 Bullets state updated, new count:", updatedBullets.length);
    } catch (error: any) {
      console.error("❌ Error regenerating bullet:", error);
      alert(`Failed to regenerate bullet: ${error.message}. Make sure Ollama is running.`);
    } finally {
      setRegenerating(null);
    }
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
    if (bullets.length === 0) {
      alert("Please add at least one bullet before continuing.");
      return;
    }

    setLoading(true);
    
    try {
      const supabase = createClient();
      
      console.log("💾 Saving bullets:", {
        evaluationId,
        bulletCount: bullets.length,
        bullets: bullets.map(b => ({
          id: b.id,
          contentLength: b.content.length,
          contentPreview: b.content.substring(0, 50) + "..."
        }))
      });
      
      // Save bullets to database
      const { data, error } = await supabase
        .from("evaluations")
        .update({ 
          bullets: bullets,
          status: "bullets_complete" 
        })
        .eq("id", evaluationId)
        .select(); // Select to verify the update

      if (error) {
        console.error("❌ Error saving bullets:", error);
        alert(`Error saving bullets: ${error.message}. Please try again.`);
        setLoading(false);
        return;
      }

      console.log("✅ Bullets saved successfully:", {
        savedCount: data?.[0]?.bullets?.length || 0,
        status: data?.[0]?.status
      });

      // Verify the bullets were actually saved
      if (!data || !data[0] || !data[0].bullets) {
        console.error("❌ Warning: Bullets may not have been saved correctly");
        alert("Warning: Bullets may not have been saved. Please check your data.");
        setLoading(false);
        return;
      }

      router.push(`/evaluation/${evaluationId}/narrative`);
    } catch (error: any) {
      console.error("❌ Unexpected error saving bullets:", error);
      alert("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="mb-4 inline-flex h-16 w-16 animate-spin items-center justify-center rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <h2 className="mb-2 text-2xl font-bold">Loading Bullets...</h2>
          <p className="text-gray-400">Loading your performance bullets from the database</p>
        </div>
      </div>
    );
  }

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
                      disabled={regenerating === bullet.id}
                      className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleRegenerate(bullet.id)}
                      disabled={regenerating === bullet.id}
                      className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <RotateCw className={`h-4 w-4 ${regenerating === bullet.id ? 'animate-spin' : ''}`} />
                      {regenerating === bullet.id ? 'Regenerating...' : 'Regenerate'}
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

