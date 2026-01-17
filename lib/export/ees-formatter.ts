// EES Text Formatter for MilEvalAI
// Formats evaluation data for copy/paste into EES system

import {
  EvaluationFormData,
  EvaluationType,
  RankLevel,
  CategorizedBullet,
  BulletCategory,
} from '@/lib/types/database';
import { getFormNumber } from '@/lib/validation/evaluation-validator';

// EES character limits per block
const EES_LIMITS = {
  BULLET_MAX_CHARS: 350,
  RATER_COMMENTS_MAX_CHARS: 2000,
  SR_COMMENTS_MAX_CHARS: 2000,
  DUTY_DESCRIPTION_MAX_CHARS: 500,
};

// Categories in standard NCOER/OER order
const CATEGORY_ORDER: BulletCategory[] = [
  'Character',
  'Presence',
  'Intellect',
  'Leads',
  'Develops',
  'Achieves',
];

/**
 * Format a single bullet for EES (handles line breaks and character limits)
 */
export function formatBulletForEES(bullet: string, maxChars: number = EES_LIMITS.BULLET_MAX_CHARS): string {
  // Remove any existing line breaks
  let cleaned = bullet.replace(/[\r\n]+/g, ' ').trim();

  // Truncate if too long (with ellipsis)
  if (cleaned.length > maxChars) {
    cleaned = cleaned.substring(0, maxChars - 3) + '...';
  }

  return cleaned;
}

/**
 * Format bullets grouped by category for EES
 */
export function formatBulletsForEES(
  bullets: CategorizedBullet[],
  includeHeaders: boolean = true
): string {
  const lines: string[] = [];

  // Group bullets by category
  const grouped = new Map<BulletCategory, string[]>();

  CATEGORY_ORDER.forEach(cat => {
    grouped.set(cat, []);
  });

  bullets.forEach(bullet => {
    const existing = grouped.get(bullet.category) || [];
    existing.push(formatBulletForEES(bullet.enhanced));
    grouped.set(bullet.category, existing);
  });

  // Format each category
  CATEGORY_ORDER.forEach(category => {
    const categoryBullets = grouped.get(category) || [];
    if (categoryBullets.length > 0) {
      if (includeHeaders) {
        lines.push(`${category.toUpperCase()}:`);
      }
      categoryBullets.forEach(b => {
        lines.push(`- ${b}`);
      });
      lines.push(''); // Blank line between categories
    }
  });

  return lines.join('\n').trim();
}

/**
 * Format rater comments for EES
 */
export function formatRaterCommentsForEES(
  comments: string,
  maxChars: number = EES_LIMITS.RATER_COMMENTS_MAX_CHARS
): string {
  // Clean up formatting
  let cleaned = comments
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Truncate if needed
  if (cleaned.length > maxChars) {
    cleaned = cleaned.substring(0, maxChars - 3) + '...';
  }

  return cleaned;
}

/**
 * Format duty description for EES
 */
export function formatDutyDescriptionForEES(
  dutyDescription: EvaluationFormData['duty_description']
): string {
  const parts: string[] = [];

  if (dutyDescription?.significant_duties) {
    parts.push(formatBulletForEES(dutyDescription.significant_duties, EES_LIMITS.DUTY_DESCRIPTION_MAX_CHARS));
  }

  return parts.join('\n');
}

/**
 * Generate complete EES-ready text for the entire evaluation
 */
export function generateEESText(
  evalType: EvaluationType,
  rankLevel: RankLevel,
  formData: Partial<EvaluationFormData> | null,
  bullets: CategorizedBullet[] | null,
  raterComments: string | null,
  srComments: string | null
): string {
  const sections: string[] = [];
  const formNumber = getFormNumber(evalType, rankLevel);

  // Header
  sections.push(`=== ${formNumber} - EES Export ===`);
  sections.push('');

  // Part I - Admin Summary
  if (formData?.rated_personnel) {
    sections.push('--- PART I - ADMINISTRATIVE DATA ---');
    sections.push(`Name: ${formData.rated_personnel.name || '[NOT ENTERED]'}`);
    sections.push(`Rank: ${formData.rated_personnel.rank || rankLevel}`);
    sections.push(`DODID: ${formData.rated_personnel.dodid || '[NOT ENTERED]'}`);
    sections.push(`Unit: ${formData.rated_personnel.unit_org_station || '[NOT ENTERED]'}`);
    sections.push(`UIC: ${formData.rated_personnel.uic || '[NOT ENTERED]'}`);

    if (formData.period_covered) {
      sections.push(`Period: ${formData.period_covered.from_date || '[DATE]'} - ${formData.period_covered.thru_date || '[DATE]'}`);
      sections.push(`Rated Months: ${formData.period_covered.rated_months || 0}`);
    }

    if (formData.reason_for_submission) {
      sections.push(`Reason: ${formData.reason_for_submission.code} - ${formData.reason_for_submission.description}`);
    }

    sections.push('');
  }

  // Part III - Duty Description
  if (formData?.duty_description) {
    sections.push('--- PART III - DUTY DESCRIPTION ---');
    sections.push(`Principal Duty Title: ${formData.duty_description.principal_duty_title || '[NOT ENTERED]'}`);

    if (formData.duty_description.significant_duties) {
      sections.push('');
      sections.push('Significant Duties and Responsibilities:');
      sections.push(formatDutyDescriptionForEES(formData.duty_description));
    }

    if (formData.duty_description.areas_of_emphasis) {
      sections.push('');
      sections.push(`Areas of Emphasis: ${formData.duty_description.areas_of_emphasis}`);
    }

    if (formData.duty_description.appointed_duties) {
      sections.push(`Appointed Duties: ${formData.duty_description.appointed_duties}`);
    }

    sections.push('');
  }

  // Part IV - Rater Assessment
  sections.push('--- PART IV - RATER ASSESSMENT ---');
  sections.push('');

  // Bullets by category
  if (bullets && bullets.length > 0) {
    sections.push('Performance Bullets:');
    sections.push('');
    sections.push(formatBulletsForEES(bullets, true));
    sections.push('');
  }

  // Rater Comments
  if (raterComments) {
    sections.push('Rater Comments:');
    sections.push(formatRaterCommentsForEES(raterComments));
    sections.push('');
  }

  // Part V - Senior Rater Assessment
  sections.push('--- PART V - SENIOR RATER ASSESSMENT ---');
  sections.push('');

  if (srComments) {
    sections.push('Senior Rater Comments:');
    sections.push(formatRaterCommentsForEES(srComments, EES_LIMITS.SR_COMMENTS_MAX_CHARS));
    sections.push('');
  }

  // Footer
  sections.push('=== END OF EVALUATION ===');

  return sections.join('\n');
}

/**
 * Generate compact EES text (just bullets and comments, no headers)
 */
export function generateCompactEESText(
  bullets: CategorizedBullet[] | null,
  raterComments: string | null,
  srComments: string | null
): string {
  const sections: string[] = [];

  // Bullets by category
  if (bullets && bullets.length > 0) {
    CATEGORY_ORDER.forEach(category => {
      const categoryBullets = bullets.filter(b => b.category === category);
      if (categoryBullets.length > 0) {
        sections.push(`${category}:`);
        categoryBullets.forEach(b => {
          sections.push(formatBulletForEES(b.enhanced));
        });
        sections.push('');
      }
    });
  }

  if (raterComments) {
    sections.push('RATER COMMENTS:');
    sections.push(formatRaterCommentsForEES(raterComments));
    sections.push('');
  }

  if (srComments) {
    sections.push('SENIOR RATER COMMENTS:');
    sections.push(formatRaterCommentsForEES(srComments));
  }

  return sections.join('\n').trim();
}

/**
 * Generate bullet-only EES text for Part IV
 */
export function generateBulletOnlyEESText(bullets: CategorizedBullet[]): string {
  return formatBulletsForEES(bullets, true);
}

/**
 * Calculate character counts for EES fields
 */
export function calculateCharCounts(
  bullets: CategorizedBullet[] | null,
  raterComments: string | null,
  srComments: string | null
): {
  bulletCounts: { category: BulletCategory; count: number; limit: number; }[];
  raterCount: number;
  raterLimit: number;
  srCount: number;
  srLimit: number;
} {
  const bulletCounts = CATEGORY_ORDER.map(cat => {
    const categoryBullets = bullets?.filter(b => b.category === cat) || [];
    const totalChars = categoryBullets.reduce((sum, b) => sum + b.enhanced.length, 0);
    return {
      category: cat,
      count: totalChars,
      limit: EES_LIMITS.BULLET_MAX_CHARS * categoryBullets.length || EES_LIMITS.BULLET_MAX_CHARS,
    };
  });

  return {
    bulletCounts,
    raterCount: raterComments?.length || 0,
    raterLimit: EES_LIMITS.RATER_COMMENTS_MAX_CHARS,
    srCount: srComments?.length || 0,
    srLimit: EES_LIMITS.SR_COMMENTS_MAX_CHARS,
  };
}
