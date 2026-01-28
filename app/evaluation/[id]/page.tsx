import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function EvaluationPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();
  const { data: evaluation, error } = await supabase
    .from("evaluations")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !evaluation) {
    // If evaluation doesn't exist, redirect to dashboard
    redirect("/dashboard");
  }

  // Route based on status - take user to their current step
  const status = evaluation.status || 'draft';

  // Flow: predecessor → admin → bullets → rater → senior-rater → review → export

  // Completed - go to review page
  if (status === 'completed') {
    redirect(`/evaluation/${params.id}/review`);
  }

  // Senior rater complete - go to review (next step)
  if (status === 'senior_rater_complete') {
    redirect(`/evaluation/${params.id}/review`);
  }

  // Rater complete - go to senior-rater (next step)
  if (status === 'rater_complete') {
    redirect(`/evaluation/${params.id}/senior-rater`);
  }

  // Bullets categorized - go to bullets page (can review/edit or continue to rater)
  if (status === 'bullets_categorized') {
    redirect(`/evaluation/${params.id}/bullets`);
  }

  // Bullets draft - go to bullets page (to continue drafting)
  if (status === 'bullets_draft') {
    redirect(`/evaluation/${params.id}/bullets`);
  }

  // Has raw bullets or categorized bullets - go to bullets page
  if (evaluation.raw_bullets && Array.isArray(evaluation.raw_bullets) && evaluation.raw_bullets.length > 0) {
    redirect(`/evaluation/${params.id}/bullets`);
  }

  if (evaluation.categorized_bullets && Array.isArray(evaluation.categorized_bullets) && evaluation.categorized_bullets.length > 0) {
    redirect(`/evaluation/${params.id}/bullets`);
  }

  // Has form data - go to admin page
  if (evaluation.form_data) {
    redirect(`/evaluation/${params.id}/admin`);
  }

  // Has predecessor - go to admin (next step after predecessor)
  if (evaluation.predecessor_file_url) {
    redirect(`/evaluation/${params.id}/admin`);
  }

  // Default: start with predecessor upload
  redirect(`/evaluation/${params.id}/predecessor`);
}

