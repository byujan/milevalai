// PDF Generator for MilEvalAI
// Generates formatted PDF exports of evaluations

import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from 'pdf-lib';
import {
  EvaluationFormData,
  EvaluationType,
  RankLevel,
  CategorizedBullet,
  BulletCategory,
} from '@/lib/types/database';
import { getFormNumber } from '@/lib/validation/evaluation-validator';

// Category order for bullets
const CATEGORY_ORDER: BulletCategory[] = [
  'Character',
  'Presence',
  'Intellect',
  'Leads',
  'Develops',
  'Achieves',
];

// PDF Layout constants
const PAGE_WIDTH = 612; // Letter size
const PAGE_HEIGHT = 792;
const MARGIN = 50;
const LINE_HEIGHT = 14;
const SECTION_SPACING = 20;

interface PDFGeneratorOptions {
  evalType: EvaluationType;
  rankLevel: RankLevel;
  dutyTitle: string;
  formData: Partial<EvaluationFormData> | null;
  bullets: CategorizedBullet[] | null;
  raterComments: string | null;
  srComments: string | null;
}

/**
 * Generate a PDF document for the evaluation
 */
export async function generateEvaluationPDF(options: PDFGeneratorOptions): Promise<Uint8Array> {
  const { evalType, rankLevel, dutyTitle, formData, bullets, raterComments, srComments } = options;

  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();

  // Embed fonts
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Get form number
  const formNumber = getFormNumber(evalType, rankLevel);

  // Start first page
  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let yPosition = PAGE_HEIGHT - MARGIN;

  // Helper function to add new page if needed
  const ensureSpace = (neededSpace: number): PDFPage => {
    if (yPosition - neededSpace < MARGIN) {
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      yPosition = PAGE_HEIGHT - MARGIN;
    }
    return page;
  };

  // Helper function to draw text
  const drawText = (
    text: string,
    x: number,
    font: PDFFont,
    size: number,
    color = rgb(0, 0, 0)
  ) => {
    page.drawText(text, { x, y: yPosition, size, font, color });
  };

  // Helper function to draw wrapped text
  const drawWrappedText = (
    text: string,
    x: number,
    maxWidth: number,
    font: PDFFont,
    size: number
  ): number => {
    const words = text.split(' ');
    let currentLine = '';
    let linesDrawn = 0;

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const width = font.widthOfTextAtSize(testLine, size);

      if (width > maxWidth && currentLine) {
        ensureSpace(LINE_HEIGHT);
        drawText(currentLine, x, font, size);
        yPosition -= LINE_HEIGHT;
        linesDrawn++;
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine) {
      ensureSpace(LINE_HEIGHT);
      drawText(currentLine, x, font, size);
      yPosition -= LINE_HEIGHT;
      linesDrawn++;
    }

    return linesDrawn;
  };

  // === HEADER ===
  drawText(formNumber, MARGIN, helveticaBold, 16, rgb(0, 0, 0.5));
  yPosition -= LINE_HEIGHT + 5;

  const evalTitle = evalType === 'OER' ? 'OFFICER EVALUATION REPORT' : 'NCO EVALUATION REPORT';
  drawText(evalTitle, MARGIN, helveticaBold, 14);
  yPosition -= LINE_HEIGHT;

  drawText(`Duty Title: ${dutyTitle || 'N/A'}`, MARGIN, helvetica, 11);
  yPosition -= LINE_HEIGHT;

  drawText(`Generated: ${new Date().toLocaleDateString()}`, MARGIN, helvetica, 10, rgb(0.4, 0.4, 0.4));
  yPosition -= SECTION_SPACING;

  // Draw separator line
  page.drawLine({
    start: { x: MARGIN, y: yPosition },
    end: { x: PAGE_WIDTH - MARGIN, y: yPosition },
    thickness: 1,
    color: rgb(0.7, 0.7, 0.7),
  });
  yPosition -= SECTION_SPACING;

  // === PART I - ADMINISTRATIVE DATA ===
  ensureSpace(LINE_HEIGHT * 3);
  drawText('PART I - ADMINISTRATIVE DATA', MARGIN, helveticaBold, 12, rgb(0, 0, 0.5));
  yPosition -= LINE_HEIGHT + 5;

  if (formData?.rated_personnel) {
    const rp = formData.rated_personnel;

    // Name and Rank row
    drawText(`Name: ${rp.name || '[NOT ENTERED]'}`, MARGIN, helvetica, 10);
    drawText(`Rank: ${rp.rank || rankLevel}`, MARGIN + 250, helvetica, 10);
    yPosition -= LINE_HEIGHT;

    // DODID and Branch
    drawText(`DODID: ${rp.dodid || '[NOT ENTERED]'}`, MARGIN, helvetica, 10);
    if (rp.branch) {
      drawText(`Branch: ${rp.branch}`, MARGIN + 250, helvetica, 10);
    }
    yPosition -= LINE_HEIGHT;

    // Unit
    drawText(`Unit: ${rp.unit_org_station || '[NOT ENTERED]'}`, MARGIN, helvetica, 10);
    drawText(`UIC: ${rp.uic || '[NOT ENTERED]'}`, MARGIN + 350, helvetica, 10);
    yPosition -= LINE_HEIGHT;

    // Email
    if (rp.email) {
      drawText(`Email: ${rp.email}`, MARGIN, helvetica, 10);
      yPosition -= LINE_HEIGHT;
    }
  } else {
    drawText('Administrative data not entered', MARGIN, helvetica, 10, rgb(0.5, 0.5, 0.5));
    yPosition -= LINE_HEIGHT;
  }

  // Period Covered
  if (formData?.period_covered) {
    const pc = formData.period_covered;
    yPosition -= 5;
    drawText(
      `Period: ${pc.from_date || '[DATE]'} - ${pc.thru_date || '[DATE]'} (${pc.rated_months || 0} months)`,
      MARGIN,
      helvetica,
      10
    );
    yPosition -= LINE_HEIGHT;
  }

  // Reason for Submission
  if (formData?.reason_for_submission) {
    drawText(
      `Reason: ${formData.reason_for_submission.code} - ${formData.reason_for_submission.description}`,
      MARGIN,
      helvetica,
      10
    );
    yPosition -= LINE_HEIGHT;
  }

  yPosition -= SECTION_SPACING / 2;

  // === PART II - RATING CHAIN ===
  if (formData?.rating_chain) {
    ensureSpace(LINE_HEIGHT * 5);
    drawText('PART II - RATING CHAIN', MARGIN, helveticaBold, 12, rgb(0, 0, 0.5));
    yPosition -= LINE_HEIGHT + 5;

    const rc = formData.rating_chain;

    if (rc.rater) {
      drawText(`Rater: ${rc.rater.name || 'N/A'}, ${rc.rater.rank || ''}`, MARGIN, helvetica, 10);
      yPosition -= LINE_HEIGHT;
      if (rc.rater.dodid) {
        drawText(`  DODID: ${rc.rater.dodid}`, MARGIN, helvetica, 9);
        yPosition -= LINE_HEIGHT;
      }
      if (rc.rater.pmos_branch) {
        drawText(`  PMOSC/Branch: ${rc.rater.pmos_branch}`, MARGIN, helvetica, 9);
        yPosition -= LINE_HEIGHT;
      }
      drawText(`  Duty Assignment: ${rc.rater.duty_assignment || 'N/A'}`, MARGIN, helvetica, 9);
      yPosition -= LINE_HEIGHT;
      if (rc.rater.organization) {
        drawText(`  Organization: ${rc.rater.organization}`, MARGIN, helvetica, 9);
        yPosition -= LINE_HEIGHT;
      }
      if (rc.rater.email) {
        drawText(`  Email: ${rc.rater.email}`, MARGIN, helvetica, 9);
        yPosition -= LINE_HEIGHT;
      }
    }

    if (rc.senior_rater) {
      yPosition -= 5;
      drawText(`Senior Rater: ${rc.senior_rater.name || 'N/A'}, ${rc.senior_rater.rank || ''}`, MARGIN, helvetica, 10);
      yPosition -= LINE_HEIGHT;
      if (rc.senior_rater.dodid) {
        drawText(`  DODID: ${rc.senior_rater.dodid}`, MARGIN, helvetica, 9);
        yPosition -= LINE_HEIGHT;
      }
      if (rc.senior_rater.pmos_branch) {
        drawText(`  PMOSC/Branch: ${rc.senior_rater.pmos_branch}`, MARGIN, helvetica, 9);
        yPosition -= LINE_HEIGHT;
      }
      drawText(`  Duty Assignment: ${rc.senior_rater.duty_assignment || 'N/A'}`, MARGIN, helvetica, 9);
      yPosition -= LINE_HEIGHT;
      if (rc.senior_rater.organization) {
        drawText(`  Organization: ${rc.senior_rater.organization}`, MARGIN, helvetica, 9);
        yPosition -= LINE_HEIGHT;
      }
      if (rc.senior_rater.email) {
        drawText(`  Email: ${rc.senior_rater.email}`, MARGIN, helvetica, 9);
        yPosition -= LINE_HEIGHT;
      }
    }

    if (rc.supplementary_reviewer) {
      drawText(`Supplementary Reviewer: ${rc.supplementary_reviewer.name || 'N/A'}`, MARGIN, helvetica, 10);
      yPosition -= LINE_HEIGHT;
    }

    yPosition -= SECTION_SPACING / 2;
  }

  // === PART III - DUTY DESCRIPTION ===
  if (formData?.duty_description) {
    ensureSpace(LINE_HEIGHT * 4);
    drawText('PART III - DUTY DESCRIPTION', MARGIN, helveticaBold, 12, rgb(0, 0, 0.5));
    yPosition -= LINE_HEIGHT + 5;

    const dd = formData.duty_description;

    drawText(`Principal Duty Title: ${dd.principal_duty_title || dutyTitle || 'N/A'}`, MARGIN, helvetica, 10);
    yPosition -= LINE_HEIGHT;

    if (dd.significant_duties) {
      yPosition -= 5;
      drawText('Significant Duties:', MARGIN, helveticaBold, 10);
      yPosition -= LINE_HEIGHT;
      drawWrappedText(dd.significant_duties, MARGIN + 10, PAGE_WIDTH - 2 * MARGIN - 10, helvetica, 9);
    }

    if (dd.areas_of_emphasis) {
      yPosition -= 5;
      drawText('Areas of Emphasis:', MARGIN, helveticaBold, 10);
      yPosition -= LINE_HEIGHT;
      drawWrappedText(dd.areas_of_emphasis, MARGIN + 10, PAGE_WIDTH - 2 * MARGIN - 10, helvetica, 9);
    }

    yPosition -= SECTION_SPACING / 2;
  }

  // === PART IV - RATER ASSESSMENT ===
  ensureSpace(LINE_HEIGHT * 3);

  page.drawLine({
    start: { x: MARGIN, y: yPosition },
    end: { x: PAGE_WIDTH - MARGIN, y: yPosition },
    thickness: 1,
    color: rgb(0.7, 0.7, 0.7),
  });
  yPosition -= SECTION_SPACING;

  drawText('PART IV - RATER ASSESSMENT', MARGIN, helveticaBold, 12, rgb(0, 0, 0.5));
  yPosition -= LINE_HEIGHT + 5;

  // Performance Bullets by Category
  if (bullets && bullets.length > 0) {
    drawText('Performance Bullets:', MARGIN, helveticaBold, 11);
    yPosition -= LINE_HEIGHT + 5;

    for (const category of CATEGORY_ORDER) {
      const categoryBullets = bullets.filter(b => b.category === category);

      if (categoryBullets.length > 0) {
        ensureSpace(LINE_HEIGHT * (categoryBullets.length + 2));

        // Category header
        drawText(category.toUpperCase(), MARGIN, helveticaBold, 10, rgb(0.2, 0.2, 0.6));
        yPosition -= LINE_HEIGHT;

        // Bullets
        for (const bullet of categoryBullets) {
          const bulletText = `- ${bullet.enhanced}`;
          drawWrappedText(bulletText, MARGIN + 10, PAGE_WIDTH - 2 * MARGIN - 20, helvetica, 9);
          yPosition -= 2;
        }

        yPosition -= 5;
      }
    }
  }

  // Rater Comments
  if (raterComments) {
    ensureSpace(LINE_HEIGHT * 3);
    yPosition -= 10;
    drawText('Rater Comments:', MARGIN, helveticaBold, 11);
    yPosition -= LINE_HEIGHT;
    drawWrappedText(raterComments, MARGIN + 10, PAGE_WIDTH - 2 * MARGIN - 10, helvetica, 9);
  }

  // === PART V - SENIOR RATER ASSESSMENT ===
  ensureSpace(LINE_HEIGHT * 3);
  yPosition -= SECTION_SPACING;

  page.drawLine({
    start: { x: MARGIN, y: yPosition },
    end: { x: PAGE_WIDTH - MARGIN, y: yPosition },
    thickness: 1,
    color: rgb(0.7, 0.7, 0.7),
  });
  yPosition -= SECTION_SPACING;

  drawText('PART V - SENIOR RATER ASSESSMENT', MARGIN, helveticaBold, 12, rgb(0, 0, 0.5));
  yPosition -= LINE_HEIGHT + 5;

  // Senior Rater Assessment details
  if (formData?.senior_rater_assessment) {
    const sra = formData.senior_rater_assessment;

    if (sra.potential_rating) {
      drawText(`Potential: ${sra.potential_rating}`, MARGIN, helvetica, 10);
      yPosition -= LINE_HEIGHT;
    }

    if (sra.enumeration) {
      drawText(`Enumeration: ${sra.enumeration}`, MARGIN, helvetica, 10);
      yPosition -= LINE_HEIGHT;
    }

    if (sra.promotion) {
      drawText(`Promotion: ${sra.promotion}`, MARGIN, helvetica, 10);
      yPosition -= LINE_HEIGHT;
    }

    if (sra.school_recommendation) {
      drawText(`School: ${sra.school_recommendation}`, MARGIN, helvetica, 10);
      yPosition -= LINE_HEIGHT;
    }

    if (sra.potential_next_assignment) {
      drawText(`Next Assignment: ${sra.potential_next_assignment}`, MARGIN, helvetica, 10);
      yPosition -= LINE_HEIGHT;
    }
  }

  // Senior Rater Comments
  if (srComments) {
    ensureSpace(LINE_HEIGHT * 3);
    yPosition -= 10;
    drawText('Senior Rater Comments:', MARGIN, helveticaBold, 11);
    yPosition -= LINE_HEIGHT;
    drawWrappedText(srComments, MARGIN + 10, PAGE_WIDTH - 2 * MARGIN - 10, helvetica, 9);
  }

  // === FOOTER ===
  ensureSpace(LINE_HEIGHT * 3);
  yPosition -= SECTION_SPACING * 2;

  page.drawLine({
    start: { x: MARGIN, y: yPosition },
    end: { x: PAGE_WIDTH - MARGIN, y: yPosition },
    thickness: 0.5,
    color: rgb(0.8, 0.8, 0.8),
  });
  yPosition -= LINE_HEIGHT;

  drawText(
    'Generated by MilEvalAI - Made for Soldiers by Soldiers',
    MARGIN,
    helvetica,
    8,
    rgb(0.5, 0.5, 0.5)
  );

  // Serialize the PDF to bytes
  const pdfBytes = await pdfDoc.save();
  return pdfBytes;
}

/**
 * Trigger download of PDF in browser
 */
export function downloadPDF(pdfBytes: Uint8Array, filename: string): void {
  const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
