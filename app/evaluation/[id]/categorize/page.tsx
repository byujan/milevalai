"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Sparkles, ThumbsUp, ThumbsDown, RotateCw, Check, ArrowRight, Pencil, Plus, Trash, X } from "lucide-react";

interface CategorizedBullet {
  id: string;
  category: 'Character' | 'Presence' | 'Intellect' | 'Leads' | 'Develops' | 'Achieves';
  original: string;
  enhanced: string;
  confidence: number;
}

const categories = ['Character', 'Presence', 'Intellect', 'Leads', 'Develops', 'Achieves'];

const categoryDescriptions = {
  Character: "Integrity, discipline, Army Values, ethical behavior",
  Presence: "Military bearing, fitness, confidence, professionalism",
  Intellect: "Sound judgment, innovation, problem-solving",
  Leads: "Leadership, guidance, mentorship, setting example",
  Develops: "Training others, team building, professional growth",
  Achieves: "Mission accomplishment, results, measurable outcomes",
};

export default function CategorizePage() {
  const params = useParams();
  const router = useRouter();
  const evaluationId = params.id as string;

  const [categorizedBullets, setCategorizedBullets] = useState<CategorizedBullet[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [evaluationData, setEvaluationData] = useState<any>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [showAddBullet, setShowAddBullet] = useState(false);
  const [newBulletText, setNewBulletText] = useState("");
  const [newBulletCategory, setNewBulletCategory] = useState<string>('Character');
  const [addingBullet, setAddingBullet] = useState(false);
  const [saving, setSaving] = useState(false);

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

      // Check if already categorized
      if (data.categorized_bullets) {
        setCategorizedBullets(data.categorized_bullets as CategorizedBullet[]);
        setLoading(false);
      } else {
        // Process bullets with AI
        await processBulletsWithAI(data.raw_bullets, data.rank_level);
      }
    } catch (error) {
      console.error("Error loading evaluation:", error);
      setLoading(false);
    }
  };

  const processBulletsWithAI = async (rawBullets: string[], rankLevel: string) => {
    setProcessing(true);

    try {
      // Call AI API to categorize and enhance bullets with proper NCOER/OER tone
      const response = await fetch("/api/ai/categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bullets: rawBullets,
          rankLevel: rankLevel,
          evaluationType: evaluationData?.evaluation_type || 'NCOER',
          evaluationId: evaluationId,
        }),
      });

      if (!response.ok) {
        throw new Error("AI processing failed");
      }

      const { categorized } = await response.json();
      
      // Add IDs to bullets
      const withIds = categorized.map((b: any, idx: number) => ({
        ...b,
        id: `bullet-${idx}`,
      }));

      setCategorizedBullets(withIds);

      // Save to database
      const supabase = createClient();
      await supabase
        .from("evaluations")
        .update({
          categorized_bullets: withIds,
          status: "bullets_categorized",
        })
        .eq("id", evaluationId);

      setLoading(false);
      setProcessing(false);
    } catch (error) {
      console.error("Error processing bullets:", error);
      alert("AI processing failed. Please try again or check that Ollama is running.");
      setLoading(false);
      setProcessing(false);
    }
  };

  const regenerateBullet = async (bulletId: string) => {
    const bullet = categorizedBullets.find((b) => b.id === bulletId);
    if (!bullet) return;

    try {
      // Regenerate with proper NCOER/OER tone and language
      const response = await fetch("/api/ai/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bullet: bullet.original,
          category: bullet.category,
          rankLevel: evaluationData.rank_level,
          evaluationType: evaluationData.evaluation_type || 'NCOER',
        }),
      });

      if (!response.ok) throw new Error("Enhancement failed");

      const { enhanced } = await response.json();

      // Update bullet
      const updatedBullets = categorizedBullets.map((b) =>
        b.id === bulletId ? { ...b, enhanced } : b
      );
      setCategorizedBullets(updatedBullets);

      // Auto-save to database
      try {
        const supabase = createClient();
        await supabase
          .from("evaluations")
          .update({ categorized_bullets: updatedBullets })
          .eq("id", evaluationId);
      } catch (error) {
        console.error("Error auto-saving regenerated bullet:", error);
      }
    } catch (error) {
      console.error("Error regenerating bullet:", error);
      alert("Failed to regenerate bullet. Make sure Ollama is running.");
    }
  };

  const handleEditBullet = (bulletId: string) => {
    const bullet = categorizedBullets.find((b) => b.id === bulletId);
    if (!bullet) return;
    setEditingId(bulletId);
    setEditContent(bullet.enhanced);
  };

  const handleSaveEdit = async (bulletId: string) => {
    const updatedBullets = categorizedBullets.map((b) =>
      b.id === bulletId ? { ...b, enhanced: editContent } : b
    );
    setCategorizedBullets(updatedBullets);
    setEditingId(null);
    setEditContent("");

    // Auto-save to database
    try {
      const supabase = createClient();
      await supabase
        .from("evaluations")
        .update({ categorized_bullets: updatedBullets })
        .eq("id", evaluationId);
    } catch (error) {
      console.error("Error auto-saving edited bullet:", error);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent("");
  };

  const handleDeleteBullet = async (bulletId: string) => {
    if (confirm("Are you sure you want to delete this bullet?")) {
      const updatedBullets = categorizedBullets.filter((b) => b.id !== bulletId);
      setCategorizedBullets(updatedBullets);

      // Auto-save to database
      try {
        const supabase = createClient();
        await supabase
          .from("evaluations")
          .update({ categorized_bullets: updatedBullets })
          .eq("id", evaluationId);
      } catch (error) {
        console.error("Error saving deleted bullet:", error);
      }
    }
  };

  const handleChangeCategory = async (bulletId: string, newCategory: string) => {
    const updatedBullets = categorizedBullets.map((b) =>
      b.id === bulletId ? { ...b, category: newCategory as any } : b
    );
    setCategorizedBullets(updatedBullets);

    // Auto-save to database
    try {
      const supabase = createClient();
      await supabase
        .from("evaluations")
        .update({ categorized_bullets: updatedBullets })
        .eq("id", evaluationId);
    } catch (error) {
      console.error("Error saving category change:", error);
    }
  };

  const handleAddBullet = async () => {
    if (!newBulletText.trim()) {
      alert("Please enter a bullet before adding.");
      return;
    }

    setAddingBullet(true);

    try {
      // Categorize and enhance the new bullet with AI
      const response = await fetch("/api/ai/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bullet: newBulletText.trim(),
          category: newBulletCategory,
          rankLevel: evaluationData.rank_level,
          evaluationType: evaluationData.evaluation_type || 'NCOER',
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to categorize new bullet");
      }

      const { enhanced } = await response.json();

      // Add new bullet with AI-enhanced version
      const newBullet: CategorizedBullet = {
        id: `bullet-${Date.now()}`,
        category: newBulletCategory as any,
        original: newBulletText.trim(),
        enhanced: enhanced,
        confidence: 0.85, // Default confidence for manually added bullets
      };

      const updatedBullets = [...categorizedBullets, newBullet];
      setCategorizedBullets(updatedBullets);
      setNewBulletText("");
      setShowAddBullet(false);
      setActiveCategory(newBulletCategory);

      // Auto-save to database
      try {
        const supabase = createClient();
        await supabase
          .from("evaluations")
          .update({ categorized_bullets: updatedBullets })
          .eq("id", evaluationId);
      } catch (error) {
        console.error("Error saving new bullet:", error);
      }
    } catch (error) {
      console.error("Error adding bullet:", error);
      alert("Failed to add bullet. Make sure Ollama is running.");
    } finally {
      setAddingBullet(false);
    }
  };

  const handleContinue = async () => {
    if (categorizedBullets.length === 0) {
      alert("Please categorize at least one bullet before continuing.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("evaluations")
        .update({ 
          categorized_bullets: categorizedBullets,
          status: "bullets_categorized"
        })
        .eq("id", evaluationId);

      if (error) {
        console.error("Error saving categorized bullets:", error);
        alert("Failed to save categorized bullets. Please try again.");
        setLoading(false);
        return;
      }

      router.push(`/evaluation/${evaluationId}/rater`);
    } catch (error) {
      console.error("Error saving:", error);
      alert("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  const bulletsInCategory = activeCategory === 'All' 
    ? categorizedBullets 
    : categorizedBullets.filter((b) => b.category === activeCategory);

  if (loading || processing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="mb-4 inline-flex h-16 w-16 animate-spin items-center justify-center rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <h2 className="mb-2 text-2xl font-bold">AI is Analyzing Your Bullets...</h2>
          <p className="text-gray-400">
            {processing
              ? "Categorizing and enhancing your performance bullets"
              : "Loading your evaluation"}
          </p>
          <div className="mt-6 text-sm text-gray-500">
            This may take a minute. Using Ollama llama3.2 locally.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black px-4 py-8 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">AI-Categorized Bullets</h1>
          <p className="text-gray-400">
            Review and refine AI-enhanced bullets organized by category
          </p>
        </div>

        {/* Category Tabs */}
        <div className="mb-8 flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveCategory('All')}
            className={`flex-shrink-0 rounded-lg border px-4 py-3 text-left transition-all ${
              activeCategory === 'All'
                ? "border-blue-500 bg-blue-500/10 text-blue-400"
                : "border-white/10 bg-white/5 text-gray-400 hover:border-white/20"
            }`}
          >
            <div className="font-semibold">All</div>
            <div className="text-xs opacity-75">
              {categorizedBullets.length} {categorizedBullets.length === 1 ? "bullet" : "bullets"}
            </div>
          </button>
          {categories.map((category) => {
            const count = categorizedBullets.filter((b) => b.category === category).length;
            return (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`flex-shrink-0 rounded-lg border px-4 py-3 text-left transition-all ${
                  activeCategory === category
                    ? "border-blue-500 bg-blue-500/10 text-blue-400"
                    : "border-white/10 bg-white/5 text-gray-400 hover:border-white/20"
                }`}
              >
                <div className="font-semibold">{category}</div>
                <div className="text-xs opacity-75">
                  {count} {count === 1 ? "bullet" : "bullets"}
                </div>
              </button>
            );
          })}
        </div>

        {/* Category Description */}
        {activeCategory !== 'All' && (
          <div className="mb-6 rounded-lg border border-white/10 bg-white/5 p-4 text-sm text-gray-400">
            <strong className="text-white">{activeCategory}:</strong>{" "}
            {categoryDescriptions[activeCategory as keyof typeof categoryDescriptions]}
          </div>
        )}

        {/* Bullets in Category */}
        <div className="space-y-4">
          {bulletsInCategory.length === 0 && !showAddBullet ? (
            <div className="rounded-xl border border-dashed border-white/20 bg-white/5 p-12 text-center text-gray-400">
              No bullets in this category yet
            </div>
          ) : (
            bulletsInCategory.map((bullet) => (
              <div
                key={bullet.id}
                className="rounded-xl border border-white/10 bg-white/5 p-6"
              >
                {/* Category and Actions Header */}
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400">
                      {bullet.category}
                    </span>
                    <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-xs text-blue-400">
                      {Math.round(bullet.confidence * 100)}% confidence
                    </span>
                    <select
                      value={bullet.category}
                      onChange={(e) => handleChangeCategory(bullet.id, e.target.value)}
                      className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white focus:border-blue-500 focus:outline-none"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => handleDeleteBullet(bullet.id)}
                    className="rounded-lg border border-red-500/20 bg-red-500/10 p-2 text-red-400 transition-colors hover:bg-red-500/20"
                    title="Delete bullet"
                  >
                    <Trash className="h-4 w-4" />
                  </button>
                </div>

                {/* Original Bullet */}
                <div className="mb-4">
                  <div className="mb-2 text-xs font-semibold uppercase text-gray-500">
                    Original
                  </div>
                  <p className="text-gray-400">{bullet.original}</p>
                </div>

                {/* AI Enhanced Bullet - Editable */}
                <div className="mb-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-blue-400" />
                    <span className="text-xs font-semibold uppercase text-blue-400">
                      AI Enhanced
                    </span>
                  </div>
                  {editingId === bullet.id ? (
                    <div>
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="mb-3 w-full resize-none rounded-lg border border-white/10 bg-black p-3 text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveEdit(bullet.id)}
                          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium transition-colors hover:bg-blue-700"
                        >
                          <Check className="h-4 w-4" />
                          Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium transition-colors hover:bg-white/10"
                        >
                          <X className="h-4 w-4" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-lg text-white">{bullet.enhanced}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {editingId !== bullet.id && (
                    <>
                      <button
                        onClick={() => handleEditBullet(bullet.id)}
                        className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm transition-colors hover:bg-white/10"
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => regenerateBullet(bullet.id)}
                        className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm transition-colors hover:bg-white/10"
                      >
                        <RotateCw className="h-4 w-4" />
                        Regenerate
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Bullet Form */}
        {showAddBullet ? (
          <div className="mt-6 rounded-xl border border-blue-500/20 bg-blue-500/10 p-6">
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Category
              </label>
              <select
                value={newBulletCategory}
                onChange={(e) => setNewBulletCategory(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 p-2 text-white focus:border-blue-500 focus:outline-none"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Bullet Text
              </label>
              <textarea
                value={newBulletText}
                onChange={(e) => setNewBulletText(e.target.value)}
                placeholder="Enter your new bullet point..."
                className="w-full resize-none rounded-lg border border-white/10 bg-black p-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleAddBullet}
                disabled={addingBullet || !newBulletText.trim()}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {addingBullet ? (
                  <>
                    <RotateCw className="h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Add Bullet
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowAddBullet(false);
                  setNewBulletText("");
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium transition-colors hover:bg-white/10"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => {
              setShowAddBullet(true);
              setNewBulletCategory(activeCategory === 'All' ? 'Character' : activeCategory);
            }}
            className="mt-6 w-full rounded-xl border border-dashed border-white/20 bg-white/5 px-6 py-4 text-sm font-medium text-gray-400 transition-colors hover:border-white/30 hover:text-white"
          >
            <Plus className="mx-auto h-5 w-5" />
            <span className="mt-2 block">Add New Bullet</span>
          </button>
        )}

        {/* Continue Button */}
        <div className="mt-8 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-6">
          <div>
            <h3 className="mb-1 font-semibold">Ready to Continue?</h3>
            <p className="text-sm text-gray-400">
              {categorizedBullets.length} bullets categorized and enhanced
            </p>
          </div>
          <button
            onClick={handleContinue}
            disabled={loading || categorizedBullets.length === 0}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continue to Rater Comments
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

