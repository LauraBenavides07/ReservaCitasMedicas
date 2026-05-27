const fs = require('fs');
const path = require('path');

const basePath = 'D:\\Universidad\\INGENIERIA DE SOFWARE III\\PROYECTO\\ReservaCitasMedicas\\frontend\\src\\app\\shared\\atoms';
const dirs = ['form-field', 'card', 'badge', 'alert'];

dirs.forEach(dir => {
  const fullPath = path.join(basePath, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`Created: ${fullPath}`);
  }
});

console.log('All directories created successfully');
