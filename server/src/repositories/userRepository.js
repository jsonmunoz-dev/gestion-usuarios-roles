// Acceso a datos de usuarios. Todas las consultas son parametrizadas.
const BASE_SELECT = `
  SELECT u.id, u.name, u.email, u.password_hash, u.is_active, u.token_version,
         u.created_at, r.name AS role
  FROM users u
  JOIN roles r ON r.id = u.role_id
`;

function toUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role,
    isActive: row.is_active,
    tokenVersion: row.token_version,
    createdAt: row.created_at,
  };
}

function createUserRepository(pool) {
  return {
    async findByEmail(email) {
      const { rows } = await pool.query(`${BASE_SELECT} WHERE u.email = $1`, [email]);
      return toUser(rows[0]);
    },

    async findById(id) {
      const { rows } = await pool.query(`${BASE_SELECT} WHERE u.id = $1`, [id]);
      return toUser(rows[0]);
    },

    async list({ limit = 20, offset = 0 } = {}) {
      const { rows } = await pool.query(`${BASE_SELECT} ORDER BY u.id LIMIT $1 OFFSET $2`, [
        limit,
        offset,
      ]);
      const count = await pool.query('SELECT COUNT(*)::int AS total FROM users');
      return { items: rows.map(toUser), total: count.rows[0].total };
    },

    async create({ name, email, passwordHash, role }) {
      const { rows } = await pool.query(
        `INSERT INTO users (name, email, password_hash, role_id)
         SELECT $1, $2, $3, id FROM roles WHERE name = $4
         RETURNING id`,
        [name, email, passwordHash, role],
      );
      return this.findById(rows[0].id);
    },

    async update(id, { name, role, isActive }) {
      const { rowCount } = await pool.query(
        `UPDATE users SET
           name      = COALESCE($2, name),
           role_id   = COALESCE((SELECT id FROM roles WHERE name = $3), role_id),
           is_active = COALESCE($4, is_active),
           updated_at = NOW()
         WHERE id = $1`,
        [id, name ?? null, role ?? null, isActive ?? null],
      );
      return rowCount ? this.findById(id) : null;
    },

    async remove(id) {
      const { rowCount } = await pool.query('DELETE FROM users WHERE id = $1', [id]);
      return rowCount > 0;
    },

    async incrementTokenVersion(id) {
      await pool.query('UPDATE users SET token_version = token_version + 1 WHERE id = $1', [id]);
    },
  };
}

module.exports = { createUserRepository };
