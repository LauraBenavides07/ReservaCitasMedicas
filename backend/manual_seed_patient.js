const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const db = new sqlite3.Database('database.sqlite');

async function seed() {
  const password = await bcrypt.hash('password123', 10);
  
  db.serialize(() => {
    db.run("INSERT INTO patients (document, firstName, lastName, phone, gender, email, password) VALUES (?, ?, ?, ?, ?, ?, ?)", 
      ['12345', 'Juan', 'Paciente', '3000000', 'Hombre', 'juan@test.com', password], function(err) {
      if (err) {
        console.error('Error inserting patient:', err.message);
      } else {
        console.log('Patient Juan inserted with ID:', this.lastID);
      }
    });
  });
  
  db.close();
}

seed();
