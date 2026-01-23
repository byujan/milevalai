"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Plus,
  X,
  RotateCw,
  Pencil,
  Trash,
  ArrowRight,
  Sparkles,
  FileText,
  Check,
  Loader2
} from "lucide-react";

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

export default function UnifiedBulletsPage() {
  const params = useParams();
  const router = useRouter();
  const evaluationId = params.id as string;

  const [evaluationData, setEvaluationData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Input state
  const [newBulletText, setNewBulletText] = useState("");
  const [adding, setAdding] = useState(false);

  // Categorized bullets state
  const [categorizedBullets, setCategorizedBullets] = useState<CategorizedBullet[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  // Load evaluation data
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

      // Load existing categorized bullets if available
      if (data.categorized_bullets && Array.isArray(data.categorized_bullets)) {
        setCategorizedBullets(data.categorized_bullets as CategorizedBullet[]);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error loading evaluation:", error);
      setLoading(false);
    }
  };

  // Handle adding a new bullet
  const handleAddBullet = async () => {
    if (!newBulletText.trim()) {
      alert("Please enter a bullet before adding.");
      return;
    }

    if (!evaluationData) {
      alert("Evaluation data not loaded yet. Please try again.");
      return;
    }

    setAdding(true);

    try {
      // Call AI to categorize and enhance
      const response = await fetch("/api/ai/categorize-single", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bullet: newBulletText.trim(),
          rankLevel: evaluationData.rank_level,
          evaluationType: evaluationData.evaluation_type || 'NCOER',
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to categorize bullet");
      }

      const { categorized } = await response.json();

      // Add to list with new ID
      const newBullet: CategorizedBullet = {
        id: `bullet-${Date.now()}`,
        category: categorized.category,
        original: newBulletText.trim(),
        enhanced: categorized.enhanced,
        confidence: categorized.confidence || 0.85,
      };

      const updatedBullets = [...categorizedBullets, newBullet];
      setCategorizedBullets(updatedBullets);
      setNewBulletText("");

      // Auto-save to database
      await saveToDatabase(updatedBullets);
    } catch (error) {
      console.error("Error adding bullet:", error);
      alert("Failed to add bullet. Make sure Ollama is running.");
    } finally {
      setAdding(false);
    }
  };

  // Handle paste from clipboard
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const lines = text
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      if (lines.length > 0) {
        // Add first line to input
        setNewBulletText(lines[0]);

        // If multiple lines, process them all
        if (lines.length > 1) {
          alert(`Pasted ${lines.length} lines. Processing first line. Add remaining lines manually.`);
        }
      }
    } catch (error) {
      console.error("Failed to read clipboard:", error);
      alert("Failed to read from clipboard.");
    }
  };

  // Handle bullet editing
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

    await saveToDatabase(updatedBullets);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent("");
  };

  // Handle bullet regeneration
  const handleRegenerateBullet = async (bulletId: string) => {
    const bullet = categorizedBullets.find((b) => b.id === bulletId);
    if (!bullet || !evaluationData) return;

    setRegeneratingId(bulletId);

    try {
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

      const updatedBullets = categorizedBullets.map((b) =>
        b.id === bulletId ? { ...b, enhanced } : b
      );
      setCategorizedBullets(updatedBullets);

      await saveToDatabase(updatedBullets);
    } catch (error) {
      console.error("Error regenerating bullet:", error);
      alert("Failed to regenerate bullet. Make sure Ollama is running.");
    } finally {
      setRegeneratingId(null);
    }
  };

  // Handle bullet deletion
  const handleDeleteBullet = async (bulletId: string) => {
    if (confirm("Are you sure you want to delete this bullet?")) {
      const updatedBullets = categorizedBullets.filter((b) => b.id !== bulletId);
      setCategorizedBullets(updatedBullets);
      await saveToDatabase(updatedBullets);
    }
  };

  // Handle category change
  const handleChangeCategory = async (bulletId: string, newCategory: string) => {
    const updatedBullets = categorizedBullets.map((b) =>
      b.id === bulletId ? { ...b, category: newCategory as any } : b
    );
    setCategorizedBullets(updatedBullets);
    await saveToDatabase(updatedBullets);
  };

  // Save to database
  const saveToDatabase = async (bullets: CategorizedBullet[]) => {
    try {
      const supabase = createClient();
      await supabase
        .from("evaluations")
        .update({ categorized_bullets: bullets })
        .eq("id", evaluationId);
    } catch (error) {
      console.error("Error saving to database:", error);
    }
  };

  // Handle continue
  const handleContinue = async () => {
    if (categorizedBullets.length === 0) {
      alert("Please add at least one bullet before continuing.");
      return;
    }

    setSaving(true);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("evaluations")
        .update({
          categorized_bullets: categorizedBullets,
          status: "bullets_categorized",
        })
        .eq("id", evaluationId);

      if (error) {
        console.error("Error saving:", error);
        alert("Failed to save. Please try again.");
        setSaving(false);
        return;
      }

      router.push(`/evaluation/${evaluationId}/rater`);
    } catch (error) {
      console.error("Error:", error);
      alert("An unexpected error occurred.");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-blue-500" />
          <p className="text-gray-400">Loading evaluation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">Draft & Categorize Bullets</h1>
          <p className="text-gray-400">
            Enter your accomplishments and AI will automatically categorize and enhance them
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left Panel: Input */}
          <div className="rounded-xl border border-white/10 bg-black shadow-sm p-6">
            <div className="mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-400" />
              <h2 className="text-lg font-semibold">Add New Bullet</h2>
            </div>

            <p className="mb-4 text-sm text-gray-400">
              Describe an accomplishment or performance highlight. AI will categorize and enhance it.
            </p>

            <textarea
              value={newBulletText}
              onChange={(e) => setNewBulletText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  handleAddBullet();
                }
              }}
              placeholder="Example: Led 15-soldier team through deployment, maintaining 100% mission readiness..."
              className="mb-4 w-full resize-none rounded-lg border border-white/10 bg-black/50 p-4 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              rows={5}
            />

            <div className="mb-4 text-xs text-gray-500">
              {newBulletText.length} characters • Press Ctrl+Enter to add
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleAddBullet}
                disabled={adding || !newBulletText.trim()}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-medium transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {adding ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Add & Categorize
                  </>
                )}
              </button>
              <button
                onClick={handlePaste}
                disabled={adding}
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-black px-4 py-3 text-sm transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <FileText className="h-4 w-4" />
                Paste
              </button>
            </div>

            {/* Tips */}
            <div className="mt-6 rounded-lg border border-blue-500/20 bg-blue-500/10 p-4">
              <h3 className="mb-2 text-sm font-semibold text-blue-400">Tips:</h3>
              <ul className="space-y-1 text-xs text-gray-300">
                <li>• Use action verbs (led, trained, managed)</li>
                <li>• Include numbers and measurable outcomes</li>
                <li>• Focus on results and impact</li>
                <li>• AI will enhance with proper {evaluationData?.evaluation_type || 'NCOER'} tone</li>
              </ul>
            </div>
          </div>

          {/* Right Panel: Categorized Bullets */}
          <div className="rounded-xl border border-white/10 bg-black shadow-sm p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-400" />
                <h2 className="text-lg font-semibold">
                  Categorized Bullets ({categorizedBullets.length})
                </h2>
              </div>
            </div>

            {categorizedBullets.length === 0 ? (
              <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-white/20 bg-black/50">
                <div className="text-center text-gray-400">
                  <Sparkles className="mx-auto mb-2 h-8 w-8" />
                  <p className="text-sm">No bullets yet</p>
                  <p className="text-xs">Add your first bullet to get started</p>
                </div>
              </div>
            ) : (
              <div className="max-h-[600px] space-y-4 overflow-y-auto pr-2">
                {categorizedBullets.map((bullet) => (
                  <div
                    key={bullet.id}
                    className="rounded-lg border border-white/10 bg-black/50 p-4"
                  >
                    {/* Category Header */}
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400">
                          {bullet.category}
                        </span>
                        <span className="text-xs text-gray-500">
                          {Math.round(bullet.confidence * 100)}% confidence
                        </span>
                      </div>
                      <select
                        value={bullet.category}
                        onChange={(e) => handleChangeCategory(bullet.id, e.target.value)}
                        className="rounded border border-white/10 bg-black px-2 py-1 text-xs text-white focus:border-blue-500 focus:outline-none"
                      >
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Original */}
                    <div className="mb-2">
                      <div className="mb-1 text-xs font-semibold uppercase text-gray-500">
                        Original
                      </div>
                      <p className="text-sm text-gray-400">{bullet.original}</p>
                    </div>

                    {/* Enhanced */}
                    <div className="mb-3">
                      <div className="mb-1 flex items-center gap-2">
                        <Sparkles className="h-3 w-3 text-blue-400" />
                        <span className="text-xs font-semibold uppercase text-blue-400">
                          AI Enhanced
                        </span>
                      </div>
                      {editingId === bullet.id ? (
                        <div>
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="mb-2 w-full resize-none rounded border border-white/10 bg-black p-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                            rows={3}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSaveEdit(bullet.id)}
                              className="inline-flex items-center gap-1 rounded bg-blue-600 px-2 py-1 text-xs hover:bg-blue-700"
                            >
                              <Check className="h-3 w-3" />
                              Save
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="inline-flex items-center gap-1 rounded border border-white/10 px-2 py-1 text-xs hover:bg-white/10"
                            >
                              <X className="h-3 w-3" />
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-white">{bullet.enhanced}</p>
                      )}
                    </div>

                    {/* Actions */}
                    {editingId !== bullet.id && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditBullet(bullet.id)}
                          className="inline-flex items-center gap-1 rounded border border-white/10 px-2 py-1 text-xs transition-colors hover:bg-white/10"
                        >
                          <Pencil className="h-3 w-3" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleRegenerateBullet(bullet.id)}
                          disabled={regeneratingId === bullet.id}
                          className="inline-flex items-center gap-1 rounded border border-white/10 px-2 py-1 text-xs transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <RotateCw className={`h-3 w-3 ${regeneratingId === bullet.id ? 'animate-spin' : ''}`} />
                          Regenerate
                        </button>
                        <button
                          onClick={() => handleDeleteBullet(bullet.id)}
                          className="inline-flex items-center gap-1 rounded border border-red-500/20 bg-red-500/10 px-2 py-1 text-xs text-red-400 transition-colors hover:bg-red-500/20"
                        >
                          <Trash className="h-3 w-3" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Continue Button */}
        <div className="mt-8 rounded-xl border border-white/10 bg-black shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="mb-1 font-semibold">Ready to Continue?</h3>
              <p className="text-sm text-gray-400">
                {categorizedBullets.length} bullet{categorizedBullets.length !== 1 ? 's' : ''} categorized
              </p>
            </div>
            <button
              onClick={handleContinue}
              disabled={saving || categorizedBullets.length === 0}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Continue to Rater Comments
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
