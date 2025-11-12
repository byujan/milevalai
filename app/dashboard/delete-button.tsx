"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Trash2, X } from "lucide-react";

interface DeleteEvaluationButtonProps {
  evaluationId: string;
  evaluationTitle: string;
}

export function DeleteEvaluationButton({
  evaluationId,
  evaluationTitle,
}: DeleteEvaluationButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setDeleting(true);

    const supabase = createClient();
    const { error } = await supabase
      .from("evaluations")
      .delete()
      .eq("id", evaluationId);

    if (error) {
      console.error("Error deleting evaluation:", error);
      alert("Failed to delete evaluation. Please try again.");
      setDeleting(false);
      return;
    }

    // Refresh the page to update the list
    router.refresh();
  };

  if (showConfirm) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
        <div className="w-full max-w-md rounded-xl border border-white/10 bg-black p-6">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">
                Delete Evaluation?
              </h3>
              <p className="mt-2 text-sm text-gray-400">
                Are you sure you want to delete "{evaluationTitle}"? This action
                cannot be undone.
              </p>
            </div>
            <button
              onClick={() => setShowConfirm(false)}
              className="text-gray-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowConfirm(false)}
              disabled={deleting}
              className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        setShowConfirm(true);
      }}
      className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-400 transition-colors hover:border-red-500/30 hover:bg-red-500/20"
    >
      <Trash2 className="h-4 w-4" />
      Delete
    </button>
  );
}

