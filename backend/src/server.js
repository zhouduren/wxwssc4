const app = require('./app');
const pool = require('./config/db');

const port = Number(process.env.PORT || 3000);

async function bootstrap() {
  await pool.query('SELECT 1');
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

bootstrap().catch((error) => {
  console.error('Server start failed:', error.message);
  process.exit(1);
});
