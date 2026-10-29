// Requiere PostgreSQL. En CI se levanta como servicio de GitHub Actions.
const { createPool } = require('../../src/db/pool');
const { migrate } = require('../../src/db/migrate');
const { seed } = require('../../src/db/seed');
const { createUserRepository } = require('../../src/repositories/userRepository');

const pool = createPool(process.env.DATABASE_URL);
const repo = createUserRepository(pool);

beforeAll(async () => {
  await pool.query('DROP TABLE IF EXISTS users, roles, schema_migrations CASCADE');
  await migrate(pool);
  await seed(pool);
});

afterAll(() => pool.end());

describe('userRepository (PostgreSQL)', () => {
  it('las migraciones son idempotentes', async () => {
    await expect(migrate(pool)).resolves.toBeUndefined();
    const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM roles');
    expect(rows[0].n).toBe(3);
  });

  it('encuentra usuarios sembrados con su rol', async () => {
    const admin = await repo.findByEmail('admin@demo.cl');
    expect(admin).toMatchObject({ role: 'admin', isActive: true, tokenVersion: 0 });
  });

  it('crea, actualiza, lista y elimina', async () => {
    const created = await repo.create({
      name: 'Test',
      email: 'test@demo.cl',
      passwordHash: 'hash',
      role: 'viewer',
    });
    expect(created.role).toBe('viewer');

    const updated = await repo.update(created.id, { role: 'editor', name: 'Test 2' });
    expect(updated).toMatchObject({ role: 'editor', name: 'Test 2' });

    const page = await repo.list({ limit: 2, offset: 0 });
    expect(page.items).toHaveLength(2);
    expect(page.total).toBe(4);

    expect(await repo.remove(created.id)).toBe(true);
    expect(await repo.findById(created.id)).toBeNull();
  });

  it('respeta la restricción de email único', async () => {
    await expect(
      repo.create({ name: 'Dup', email: 'admin@demo.cl', passwordHash: 'x', role: 'viewer' }),
    ).rejects.toThrow(/duplicate key/);
  });

  it('incrementa token_version', async () => {
    const editor = await repo.findByEmail('editor@demo.cl');
    await repo.incrementTokenVersion(editor.id);
    expect((await repo.findById(editor.id)).tokenVersion).toBe(editor.tokenVersion + 1);
  });
});
