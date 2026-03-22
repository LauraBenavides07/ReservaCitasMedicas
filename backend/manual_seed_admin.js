const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const db = new sqlite3.Database('database.sqlite');

async function seed() {
  try {
    const adminPassword = await bcrypt.hash('admin123', 10);
    const staffPassword = await bcrypt.hash('staff123', 10);
    
    db.serialize(() => {
      // Limpiar tabla users primero
      db.run("DELETE FROM users", (err) => {
        if (err) console.error('Error deleting users:', err.message);
      });

      db.run("INSERT INTO users (email, password, firstName, lastName, role) VALUES (?, ?, ?, ?, ?)", 
        ['admin@piedrazul.com', adminPassword, 'Super', 'Admin', 'admin'], function(err) {
        if (err) console.error('Error inserting admin:', err.message);
        else console.log('Admin user inserted with ID:', this.lastID);
      });

      db.run("INSERT INTO users (email, password, firstName, lastName, role) VALUES (?, ?, ?, ?, ?)", 
        ['staff@piedrazul.com', staffPassword, 'Ana', 'Agendadora', 'staff'], function(err) {
        if (err) console.error('Error inserting staff:', err.message);
        else console.log('Staff user inserted with ID:', this.lastID);
      });
    });
  } catch (err) {
    console.error('Seed script error:', err);
  } finally {
    setTimeout(() => db.close(), 1000);
  }
}

seed();
