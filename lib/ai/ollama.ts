// Ollama Integration for MilEvalAI
// Uses llama3.2 for AI-powered bullet categorization and enhancement

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

// Default Ollama API endpoint (running locally)
const OLLAMA_API_URL = process.env.OLLAMA_API_URL || 'http://localhost:11434';
const MODEL = 'llama3.2';

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
  rankLevel: string,
  evaluationType: 'NCOER' | 'OER' = 'NCOER'
): Promise<string> {
  console.log(`🔄 REGENERATE: Enhancing ${evaluationType} bullet for ${rankLevel} in category "${category}"`);
  const isOER = evaluationType === 'OER';
  
  const system = `You are a military evaluation writing expert specializing in ${evaluationType}s.

${isOER ? 'OFFICER EVALUATION REPORT (OER) STANDARDS:' : 'NCO EVALUATION REPORT (NCOER) STANDARDS:'}
- Use strong action verbs appropriate for ${isOER ? 'officers' : 'NCOs'} (${isOER ? 'directed, coordinated, managed, led, planned' : 'led, trained, maintained, supervised, executed'})
- Results-focused with quantifiable metrics
- ${isOER ? 'Strategic and analytical language' : 'Tactical and action-oriented language'}
- Professional ${isOER ? 'officer' : 'NCO'} tone
- Concise (under 350 characters for EES compatibility)
- Appropriate for ${rankLevel} rank level
- ${isOER ? 'Emphasize planning, coordination, and decision-making' : 'Emphasize leadership, training, and mission execution'}

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
 * Generate Senior Rater Comments
 */
export async function generateSeniorRaterComments(
  raterComments: string,
  bullets: CategoryResult[],
  rankLevel: string,
  evaluationType: 'NCOER' | 'OER' = 'NCOER'
): Promise<string> {
  console.log(`⭐ REGENERATE: Generating Senior Rater comments for ${evaluationType} ${rankLevel}`);
  const isOER = evaluationType === 'OER';
  
  const system = `You are writing Senior Rater comments for a military ${evaluationType}.

${isOER ? 'OER SENIOR RATER STANDARDS:' : 'NCOER SENIOR RATER STANDARDS:'}
- Write a powerful paragraph (150-200 words)
- Build on but DON'T repeat the Rater comments
- Provide strategic-level, big-picture perspective
- Highlight potential and readiness for promotion/next level
- Use strong, confident language appropriate for senior leaders
- ${isOER ? 'Emphasize strategic thinking and officer potential' : 'Emphasize leadership potential and technical expertise'}
- Match ${rankLevel} rank level expectations
- ${isOER ? 'Use phrases like "promote ahead of peers", "unlimited potential", "ready for battalion command"' : 'Use phrases like "promote to MSG/1SG immediately", "ready for greater responsibility", "unlimited potential"'}

Format: Single powerful paragraph that makes this individual stand out.`;

  const prompt = `Write Senior Rater comments for a ${rankLevel} ${evaluationType} building on these Rater comments:\n\n"${raterComments}"\n\nProvide ONLY the paragraph in proper ${evaluationType} senior rater language, nothing else.`;

  try {
    const result = await callOllama(prompt, system);
    console.log(`✅ SENIOR RATER COMMENTS COMPLETE: ${result.split(' ').length} words generated`);
    return result;
  } catch (error) {
    console.error('❌ Error generating senior rater comments:', error);
    return isOER
      ? 'Exceptionally strong officer with unlimited potential. Promote ahead of peers and select for key developmental assignments.'
      : 'Exceptionally strong NCO with unlimited potential. Promote to next rank immediately and retain for positions of greater responsibility.';
  }
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
  rankLevel: string,
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

