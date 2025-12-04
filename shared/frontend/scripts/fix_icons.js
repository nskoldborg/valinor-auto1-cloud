const fs = require('fs');
const path = require('path');

function fixIconsInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Replace icon={<FaIcon />} with icon={FaIcon}
  const newContent = content.replace(/icon=\{<([A-Z][a-zA-Z0-9]*)\s*\/>\}/g, (match, iconName) => {
    modified = true;
    return `icon={${iconName}}`;
  });

  if (modified) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`✅ Fixed: ${filePath}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    // Recurse into directories, skipping node_modules
    if (stat.isDirectory() && !filePath.includes('node_modules')) {
      walkDir(filePath);
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      fixIconsInFile(filePath);
    }
  });
}

console.log('🔧 Fixing icon props...');
// CRITICAL FIX: The execution context is shared/frontend, so the target source is just ./src
walkDir('./src'); 
console.log('✨ Done!');