# NCOER/OER Tone Enhancement Update

## Overview
All AI regenerate buttons across the application now use proper military evaluation language and tone based on whether it's an NCOER (NCO Evaluation Report) or OER (Officer Evaluation Report).

## Changes Made

### 1. **Enhanced AI Library** (`lib/ai/ollama.ts`)

#### `enhanceBullet()` Function
- Added `evaluationType` parameter (`'NCOER' | 'OER'`)
- **NCOER-specific guidance:**
  - Action verbs: led, trained, maintained, supervised, executed
  - Tactical and action-oriented language
  - Emphasizes leadership, training, and mission execution
  
- **OER-specific guidance:**
  - Action verbs: directed, coordinated, managed, led, planned
  - Strategic and analytical language
  - Emphasizes planning, coordination, and decision-making

#### `generateRaterComments()` Function
- Added `evaluationType` parameter
- **NCOER Standards:**
  - Emphasizes technical competence, leadership, and training
  - Uses phrases like "consistently demonstrated", "effectively led", "expertly trained"
  
- **OER Standards:**
  - Emphasizes leadership, decision-making, and strategic thinking
  - Uses phrases like "demonstrated exceptional judgment", "effectively managed", "skillfully coordinated"

#### `generateSeniorRaterComments()` Function
- Added `evaluationType` parameter
- **NCOER Standards:**
  - Emphasizes leadership potential and technical expertise
  - Uses phrases like "promote to MSG/1SG immediately", "ready for greater responsibility", "unlimited potential"
  
- **OER Standards:**
  - Emphasizes strategic thinking and officer potential
  - Uses phrases like "promote ahead of peers", "ready for battalion command", "unlimited potential"

#### `processBullets()` Function
- Updated to pass `evaluationType` through the entire bullet processing pipeline

### 2. **Updated API Routes**

All API routes now accept and pass the `evaluationType` parameter:

- **`/api/ai/categorize`** - Categorizes bullets with proper tone
- **`/api/ai/enhance`** - Regenerates individual bullets with proper tone
- **`/api/ai/rater`** - Generates rater comments with proper military language
- **`/api/ai/senior-rater`** - Generates senior rater comments with proper military language

### 3. **Updated Frontend Pages**

#### Categorization Page (`app/evaluation/[id]/categorize/page.tsx`)
- **Initial AI Processing:** Now passes `evaluationType` when categorizing all bullets
- **Regenerate Button:** Passes `evaluationType` when regenerating individual bullets
- Ensures all bullets are enhanced with proper NCOER/OER tone

#### Rater Comments Page (`app/evaluation/[id]/rater/page.tsx`)
- **Generate Button:** Passes `evaluationType` to AI
- Generates comments using appropriate military evaluation language per AR 623-3

#### Senior Rater Comments Page (`app/evaluation/[id]/senior-rater/page.tsx`)
- **Generate Button:** Passes `evaluationType` to AI
- Generates strategic-level comments with proper officer/NCO language

## Key Benefits

### 1. **Accurate Military Language**
- NCOERs use tactical, action-oriented language appropriate for NCO roles
- OERs use strategic, analytical language appropriate for officer roles

### 2. **Rank-Appropriate Tone**
- Combined with existing `rankLevel` parameter for even more precise language
- E5 evaluations differ from E9 evaluations in tone and expectations
- O1-O3 evaluations differ from O6 evaluations in strategic perspective

### 3. **Consistency Across the App**
- Every regenerate button now produces evaluation-type-appropriate content
- No more generic bullets that don't match the evaluation type

### 4. **AR 623-3 Compliance**
- AI prompts explicitly reference proper evaluation language per Army regulations
- Follows established NCOER/OER writing standards

## Example Differences

### NCOER Bullet (E6):
**Input:** "Led team to success"
**Enhanced:** "Effectively led 10-soldier squad through 15 missions, achieving 100% mission success with zero safety incidents; expertly trained 3 junior NCOs on tactical operations"

### OER Bullet (O3):
**Input:** "Led team to success"
**Enhanced:** "Skillfully coordinated company-level operations involving 120 personnel, demonstrating sound tactical judgment and achieving 100% mission success across 15 complex operations"

### NCOER Rater Comments:
"SSG Smith consistently demonstrated exceptional technical competence and leadership throughout the rating period. Expertly trained 12 junior soldiers on mission-essential tasks, resulting in 95% GO rate on external evaluations..."

### OER Rater Comments:
"CPT Johnson demonstrated exceptional judgment and strategic thinking in all aspects of command. Effectively managed company operations, skillfully coordinating training and readiness across all warfighting functions..."

## Testing Recommendations

1. **Create an NCOER evaluation** (E5, E6-E8, or E9)
   - Add bullets and verify AI uses NCO-appropriate language
   - Check regenerate buttons produce tactical, action-oriented bullets
   - Verify rater/senior rater comments use NCO-specific phrases

2. **Create an OER evaluation** (O1-O3, O4-O5, or O6)
   - Add bullets and verify AI uses officer-appropriate language
   - Check regenerate buttons produce strategic, analytical bullets
   - Verify rater/senior rater comments use officer-specific phrases

3. **Test all regenerate buttons:**
   - Bullet regeneration on categorization page
   - Rater comments regeneration
   - Senior rater comments regeneration

## Technical Notes

- All functions default to `'NCOER'` if `evaluationType` is not provided (backward compatibility)
- The evaluation type is pulled from the database (`evaluations.evaluation_type` column)
- No breaking changes - existing evaluations will continue to work
- The AI model (Ollama llama3.2) receives detailed system prompts explaining NCOER vs OER standards

## Next Steps

Consider adding:
- Visual indicators in the UI showing which evaluation type is being used
- A "tone preview" showing example NCOER vs OER language differences
- User feedback buttons to rate AI-generated content quality
- A/B testing between different prompt templates for continuous improvement

