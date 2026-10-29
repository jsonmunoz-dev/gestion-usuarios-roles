const bcrypt = require('bcryptjs');
const { createPool } = require('./pool');

const DEMO_PASSWORD = 'Demo1234!';

const demoUsers = [
  { name: 'Ana Admin', email: 'admin@demo.cl', role: 'admin' },
  { name: 'Eduardo Editor', email: 'editor@demo.cl', role: 'editor' },
  { name: 'Valeria Viewer', email: 'viewer@demo.cl', role: 'viewer' },
];

async function seed(pool) {
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
  for (const user of demoUsers) {
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role_id)
       SELECT $1, $2, $3, id FROM roles WHERE name = $4
       ON CONFLICT (email) DO NOTHING`,
      [user.name, user.email, hash, user.role],
    );
  }
  console.log(`Usuarios demo listos (contraseña: ${DEMO_PASSWORD})`);
}

if (require.main === module) {
  require('dotenv').config();
  const pool = createPool(process.env.DATABASE_URL);
  seed(pool)
    .then(() => pool.end())
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { seed, DEMO_PASSWORD, DEMO_EMAILS: demoUsers.map((u) => u.email) };
