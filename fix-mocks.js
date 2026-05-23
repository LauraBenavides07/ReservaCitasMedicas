const fs = require('fs');
const path = require('path');
function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.spec.ts')) results.push(file);
    }
  });
  return results;
}
const files = walk('frontend/src');
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  if (content.includes("vi.mock('sweetalert2'")) {
    content = content.replace(/default:\s*\{\s*fire:[\s\S]*?\}(?=\s*\}|\s*,)/g, (match) => {
       if(match.includes('close: vi.fn()')) return match;
       return match + ", close: vi.fn(), showLoading: vi.fn()";
    });
    fs.writeFileSync(f, content);
  }
});
console.log('Fixed SweetAlert2 mocks');
