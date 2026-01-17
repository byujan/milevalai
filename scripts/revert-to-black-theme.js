const fs = require('fs');
const path = require('path');

// Reverse color theme replacements - back to black theme
const colorReplacements = [
  // Background colors
  { from: /(?<![\w-])bg-white(?![\w-])/g, to: 'bg-black' },
  { from: /bg-white shadow-sm/g, to: 'bg-white/5' },
  { from: /bg-gray-50(?![\w-])/g, to: 'bg-white/10' },

  // Border colors
  { from: /border-gray-200(?![\w-])/g, to: 'border-white/10' },
  { from: /border-gray-300(?![\w-])/g, to: 'border-white/20' },

  // Text colors
  { from: /text-gray-900(?![\w-])/g, to: 'text-white' },
  { from: /text-gray-600(?![\w-])/g, to: 'text-gray-400' },
  { from: /text-gray-700(?![\w-])/g, to: 'text-gray-300' },

  // Hover states
  { from: /hover:text-gray-900(?![\w-])/g, to: 'hover:text-white' },
  { from: /hover:bg-gray-100(?![\w-])/g, to: 'hover:bg-white/10' },
  { from: /hover:border-gray-300(?![\w-])/g, to: 'hover:border-white/20' },
  { from: /hover:bg-gray-200(?![\w-])/g, to: 'hover:bg-white/10' },

  // Blue shades
  { from: /text-blue-600(?![\w-])/g, to: 'text-blue-400' },
  { from: /bg-blue-50(?![\w-])/g, to: 'bg-blue-500/10' },
  { from: /border-blue-200(?![\w-])/g, to: 'border-blue-500/20' },
  { from: /text-blue-700(?![\w-])/g, to: 'text-blue-400' },
];

const filesToUpdate = [
  // Evaluation pages
  'app/evaluation/[id]/predecessor/page.tsx',
  'app/evaluation/[id]/admin/page.tsx',
  'app/evaluation/[id]/draft/page.tsx',
  'app/evaluation/[id]/bullets/page.tsx',
  'app/evaluation/[id]/categorize/page.tsx',
  'app/evaluation/[id]/narrative/page.tsx',
  'app/evaluation/[id]/rater/page.tsx',
  'app/evaluation/[id]/senior-rater/page.tsx',
  'app/evaluation/[id]/review/page.tsx',
  'app/evaluation/[id]/export/page.tsx',

  // Other pages
  'app/dashboard/page.tsx',
  'app/evaluation/create/page.tsx',
];

const rootDir = path.join(__dirname, '..');

filesToUpdate.forEach(relativePath => {
  const filePath = path.join(rootDir, relativePath);

  if (!fs.existsSync(filePath)) {
    console.log(`⚠ Skipping ${relativePath} - not found`);
    return;
  }

  console.log(`Reverting ${relativePath}...`);
  let content = fs.readFileSync(filePath, 'utf8');

  colorReplacements.forEach(replacement => {
    content = content.replace(replacement.from, replacement.to);
  });

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✓ Reverted ${relativePath}`);
});

console.log('\n✅ All pages reverted to black theme!');
