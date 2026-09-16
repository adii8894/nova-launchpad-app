import Database from "better-sqlite3";
import path from "path";
import crypto from "crypto";
import type { Adapter, AdapterUser, AdapterSession, VerificationToken } from "next-auth/adapters";

const db = new Database(path.join(process.cwd(), "auth.db"));
db.pragma("journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE,
  emailVerified TEXT,
  image TEXT
);
CREATE TABLE IF NOT EXISTS sessions (
  sessionToken TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  expires TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  type TEXT,
  provider TEXT,
  providerAccountId TEXT,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INTEGER,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT
);
CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier TEXT NOT NULL,
  token TEXT NOT NULL,
  expires TEXT NOT NULL,
  PRIMARY KEY (identifier, token)
);
`);

function uid() {
  return crypto.randomUUID();
}

export function SqliteAdapter(): Adapter {
  return {
    async createUser(user) {
      const id = uid();
      db.prepare(`INSERT INTO users (id, name, email, emailVerified, image) VALUES (?, ?, ?, ?, ?)`).run(
        id, user.name ?? null, user.email, user.emailVerified?.toISOString() ?? null, user.image ?? null
      );
      return { ...user, id } as AdapterUser;
    },
    async getUser(id) {
      const row: any = db.prepare(`SELECT * FROM users WHERE id = ?`).get(id);
      if (!row) return null;
      return { ...row, emailVerified: row.emailVerified ? new Date(row.emailVerified) : null } as AdapterUser;
    },
    async getUserByEmail(email) {
      const row: any = db.prepare(`SELECT * FROM users WHERE email = ?`).get(email);
      if (!row) return null;
      return { ...row, emailVerified: row.emailVerified ? new Date(row.emailVerified) : null } as AdapterUser;
    },
    async getUserByAccount({ provider, providerAccountId }) {
      const row: any = db
        .prepare(`SELECT users.* FROM users JOIN accounts ON users.id = accounts.userId WHERE accounts.provider = ? AND accounts.providerAccountId = ?`)
        .get(provider, providerAccountId);
      if (!row) return null;
      return { ...row, emailVerified: row.emailVerified ? new Date(row.emailVerified) : null } as AdapterUser;
    },
    async updateUser(user) {
      db.prepare(`UPDATE users SET name = ?, email = ?, emailVerified = ?, image = ? WHERE id = ?`).run(
        user.name ?? null, user.email, user.emailVerified?.toISOString() ?? null, user.image ?? null, user.id
      );
      return user as AdapterUser;
    },
    async deleteUser(userId) {
      db.prepare(`DELETE FROM users WHERE id = ?`).run(userId);
    },
    async linkAccount(account) {
      db.prepare(
        `INSERT INTO accounts (id, userId, type, provider, providerAccountId, refresh_token, access_token, expires_at, token_type, scope, id_token, session_state)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        uid(), account.userId, account.type, account.provider, account.providerAccountId,
        account.refresh_token ?? null, account.access_token ?? null, account.expires_at ?? null,
        account.token_type ?? null, account.scope ?? null, account.id_token ?? null, account.session_state ?? null
      );
    },
    async unlinkAccount({ provider, providerAccountId }) {
      db.prepare(`DELETE FROM accounts WHERE provider = ? AND providerAccountId = ?`).run(provider, providerAccountId);
    },
    async createSession(session) {
      db.prepare(`INSERT INTO sessions (sessionToken, userId, expires) VALUES (?, ?, ?)`).run(
        session.sessionToken, session.userId, session.expires.toISOString()
      );
      return session as AdapterSession;
    },
    async getSessionAndUser(sessionToken) {
      const session: any = db.prepare(`SELECT * FROM sessions WHERE sessionToken = ?`).get(sessionToken);
      if (!session) return null;
      const user: any = db.prepare(`SELECT * FROM users WHERE id = ?`).get(session.userId);
      if (!user) return null;
      return {
        session: { ...session, expires: new Date(session.expires) } as AdapterSession,
        user: { ...user, emailVerified: user.emailVerified ? new Date(user.emailVerified) : null } as AdapterUser,
      };
    },
    async updateSession(session) {
      db.prepare(`UPDATE sessions SET expires = ? WHERE sessionToken = ?`).run(
        session.expires?.toISOString(), session.sessionToken
      );
      const row: any = db.prepare(`SELECT * FROM sessions WHERE sessionToken = ?`).get(session.sessionToken);
      return row ? { ...row, expires: new Date(row.expires) } : null;
    },
    async deleteSession(sessionToken) {
      db.prepare(`DELETE FROM sessions WHERE sessionToken = ?`).run(sessionToken);
    },
    async createVerificationToken(token) {
      db.prepare(`INSERT INTO verification_tokens (identifier, token, expires) VALUES (?, ?, ?)`).run(
        token.identifier, token.token, token.expires.toISOString()
      );
      return token as VerificationToken;
    },
    async useVerificationToken({ identifier, token }) {
      const row: any = db.prepare(`SELECT * FROM verification_tokens WHERE identifier = ? AND token = ?`).get(identifier, token);
      if (!row) return null;
      db.prepare(`DELETE FROM verification_tokens WHERE identifier = ? AND token = ?`).run(identifier, token);
      return { ...row, expires: new Date(row.expires) };
    },
  };
}
