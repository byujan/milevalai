const fs = require('fs');
const path = require('path');

// Map of pages to their breadcrumb step names
const pageSteps = {
  'admin': 'admin',
  'draft': 'draft',
  'bullets': 'draft',
  'categorize': 'categorize',
  'narrative': 'categorize',
  'rater': 'rater',
  'senior-rater': 'senior-rater',
  'review': 'review',
  'export': 'export'
};

// Color theme replacements
const colorReplacements = [
  // Background colors
  { from: /bg-black/g, to: 'bg-white' },
  { from: /bg-white\/5/g, to: 'bg-white shadow-sm' },
  { from: /bg-white\/10/g, to: 'bg-gray-50' },

  // Border colors
  { from: /border-white\/10/g, to: 'border-gray-200' },
  { from: /border-white\/20/g, to: 'border-gray-300' },

  // Text colors
  { from: /text-white(?![\w-])/g, to: 'text-gray-900' },
  { from: /text-gray-400/g, to: 'text-gray-600' },
  { from: /text-gray-300/g, to: 'text-gray-700' },

  // Hover states
  { from: /hover:text-white/g, to: 'hover:text-gray-900' },
  { from: /hover:bg-white\/10/g, to: 'hover:bg-gray-100' },

  // Blue shades for consistency
  { from: /text-blue-400/g, to: 'text-blue-600' },
  { from: /bg-blue-500\/10/g, to: 'bg-blue-50' },
  { from: /border-blue-500\/20/g, to: 'border-blue-200' },
];

function updatePageFile(filePath, stepName) {
  console.log(`Updating ${filePath}...`);

  let content = fs.readFileSync(filePath, 'utf8');

  // Add breadcrumb import if not present
  if (!content.includes('EvaluationBreadcrumbs')) {
    // Find the last import statement
    const importLines = content.split('\n');
    let lastImportIndex = -1;
    for (let i = 0; i < importLines.length; i++) {
      if (importLines[i].trim().startsWith('import ')) {
        lastImportIndex = i;
      }
    }

    if (lastImportIndex >= 0) {
      importLines.splice(lastImportIndex + 1, 0, 'import EvaluationBreadcrumbs from "@/components/evaluation-breadcrumbs";');
      content = importLines.join('\n');
    }
  }

  // Apply color theme replacements
  for (const replacement of colorReplacements) {
    content = content.replace(replacement.from, replacement.to);
  }

  // Add breadcrumb component after the main container div opens
  // Look for patterns like: <div className="...max-w-...">
  if (!content.includes('<EvaluationBreadcrumbs')) {
    // Find main container pattern
    const containerRegex = /<div className="[^"]*min-h-screen[^"]*">\s*<div className="[^"]*max-w-[^"]*">/;
    const match = content.match(containerRegex);

    if (match) {
      const breadcrumb = `
        <EvaluationBreadcrumbs
          evaluationId={evaluationId}
          currentStep="${stepName}"
        />`;

      content = content.replace(
        match[0],
        match[0] + breadcrumb
      );
    }
  }

  // Write updated content
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✓ Updated ${filePath}`);
}

// Process all evaluation pages
const evaluationDir = path.join(__dirname, '..', 'app', 'evaluation', '[id]');

for (const [pageName, stepName] of Object.entries(pageSteps)) {
  const pagePath = path.join(evaluationDir, pageName, 'page.tsx');

  if (fs.existsSync(pagePath)) {
    try {
      updatePageFile(pagePath, stepName);
    } catch (error) {
      console.error(`Error updating ${pagePath}:`, error.message);
    }
  } else {
    console.log(`⚠ Page not found: ${pagePath}`);
  }
}

console.log('\n✅ All pages updated!');
