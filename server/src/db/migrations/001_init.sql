-- Roles disponibles en el sistema. Se modelan como tabla (y no como ENUM)
-- para poder agregar roles nuevos sin alterar el tipo.
CREATE TABLE IF NOT EXISTS roles (
  id          SMALLSERIAL PRIMARY KEY,
  name        VARCHAR(30) NOT NULL UNIQUE,
  description TEXT        NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT         NOT NULL,
  role_id       SMALLINT     NOT NULL REFERENCES roles (id),
  is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
  -- Se incrementa al cerrar sesión o cambiar la contraseña para invalidar
  -- todos los refresh tokens emitidos antes.
  token_version INTEGER      NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_role_id ON users (role_id);

INSERT INTO roles (name, description) VALUES
  ('admin',  'Administra usuarios y roles'),
  ('editor', 'Puede ver el listado de usuarios'),
  ('viewer', 'Solo accede a su propio perfil')
ON CONFLICT (name) DO NOTHING;
