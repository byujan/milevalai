"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

type EvaluationType = "NCOER" | "OER";
type EvaluationSubtype = "Annual" | "Change of Rater" | "Relief for Cause";
type RankLevel = "O1-O3" | "O4-O5" | "O6" | "E5" | "E6-E8" | "E9";

export default function CreateEvaluation() {
  const [dutyTitle, setDutyTitle] = useState("");
  const [evaluationType, setEvaluationType] = useState<EvaluationType>("NCOER");
  const [evaluationSubtype, setEvaluationSubtype] = useState<EvaluationSubtype>("Change of Rater");
  const [rankLevel, setRankLevel] = useState<RankLevel>("E6-E8");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleNext = async () => {
    if (!dutyTitle.trim()) {
      alert("Please enter a duty title");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth/signin");
      return;
    }

    // Create evaluation in database
    const { data, error } = await supabase
      .from("evaluations")
      .insert({
        user_id: user.id,
        duty_title: dutyTitle,
        evaluation_type: evaluationType,
        evaluation_subtype: evaluationSubtype,
        rank_level: rankLevel,
        status: "draft",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating evaluation:", error);
      alert("Error creating evaluation. Please try again.");
      setLoading(false);
      return;
    }

    router.push(`/evaluation/${data.id}/bullets`);
  };

  return (
    <div className="min-h-screen bg-black px-4 py-8 text-white">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/dashboard"
          className="mb-8 inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="mb-12 text-center">
          <h1 className="mb-2 text-4xl font-bold">Create Evaluation</h1>
          <p className="text-gray-400">
            Enter your duty title and select an evaluation type.
          </p>
        </div>

        <div className="space-y-8">
          {/* Duty Title */}
          <div>
            <label htmlFor="dutyTitle" className="mb-3 block text-xl font-semibold">
              Duty Title
            </label>
            <input
              id="dutyTitle"
              type="text"
              value={dutyTitle}
              onChange={(e) => setDutyTitle(e.target.value)}
              placeholder="Company First Sergeant"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-6 py-4 text-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Evaluation Type */}
          <div>
            <label className="mb-3 block text-xl font-semibold">Evaluation Type</label>
            <div className="grid gap-4 sm:grid-cols-2">
              <button
                onClick={() => setEvaluationType("NCOER")}
                className={`rounded-xl border p-6 text-left transition-all ${
                  evaluationType === "NCOER"
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-white/10 bg-white/5 hover:border-white/20"
                }`}
              >
                <h3 className="mb-2 text-2xl font-bold">NCOER</h3>
                <p className="text-sm text-gray-400">
                  Non-Commissioned Officer Evaluation Report
                </p>
              </button>
              <button
                onClick={() => setEvaluationType("OER")}
                className={`rounded-xl border p-6 text-left transition-all ${
                  evaluationType === "OER"
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-white/10 bg-white/5 hover:border-white/20"
                }`}
              >
                <h3 className="mb-2 text-2xl font-bold">OER</h3>
                <p className="text-sm text-gray-400">Officer Evaluation Report</p>
              </button>
            </div>
          </div>

          {/* Evaluation Subtype */}
          <div>
            <label className="mb-3 block text-xl font-semibold">Evaluation Subtype</label>
            <div className="grid gap-4">
              {["Annual", "Change of Rater", "Relief for Cause"].map((type) => (
                <button
                  key={type}
                  onClick={() => setEvaluationSubtype(type as EvaluationSubtype)}
                  className={`rounded-xl border p-4 text-left transition-all ${
                    evaluationSubtype === type
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-white/10 bg-white/5 hover:border-white/20"
                  }`}
                >
                  <h4 className="font-semibold">{type}</h4>
                  <p className="text-sm text-gray-400">
                    {type === "Annual" && "DA FORM 67-10-2"}
                    {type === "Change of Rater" && "DA FORM 67-10-2"}
                    {type === "Relief for Cause" && "DA FORM 67-10-2"}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Rank Level */}
          <div>
            <label className="mb-3 block text-xl font-semibold">
              Select Rank Level
            </label>
            <p className="mb-4 text-sm text-gray-400">
              Which best represents the rank level being evaluated?
            </p>
            <div className="grid gap-4">
              {evaluationType === "OER" ? (
                <>
                  {["O1-O3", "O4-O5", "O6"].map((rank) => (
                    <button
                      key={rank}
                      onClick={() => setRankLevel(rank as RankLevel)}
                      className={`rounded-xl border p-4 text-left transition-all ${
                        rankLevel === rank
                          ? "border-blue-500 bg-blue-500/10"
                          : "border-white/10 bg-white/5 hover:border-white/20"
                      }`}
                    >
                      <h4 className="font-semibold">{rank}</h4>
                      <p className="text-sm text-gray-400">
                        {rank === "O1-O3" && "Company-grade officers"}
                        {rank === "O4-O5" && "Field-grade officers"}
                        {rank === "O6" && "Colonels"}
                      </p>
                    </button>
                  ))}
                </>
              ) : (
                <>
                  {["E5", "E6-E8", "E9"].map((rank) => (
                    <button
                      key={rank}
                      onClick={() => setRankLevel(rank as RankLevel)}
                      className={`rounded-xl border p-4 text-left transition-all ${
                        rankLevel === rank
                          ? "border-blue-500 bg-blue-500/10"
                          : "border-white/10 bg-white/5 hover:border-white/20"
                      }`}
                    >
                      <h4 className="font-semibold">{rank}</h4>
                      <p className="text-sm text-gray-400">
                        {rank === "E5" && "SGT (DA FORM 2166-9-1)"}
                        {rank === "E6-E8" && "SSG–1SG/MSG (DA FORM 2166-9-2)"}
                        {rank === "E9" && "CSM/SGM (DA FORM 2166-9-3)"}
                      </p>
                    </button>
                  ))}
                </>
              )}
            </div>
          </div>

          <button
            onClick={handleNext}
            disabled={loading || !dutyTitle.trim()}
            className="w-full rounded-xl bg-blue-600 px-6 py-4 text-lg font-medium transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Creating..." : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}

