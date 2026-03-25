const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.sqlite');

const doctors = [
  {
    name: 'Dr. Carlos Méndez',
    specialty: 'Terapia Neural',
    startTime: '08:00',
    endTime: '17:00',
    appointmentDuration: 30,
    workingDays: '1,2,3,4,5',
    breakStart: '12:00',
    breakEnd: '13:00'
  },
  {
    name: 'Dra. Laura Rivas',
    specialty: 'Quiropráctica',
    startTime: '08:00',
    endTime: '18:00',
    appointmentDuration: 40,
    workingDays: '1,2,3,4,5',
    breakStart: '12:00',
    breakEnd: '13:00'
  },
  {
    name: 'Dr. Andrés Castillo',
    specialty: 'Fisioterapia',
    startTime: '07:00',
    endTime: '16:00',
    appointmentDuration: 30,
    workingDays: '1,2,3,4,5,6',
    breakStart: '12:00',
    breakEnd: '13:00'
  },
  {
    name: 'Dr. Gregory House',
    specialty: 'Diagnóstico',
    startTime: '09:00',
    endTime: '18:00',
    appointmentDuration: 45,
    workingDays: '2,3,4',
    breakStart: '13:00',
    breakEnd: '14:00'
  }
];

db.serialize(() => {
  // Limpiar doctores existentes
  db.run("DELETE FROM doctors", (err) => {
    if (err) console.error('Error deleting doctors:', err.message);
    else console.log('Doctores eliminados');
  });

  // Insertar todos los doctores
  doctors.forEach((doctor, index) => {
    db.run(`INSERT INTO doctors 
      (name, specialty, startTime, endTime, appointmentDuration, workingDays, breakStart, breakEnd) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        doctor.name,
        doctor.specialty,
        doctor.startTime,
        doctor.endTime,
        doctor.appointmentDuration,
        doctor.workingDays,
        doctor.breakStart,
        doctor.breakEnd
      ],
      function(err) {
        if (err) console.error(`Error inserting ${doctor.name}:`, err.message);
        else console.log(`${doctor.name} insertado con ID: ${this.lastID}`);
      }
    );
  });
});

db.close();