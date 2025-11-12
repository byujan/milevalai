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

  // Route based on v1.6 flow status - take user to their current step
  const status = evaluation.status || 'draft';
  
  // Flow: draft → predecessor → draft → categorize → rater → senior-rater → review → export
  
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
  
  // Bullets categorized - go to categorize page (can review/edit or continue to rater)
  if (status === 'bullets_categorized') {
    redirect(`/evaluation/${params.id}/categorize`);
  }
  
  // Bullets draft - go to draft page (to continue drafting)
  if (status === 'bullets_draft') {
    redirect(`/evaluation/${params.id}/draft`);
  }
  
  // Has raw bullets but status is draft - go to categorize (should be categorized)
  if (evaluation.raw_bullets && Array.isArray(evaluation.raw_bullets) && evaluation.raw_bullets.length > 0) {
    redirect(`/evaluation/${params.id}/categorize`);
  }
  
  // Has categorized bullets but status is draft - go to categorize
  if (evaluation.categorized_bullets && Array.isArray(evaluation.categorized_bullets) && evaluation.categorized_bullets.length > 0) {
    redirect(`/evaluation/${params.id}/categorize`);
  }
  
  // Default: draft status - go to predecessor page (or draft if they skipped)
  // Check if they have a predecessor file - if yes, go to draft; if no, go to predecessor
  if (evaluation.predecessor_file_url) {
    redirect(`/evaluation/${params.id}/draft`);
  }
  
  redirect(`/evaluation/${params.id}/predecessor`);
}

