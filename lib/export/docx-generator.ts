// DOCX Generator for MilEvalAI
// Generates editable Word document exports of evaluations

import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  Packer,
} from 'docx';
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

interface DOCXGeneratorOptions {
  evalType: EvaluationType;
  rankLevel: RankLevel;
  dutyTitle: string;
  formData: Partial<EvaluationFormData> | null;
  bullets: CategorizedBullet[] | null;
  raterComments: string | null;
  srComments: string | null;
}

/**
 * Create a section header paragraph
 */
function createSectionHeader(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: text,
        bold: true,
        color: '000080',
        size: 24,
      }),
    ],
    spacing: { before: 300, after: 100 },
    border: {
      bottom: {
        color: 'CCCCCC',
        space: 1,
        style: BorderStyle.SINGLE,
        size: 6,
      },
    },
  });
}

/**
 * Create a field label and value
 */
function createFieldRow(label: string, value: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: `${label}: `,
        bold: true,
        size: 20,
      }),
      new TextRun({
        text: value || '[NOT ENTERED]',
        size: 20,
      }),
    ],
    spacing: { after: 80 },
  });
}

/**
 * Create a bullet point paragraph
 */
function createBulletPoint(text: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text: `- ${text}`,
        size: 18,
      }),
    ],
    spacing: { after: 60 },
    indent: { left: 360 },
  });
}

/**
 * Generate a DOCX document for the evaluation
 */
export async function generateEvaluationDOCX(options: DOCXGeneratorOptions): Promise<Blob> {
  const { evalType, rankLevel, dutyTitle, formData, bullets, raterComments, srComments } = options;

  const formNumber = getFormNumber(evalType, rankLevel);
  const evalTitle = evalType === 'OER' ? 'OFFICER EVALUATION REPORT' : 'NCO EVALUATION REPORT';

  const children: Paragraph[] = [];

  // === HEADER ===
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: formNumber,
          bold: true,
          size: 32,
          color: '000080',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    })
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: evalTitle,
          bold: true,
          size: 28,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    })
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Duty Title: ${dutyTitle || 'N/A'}`,
          size: 22,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    })
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `Generated: ${new Date().toLocaleDateString()}`,
          size: 18,
          color: '666666',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    })
  );

  // === PART I - ADMINISTRATIVE DATA ===
  children.push(createSectionHeader('PART I - ADMINISTRATIVE DATA'));

  if (formData?.rated_personnel) {
    const rp = formData.rated_personnel;
    children.push(createFieldRow('Name', rp.name || ''));
    children.push(createFieldRow('Rank', rp.rank || rankLevel));
    children.push(createFieldRow('DODID', rp.dodid || ''));
    children.push(createFieldRow('Unit', rp.unit_org_station || ''));
    children.push(createFieldRow('UIC', rp.uic || ''));
    if (rp.branch) {
      children.push(createFieldRow('Branch', rp.branch));
    }
    if (rp.email) {
      children.push(createFieldRow('Email', rp.email));
    }
  } else {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'Administrative data not entered',
            italics: true,
            color: '666666',
            size: 20,
          }),
        ],
        spacing: { after: 100 },
      })
    );
  }

  // Period Covered
  if (formData?.period_covered) {
    const pc = formData.period_covered;
    children.push(
      createFieldRow(
        'Period Covered',
        `${pc.from_date || '[DATE]'} - ${pc.thru_date || '[DATE]'} (${pc.rated_months || 0} months)`
      )
    );
  }

  // Reason for Submission
  if (formData?.reason_for_submission) {
    children.push(
      createFieldRow(
        'Reason',
        `${formData.reason_for_submission.code} - ${formData.reason_for_submission.description}`
      )
    );
  }

  // === PART II - RATING CHAIN ===
  if (formData?.rating_chain) {
    children.push(createSectionHeader('PART II - RATING CHAIN'));

    const rc = formData.rating_chain;

    if (rc.rater) {
      children.push(
        createFieldRow('Rater Name', `${rc.rater.name || 'N/A'}, ${rc.rater.rank || ''}`)
      );
      if (rc.rater.dodid) {
        children.push(createFieldRow('  DODID', rc.rater.dodid));
      }
      if (rc.rater.pmos_branch) {
        children.push(createFieldRow('  PMOSC/Branch', rc.rater.pmos_branch));
      }
      children.push(createFieldRow('  Duty Assignment', rc.rater.duty_assignment || 'N/A'));
      if (rc.rater.organization) {
        children.push(createFieldRow('  Organization', rc.rater.organization));
      }
      if (rc.rater.email) {
        children.push(createFieldRow('  Email', rc.rater.email));
      }
    }

    if (rc.senior_rater) {
      children.push(
        createFieldRow('Senior Rater Name', `${rc.senior_rater.name || 'N/A'}, ${rc.senior_rater.rank || ''}`)
      );
      if (rc.senior_rater.dodid) {
        children.push(createFieldRow('  DODID', rc.senior_rater.dodid));
      }
      if (rc.senior_rater.pmos_branch) {
        children.push(createFieldRow('  PMOSC/Branch', rc.senior_rater.pmos_branch));
      }
      children.push(createFieldRow('  Duty Assignment', rc.senior_rater.duty_assignment || 'N/A'));
      if (rc.senior_rater.organization) {
        children.push(createFieldRow('  Organization', rc.senior_rater.organization));
      }
      if (rc.senior_rater.email) {
        children.push(createFieldRow('  Email', rc.senior_rater.email));
      }
    }

    if (rc.intermediate_rater) {
      children.push(
        createFieldRow('Intermediate Rater', `${rc.intermediate_rater.name || 'N/A'}`)
      );
    }

    if (rc.supplementary_reviewer) {
      children.push(
        createFieldRow('Supplementary Reviewer', `${rc.supplementary_reviewer.name || 'N/A'}`)
      );
    }
  }

  // === PART III - DUTY DESCRIPTION ===
  if (formData?.duty_description) {
    children.push(createSectionHeader('PART III - DUTY DESCRIPTION'));

    const dd = formData.duty_description;

    children.push(createFieldRow('Principal Duty Title', dd.principal_duty_title || dutyTitle || ''));

    if (dd.significant_duties) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Significant Duties and Responsibilities:',
              bold: true,
              size: 20,
            }),
          ],
          spacing: { before: 100, after: 60 },
        })
      );
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: dd.significant_duties,
              size: 18,
            }),
          ],
          spacing: { after: 100 },
          indent: { left: 360 },
        })
      );
    }

    if (dd.areas_of_emphasis) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Areas of Emphasis:',
              bold: true,
              size: 20,
            }),
          ],
          spacing: { before: 100, after: 60 },
        })
      );
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: dd.areas_of_emphasis,
              size: 18,
            }),
          ],
          spacing: { after: 100 },
          indent: { left: 360 },
        })
      );
    }

    if (dd.appointed_duties) {
      children.push(createFieldRow('Appointed Duties', dd.appointed_duties));
    }
  }

  // === PART IV - RATER ASSESSMENT ===
  children.push(createSectionHeader('PART IV - RATER ASSESSMENT'));

  // Performance Bullets by Category
  if (bullets && bullets.length > 0) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'Performance Bullets:',
            bold: true,
            size: 22,
          }),
        ],
        spacing: { before: 100, after: 100 },
      })
    );

    for (const category of CATEGORY_ORDER) {
      const categoryBullets = bullets.filter(b => b.category === category);

      if (categoryBullets.length > 0) {
        // Category header
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: category.toUpperCase(),
                bold: true,
                size: 20,
                color: '333399',
              }),
            ],
            spacing: { before: 150, after: 60 },
          })
        );

        // Bullets
        for (const bullet of categoryBullets) {
          children.push(createBulletPoint(bullet.enhanced));
        }
      }
    }
  }

  // Rater Comments
  if (raterComments) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'Rater Comments:',
            bold: true,
            size: 22,
          }),
        ],
        spacing: { before: 200, after: 100 },
      })
    );

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: raterComments,
            size: 18,
          }),
        ],
        spacing: { after: 100 },
        indent: { left: 360 },
      })
    );
  }

  // === PART V - SENIOR RATER ASSESSMENT ===
  children.push(createSectionHeader('PART V - SENIOR RATER ASSESSMENT'));

  // Senior Rater Assessment details
  if (formData?.senior_rater_assessment) {
    const sra = formData.senior_rater_assessment;

    if (sra.potential_rating) {
      children.push(createFieldRow('Potential', sra.potential_rating));
    }

    if (sra.enumeration) {
      children.push(createFieldRow('Enumeration', sra.enumeration));
    }

    if (sra.promotion) {
      children.push(createFieldRow('Promotion', sra.promotion));
    }

    if (sra.school_recommendation) {
      children.push(createFieldRow('School Recommendation', sra.school_recommendation));
    }

    if (sra.potential_next_assignment) {
      children.push(createFieldRow('Next Assignment', sra.potential_next_assignment));
    }
  }

  // Senior Rater Comments
  if (srComments) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'Senior Rater Comments:',
            bold: true,
            size: 22,
          }),
        ],
        spacing: { before: 200, after: 100 },
      })
    );

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: srComments,
            size: 18,
          }),
        ],
        spacing: { after: 100 },
        indent: { left: 360 },
      })
    );
  }

  // === FOOTER ===
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: '─'.repeat(80),
          color: 'CCCCCC',
          size: 16,
        }),
      ],
      spacing: { before: 400, after: 100 },
      alignment: AlignmentType.CENTER,
    })
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'Generated by MilEvalAI - Made for Soldiers by Soldiers',
          size: 16,
          color: '888888',
          italics: true,
        }),
      ],
      alignment: AlignmentType.CENTER,
    })
  );

  // Create the document
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: children,
      },
    ],
  });

  // Generate the blob
  const blob = await Packer.toBlob(doc);
  return blob;
}

/**
 * Trigger download of DOCX in browser
 */
export function downloadDOCX(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
