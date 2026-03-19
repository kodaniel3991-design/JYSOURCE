const sql = require('mssql');

const config = {
  user: 'sa',
  password: 'TestSa@123',
  server: '127.0.0.1',
  port: 1434,
  database: 'JYSource',
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

console.log('Connecting with config:', JSON.stringify({ ...config, password: '***' }, null, 2));

sql.connect(config)
  .then(pool => {
    console.log('Connected successfully!');
    return pool.request().query('SELECT 1 AS test');
  })
  .then(result => {
    console.log('Query result:', result.recordset);
    process.exit(0);
  })
  .catch(err => {
    console.error('Error code:', err.code);
    console.error('Error message:', err.message);
    process.exit(1);
  });
