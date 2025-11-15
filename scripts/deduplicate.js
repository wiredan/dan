const fs = require('fs');
const path = require('path');

// Example: remove duplicate function definitions in authStore.ts
const filePath = path.join(__dirname, '../src/lib/authStore.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Simple regex-based cleanup (example for duplicate logoutUser)
content = content.replace(/export function logoutUser[\s\S]*?}\n/g, '');

// Write back cleaned file
fs.writeFileSync(filePath, content, 'utf8');

console.log('Duplicates removed from authStore.ts');
