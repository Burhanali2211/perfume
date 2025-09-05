#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Common unused imports to remove
const UNUSED_IMPORTS = [
  // Lucide React icons that are commonly unused
  'Star', 'Smartphone', 'Gift', 'Heart', 'ShoppingCart', 'CheckCircle', 
  'Filter', 'Calendar', 'Download', 'RefreshCw', 'CheckSquare', 'Square',
  'Eye', 'Copy', 'Archive', 'SortAsc', 'SortDesc', 'DollarSign', 'Users',
  'BarChart3', 'TrendingUp', 'TrendingDown', 'PieChart', 'LineChart',
  'Clock', 'Database', 'CreditCard', 'Image', 'ToggleLeft', 'ToggleRight',
  'Trash2', 'MapPin', 'Truck', 'MoreVertical', 'Mail', 'Phone', 'Upload',
  'Plus', 'Edit', 'ChevronRight', 'MoreHorizontal', 'ArrowUpDown',
  'MessageSquare', 'Settings', 'Percent', 'Tag', 'Zap', 'AlertCircle',
  'Bell', 'Key', 'FileText', 'Lock', 'Unlock', 'Server', 'Activity',
  'TrendingDown', 'Globe', 'Shield', 'Package', 'LayoutDashboard',
  
  // Framer Motion
  'motion', 'AnimatePresence',
  
  // React hooks that might be unused
  'useEffect', 'useState', 'useMemo', 'useCallback'
];

function cleanupFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let updatedContent = content;
    let hasChanges = false;

    // Remove unused imports from lucide-react
    const lucideImportRegex = /import\s*{\s*([^}]+)\s*}\s*from\s*['"]lucide-react['"];?/g;
    updatedContent = updatedContent.replace(lucideImportRegex, (match, imports) => {
      const importList = imports.split(',').map(imp => imp.trim());
      const usedImports = importList.filter(imp => {
        const cleanImp = imp.trim();
        // Check if the import is actually used in the file
        const usageRegex = new RegExp(`\\b${cleanImp}\\b`, 'g');
        const matches = content.match(usageRegex) || [];
        // If it appears more than once (once in import, once+ in usage), keep it
        return matches.length > 1;
      });
      
      if (usedImports.length !== importList.length) {
        hasChanges = true;
        if (usedImports.length === 0) {
          return ''; // Remove entire import if no icons are used
        }
        return `import { ${usedImports.join(', ')} } from 'lucide-react';`;
      }
      return match;
    });

    // Remove unused framer-motion imports
    const framerImportRegex = /import\s*{\s*([^}]+)\s*}\s*from\s*['"]framer-motion['"];?/g;
    updatedContent = updatedContent.replace(framerImportRegex, (match, imports) => {
      const importList = imports.split(',').map(imp => imp.trim());
      const usedImports = importList.filter(imp => {
        const cleanImp = imp.trim();
        const usageRegex = new RegExp(`\\b${cleanImp}\\b`, 'g');
        const matches = content.match(usageRegex) || [];
        return matches.length > 1;
      });
      
      if (usedImports.length !== importList.length) {
        hasChanges = true;
        if (usedImports.length === 0) {
          return '';
        }
        return `import { ${usedImports.join(', ')} } from 'framer-motion';`;
      }
      return match;
    });

    // Clean up empty lines left by removed imports
    updatedContent = updatedContent.replace(/\n\s*\n\s*\n/g, '\n\n');

    if (hasChanges) {
      fs.writeFileSync(filePath, updatedContent);
      console.log(`✅ Cleaned up: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function processDirectory(dirPath) {
  let totalCleaned = 0;
  
  function walkDir(currentPath) {
    const items = fs.readdirSync(currentPath);
    
    for (const item of items) {
      const fullPath = path.join(currentPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        walkDir(fullPath);
      } else if (stat.isFile() && (item.endsWith('.tsx') || item.endsWith('.ts'))) {
        if (cleanupFile(fullPath)) {
          totalCleaned++;
        }
      }
    }
  }
  
  walkDir(dirPath);
  return totalCleaned;
}

// Main execution
const srcPath = path.join(process.cwd(), 'src');
console.log('🧹 Starting cleanup of unused imports...');
const cleaned = processDirectory(srcPath);
console.log(`\n✨ Cleanup complete! Processed ${cleaned} files.`);
