const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.sqlite');

db.run("UPDATE users SET role = 'admin' WHERE email = 'admin@piedrazul.com'", function(err) {
  if (err) {
    console.error('Update error:', err.message);
  } else {
    console.log('Update successful, rows updated:', this.changes);
  }
  db.close();
});
