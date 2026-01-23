// Ollama Integration for MilEvalAI
// Uses llama3.2 for AI-powered bullet categorization and enhancement

import { RankLevel, EvaluationType, SeniorRaterAssessment, OERPotentialRating } from '@/lib/types/database';

interface OllamaResponse {
  model: string;
  response: string;
  done: boolean;
}

export interface CategoryResult {
  category: 'Character' | 'Presence' | 'Intellect' | 'Leads' | 'Develops' | 'Achieves';
  confidence: number;
  enhanced: string;
  original: string;
}

// Senior Rater structured output
export interface SeniorRaterOutput {
  enumeration: string;
  promotion: string;
  school_recommendation: string;
  potential_next_assignment: string;
  full_narrative: string;
  successive_assignments: string[];
  broadening_assignment?: string;
}

// Default Ollama API endpoint (running locally)
const OLLAMA_API_URL = process.env.OLLAMA_API_URL || 'http://localhost:11434';
const MODEL = 'llama3.2';

// ============================================
// Form-Specific Configuration
// ============================================

// School recommendations by rank level
const SCHOOL_RECOMMENDATIONS: Record<RankLevel, string[]> = {
  'E5': ['BLC', 'ALC', 'Ranger School', 'Air Assault', 'Airborne'],
  'E6-E8': ['ALC', 'SLC', 'MLC', 'Master Gunner', 'Battle Staff', 'Ranger School'],
  'E9': ['SLC', 'SGM Academy', 'MLC', 'Senior Enlisted Joint PME'],
  'O1-O3': ['CCC', 'Ranger School', 'Airborne', 'Air Assault', 'Pathfinder', 'BOLC'],
  'O4-O5': ['ILE', 'ILE Resident', 'CGSC', 'SAMS', 'Joint School', 'Airborne'],
  'O6': ['SSC', 'War College', 'JAWS', 'Joint PME II', 'Defense Strategy Course', 'NWC'],
};

// Typical next assignments by rank level
const NEXT_ASSIGNMENTS: Record<RankLevel, string[]> = {
  'E5': ['Squad Leader', 'Section Leader', 'Team Leader', 'Instructor', 'Drill Sergeant'],
  'E6-E8': ['Platoon Sergeant', 'Operations NCO', 'First Sergeant', 'Senior Instructor', 'BN/BDE Staff NCO'],
  'E9': ['Command Sergeant Major', 'Division/Corps Staff', 'Nominative CSM', 'TRADOC Assignment'],
  'O1-O3': ['Company Commander', 'XO', 'S3 Air', 'Assistant S3', 'Staff Officer'],
  'O4-O5': ['Battalion XO', 'Battalion S3', 'Brigade S3', 'Division Staff', 'Joint Staff'],
  'O6': ['Brigade Commander', 'Division G3/G5', 'Joint Staff', 'HQDA Staff Director', 'Combatant Command'],
};

// Rank-specific language for bullet enhancement
const getRankSpecificGuidance = (rankLevel: RankLevel, evalType: EvaluationType): string => {
  const isOER = evalType === 'OER';

  const guidance: Record<RankLevel, string> = {
    'E5': `Direct-level NCO language: Focus on hands-on leadership, Soldier training, equipment maintenance, tactical execution. Use verbs like: led, trained, maintained, executed, supervised, mentored.`,
    'E6-E8': `Organizational-level NCO language: Focus on systems management, program oversight, training management, readiness, junior NCO development. Use verbs like: managed, developed, implemented, synchronized, resourced, standardized.`,
    'E9': `Strategic-level NCO language: Focus on enterprise-wide impact, organizational transformation, talent management, doctrine development. Use verbs like: influenced, shaped, transformed, institutionalized, championed.`,
    'O1-O3': `Company-grade officer language: Focus on planning, coordinating, decision-making, resource management, mission command. Use verbs like: planned, coordinated, directed, resourced, synchronized.`,
    'O4-O5': `Field-grade officer language: Focus on organizational leadership, enterprise operations, staff integration, joint coordination. Use verbs like: orchestrated, integrated, synchronized, operationalized, enabled.`,
    'O6': `Strategic-grade officer language: Focus on enterprise-level impact, strategic vision, interagency coordination, national-level mission. Use verbs like: directed, shaped, influenced, transformed, modernized, strategized.`,
  };

  return guidance[rankLevel] || guidance['E6-E8'];
};

/**
 * Call Ollama API with a prompt
 */
async function callOllama(prompt: string, system?: string): Promise<string> {
  console.log(`🤖 Calling Ollama LLM at ${OLLAMA_API_URL}/api/generate with model: ${MODEL}`);
  
  try {
    const response = await fetch(`${OLLAMA_API_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        prompt: prompt,
        system: system,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Ollama API error: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`Ollama API error: ${response.statusText} - ${errorText}`);
    }

    const data: OllamaResponse = await response.json();
    console.log(`✅ Ollama LLM response received (${data.response.length} chars)`);
    return data.response.trim();
  } catch (error) {
    console.error('❌ Ollama API error:', error);
    throw error;
  }
}

/**
 * Categorize a bullet into one of the 6 categories
 */
export async function categorizeBullet(bullet: string): Promise<CategoryResult> {
  const system = `You are a military evaluation expert. Categorize performance bullets into one of these categories:
- Character: Integrity, discipline, Army Values, ethical behavior
- Presence: Military bearing, fitness, confidence, professionalism
- Intellect: Sound judgment, innovation, problem-solving, critical thinking
- Leads: Leadership, guidance, mentorship, setting example
- Develops: Training, development of others, team building, professional growth
- Achieves: Mission accomplishment, results, measurable outcomes, achievements

Respond ONLY with a JSON object in this format:
{"category": "CategoryName", "confidence": 0.95, "reasoning": "brief explanation"}`;

  const prompt = `Categorize this military performance bullet:\n\n"${bullet}"\n\nProvide the category, confidence score (0-1), and brief reasoning.`;

  try {
    const response = await callOllama(prompt, system);
    
    // Parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      // Fallback if AI doesn't return JSON
      return {
        category: 'Achieves',
        confidence: 0.5,
        enhanced: bullet,
        original: bullet,
      };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    return {
      category: parsed.category,
      confidence: parsed.confidence || 0.8,
      enhanced: bullet, // Will enhance in next step
      original: bullet,
    };
  } catch (error) {
    console.error('Error categorizing bullet:', error);
    // Fallback
    return {
      category: 'Achieves',
      confidence: 0.5,
      enhanced: bullet,
      original: bullet,
    };
  }
}

/**
 * Enhance a bullet with better grammar, tone, and quantification
 */
export async function enhanceBullet(
  bullet: string,
  category: string,
  rankLevel: RankLevel,
  evaluationType: EvaluationType = 'NCOER'
): Promise<string> {
  console.log(`🔄 REGENERATE: Enhancing ${evaluationType} bullet for ${rankLevel} in category "${category}"`);
  const isOER = evaluationType === 'OER';
  const rankGuidance = getRankSpecificGuidance(rankLevel, evaluationType);

  const system = `You are a military evaluation writing expert specializing in ${evaluationType}s.

${isOER ? 'OFFICER EVALUATION REPORT (OER) STANDARDS:' : 'NCO EVALUATION REPORT (NCOER) STANDARDS:'}
- ${rankGuidance}
- Results-focused with quantifiable metrics when possible
- Professional tone appropriate for ${rankLevel} grade
- Concise (under 350 characters for EES compatibility)
- NO personal pronouns (I, me, my)
- Begin with strong action verb
- Include impact/results when available

FORM-SPECIFIC GUIDANCE FOR ${rankLevel}:
${isOER
  ? rankLevel === 'O6'
    ? 'Strategic-grade OER: Emphasize enterprise-wide impact, strategic vision, joint/interagency coordination'
    : rankLevel === 'O4-O5'
    ? 'Field-grade OER: Emphasize organizational leadership, staff integration, operational planning'
    : 'Company-grade OER: Emphasize tactical leadership, resource management, mission command'
  : rankLevel === 'E9'
    ? 'SGM/CSM NCOER: Emphasize enterprise influence, institutional impact, talent management'
    : rankLevel === 'E6-E8'
    ? 'Organizational NCOER: Emphasize program management, systems oversight, NCO development'
    : 'Direct-level NCOER: Emphasize hands-on leadership, Soldier training, tactical execution'
}

CRITICAL: Do NOT add information not in the original bullet. Only enhance what's there.`;

  const prompt = `Enhance this ${category} bullet for a ${rankLevel} ${evaluationType}:\n\n"${bullet}"\n\nProvide ONLY the enhanced bullet in proper ${evaluationType} format and tone, nothing else.`;

  try {
    const enhanced = await callOllama(prompt, system);
    console.log(`✅ REGENERATE COMPLETE: Enhanced from ${bullet.length} to ${enhanced.length} characters`);
    return enhanced.replace(/^["']|["']$/g, '').trim();
  } catch (error) {
    console.error('❌ Error enhancing bullet:', error);
    return bullet; // Return original if enhancement fails
  }
}

/**
 * Extract structured administrative data from predecessor evaluation
 */
export async function extractAdminDataFromPredecessor(text: string): Promise<{
  name?: string;
  rank?: string;
  dodid?: string;
  pmos_aoc?: string;
  uic?: string;
  unit_org_station?: string;
  rater_name?: string;
  rater_rank?: string;
  rater_position?: string;
  senior_rater_name?: string;
  senior_rater_rank?: string;
  senior_rater_position?: string;
  period_from?: string;
  period_thru?: string;
  duty_title?: string;
}> {
  const system = `You are extracting administrative data from a military evaluation document. Extract the following fields and return them as JSON:
{
  "name": "Rated person's name (Last, First MI)",
  "rank": "Rated person's rank (e.g., SFC, CPT)",
  "dodid": "10-digit DOD ID number",
  "pmos_aoc": "PMOS for NCO or AOC for Officer",
  "uic": "6-character Unit Identification Code",
  "unit_org_station": "Unit, Organization, Station, ZIP/APO, Major Command",
  "rater_name": "Rater's name (Last, First MI)",
  "rater_rank": "Rater's rank",
  "rater_position": "Rater's position/duty title",
  "senior_rater_name": "Senior Rater's name (Last, First MI)",
  "senior_rater_rank": "Senior Rater's rank",
  "senior_rater_position": "Senior Rater's position/duty title",
  "period_from": "Period covered from date (YYYYMMDD format)",
  "period_thru": "Period covered thru date (YYYYMMDD format)",
  "duty_title": "Principal duty title"
}

Return ONLY fields you can find. If a field is not found, omit it from the JSON. Use null for missing fields.`;

  const prompt = `Extract administrative data from this military evaluation:\n\n${text.substring(0, 3000)}\n\nProvide only the JSON object with extracted data.`;

  try {
    const response = await callOllama(prompt, system);
    const jsonMatch = response.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      // Clean up the data - remove null/empty values
      const cleaned: any = {};
      Object.keys(parsed).forEach(key => {
        if (parsed[key] && parsed[key] !== 'null' && parsed[key].trim() !== '') {
          cleaned[key] = parsed[key].trim();
        }
      });
      console.log('✅ Extracted admin data from predecessor:', Object.keys(cleaned));
      return cleaned;
    }
  } catch (error) {
    console.error('Error extracting admin data from predecessor:', error);
  }

  // Return empty object if extraction fails
  return {};
}

/**
 * Analyze predecessor evaluation to learn tone and style
 */
export async function analyzePredecessor(text: string): Promise<{
  tone: string;
  avgWordCount: number;
  style: string;
  keyPhrases: string[];
}> {
  const system = `You are analyzing a military evaluation to understand writing style and tone. Provide a JSON response with:
- tone: overall tone (e.g., "formal", "results-oriented", "narrative")
- avgWordCount: average words per bullet
- style: writing style description
- keyPhrases: array of 3-5 commonly used phrases`;

  const prompt = `Analyze this military evaluation:\n\n${text.substring(0, 2000)}\n\nProvide analysis as JSON.`;

  try {
    const response = await callOllama(prompt, system);
    const jsonMatch = response.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error('Error analyzing predecessor:', error);
  }

  // Fallback
  return {
    tone: 'professional',
    avgWordCount: 50,
    style: 'concise and results-focused',
    keyPhrases: ['demonstrated', 'achieved', 'led'],
  };
}

/**
 * Generate Rater Comments based on bullets
 */
export async function generateRaterComments(
  bullets: CategoryResult[],
  rankLevel: string,
  dutyTitle: string,
  evaluationType: 'NCOER' | 'OER' = 'NCOER'
): Promise<string> {
  console.log(`📝 REGENERATE: Generating Rater comments for ${evaluationType} ${rankLevel} (${bullets.length} bullets)`);
  const isOER = evaluationType === 'OER';
  
  const system = `You are writing Rater comments for a military ${evaluationType}. 

${isOER ? 'OER RATER COMMENT STANDARDS:' : 'NCOER RATER COMMENT STANDARDS:'}
- Write a cohesive paragraph (100-150 words)
- Synthesize key accomplishments from the bullets
- Use proper ${isOER ? 'officer' : 'NCO'} evaluation language per AR 623-3
- ${isOER ? 'Emphasize leadership, decision-making, and strategic thinking' : 'Emphasize technical competence, leadership, and training'}
- Match ${rankLevel} rank level expectations
- Professional, results-oriented tone
- ${isOER ? 'Forward-looking and developmental' : 'Action-oriented and mission-focused'}
- Use phrases common in ${evaluationType}s: ${isOER ? '"demonstrated exceptional judgment", "effectively managed", "skillfully coordinated"' : '"consistently demonstrated", "effectively led", "expertly trained"'}

Format: Single cohesive paragraph, no bullet points.`;

  const bulletText = bullets
    .map(b => `- ${b.enhanced}`)
    .join('\n');

  const prompt = `Write Rater comments for a ${dutyTitle} (${rankLevel}) ${evaluationType} based on these accomplishments:\n\n${bulletText}\n\nProvide ONLY the paragraph in proper ${evaluationType} format and language, nothing else.`;

  try {
    const result = await callOllama(prompt, system);
    console.log(`✅ RATER COMMENTS COMPLETE: ${result.split(' ').length} words generated`);
    return result;
  } catch (error) {
    console.error('❌ Error generating rater comments:', error);
    return isOER 
      ? 'Outstanding officer who consistently demonstrates exceptional leadership and sound judgment in all areas of responsibility.'
      : 'Outstanding NCO who consistently demonstrates exceptional leadership and technical competence in all areas of responsibility.';
  }
}

/**
 * Generate Senior Rater Comments (legacy - simple paragraph)
 */
export async function generateSeniorRaterComments(
  raterComments: string,
  bullets: CategoryResult[],
  rankLevel: RankLevel,
  evaluationType: EvaluationType = 'NCOER'
): Promise<string> {
  // Use the structured generator and return just the full narrative
  const structured = await generateStructuredSeniorRater(
    raterComments,
    bullets,
    rankLevel,
    evaluationType
  );
  return structured.full_narrative;
}

/**
 * Generate Structured Senior Rater output with all 4 REQUIRED elements
 * Per MilEvalAI Flow: Enumeration, Promotion, School, Potential/Next Assignment
 */
export async function generateStructuredSeniorRater(
  raterComments: string,
  bullets: CategoryResult[],
  rankLevel: RankLevel,
  evaluationType: EvaluationType = 'NCOER',
  numSeniorRated: number = 15
): Promise<SeniorRaterOutput> {
  console.log(`⭐ Generating STRUCTURED Senior Rater for ${evaluationType} ${rankLevel}`);
  const isOER = evaluationType === 'OER';

  const schoolOptions = SCHOOL_RECOMMENDATIONS[rankLevel].join(', ');
  const assignmentOptions = NEXT_ASSIGNMENTS[rankLevel].join(', ');

  const system = `You are writing Senior Rater comments for a military ${evaluationType}.

CRITICAL REQUIREMENT: You MUST include ALL FOUR of these elements in your response:

1. ENUMERATION: How this person ranks among peers (e.g., "#1 of ${numSeniorRated}", "Top 5%", "Best of ${Math.floor(numSeniorRated * 0.9)}")
2. PROMOTION: Specific promotion recommendation (e.g., "Promote immediately", "Promote ahead of peers", "Select for promotion now")
3. SCHOOL RECOMMENDATION: Appropriate for ${rankLevel}: ${schoolOptions}
4. POTENTIAL/NEXT ASSIGNMENT: From these options: ${assignmentOptions}

${isOER ? 'OER SENIOR RATER STANDARDS:' : 'NCOER SENIOR RATER STANDARDS:'}
- Write a powerful, comprehensive paragraph (150-200 words)
- Build on but DON'T repeat the Rater comments
- Strategic-level, big-picture perspective
- Strong, confident language
- ${isOER
  ? rankLevel === 'O6'
    ? 'Strategic-grade: Emphasize enterprise impact, GO potential, strategic vision'
    : rankLevel === 'O4-O5'
    ? 'Field-grade: Emphasize battalion/brigade readiness, command potential'
    : 'Company-grade: Emphasize company command potential, tactical excellence'
  : rankLevel === 'E9'
    ? 'SGM/CSM: Emphasize nominative potential, institutional impact'
    : rankLevel === 'E6-E8'
    ? 'SSG-MSG: Emphasize 1SG/SGM potential, organizational leadership'
    : 'SGT: Emphasize SSG potential, squad/section leadership'
}

Respond with a JSON object containing:
{
  "enumeration": "the enumeration statement",
  "promotion": "the promotion recommendation",
  "school_recommendation": "the school recommendation",
  "potential_next_assignment": "the next assignment recommendation",
  "full_narrative": "the complete senior rater paragraph incorporating all 4 elements",
  "successive_assignments": ["assignment1", "assignment2", ${isOER ? '"assignment3"' : ''}],
  "broadening_assignment": "${!isOER ? 'one broadening assignment' : ''}"
}`;

  const bulletSummary = bullets.map(b => b.enhanced).join('; ');

  const prompt = `Write Senior Rater comments for a ${rankLevel} ${evaluationType}.

Rater's assessment: "${raterComments}"

Key accomplishments: ${bulletSummary}

Number of ${isOER ? 'officers' : 'NCOs'} I senior rate in this grade: ${numSeniorRated}

Generate a JSON response with enumeration, promotion, school_recommendation, potential_next_assignment, full_narrative, successive_assignments${!isOER ? ', and broadening_assignment' : ''}.`;

  try {
    const response = await callOllama(prompt, system);

    // Parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);

      // Ensure all required fields are present
      const result: SeniorRaterOutput = {
        enumeration: parsed.enumeration || `#1 of ${numSeniorRated} ${isOER ? 'officers' : 'NCOs'} I senior rate`,
        promotion: parsed.promotion || 'Promote immediately',
        school_recommendation: parsed.school_recommendation || SCHOOL_RECOMMENDATIONS[rankLevel][0],
        potential_next_assignment: parsed.potential_next_assignment || NEXT_ASSIGNMENTS[rankLevel][0],
        full_narrative: parsed.full_narrative || '',
        successive_assignments: parsed.successive_assignments || NEXT_ASSIGNMENTS[rankLevel].slice(0, isOER ? 3 : 2),
        broadening_assignment: !isOER ? (parsed.broadening_assignment || 'Instructor/Drill Sergeant') : undefined,
      };

      // If full_narrative is empty, construct it from components
      if (!result.full_narrative) {
        result.full_narrative = constructSeniorRaterNarrative(result, rankLevel, evaluationType);
      }

      console.log(`✅ STRUCTURED SR COMPLETE: All 4 elements generated`);
      return result;
    }

    // Fallback if JSON parsing fails
    throw new Error('Failed to parse JSON response');
  } catch (error) {
    console.error('❌ Error generating structured SR:', error);

    // Return sensible defaults
    const defaults: SeniorRaterOutput = {
      enumeration: `#1 of ${numSeniorRated} ${isOER ? 'officers' : 'NCOs'} I senior rate; top performer`,
      promotion: isOER ? 'Promote ahead of peers' : 'Promote immediately to next grade',
      school_recommendation: SCHOOL_RECOMMENDATIONS[rankLevel][0],
      potential_next_assignment: NEXT_ASSIGNMENTS[rankLevel][0],
      full_narrative: '',
      successive_assignments: NEXT_ASSIGNMENTS[rankLevel].slice(0, isOER ? 3 : 2),
      broadening_assignment: !isOER ? 'Instructor' : undefined,
    };

    defaults.full_narrative = constructSeniorRaterNarrative(defaults, rankLevel, evaluationType);
    return defaults;
  }
}

/**
 * Helper to construct a full narrative from SR components
 */
function constructSeniorRaterNarrative(
  sr: SeniorRaterOutput,
  rankLevel: RankLevel,
  evaluationType: EvaluationType
): string {
  const isOER = evaluationType === 'OER';
  const title = isOER ? 'officer' : 'NCO';
  const nextRank = isOER
    ? rankLevel === 'O1-O3' ? 'MAJ' : rankLevel === 'O4-O5' ? 'COL' : 'BG'
    : rankLevel === 'E5' ? 'SSG' : rankLevel === 'E6-E8' ? 'MSG/1SG' : 'CSM';

  return `${sr.enumeration}. Exceptional ${title} with unlimited potential and proven results. ${sr.promotion} to ${nextRank}. Ready for ${sr.potential_next_assignment} now. Send to ${sr.school_recommendation} immediately. This ${title} consistently exceeds expectations and is prepared for positions of greater responsibility. Retain and challenge with the most demanding assignments.`;
}

/**
 * Generate Summary Narrative
 */
export async function generateNarrative(
  bullets: CategoryResult[],
  rankLevel: string,
  dutyTitle: string,
  evaluationType: 'NCOER' | 'OER' = 'NCOER',
  style: 'concise' | 'narrative' = 'concise'
): Promise<string> {
  console.log(`📖 REGENERATE: Generating ${style} narrative for ${evaluationType} ${rankLevel}`);
  const isOER = evaluationType === 'OER';
  
  const system = `You are writing a Summary Narrative for a military ${evaluationType}.

${isOER ? 'OER SUMMARY NARRATIVE STANDARDS:' : 'NCOER SUMMARY NARRATIVE STANDARDS:'}
- Write a ${style === 'concise' ? 'concise, powerful' : 'detailed, narrative-style'} summary
- ${style === 'concise' ? '50-75 words' : '100-150 words'}
- Synthesize overall performance and leadership
- Use proper ${isOER ? 'officer' : 'NCO'} evaluation language per AR 623-3
- ${isOER ? 'Emphasize strategic impact and officer qualities' : 'Emphasize tactical leadership and NCO competence'}
- Professional, results-oriented tone
- ${isOER ? 'Forward-looking with command perspective' : 'Action-oriented with mission focus'}
- Highlight key strengths and overall performance level

Style: Single ${style === 'concise' ? 'powerful, concise' : 'flowing, narrative'} summary that captures the individual's overall performance.`;

  const bulletText = bullets
    .map(b => `- ${b.enhanced}`)
    .join('\n');

  const prompt = `Write a ${style} summary narrative for a ${dutyTitle} (${rankLevel}) ${evaluationType} based on these accomplishments:\n\n${bulletText}\n\nProvide ONLY the narrative paragraph in proper ${evaluationType} format, nothing else.`;

  try {
    const result = await callOllama(prompt, system);
    console.log(`✅ NARRATIVE COMPLETE: ${result.split(' ').length} words generated (${style} style)`);
    return result;
  } catch (error) {
    console.error('❌ Error generating narrative:', error);
    return isOER
      ? 'Outstanding officer who consistently demonstrates exceptional leadership, sound judgment, and strategic thinking across all areas of responsibility. Exceeded all performance expectations.'
      : 'Outstanding NCO who consistently demonstrates exceptional leadership, technical competence, and mission focus across all areas of responsibility. Exceeded all performance expectations.';
  }
}

/**
 * Batch categorize and enhance bullets
 */
export async function processBullets(
  bullets: string[],
  rankLevel: RankLevel,
  evaluationType: 'NCOER' | 'OER' = 'NCOER'
): Promise<CategoryResult[]> {
  console.log(`🔄 Processing ${bullets.length} bullets for ${evaluationType} ${rankLevel} (calling LLM ${bullets.length * 2} times)`);
  const results: CategoryResult[] = [];

  for (let i = 0; i < bullets.length; i++) {
    const bullet = bullets[i];
    console.log(`  📌 Bullet ${i + 1}/${bullets.length}: "${bullet.substring(0, 50)}..."`);
    
    try {
      // Categorize
      const categorized = await categorizeBullet(bullet);
      console.log(`    → Categorized as: ${categorized.category} (${Math.round(categorized.confidence * 100)}% confidence)`);
      
      // Enhance with proper NCOER/OER tone
      const enhanced = await enhanceBullet(
        bullet,
        categorized.category,
        rankLevel,
        evaluationType
      );

      results.push({
        ...categorized,
        enhanced,
      });
    } catch (error) {
      console.error(`❌ Error processing bullet ${i + 1}:`, error);
      // Add as-is if processing fails
      results.push({
        category: 'Achieves',
        confidence: 0.5,
        enhanced: bullet,
        original: bullet,
      });
    }
  }

  console.log(`✅ Completed processing ${bullets.length} bullets`);
  return results;
}

