# Narrative Save Issue - Debugging Improvements

## Overview
Added comprehensive logging and error handling to debug why regenerated narratives might not be saving when clicking "Save & Continue".

## Changes Made

### 🔍 **Enhanced Save Function** (`handleNext`)

#### **Before:**
- Basic error logging
- No visibility into what was being saved
- Generic error messages

#### **After:**
Added detailed logging and validation:

```typescript
const handleNext = async () => {
  // 1. Validate narrative exists
  if (!narrative.trim()) {
    alert("Please add a narrative before continuing.");
    return;
  }

  setLoading(true);
  
  try {
    const supabase = createClient();
    
    // 2. Log what we're about to save
    console.log("💾 Saving narrative:", {
      evaluationId,
      narrativeLength: narrative.length,
      narrativePreview: narrative.substring(0, 50) + "..."
    });
    
    // 3. Save with .select() to verify the update
    const { data, error } = await supabase
      .from("evaluations")
      .update({ 
        narrative: narrative,
        status: "narrative_complete" 
      })
      .eq("id", evaluationId)
      .select();  // ← Added this to see what was saved

    if (error) {
      console.error("❌ Error saving narrative:", error);
      alert(`Error saving narrative: ${error.message}`);
      setLoading(false);
      return;
    }

    // 4. Confirm successful save
    console.log("✅ Narrative saved successfully:", data);
    router.push(`/evaluation/${evaluationId}/review`);
  } catch (error) {
    console.error("❌ Unexpected error:", error);
    alert("An unexpected error occurred. Please try again.");
    setLoading(false);
  }
};
```

### 📝 **Enhanced Regenerate Function** (`handleRegenerate`)

Added logging to track the regeneration process:

```typescript
const handleRegenerate = async () => {
  if (!evaluationData) {
    alert("Evaluation data not loaded yet. Please try again.");
    return;
  }

  // 1. Log regeneration start
  console.log("🔄 Regenerating narrative with style:", style);
  setRegenerating(true);

  try {
    const response = await fetch("/api/ai/narrative", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bullets: evaluationData.categorized_bullets || [],
        rankLevel: evaluationData.rank_level,
        dutyTitle: evaluationData.duty_title,
        evaluationType: evaluationData.evaluation_type || 'NCOER',
        style: style,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to regenerate narrative");
    }

    const { narrative: generatedNarrative } = await response.json();
    
    // 2. Log what was received from AI
    console.log("✅ Narrative regenerated:", {
      length: generatedNarrative.length,
      preview: generatedNarrative.substring(0, 100) + "..."
    });
    
    // 3. Update state
    setNarrative(generatedNarrative);
  } catch (error: any) {
    console.error("❌ Error regenerating narrative:", error);
    alert(`Failed to regenerate narrative: ${error.message}. Make sure Ollama is running.`);
  } finally {
    setRegenerating(false);
  }
};
```

## How to Debug the Save Issue

### **1. Open Browser Console** (F12 or Cmd+Option+I)

When you:
1. Click "Regenerate"
2. Click "Save & Continue"

You should see this console output:

```bash
# When regenerating:
🔄 Regenerating narrative with style: concise
🤖 Calling Ollama LLM at http://localhost:11434/api/generate with model: llama3.2
✅ Ollama LLM response received (234 chars)
✅ NARRATIVE COMPLETE: 87 words generated (concise style)
✅ Narrative regenerated: {
  length: 234,
  preview: "Outstanding NCO who consistently demonstrates exceptional leadership..."
}

# When saving:
💾 Saving narrative: {
  evaluationId: "abc123-def456",
  narrativeLength: 234,
  narrativePreview: "Outstanding NCO who consistently demonstrates..."
}
✅ Narrative saved successfully: [{
  id: "abc123-def456",
  narrative: "Outstanding NCO who consistently demonstrates...",
  status: "narrative_complete",
  ...
}]
```

### **2. Check for Errors**

If you see any of these errors, they indicate the problem:

#### **Error: "Please add a narrative before continuing"**
- **Cause:** The narrative state is empty
- **Solution:** Check if regenerate is properly setting the narrative

#### **Error: "Error saving narrative: [message]"**
- **Cause:** Supabase update failed
- **Solution:** Check:
  - Row Level Security policies
  - User authentication
  - Database connection
  - Field permissions

#### **Error: "Failed to regenerate narrative: [message]"**
- **Cause:** AI generation failed
- **Solution:** 
  - Verify Ollama is running: `ollama serve`
  - Check if model exists: `ollama list`
  - Verify categorized bullets exist in evaluation

### **3. Verify in Supabase Dashboard**

After clicking "Save & Continue":
1. Go to Supabase dashboard
2. Click "Table Editor"
3. Open `evaluations` table
4. Find your evaluation by ID
5. Check the `narrative` column
6. Check the `status` column (should be "narrative_complete")

### **4. Common Issues and Fixes**

#### **Issue: Narrative appears in UI but doesn't save**
**Symptoms:**
- ✅ Regenerate works
- ✅ Text appears in textarea
- ❌ Not in database after save

**Debug:**
```bash
# Check console logs
💾 Saving narrative: { ... }  # Should show the narrative
✅ Narrative saved successfully: [ ... ]  # Should show updated record

# If you see ❌ Error, check the error message
```

**Fix:**
- Verify RLS policies allow update
- Check if `evaluationId` is correct
- Verify user is authenticated

#### **Issue: Save button doesn't do anything**
**Symptoms:**
- Click "Save & Continue"
- No console logs
- Page doesn't navigate

**Debug:**
```javascript
// Add this temporarily to the button onClick:
onClick={() => {
  console.log("Button clicked!");
  handleNext();
}}
```

**Fix:**
- Check if button is disabled
- Verify loading state
- Check browser console for JavaScript errors

#### **Issue: Narrative is empty after regenerate**
**Symptoms:**
- Click "Regenerate"
- Loading spinner appears
- Nothing happens

**Debug:**
```bash
# Check terminal logs (where npm run dev runs)
📖 REGENERATE: Generating concise narrative for NCOER E5
🤖 Calling Ollama LLM...
✅ NARRATIVE COMPLETE: 87 words generated
```

**Fix:**
- Verify Ollama is running
- Check if bullets exist: `categorized_bullets` in database
- Verify API route is working

### **5. Manual Testing Steps**

1. **Navigate to narrative page:**
   ```
   /evaluation/{your-eval-id}/narrative
   ```

2. **Open browser console** (F12)

3. **Click "Regenerate"** and verify logs:
   ```
   ✅ Should see: "🔄 Regenerating narrative..."
   ✅ Should see: "✅ Narrative regenerated..."
   ```

4. **Verify text appears in textarea**

5. **Click "Save & Continue"** and verify logs:
   ```
   ✅ Should see: "💾 Saving narrative..."
   ✅ Should see: "✅ Narrative saved successfully..."
   ```

6. **Check Supabase dashboard** to verify data was saved

### **6. Check Terminal Logs**

Since AI calls happen server-side, check your terminal where `npm run dev` is running:

```bash
# When regenerating:
📖 REGENERATE: Generating concise narrative for NCOER E5
🤖 Calling Ollama LLM at http://localhost:11434/api/generate with model: llama3.2
✅ Ollama LLM response received (234 chars)
✅ NARRATIVE COMPLETE: 87 words generated (concise style)
```

## File Size Impact
- Narrative page increased from **2.62 kB** to **2.86 kB** (+240 bytes)
- Added comprehensive logging and error handling

## Build Status
```
✓ Compiled successfully
✓ All routes built
Route: /evaluation/[id]/narrative - 2.86 kB
```

---

## Quick Troubleshooting Checklist

- [ ] Ollama is running (`ollama serve`)
- [ ] Model exists (`ollama list` shows llama3.2)
- [ ] Evaluation has categorized bullets in database
- [ ] User is authenticated
- [ ] Browser console shows regenerate success logs
- [ ] Terminal shows LLM call logs
- [ ] Browser console shows save success logs
- [ ] Supabase dashboard shows updated narrative column
- [ ] No JavaScript errors in console
- [ ] No Supabase RLS policy errors

**If all checks pass but save still fails, share the console logs and I can help debug further!** 🔧

