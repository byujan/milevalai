"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  User,
  Users,
  Briefcase,
  Activity,
  AlertCircle,
  Check,
  RotateCw,
} from "lucide-react";
import {
  EvaluationFormData,
  RatedPersonnel,
  PeriodCovered,
  ReasonForSubmission,
  RatingChain,
  RaterInfo,
  SeniorRaterInfo,
  DutyDescription,
  FitnessData,
  EvaluationType,
  RankLevel,
  Component,
  StatusCode,
} from "@/lib/types/database";
import {
  REASON_CODES,
  NONRATED_CODES,
  calculateRatedMonths,
  validateDODID,
  validateUIC,
  validateMilitaryEmail,
} from "@/lib/validation/evaluation-validator";
import { generateQuarterlyCounselingDates } from "@/lib/utils/date-utils";

// Section collapse state type
interface SectionState {
  partI: boolean;
  partII: boolean;
  partIII: boolean;
  fitness: boolean;
}

// Component selection options
const COMPONENTS: { value: Component; label: string }[] = [
  { value: "RA", label: "Regular Army (RA)" },
  { value: "USAR", label: "US Army Reserve (USAR)" },
  { value: "ARNG", label: "Army National Guard (ARNG)" },
];

const STATUS_CODES: { value: StatusCode; label: string }[] = [
  { value: "AD", label: "Active Duty" },
  { value: "AGR", label: "Active Guard Reserve" },
  { value: "TPU", label: "Troop Program Unit" },
  { value: "IMA", label: "Individual Mobilization Augmentee" },
  { value: "IRR", label: "Individual Ready Reserve" },
  { value: "MOB", label: "Mobilized" },
];

const ACFT_STATUS_OPTIONS = [
  { value: "Pass", label: "Pass" },
  { value: "Fail", label: "Fail" },
  { value: "Profile", label: "Profile" },
  { value: "Exempt", label: "Exempt" },
];

export default function AdminDataPage() {
  const params = useParams();
  const router = useRouter();
  const evaluationId = params.id as string;

  // Evaluation metadata
  const [evalType, setEvalType] = useState<EvaluationType>("NCOER");
  const [rankLevel, setRankLevel] = useState<RankLevel>("E6-E8");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Section collapse state
  const [expanded, setExpanded] = useState<SectionState>({
    partI: true,
    partII: false,
    partIII: false,
    fitness: false,
  });

  // Form data state
  const [formData, setFormData] = useState<Partial<EvaluationFormData>>({
    rated_personnel: {
      name: "",
      dodid: "",
      rank: "",
      date_of_rank: "",
      pmos_aoc: "",
      component: "RA",
      status_code: "AD",
      unit_org_station: "",
      uic: "",
      email: "",
    },
    period_covered: {
      from_date: "",
      thru_date: "",
      rated_months: 0,
      nonrated_codes: [],
    },
    reason_for_submission: {
      code: "01",
      description: "Annual",
    },
    rating_chain: {
      rater: {
        name: "",
        rank: "",
        position: "",
        email: "",
        num_rated_in_grade: 0,
      },
      senior_rater: {
        name: "",
        rank: "",
        position: "",
        email: "",
        num_senior_rated_in_grade: 0,
      },
    },
    duty_description: {
      principal_duty_title: "",
      significant_duties: "",
      areas_of_emphasis: "",
      appointed_duties: "",
      counseling_dates: {
        initial: "",
        quarterly: [],
      },
    },
    fitness: {
      acft_status: "Pass",
      acft_date: "",
      height: "",
      weight: "",
      within_standard: true,
    },
  });

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load existing evaluation data
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
        router.push("/dashboard");
        return;
      }

      setEvalType(data.evaluation_type);
      setRankLevel(data.rank_level);

      // Load existing form data if available
      if (data.form_data) {
        const existingData = data.form_data as EvaluationFormData;
        setFormData((prev) => ({
          ...prev,
          ...existingData,
          duty_description: {
            ...prev.duty_description,
            ...existingData.duty_description,
            principal_duty_title:
              existingData.duty_description?.principal_duty_title ||
              data.duty_title,
          },
        }));
      } else {
        // Pre-fill from predecessor if available
        const predecessorData = data.predecessor_analysis?.admin_data;

        if (predecessorData) {
          console.log('Pre-filling from predecessor analysis:', predecessorData);

          setFormData((prev) => ({
            ...prev,
            rated_personnel: {
              ...prev.rated_personnel!,
              name: predecessorData.name || prev.rated_personnel?.name || "",
              rank: predecessorData.rank || prev.rated_personnel?.rank || "",
              dodid: predecessorData.dodid || prev.rated_personnel?.dodid || "",
              pmos_aoc: predecessorData.pmos_aoc || prev.rated_personnel?.pmos_aoc || "",
              uic: predecessorData.uic || prev.rated_personnel?.uic || "",
              unit_org_station: predecessorData.unit_org_station || prev.rated_personnel?.unit_org_station || "",
            },
            period_covered: {
              ...prev.period_covered!,
              from_date: predecessorData.period_from || prev.period_covered?.from_date || "",
              thru_date: predecessorData.period_thru || prev.period_covered?.thru_date || "",
            },
            rating_chain: {
              ...prev.rating_chain!,
              rater: {
                ...prev.rating_chain?.rater!,
                name: predecessorData.rater_name || prev.rating_chain?.rater?.name || "",
                rank: predecessorData.rater_rank || prev.rating_chain?.rater?.rank || "",
                position: predecessorData.rater_position || prev.rating_chain?.rater?.position || "",
              },
              senior_rater: {
                ...prev.rating_chain?.senior_rater!,
                name: predecessorData.senior_rater_name || prev.rating_chain?.senior_rater?.name || "",
                rank: predecessorData.senior_rater_rank || prev.rating_chain?.senior_rater?.rank || "",
                position: predecessorData.senior_rater_position || prev.rating_chain?.senior_rater?.position || "",
              },
            },
            duty_description: {
              ...prev.duty_description!,
              principal_duty_title: predecessorData.duty_title || data.duty_title,
            },
          }));
        } else {
          // No predecessor data, just pre-fill duty title from evaluation
          setFormData((prev) => ({
            ...prev,
            duty_description: {
              ...prev.duty_description!,
              principal_duty_title: data.duty_title,
            },
          }));
        }
      }

      setLoading(false);
    };

    loadEvaluation();
  }, [evaluationId, router]);

  // Auto-calculate rated months when dates change
  useEffect(() => {
    if (formData.period_covered?.from_date && formData.period_covered?.thru_date) {
      const months = calculateRatedMonths(
        formData.period_covered.from_date,
        formData.period_covered.thru_date
      );
      setFormData((prev) => ({
        ...prev,
        period_covered: {
          ...prev.period_covered!,
          rated_months: months,
        },
      }));
    }
  }, [formData.period_covered?.from_date, formData.period_covered?.thru_date]);

  // Auto-generate counseling dates when from_date changes
  useEffect(() => {
    if (formData.period_covered?.from_date && !formData.duty_description?.counseling_dates?.initial) {
      const ratedMonths = formData.period_covered?.rated_months || 12;
      const counselingDates = generateQuarterlyCounselingDates(
        formData.period_covered.from_date,
        ratedMonths
      );

      setFormData((prev) => ({
        ...prev,
        duty_description: {
          ...prev.duty_description!,
          counseling_dates: counselingDates,
        },
      }));
    }
  }, [formData.period_covered?.from_date, formData.period_covered?.rated_months]);

  // Debounced auto-save
  const saveFormData = useCallback(async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("evaluations")
        .update({
          form_data: formData,
          duty_title: formData.duty_description?.principal_duty_title,
          updated_at: new Date().toISOString(),
        })
        .eq("id", evaluationId);

      if (error) throw error;
      setLastSaved(new Date());
    } catch (error) {
      console.error("Error saving:", error);
    } finally {
      setSaving(false);
    }
  }, [formData, evaluationId]);

  // Auto-save on changes (debounced)
  useEffect(() => {
    if (loading) return;

    const timer = setTimeout(() => {
      saveFormData();
    }, 2000);

    return () => clearTimeout(timer);
  }, [formData, loading, saveFormData]);

  // Validate field on blur
  const validateField = (field: string, value: string) => {
    let error: string | null = null;

    switch (field) {
      case "rated_personnel.dodid":
        const dodidError = validateDODID(value);
        error = dodidError?.message || null;
        break;
      case "rated_personnel.uic":
        const uicError = validateUIC(value);
        error = uicError?.message || null;
        break;
      case "rated_personnel.email":
      case "rating_chain.rater.email":
      case "rating_chain.senior_rater.email":
        const emailError = validateMilitaryEmail(value, field);
        error = emailError?.message || null;
        break;
    }

    setErrors((prev) => {
      if (error) {
        return { ...prev, [field]: error };
      } else {
        const { [field]: _, ...rest } = prev;
        return rest;
      }
    });
  };

  // Update nested form data
  const updateFormData = (path: string, value: unknown) => {
    setFormData((prev) => {
      const parts = path.split(".");
      const newData = { ...prev };
      let current: Record<string, unknown> = newData;

      for (let i = 0; i < parts.length - 1; i++) {
        current[parts[i]] = { ...(current[parts[i]] as Record<string, unknown>) };
        current = current[parts[i]] as Record<string, unknown>;
      }

      current[parts[parts.length - 1]] = value;
      return newData as Partial<EvaluationFormData>;
    });
  };

  // Toggle section expansion
  const toggleSection = (section: keyof SectionState) => {
    setExpanded((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Handle continue to next step
  const handleContinue = async () => {
    await saveFormData();
    router.push(`/evaluation/${evaluationId}/bullets`);
  };

  // Get reason codes for current eval type
  const reasonCodes = REASON_CODES[evalType];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-white">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto"></div>
          <p className="text-gray-400">Loading evaluation data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <Link
          href="/dashboard"
          className="mb-8 inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">Administrative Data</h1>
          <p className="text-gray-400">
            Complete all required fields for Parts I, II, and III of the{" "}
            {evalType === "OER" ? "Officer Evaluation Report" : "NCO Evaluation Report"}.
          </p>
          <div className="mt-2 inline-flex items-center gap-2 rounded-lg bg-black shadow-sm px-3 py-1 text-sm">
            <span className="text-gray-400">Form:</span>
            <span className="font-medium">
              {evalType === "OER"
                ? rankLevel === "O1-O3"
                  ? "DA 67-10-1"
                  : rankLevel === "O4-O5"
                  ? "DA 67-10-2"
                  : "DA 67-10-3"
                : rankLevel === "E5"
                ? "DA 2166-9-1"
                : rankLevel === "E6-E8"
                ? "DA 2166-9-2"
                : "DA 2166-9-3"}
            </span>
          </div>
        </div>

        {/* Part I - Rated Personnel */}
        <section className="mb-6 rounded-xl border border-white/10 bg-black shadow-sm overflow-hidden">
          <button
            onClick={() => toggleSection("partI")}
            className="flex w-full items-center justify-between p-6 text-left"
          >
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-blue-400" />
              <div>
                <h2 className="text-xl font-semibold">Part I - Rated {evalType === "OER" ? "Officer" : "NCO"}</h2>
                <p className="text-sm text-gray-400">Administrative identification data</p>
              </div>
            </div>
            {expanded.partI ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </button>

          {expanded.partI && (
            <div className="border-t border-white/10 p-6 space-y-6">
              {/* Name and DODID */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Name (Last, First MI) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.rated_personnel?.name || ""}
                    onChange={(e) => updateFormData("rated_personnel.name", e.target.value)}
                    placeholder="SMITH, JOHN A"
                    className="w-full rounded-lg border border-white/10 bg-black shadow-sm0 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    DOD ID Number <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.rated_personnel?.dodid || ""}
                    onChange={(e) => updateFormData("rated_personnel.dodid", e.target.value.replace(/\D/g, "").slice(0, 10))}
                    onBlur={(e) => validateField("rated_personnel.dodid", e.target.value)}
                    placeholder="1234567890"
                    maxLength={10}
                    className={`w-full rounded-lg border ${
                      errors["rated_personnel.dodid"] ? "border-red-500" : "border-white/10"
                    } bg-black shadow-sm0 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none`}
                  />
                  {errors["rated_personnel.dodid"] && (
                    <p className="mt-1 text-sm text-red-400">{errors["rated_personnel.dodid"]}</p>
                  )}
                </div>
              </div>

              {/* Rank and Date of Rank */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Rank <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.rated_personnel?.rank || ""}
                    onChange={(e) => updateFormData("rated_personnel.rank", e.target.value)}
                    placeholder={evalType === "OER" ? "CPT" : "SFC"}
                    className="w-full rounded-lg border border-white/10 bg-black shadow-sm0 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Date of Rank (YYYYMMDD) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.rated_personnel?.date_of_rank || ""}
                    onChange={(e) => updateFormData("rated_personnel.date_of_rank", e.target.value.replace(/\D/g, "").slice(0, 8))}
                    placeholder="20230601"
                    maxLength={8}
                    className="w-full rounded-lg border border-white/10 bg-black shadow-sm0 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* PMOS/AOC and Branch */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    {evalType === "OER" ? "AOC/Branch" : "PMOS"} <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.rated_personnel?.pmos_aoc || ""}
                    onChange={(e) => updateFormData("rated_personnel.pmos_aoc", e.target.value)}
                    placeholder={evalType === "OER" ? "11A" : "11B"}
                    className="w-full rounded-lg border border-white/10 bg-black shadow-sm0 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Email (.gov or .mil)</label>
                  <input
                    type="email"
                    value={formData.rated_personnel?.email || ""}
                    onChange={(e) => updateFormData("rated_personnel.email", e.target.value)}
                    onBlur={(e) => validateField("rated_personnel.email", e.target.value)}
                    placeholder="john.smith@army.mil"
                    className={`w-full rounded-lg border ${
                      errors["rated_personnel.email"] ? "border-yellow-500" : "border-white/10"
                    } bg-black shadow-sm0 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none`}
                  />
                  {errors["rated_personnel.email"] && (
                    <p className="mt-1 text-sm text-yellow-400">{errors["rated_personnel.email"]}</p>
                  )}
                </div>
              </div>

              {/* Component and Status Code */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">Component <span className="text-red-400">*</span></label>
                  <select
                    value={formData.rated_personnel?.component || "RA"}
                    onChange={(e) => updateFormData("rated_personnel.component", e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-black shadow-sm0 px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                  >
                    {COMPONENTS.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Status Code</label>
                  <select
                    value={formData.rated_personnel?.status_code || "AD"}
                    onChange={(e) => updateFormData("rated_personnel.status_code", e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-black shadow-sm0 px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                  >
                    {STATUS_CODES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Unit/Org and UIC */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium">
                    Unit, Organization, Station, ZIP/APO, Major Command <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.rated_personnel?.unit_org_station || ""}
                    onChange={(e) => updateFormData("rated_personnel.unit_org_station", e.target.value)}
                    placeholder="HHC, 1-502 IN, Fort Campbell, KY 42223, 101st ABN DIV"
                    className="w-full rounded-lg border border-white/10 bg-black shadow-sm0 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    UIC <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.rated_personnel?.uic || ""}
                    onChange={(e) => updateFormData("rated_personnel.uic", e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
                    onBlur={(e) => validateField("rated_personnel.uic", e.target.value)}
                    placeholder="WABCD0"
                    maxLength={6}
                    className={`w-full rounded-lg border ${
                      errors["rated_personnel.uic"] ? "border-red-500" : "border-white/10"
                    } bg-black shadow-sm0 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none`}
                  />
                  {errors["rated_personnel.uic"] && (
                    <p className="mt-1 text-sm text-red-400">{errors["rated_personnel.uic"]}</p>
                  )}
                </div>
              </div>

              {/* Period Covered */}
              <div className="border-t border-white/10 pt-6">
                <h3 className="mb-4 text-lg font-semibold">Period Covered</h3>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      From (YYYYMMDD) <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.period_covered?.from_date || ""}
                      onChange={(e) => updateFormData("period_covered.from_date", e.target.value.replace(/\D/g, "").slice(0, 8))}
                      placeholder="20240101"
                      maxLength={8}
                      className="w-full rounded-lg border border-white/10 bg-black shadow-sm0 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Thru (YYYYMMDD) <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.period_covered?.thru_date || ""}
                      onChange={(e) => updateFormData("period_covered.thru_date", e.target.value.replace(/\D/g, "").slice(0, 8))}
                      placeholder="20241231"
                      maxLength={8}
                      className="w-full rounded-lg border border-white/10 bg-black shadow-sm0 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">Rated Months</label>
                    <div className="flex h-[50px] items-center rounded-lg border border-white/10 bg-black/30 px-4 text-gray-400">
                      {formData.period_covered?.rated_months || 0} months
                    </div>
                  </div>
                </div>
              </div>

              {/* Reason for Submission */}
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Reason for Submission <span className="text-red-400">*</span>
                </label>
                <select
                  value={formData.reason_for_submission?.code || "01"}
                  onChange={(e) => {
                    const selected = reasonCodes.find((r) => r.code === e.target.value);
                    updateFormData("reason_for_submission", selected || reasonCodes[0]);
                  }}
                  className="w-full rounded-lg border border-white/10 bg-black shadow-sm0 px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                >
                  {reasonCodes.map((r) => (
                    <option key={r.code} value={r.code}>
                      {r.code} - {r.description}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </section>

        {/* Part II - Rating Chain */}
        <section className="mb-6 rounded-xl border border-white/10 bg-black shadow-sm overflow-hidden">
          <button
            onClick={() => toggleSection("partII")}
            className="flex w-full items-center justify-between p-6 text-left"
          >
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-green-400" />
              <div>
                <h2 className="text-xl font-semibold">Part II - Rating Chain</h2>
                <p className="text-sm text-gray-400">Rater and Senior Rater information</p>
              </div>
            </div>
            {expanded.partII ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </button>

          {expanded.partII && (
            <div className="border-t border-white/10 p-6 space-y-8">
              {/* Rater */}
              <div>
                <h3 className="mb-4 text-lg font-semibold text-green-400">Rater</h3>
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Name (Last, First MI) <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.rating_chain?.rater?.name || ""}
                        onChange={(e) => updateFormData("rating_chain.rater.name", e.target.value)}
                        placeholder="DOE, JANE M"
                        className="w-full rounded-lg border border-white/10 bg-black shadow-sm0 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Rank <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.rating_chain?.rater?.rank || ""}
                        onChange={(e) => updateFormData("rating_chain.rater.rank", e.target.value)}
                        placeholder={evalType === "OER" ? "MAJ" : "1SG"}
                        className="w-full rounded-lg border border-white/10 bg-black shadow-sm0 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Position <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.rating_chain?.rater?.position || ""}
                        onChange={(e) => updateFormData("rating_chain.rater.position", e.target.value)}
                        placeholder="Company Commander"
                        className="w-full rounded-lg border border-white/10 bg-black shadow-sm0 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium">Email (.gov or .mil)</label>
                      <input
                        type="email"
                        value={formData.rating_chain?.rater?.email || ""}
                        onChange={(e) => updateFormData("rating_chain.rater.email", e.target.value)}
                        onBlur={(e) => validateField("rating_chain.rater.email", e.target.value)}
                        placeholder="jane.doe@army.mil"
                        className="w-full rounded-lg border border-white/10 bg-black shadow-sm0 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Senior Rater */}
              <div className="border-t border-white/10 pt-6">
                <h3 className="mb-4 text-lg font-semibold text-blue-400">Senior Rater</h3>
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Name (Last, First MI) <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.rating_chain?.senior_rater?.name || ""}
                        onChange={(e) => updateFormData("rating_chain.senior_rater.name", e.target.value)}
                        placeholder="JONES, ROBERT L"
                        className="w-full rounded-lg border border-white/10 bg-black shadow-sm0 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Rank <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.rating_chain?.senior_rater?.rank || ""}
                        onChange={(e) => updateFormData("rating_chain.senior_rater.rank", e.target.value)}
                        placeholder={evalType === "OER" ? "LTC" : "CSM"}
                        className="w-full rounded-lg border border-white/10 bg-black shadow-sm0 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Position <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.rating_chain?.senior_rater?.position || ""}
                        onChange={(e) => updateFormData("rating_chain.senior_rater.position", e.target.value)}
                        placeholder="Battalion Commander"
                        className="w-full rounded-lg border border-white/10 bg-black shadow-sm0 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium">Email (.gov or .mil)</label>
                      <input
                        type="email"
                        value={formData.rating_chain?.senior_rater?.email || ""}
                        onChange={(e) => updateFormData("rating_chain.senior_rater.email", e.target.value)}
                        onBlur={(e) => validateField("rating_chain.senior_rater.email", e.target.value)}
                        placeholder="robert.jones@army.mil"
                        className="w-full rounded-lg border border-white/10 bg-black shadow-sm0 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Part III - Duty Description */}
        <section className="mb-6 rounded-xl border border-white/10 bg-black shadow-sm overflow-hidden">
          <button
            onClick={() => toggleSection("partIII")}
            className="flex w-full items-center justify-between p-6 text-left"
          >
            <div className="flex items-center gap-3">
              <Briefcase className="h-5 w-5 text-purple-400" />
              <div>
                <h2 className="text-xl font-semibold">Part III - Duty Description</h2>
                <p className="text-sm text-gray-400">Position, duties, and counseling information</p>
              </div>
            </div>
            {expanded.partIII ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </button>

          {expanded.partIII && (
            <div className="border-t border-white/10 p-6 space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Principal Duty Title <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.duty_description?.principal_duty_title || ""}
                    onChange={(e) => updateFormData("duty_description.principal_duty_title", e.target.value)}
                    placeholder="Company First Sergeant"
                    className="w-full rounded-lg border border-white/10 bg-black shadow-sm0 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    {evalType === "OER" ? "Position AOC/Branch" : "Duty MOSC"}
                  </label>
                  <input
                    type="text"
                    value={evalType === "OER" ? formData.duty_description?.position_aoc_branch || "" : formData.duty_description?.duty_mosc || ""}
                    onChange={(e) => updateFormData(evalType === "OER" ? "duty_description.position_aoc_branch" : "duty_description.duty_mosc", e.target.value)}
                    placeholder={evalType === "OER" ? "11A" : "11B40"}
                    className="w-full rounded-lg border border-white/10 bg-black shadow-sm0 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Significant Duties and Responsibilities <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={formData.duty_description?.significant_duties || ""}
                  onChange={(e) => updateFormData("duty_description.significant_duties", e.target.value)}
                  placeholder="Describe daily duties and scope including people, equipment, facilities, and dollars supervised..."
                  rows={4}
                  className="w-full rounded-lg border border-white/10 bg-black shadow-sm0 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Areas of Special Emphasis</label>
                <textarea
                  value={formData.duty_description?.areas_of_emphasis || ""}
                  onChange={(e) => updateFormData("duty_description.areas_of_emphasis", e.target.value)}
                  placeholder="Training, readiness, maintenance, safety..."
                  rows={2}
                  className="w-full rounded-lg border border-white/10 bg-black shadow-sm0 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Appointed Duties</label>
                <input
                  type="text"
                  value={formData.duty_description?.appointed_duties || ""}
                  onChange={(e) => updateFormData("duty_description.appointed_duties", e.target.value)}
                  placeholder="UPL, SHARP Rep, Master Fitness Trainer..."
                  className="w-full rounded-lg border border-white/10 bg-black shadow-sm0 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Counseling Dates */}
              <div className="border-t border-white/10 pt-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Counseling Dates</h3>
                  <button
                    type="button"
                    onClick={() => {
                      if (formData.period_covered?.from_date) {
                        const ratedMonths = formData.period_covered?.rated_months || 12;
                        const counselingDates = generateQuarterlyCounselingDates(
                          formData.period_covered.from_date,
                          ratedMonths
                        );
                        updateFormData("duty_description.counseling_dates", counselingDates);
                      }
                    }}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-black shadow-sm px-3 py-1.5 text-xs text-gray-400 transition-colors hover:text-white hover:border-blue-500"
                  >
                    <RotateCw className="h-3 w-3" />
                    Regenerate Dates
                  </button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Initial Counseling (YYYYMMDD) <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.duty_description?.counseling_dates?.initial || ""}
                      onChange={(e) => updateFormData("duty_description.counseling_dates.initial", e.target.value.replace(/\D/g, "").slice(0, 8))}
                      placeholder="20240115"
                      maxLength={8}
                      className="w-full rounded-lg border border-white/10 bg-black shadow-sm0 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">Later Counseling Dates</label>
                    <input
                      type="text"
                      value={formData.duty_description?.counseling_dates?.quarterly?.join(", ") || ""}
                      onChange={(e) => {
                        const dates = e.target.value.split(",").map(d => d.trim()).filter(d => d);
                        updateFormData("duty_description.counseling_dates.quarterly", dates);
                      }}
                      placeholder="20240415, 20240715, 20241015"
                      className="w-full rounded-lg border border-white/10 bg-black shadow-sm0 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                    />
                    <p className="mt-1 text-xs text-gray-500">Comma-separated YYYYMMDD dates</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Fitness Data */}
        <section className="mb-6 rounded-xl border border-white/10 bg-black shadow-sm overflow-hidden">
          <button
            onClick={() => toggleSection("fitness")}
            className="flex w-full items-center justify-between p-6 text-left"
          >
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-orange-400" />
              <div>
                <h2 className="text-xl font-semibold">Physical Fitness / Body Composition</h2>
                <p className="text-sm text-gray-400">ACFT status and height/weight data</p>
              </div>
            </div>
            {expanded.fitness ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </button>

          {expanded.fitness && (
            <div className="border-t border-white/10 p-6 space-y-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-medium">ACFT Status</label>
                  <select
                    value={formData.fitness?.acft_status || "Pass"}
                    onChange={(e) => updateFormData("fitness.acft_status", e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-black shadow-sm0 px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                  >
                    {ACFT_STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">ACFT Date (YYYYMMDD)</label>
                  <input
                    type="text"
                    value={formData.fitness?.acft_date || ""}
                    onChange={(e) => updateFormData("fitness.acft_date", e.target.value.replace(/\D/g, "").slice(0, 8))}
                    placeholder="20240315"
                    maxLength={8}
                    className="w-full rounded-lg border border-white/10 bg-black shadow-sm0 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Within HT/WT Standard?</label>
                  <select
                    value={formData.fitness?.within_standard ? "yes" : "no"}
                    onChange={(e) => updateFormData("fitness.within_standard", e.target.value === "yes")}
                    className="w-full rounded-lg border border-white/10 bg-black shadow-sm0 px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">Height (inches)</label>
                  <input
                    type="text"
                    value={formData.fitness?.height || ""}
                    onChange={(e) => updateFormData("fitness.height", e.target.value)}
                    placeholder="70"
                    className="w-full rounded-lg border border-white/10 bg-black shadow-sm0 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Weight (pounds)</label>
                  <input
                    type="text"
                    value={formData.fitness?.weight || ""}
                    onChange={(e) => updateFormData("fitness.weight", e.target.value)}
                    placeholder="180"
                    className="w-full rounded-lg border border-white/10 bg-black shadow-sm0 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {formData.fitness?.within_standard === false && (
                <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-400">Body Fat Assessment Required</p>
                      <p className="text-sm text-gray-300 mt-1">
                        DA 5500/5501 (Body Fat Worksheet) may be required per AR 600-9 when not within HT/WT standard.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {formData.fitness?.acft_status === "Profile" && (
                <div>
                  <label className="mb-2 block text-sm font-medium">Profile Information</label>
                  <textarea
                    value={formData.fitness?.profile_info || ""}
                    onChange={(e) => updateFormData("fitness.profile_info", e.target.value)}
                    placeholder="Describe profile limitations..."
                    rows={2}
                    className="w-full rounded-lg border border-white/10 bg-black shadow-sm0 px-4 py-3 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none resize-none"
                  />
                </div>
              )}
            </div>
          )}
        </section>

        {/* Save Status & Continue */}
        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black shadow-sm p-6">
          <div className="flex items-center gap-2 text-sm">
            {saving ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                <span className="text-gray-400">Saving...</span>
              </>
            ) : lastSaved ? (
              <>
                <Check className="h-4 w-4 text-green-400" />
                <span className="text-gray-400">
                  Saved {lastSaved.toLocaleTimeString()}
                </span>
              </>
            ) : null}
          </div>

          <button
            onClick={handleContinue}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium transition-colors hover:bg-blue-700"
          >
            Continue to Bullet Drafting
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
