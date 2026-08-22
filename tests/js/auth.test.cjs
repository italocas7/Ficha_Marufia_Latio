const assert = require("node:assert/strict");
const test = require("node:test");

const authTools = require("../../src/online/auth.js");

function fakeClient(options = {}) {
  const calls = { signUp: [], signIn: [], signOut: 0, profiles: 0, listener: null };
  const session = options.session ?? null;
  const profile = options.profile ?? null;
  const subscription = { unsubscribe() {} };
  const client = {
    auth: {
      async getSession() {
        return { data: { session }, error: options.restoreError ?? null };
      },
      async signUp(payload) {
        calls.signUp.push(payload);
        if (options.signUpError) return { data: {}, error: options.signUpError };
        return {
          data: options.signUpData ?? { user: { id: "user-1", email: payload.email }, session: null },
          error: null,
        };
      },
      async signInWithPassword(payload) {
        calls.signIn.push(payload);
        return { data: { session: options.signInSession ?? session }, error: options.signInError ?? null };
      },
      async signOut() {
        calls.signOut += 1;
        return { error: options.signOutError ?? null };
      },
      onAuthStateChange(listener) {
        calls.listener = listener;
        return { data: { subscription } };
      },
    },
    from(table) {
      assert.equal(table, "profiles");
      calls.profiles += 1;
      return {
        select(columns) {
          assert.equal(columns, authTools.PROFILE_COLUMNS);
          return this;
        },
        eq(column, value) {
          assert.equal(column, "id");
          assert.ok(value);
          return this;
        },
        async maybeSingle() {
          return { data: profile, error: options.profileError ?? null };
        },
      };
    },
  };
  return { client, calls, subscription };
}

const activeSession = {
  access_token: "public-test-session",
  user: {
    id: "user-1",
    email: "jogador@example.com",
    user_metadata: { display_name: "Jogador" },
  },
};

test("validates and normalizes account input locally", () => {
  assert.deepEqual(
    authTools.validateAuthInput({ email: "  Jogador@Example.com ", password: "senha-segura", displayName: "  Arthur  " }, "signup"),
    { email: "jogador@example.com", password: "senha-segura", displayName: "Arthur" },
  );
  assert.throws(() => authTools.validateAuthInput({ email: "invalido", password: "senha-segura" }), /email válido/);
  assert.throws(() => authTools.validateAuthInput({ email: "a@b.com", password: "curta" }), /8 caracteres/);
  assert.throws(() => authTools.validateAuthInput({ email: "a@b.com", password: "senha-segura" }, "signup"), /nome/);
});

test("signs up with display metadata and reports required email confirmation", async () => {
  const { client, calls } = fakeClient();
  const service = authTools.createAuthService(client);
  const result = await service.signUp({
    email: "jogador@example.com",
    password: "senha-segura",
    displayName: "Arthur",
  });
  assert.equal(result.pendingConfirmation, true);
  assert.equal(result.email, "jogador@example.com");
  assert.deepEqual(calls.signUp[0], {
    email: "jogador@example.com",
    password: "senha-segura",
    options: { data: { display_name: "Arthur" } },
  });
});

test("signs in and restores the own database profile", async () => {
  const profile = { id: "user-1", display_name: "Arthur Latio", avatar_url: null };
  const { client, calls } = fakeClient({ session: activeSession, signInSession: activeSession, profile });
  const service = authTools.createAuthService(client);

  const restored = await service.restore();
  assert.equal(restored.session, activeSession);
  assert.equal(restored.profile, profile);

  const signedIn = await service.signIn({ email: "jogador@example.com", password: "senha-segura" });
  assert.equal(signedIn.profile.display_name, "Arthur Latio");
  assert.deepEqual(calls.signIn[0], { email: "jogador@example.com", password: "senha-segura" });
  assert.equal(calls.profiles, 2);
});

test("keeps a recovered session usable when the profile request is offline", async () => {
  const { client } = fakeClient({ session: activeSession, profileError: new Error("Failed to fetch") });
  const restored = await authTools.createAuthService(client).restore();
  assert.equal(restored.session, activeSession);
  assert.equal(restored.profile.display_name, "Jogador");
  assert.match(restored.profileWarning, /ficha local continua disponível/);
});

test("logs out and follows authentication state changes", async () => {
  const { client, calls, subscription } = fakeClient({ profile: { id: "user-1", display_name: "Arthur" } });
  const service = authTools.createAuthService(client);
  const events = [];
  assert.equal(service.onChange((state, event) => events.push({ state, event })), subscription);
  calls.listener("SIGNED_IN", activeSession);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(events[0].event, "SIGNED_IN");
  assert.equal(events[0].state.profile.display_name, "Arthur");
  assert.equal((await service.signOut()).session, null);
  assert.equal(calls.signOut, 1);
});

test("translates server errors without exposing technical details", () => {
  assert.equal(authTools.friendlyAuthMessage(new Error("Invalid login credentials")), "Email ou senha incorretos.");
  assert.equal(authTools.friendlyAuthMessage(new Error("Email not confirmed")), "Confirme seu email antes de entrar.");
  assert.equal(authTools.friendlyAuthMessage(new Error("Failed to fetch token at internal endpoint")), "Não foi possível acessar o servidor. A ficha local continua disponível.");
});

test("renders accessible login and account states with escaped user content", () => {
  const loggedOut = authTools.authDialogHtml({ mode: "signup", email: '\"><img src=x>', busy: false });
  assert.match(loggedOut, /data-online-auth-form/);
  assert.match(loggedOut, /autocomplete="new-password"/);
  assert.doesNotMatch(loggedOut, /<img src=x>/);

  const loggedIn = authTools.authDialogHtml({
    session: activeSession,
    user: activeSession.user,
    profile: { display_name: "<script>não</script>" },
  });
  assert.match(loggedIn, /Sessão ativa/);
  assert.doesNotMatch(loggedIn, /<script>/);
});
