import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, FileText, LogOut } from "lucide-react";

export default async function Dashboard() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/signin");
  }

  // Fetch user's evaluations
  const { data: evaluations } = await supabase
    .from("evaluations")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10 bg-white/5">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold">MilEvalAI</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">{user.email}</span>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm transition-colors hover:bg-white/10"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold">My Evaluations</h2>
            <p className="mt-1 text-gray-400">
              Create and manage your military evaluations
            </p>
          </div>
          <Link
            href="/evaluation/create"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-medium transition-colors hover:bg-blue-700"
          >
            <Plus className="h-5 w-5" />
            New Evaluation
          </Link>
        </div>

        {evaluations && evaluations.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {evaluations.map((evaluation: any) => (
              <Link
                key={evaluation.id}
                href={`/evaluation/${evaluation.id}`}
                className="group rounded-xl border border-white/10 bg-white/5 p-6 transition-colors hover:border-white/20 hover:bg-white/10"
              >
                <div className="mb-4 flex items-start justify-between">
                  <FileText className="h-8 w-8 text-blue-400" />
                  <span className="rounded-full bg-blue-500/10 px-2 py-1 text-xs text-blue-400">
                    {evaluation.evaluation_type || "NCOER"}
                  </span>
                </div>
                <h3 className="mb-2 text-lg font-semibold">
                  {evaluation.duty_title || "Untitled Evaluation"}
                </h3>
                <p className="text-sm text-gray-400">
                  {new Date(evaluation.created_at).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-white/20 bg-white/5 p-12 text-center">
            <FileText className="mx-auto mb-4 h-12 w-12 text-gray-500" />
            <h3 className="mb-2 text-lg font-semibold">
              No evaluations yet
            </h3>
            <p className="mb-6 text-gray-400">
              Get started by creating your first evaluation
            </p>
            <Link
              href="/evaluation/create"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-medium transition-colors hover:bg-blue-700"
            >
              <Plus className="h-5 w-5" />
              Create Evaluation
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

