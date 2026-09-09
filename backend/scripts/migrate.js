const { migrate } = require('../services/migrations');
const { pool } = require('../db');
migrate().then(() => console.log('Database migrations applied.')).catch(error => {
  console.error('Migration failed:', error.message);
  process.exitCode = 1;
}).finally(() => pool.end());
