const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.sqlite');

db.serialize(() => {
  // First, check if the table exists and columns are correct
  db.all("SELECT name FROM sqlite_master WHERE type='table';", (err, tables) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log('Tables:', tables);
  });

  // Simple insert for a doctor
  // Using the table name 'doctors' from @Entity('doctors') in doctor.entity.ts
  db.run("INSERT INTO doctors (name, specialty, startTime, endTime, appointmentDuration) VALUES (?, ?, ?, ?, ?)", 
    ['Dr. Gregory House', 'Diagnóstico', '08:00', '18:00', 30], function(err) {
    if (err) {
      console.error('Error inserting doctor:', err.message);
    } else {
      console.log('Doctor inserted with ID:', this.lastID);
    }
  });
});

db.close();
