// Evaluation Validator - Per DA Pam 623-3 Requirements
// Validates all parts of OER and NCOER forms

import {
  EvaluationFormData,
  EvaluationType,
  RankLevel,
  ValidationResult,
  ValidationError,
  OERPotentialRating,
  SeniorRaterAssessment,
  RatedPersonnel,
  PeriodCovered,
  RatingChain,
  DutyDescription,
  FitnessData,
} from '@/lib/types/database';

// ============================================
// Validation Constants
// ============================================

// Reason for Submission codes per DA Pam 623-3 Table 2-24
export const REASON_CODES = {
  OER: [
    { code: '01', description: 'Annual' },
    { code: '02', description: 'Change of Rater' },
    { code: '03', description: 'Complete the Record' },
    { code: '04', description: 'Relief for Cause' },
    { code: '05', description: '60 Day Rater Option' },
    { code: '06', description: '60 Day Senior Rater Option' },
    { code: '07', description: 'Temporary Duty, Special Duty, or Compassionate Reassignment' },
  ],
  NCOER: [
    { code: '01', description: 'Annual' },
    { code: '02', description: 'Change of Rater' },
    { code: '03', description: 'Complete the Record' },
    { code: '04', description: 'Relief for Cause' },
    { code: '05', description: '60 Day Rater Option' },
    { code: '06', description: '60 Day Senior Rater Option' },
    { code: '07', description: 'Temporary Duty, Special Duty, or Compassionate Reassignment' },
  ],
};

// Nonrated codes per DA Pam 623-3 Table 2-25
export const NONRATED_CODES = [
  { code: 'A', description: 'Absent Without Leave (AWOL)' },
  { code: 'B', description: 'In Confinement' },
  { code: 'C', description: 'Hospitalized' },
  { code: 'D', description: 'Detailed' },
  { code: 'E', description: 'Extended TDY' },
  { code: 'F', description: 'In School' },
  { code: 'G', description: 'Leave' },
  { code: 'H', description: 'Non-rated time prior to this report' },
  { code: 'J', description: 'Other' },
  { code: 'K', description: 'Commander directed non-rated time' },
];

// School recommendations by rank level
export const SCHOOL_RECOMMENDATIONS = {
  'E5': ['BLC', 'ALC'],
  'E6-E8': ['ALC', 'SLC', 'MLC', 'Master Gunner', 'Battle Staff'],
  'E9': ['SLC', 'SGM Academy', 'MLC'],
  'O1-O3': ['CCC', 'Ranger', 'Airborne', 'Air Assault', 'Pathfinder'],
  'O4-O5': ['ILE', 'ILE Resident', 'CGSC', 'SAMS', 'Joint School'],
  'O6': ['SSC', 'War College', 'JAWS', 'Joint PME II', 'Defense Strategy Course'],
};

// ============================================
// Validation Functions
// ============================================

/**
 * Validate DODID format (10 digits)
 */
export function validateDODID(dodid: string): ValidationError | null {
  if (!dodid) {
    return {
      field: 'rated_personnel.dodid',
      message: 'DODID is required',
      severity: 'error',
      reference: 'DA Pam 623-3, Part I, Block b',
    };
  }

  const cleaned = dodid.replace(/\D/g, '');
  if (cleaned.length !== 10) {
    return {
      field: 'rated_personnel.dodid',
      message: 'DODID must be exactly 10 digits',
      severity: 'error',
      reference: 'DA Pam 623-3, Part I, Block b',
    };
  }

  return null;
}

/**
 * Validate UIC format (6 alphanumeric characters)
 */
export function validateUIC(uic: string): ValidationError | null {
  if (!uic) {
    return {
      field: 'rated_personnel.uic',
      message: 'UIC is required',
      severity: 'error',
      reference: 'DA Pam 623-3, Part I, Block h',
    };
  }

  const cleaned = uic.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (cleaned.length !== 6) {
    return {
      field: 'rated_personnel.uic',
      message: 'UIC must be exactly 6 alphanumeric characters',
      severity: 'error',
      reference: 'DA Pam 623-3, Part I, Block h',
    };
  }

  return null;
}

/**
 * Validate email format (.gov or .mil required)
 */
export function validateMilitaryEmail(email: string, field: string): ValidationError | null {
  if (!email) {
    return {
      field,
      message: 'Email is required',
      severity: 'error',
    };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.(gov|mil)$/i;
  if (!emailRegex.test(email)) {
    return {
      field,
      message: 'Email must be a .gov or .mil address',
      severity: 'warning',
      reference: 'AR 623-3',
    };
  }

  return null;
}

/**
 * Validate date format (YYYYMMDD)
 */
export function validateDateFormat(date: string, field: string): ValidationError | null {
  if (!date) {
    return {
      field,
      message: 'Date is required',
      severity: 'error',
    };
  }

  const dateRegex = /^\d{8}$/;
  if (!dateRegex.test(date)) {
    return {
      field,
      message: 'Date must be in YYYYMMDD format',
      severity: 'error',
    };
  }

  // Validate it's a real date
  const year = parseInt(date.substring(0, 4));
  const month = parseInt(date.substring(4, 6));
  const day = parseInt(date.substring(6, 8));

  const testDate = new Date(year, month - 1, day);
  if (
    testDate.getFullYear() !== year ||
    testDate.getMonth() !== month - 1 ||
    testDate.getDate() !== day
  ) {
    return {
      field,
      message: 'Invalid date',
      severity: 'error',
    };
  }

  return null;
}

/**
 * Calculate rated months from period covered
 */
export function calculateRatedMonths(fromDate: string, thruDate: string): number {
  if (!fromDate || !thruDate) return 0;

  const from = new Date(
    parseInt(fromDate.substring(0, 4)),
    parseInt(fromDate.substring(4, 6)) - 1,
    parseInt(fromDate.substring(6, 8))
  );

  const thru = new Date(
    parseInt(thruDate.substring(0, 4)),
    parseInt(thruDate.substring(4, 6)) - 1,
    parseInt(thruDate.substring(6, 8))
  );

  const diffTime = thru.getTime() - from.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  const diffMonths = Math.round(diffDays / 30.44);

  return diffMonths;
}

/**
 * Validate period covered (typically <= 12 months)
 */
export function validatePeriodCovered(period: PeriodCovered): ValidationError[] {
  const errors: ValidationError[] = [];

  const fromError = validateDateFormat(period.from_date, 'period_covered.from_date');
  if (fromError) errors.push(fromError);

  const thruError = validateDateFormat(period.thru_date, 'period_covered.thru_date');
  if (thruError) errors.push(thruError);

  if (!fromError && !thruError) {
    const ratedMonths = calculateRatedMonths(period.from_date, period.thru_date);

    if (ratedMonths > 12) {
      errors.push({
        field: 'period_covered',
        message: `Rated period exceeds 12 months (${ratedMonths} months). Extended rating periods require justification.`,
        severity: 'warning',
        reference: 'DA Pam 623-3, Part I, Block j',
      });
    }

    if (ratedMonths < 0) {
      errors.push({
        field: 'period_covered',
        message: 'Thru date must be after From date',
        severity: 'error',
        reference: 'DA Pam 623-3, Part I, Block j',
      });
    }
  }

  return errors;
}

/**
 * Validate rated personnel (Part I)
 */
export function validateRatedPersonnel(personnel: Partial<RatedPersonnel>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!personnel.name?.trim()) {
    errors.push({
      field: 'rated_personnel.name',
      message: 'Name is required (Last, First MI)',
      severity: 'error',
      reference: 'DA Pam 623-3, Part I, Block a',
    });
  }

  const dodidError = validateDODID(personnel.dodid || '');
  if (dodidError) errors.push(dodidError);

  if (!personnel.rank?.trim()) {
    errors.push({
      field: 'rated_personnel.rank',
      message: 'Rank is required',
      severity: 'error',
      reference: 'DA Pam 623-3, Part I, Block c',
    });
  }

  const dorError = validateDateFormat(personnel.date_of_rank || '', 'rated_personnel.date_of_rank');
  if (dorError) {
    dorError.message = 'Date of Rank is required (YYYYMMDD)';
    dorError.reference = 'DA Pam 623-3, Part I, Block d';
    errors.push(dorError);
  }

  if (!personnel.pmos_aoc?.trim()) {
    errors.push({
      field: 'rated_personnel.pmos_aoc',
      message: 'PMOS/AOC is required',
      severity: 'error',
      reference: 'DA Pam 623-3, Part I, Block d/e',
    });
  }

  if (!personnel.component) {
    errors.push({
      field: 'rated_personnel.component',
      message: 'Component is required (RA, USAR, ARNG)',
      severity: 'error',
      reference: 'DA Pam 623-3, Part I, Block e/f',
    });
  }

  if (!personnel.unit_org_station?.trim()) {
    errors.push({
      field: 'rated_personnel.unit_org_station',
      message: 'Unit/Organization/Station is required',
      severity: 'error',
      reference: 'DA Pam 623-3, Part I, Block g',
    });
  }

  const uicError = validateUIC(personnel.uic || '');
  if (uicError) errors.push(uicError);

  const emailError = validateMilitaryEmail(personnel.email || '', 'rated_personnel.email');
  if (emailError) errors.push(emailError);

  return errors;
}

/**
 * Validate rating chain (Part II)
 */
export function validateRatingChain(
  chain: Partial<RatingChain>,
  evalType: EvaluationType,
  rankLevel: RankLevel
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Validate Rater
  if (!chain.rater?.name?.trim()) {
    errors.push({
      field: 'rating_chain.rater.name',
      message: 'Rater name is required',
      severity: 'error',
      reference: 'DA Pam 623-3, Part II',
    });
  }

  if (!chain.rater?.rank?.trim()) {
    errors.push({
      field: 'rating_chain.rater.rank',
      message: 'Rater rank is required',
      severity: 'error',
    });
  }

  if (!chain.rater?.duty_assignment?.trim()) {
    errors.push({
      field: 'rating_chain.rater.duty_assignment',
      message: 'Rater duty assignment is required',
      severity: 'error',
    });
  }

  const raterEmailError = validateMilitaryEmail(
    chain.rater?.email || '',
    'rating_chain.rater.email'
  );
  if (raterEmailError) errors.push(raterEmailError);

  // Validate Senior Rater
  if (!chain.senior_rater?.name?.trim()) {
    errors.push({
      field: 'rating_chain.senior_rater.name',
      message: 'Senior Rater name is required',
      severity: 'error',
      reference: 'DA Pam 623-3, Part II',
    });
  }

  if (!chain.senior_rater?.rank?.trim()) {
    errors.push({
      field: 'rating_chain.senior_rater.rank',
      message: 'Senior Rater rank is required',
      severity: 'error',
    });
  }

  const srEmailError = validateMilitaryEmail(
    chain.senior_rater?.email || '',
    'rating_chain.senior_rater.email'
  );
  if (srEmailError) errors.push(srEmailError);

  // Check if Intermediate Rater is required for Field Grade OER
  if (evalType === 'OER' && (rankLevel === 'O4-O5' || rankLevel === 'O6')) {
    // Intermediate rater may be required based on unit policy
    // This is a warning, not an error
    if (!chain.intermediate_rater?.name) {
      errors.push({
        field: 'rating_chain.intermediate_rater',
        message: 'Consider whether an Intermediate Rater is required for Field Grade OER',
        severity: 'warning',
        reference: 'DA Pam 623-3, Part II',
      });
    }
  }

  return errors;
}

/**
 * Validate duty description (Part III)
 */
export function validateDutyDescription(duty: Partial<DutyDescription>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!duty.principal_duty_title?.trim()) {
    errors.push({
      field: 'duty_description.principal_duty_title',
      message: 'Principal Duty Title is required',
      severity: 'error',
      reference: 'DA Pam 623-3, Part III, Block a',
    });
  }

  if (!duty.significant_duties?.trim()) {
    errors.push({
      field: 'duty_description.significant_duties',
      message: 'Significant Duties and Responsibilities are required',
      severity: 'error',
      reference: 'DA Pam 623-3, Part III, Block c',
    });
  }

  // Validate counseling dates
  if (!duty.counseling_dates?.initial) {
    errors.push({
      field: 'duty_description.counseling_dates.initial',
      message: 'Initial counseling date is required',
      severity: 'warning',
      reference: 'DA Pam 623-3, Part III, Block e',
    });
  } else {
    const initialError = validateDateFormat(
      duty.counseling_dates.initial,
      'duty_description.counseling_dates.initial'
    );
    if (initialError) errors.push(initialError);
  }

  return errors;
}

/**
 * Validate fitness data (Part IV)
 */
export function validateFitness(
  fitness: Partial<FitnessData>,
  periodCovered: PeriodCovered
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!fitness.acft_status) {
    errors.push({
      field: 'fitness.acft_status',
      message: 'ACFT status is required (Pass/Fail/Profile/Exempt)',
      severity: 'error',
      reference: 'DA Pam 623-3, Part IV',
    });
  }

  // Validate ACFT date is within period covered
  if (fitness.acft_date && periodCovered.from_date && periodCovered.thru_date) {
    const acftDate = parseInt(fitness.acft_date);
    const fromDate = parseInt(periodCovered.from_date);
    const thruDate = parseInt(periodCovered.thru_date);

    if (acftDate < fromDate || acftDate > thruDate) {
      errors.push({
        field: 'fitness.acft_date',
        message: 'ACFT date must fall within the rating period',
        severity: 'warning',
        reference: 'DA Pam 623-3, Part IV',
      });
    }
  }

  // If ACFT is Failed or Profile precludes duty, comments required
  if (fitness.acft_status === 'Fail') {
    errors.push({
      field: 'fitness.acft_status',
      message: 'Comments are required for Failed ACFT',
      severity: 'warning',
      reference: 'DA Pam 623-3, Part IV',
    });
  }

  // Height/Weight validation
  if (fitness.within_standard === false && !fitness.body_fat_required) {
    errors.push({
      field: 'fitness.body_fat_required',
      message: 'DA 5500/5501 (Body Fat Worksheet) may be required when not within HT/WT standard',
      severity: 'warning',
      reference: 'AR 600-9',
    });
  }

  return errors;
}

/**
 * Validate Senior Rater assessment - ensures all 4 required elements
 */
export function validateSeniorRaterAssessment(
  assessment: Partial<SeniorRaterAssessment>,
  evalType: EvaluationType,
  rankLevel: RankLevel
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Potential rating is required
  if (!assessment.potential_rating) {
    errors.push({
      field: 'senior_rater_assessment.potential_rating',
      message: 'Senior Rater potential rating is required',
      severity: 'error',
      reference: 'DA Pam 623-3, Part V/VI',
    });
  }

  // Validate the 4 required elements per MilEvalAI Flow
  if (!assessment.enumeration?.trim()) {
    errors.push({
      field: 'senior_rater_assessment.enumeration',
      message: 'Enumeration is required (e.g., "#1 of 16; top 5%")',
      severity: 'error',
      reference: 'DA Pam 623-3, Part V/VI',
    });
  }

  if (!assessment.promotion?.trim()) {
    errors.push({
      field: 'senior_rater_assessment.promotion',
      message: 'Promotion recommendation is required',
      severity: 'error',
      reference: 'DA Pam 623-3, Part V/VI',
    });
  }

  if (!assessment.school_recommendation?.trim()) {
    errors.push({
      field: 'senior_rater_assessment.school_recommendation',
      message: `School recommendation is required for ${rankLevel}`,
      severity: 'error',
      reference: 'DA Pam 623-3, Part V/VI',
    });
  }

  if (!assessment.potential_next_assignment?.trim()) {
    errors.push({
      field: 'senior_rater_assessment.potential_next_assignment',
      message: 'Potential/Next Assignment recommendation is required',
      severity: 'error',
      reference: 'DA Pam 623-3, Part V/VI',
    });
  }

  // Full narrative comments
  if (!assessment.comments?.trim()) {
    errors.push({
      field: 'senior_rater_assessment.comments',
      message: 'Senior Rater narrative comments are required',
      severity: 'error',
      reference: 'DA Pam 623-3, Part V/VI',
    });
  }

  // Validate future assignments based on eval type
  if (evalType === 'OER') {
    const numSuccessive = assessment.successive_assignments?.filter(a => a?.trim()).length || 0;
    if (numSuccessive < 3) {
      errors.push({
        field: 'senior_rater_assessment.successive_assignments',
        message: 'OER requires 3 future successive assignments',
        severity: 'warning',
        reference: 'DA Pam 623-3, Part V/VI, Block d',
      });
    }
  } else {
    // NCOER requires 2 successive + 1 broadening
    const numSuccessive = assessment.successive_assignments?.filter(a => a?.trim()).length || 0;
    if (numSuccessive < 2) {
      errors.push({
        field: 'senior_rater_assessment.successive_assignments',
        message: 'NCOER requires 2 successive assignments',
        severity: 'warning',
        reference: 'DA Pam 623-3, Part V, Block c',
      });
    }
    if (!assessment.broadening_assignment?.trim()) {
      errors.push({
        field: 'senior_rater_assessment.broadening_assignment',
        message: 'NCOER requires 1 broadening assignment',
        severity: 'warning',
        reference: 'DA Pam 623-3, Part V, Block c',
      });
    }
  }

  return errors;
}

/**
 * Check Most Qualified profile limits
 * OER: 49% max for "Most Qualified" / "Excels"
 * NCOER: 24% max for "Most Qualified" (21% for SGT)
 */
export function validateProfileLimits(
  rating: OERPotentialRating,
  numSeniorRated: number,
  numMostQualified: number,
  evalType: EvaluationType,
  rankLevel: RankLevel
): ValidationError | null {
  if (rating !== 'MOST QUALIFIED') return null;
  if (numSeniorRated < 1) return null;

  const percentage = (numMostQualified / numSeniorRated) * 100;

  let maxPercentage: number;
  if (evalType === 'OER') {
    maxPercentage = 49;
  } else {
    maxPercentage = rankLevel === 'E5' ? 21 : 24;
  }

  if (percentage > maxPercentage) {
    return {
      field: 'senior_rater_assessment.potential_rating',
      message: `"Most Qualified" is limited to ${maxPercentage}%. Current rate: ${percentage.toFixed(1)}% (${numMostQualified} of ${numSeniorRated})`,
      severity: 'warning',
      reference: `DA Pam 623-3, ${evalType === 'OER' ? 'Part VI' : 'Part V'}`,
    };
  }

  return null;
}

/**
 * Validate complete evaluation form data
 */
export function validateEvaluation(
  formData: Partial<EvaluationFormData>,
  evalType: EvaluationType,
  rankLevel: RankLevel
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Part I - Rated Personnel
  if (formData.rated_personnel) {
    const personnelErrors = validateRatedPersonnel(formData.rated_personnel);
    personnelErrors.forEach(e => {
      if (e.severity === 'error') errors.push(e);
      else warnings.push(e);
    });
  } else {
    errors.push({
      field: 'rated_personnel',
      message: 'Rated personnel information is required',
      severity: 'error',
    });
  }

  // Part I - Period Covered
  if (formData.period_covered) {
    const periodErrors = validatePeriodCovered(formData.period_covered);
    periodErrors.forEach(e => {
      if (e.severity === 'error') errors.push(e);
      else warnings.push(e);
    });
  } else {
    errors.push({
      field: 'period_covered',
      message: 'Period covered is required',
      severity: 'error',
    });
  }

  // Part I - Reason for Submission
  if (!formData.reason_for_submission?.code) {
    errors.push({
      field: 'reason_for_submission',
      message: 'Reason for submission is required',
      severity: 'error',
      reference: 'DA Pam 623-3, Part I, Block i',
    });
  }

  // Part II - Rating Chain
  if (formData.rating_chain) {
    const chainErrors = validateRatingChain(formData.rating_chain, evalType, rankLevel);
    chainErrors.forEach(e => {
      if (e.severity === 'error') errors.push(e);
      else warnings.push(e);
    });
  } else {
    errors.push({
      field: 'rating_chain',
      message: 'Rating chain is required',
      severity: 'error',
    });
  }

  // Part III - Duty Description
  if (formData.duty_description) {
    const dutyErrors = validateDutyDescription(formData.duty_description);
    dutyErrors.forEach(e => {
      if (e.severity === 'error') errors.push(e);
      else warnings.push(e);
    });
  } else {
    errors.push({
      field: 'duty_description',
      message: 'Duty description is required',
      severity: 'error',
    });
  }

  // Part IV - Fitness
  if (formData.fitness && formData.period_covered) {
    const fitnessErrors = validateFitness(formData.fitness, formData.period_covered);
    fitnessErrors.forEach(e => {
      if (e.severity === 'error') errors.push(e);
      else warnings.push(e);
    });
  }

  // Part V/VI - Senior Rater Assessment
  if (formData.senior_rater_assessment) {
    const srErrors = validateSeniorRaterAssessment(
      formData.senior_rater_assessment,
      evalType,
      rankLevel
    );
    srErrors.forEach(e => {
      if (e.severity === 'error') errors.push(e);
      else warnings.push(e);
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check for prohibited words/phrases in narratives
 */
export function checkProhibitedContent(text: string): ValidationError[] {
  const errors: ValidationError[] = [];

  // Prohibited personal pronouns
  const pronounPatterns = [
    { pattern: /\bI\b/g, word: 'I' },
    { pattern: /\bme\b/gi, word: 'me' },
    { pattern: /\bmy\b/gi, word: 'my' },
    { pattern: /\bmine\b/gi, word: 'mine' },
    { pattern: /\bmyself\b/gi, word: 'myself' },
  ];

  pronounPatterns.forEach(({ pattern, word }) => {
    if (pattern.test(text)) {
      errors.push({
        field: 'narrative',
        message: `Personal pronoun "${word}" should not be used in evaluation narratives`,
        severity: 'warning',
        reference: 'DA Pam 623-3',
      });
    }
  });

  // Prohibited predictive language
  if (/\bwill\b/gi.test(text)) {
    errors.push({
      field: 'narrative',
      message: 'Avoid predictive language ("will") - use past tense to describe accomplishments',
      severity: 'warning',
      reference: 'DA Pam 623-3',
    });
  }

  // Check for potentially sensitive content
  const sensitivePatterns = [
    { pattern: /\bfamily\b/gi, message: 'Avoid mentioning family matters' },
    { pattern: /\bmedical\b/gi, message: 'Avoid mentioning medical conditions' },
    { pattern: /\bdiagnos/gi, message: 'Avoid mentioning diagnoses' },
    { pattern: /\breligion\b/gi, message: 'Avoid mentioning religion' },
  ];

  sensitivePatterns.forEach(({ pattern, message }) => {
    if (pattern.test(text)) {
      errors.push({
        field: 'narrative',
        message,
        severity: 'warning',
        reference: 'AR 623-3',
      });
    }
  });

  return errors;
}

/**
 * Get form number based on evaluation type and rank level
 */
export function getFormNumber(evalType: EvaluationType, rankLevel: RankLevel): string {
  if (evalType === 'OER') {
    switch (rankLevel) {
      case 'O1-O3': return 'DA FORM 67-10-1';
      case 'O4-O5': return 'DA FORM 67-10-2';
      case 'O6': return 'DA FORM 67-10-3';
      default: return 'DA FORM 67-10-1';
    }
  } else {
    switch (rankLevel) {
      case 'E5': return 'DA FORM 2166-9-1';
      case 'E6-E8': return 'DA FORM 2166-9-2';
      case 'E9': return 'DA FORM 2166-9-3';
      default: return 'DA FORM 2166-9-1';
    }
  }
}
