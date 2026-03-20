const db = require('./conexion');
db.query('SELECT resultado FROM ensayos LIMIT 1')
  .then(res => {
    console.log('Column "resultado" exists.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error checking column "resultado":', err.message);
    process.exit(1);
  });
