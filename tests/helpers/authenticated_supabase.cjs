"use strict";

const { createHash } = require("node:crypto");

function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function passwordHash(email, password) {
  return createHash("sha256").update(`marufia-mvp\0${email}\0${password}`).digest("hex");
}

function userIdFor(serial) {
  return `cccccccc-cccc-4ccc-8ccc-${String(serial).padStart(12, "0")}`;
}

class ProfileQuery {
  constructor(provider) {
    this.provider = provider;
    this.id = "";
  }

  select() {
    return this;
  }

  eq(column, value) {
    if (column === "id") this.id = String(value ?? "").toLowerCase();
    return this;
  }

  async maybeSingle() {
    return { data: clone(this.provider.profile(this.id)), error: null };
  }
}

class TestIdentityProvider {
  constructor(server, seed = {}) {
    this.server = server;
    this.accounts = clone(Array.isArray(seed.accounts) ? seed.accounts : []);
    this.profiles = clone(Array.isArray(seed.profiles) ? seed.profiles : []);
    this.serial = Math.max(Number(seed.serial) || 0, this.accounts.length);
  }

  profile(id) {
    return this.profiles.find((profile) => profile.id === id) ?? null;
  }

  session(account) {
    return {
      access_token: `local-mvp-session-${account.id}`,
      user: {
        id: account.id,
        email: account.email,
        user_metadata: { display_name: account.display_name },
      },
    };
  }

  createClient() {
    let activeSession = null;
    const listeners = new Set();
    const provider = this;

    function emit(event) {
      for (const listener of listeners) queueMicrotask(() => listener(event, clone(activeSession)));
    }

    function activeDatabaseClient() {
      const userId = activeSession?.user?.id;
      if (!userId) throw new Error("not authenticated");
      return provider.server.clientFor(userId);
    }

    return Object.freeze({
      auth: Object.freeze({
        async getSession() {
          return { data: { session: clone(activeSession) }, error: null };
        },
        async signUp(payload = {}) {
          const email = String(payload.email ?? "").trim().toLowerCase();
          if (provider.accounts.some((account) => account.email === email)) {
            return { data: {}, error: { message: "User already registered" } };
          }
          const displayName = String(payload.options?.data?.display_name ?? "").trim();
          const id = userIdFor(++provider.serial);
          const account = {
            id,
            email,
            display_name: displayName,
            password_hash: passwordHash(email, String(payload.password ?? "")),
          };
          const createdAt = new Date(Date.parse("2026-08-21T11:00:00.000Z") + provider.serial * 1_000).toISOString();
          provider.accounts.push(account);
          provider.profiles.push({
            id,
            display_name: displayName,
            avatar_url: null,
            created_at: createdAt,
            updated_at: createdAt,
          });
          activeSession = provider.session(account);
          emit("SIGNED_IN");
          return { data: { user: clone(activeSession.user), session: clone(activeSession) }, error: null };
        },
        async signInWithPassword(payload = {}) {
          const email = String(payload.email ?? "").trim().toLowerCase();
          const account = provider.accounts.find((item) => item.email === email);
          if (!account || account.password_hash !== passwordHash(email, String(payload.password ?? ""))) {
            return { data: {}, error: { message: "Invalid login credentials" } };
          }
          activeSession = provider.session(account);
          emit("SIGNED_IN");
          return { data: { session: clone(activeSession) }, error: null };
        },
        async signOut() {
          activeSession = null;
          emit("SIGNED_OUT");
          return { error: null };
        },
        onAuthStateChange(listener) {
          listeners.add(listener);
          return {
            data: {
              subscription: Object.freeze({ unsubscribe: () => listeners.delete(listener) }),
            },
          };
        },
      }),
      from(table) {
        return table === "profiles" ? new ProfileQuery(provider) : activeDatabaseClient().from(table);
      },
      rpc(name, args) {
        return activeDatabaseClient().rpc(name, args);
      },
      channel(name) {
        return activeDatabaseClient().channel(name);
      },
      removeChannel(channel) {
        return provider.server.clientFor(channel.userId).removeChannel(channel);
      },
    });
  }

  snapshot() {
    return clone({ accounts: this.accounts, profiles: this.profiles, serial: this.serial });
  }
}

function createAuthenticatedSupabase(server, seed) {
  return new TestIdentityProvider(server, seed);
}

module.exports = Object.freeze({ createAuthenticatedSupabase });
