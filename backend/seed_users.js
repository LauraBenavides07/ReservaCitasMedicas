const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.sqlite');

async function seed() {
  try {
    const hash = await bcrypt.hash('admin123', 10);
    db.run("INSERT INTO users (email, password, firstName, lastName, role) VALUES (?, ?, ?, ?, ?)", 
      ['admin@piedrazul.com', hash, 'Admin', 'Piedrazul', 'admin'], function(err) {
        if (err) console.error('Error inserting admin:', err.message);
        else console.log('Admin user created -> Email: admin@piedrazul.com | Pass: admin123');
    });

    const hash2 = await bcrypt.hash('agendador123', 10);
    db.run("INSERT INTO users (email, password, firstName, lastName, role) VALUES (?, ?, ?, ?, ?)", 
      ['agendador@piedrazul.com', hash2, 'Agendador', 'Piedrazul', 'staff'], function(err) {
        if (err) console.error('Error inserting agendador:', err.message);
        else console.log('Agendador (Staff) user created -> Email: agendador@piedrazul.com | Pass: agendador123');
        db.close();
    });
  } catch (e) {
    console.error(e);
  }
}
seed();
