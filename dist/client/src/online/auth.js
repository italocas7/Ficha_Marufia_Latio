(function initMarufiaAuth(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.MARUFIA_AUTH = api;
  if (root?.document) Promise.resolve().then(() => api.init(root.document, root.MARUFIA_SUPABASE, root.MARUFIA_ONLINE_CONFIG));
})(typeof window !== "undefined" ? window : globalThis, function createMarufiaAuthApi() {
  "use strict";

  const PROFILE_COLUMNS = "id,display_name,avatar_url,created_at,updated_at";

  function authError(code, message) {
    const error = new Error(message);
    error.code = code;
    error.userMessage = message;
    return error;
  }

  function cleanText(value, maxLength) {
    return String(value ?? "").trim().slice(0, maxLength);
  }

  function validateAuthInput(input = {}, mode = "login") {
    const email = cleanText(input.email, 320).toLowerCase();
    const password = String(input.password ?? "");
    const displayName = cleanText(input.displayName, 80);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw authError("LAT-AUTH-INPUT-001", "Informe um email válido.");
    }
    if (password.length < 8) {
      throw authError("LAT-AUTH-INPUT-002", "A senha precisa ter pelo menos 8 caracteres.");
    }
    if (mode === "signup" && !displayName) {
      throw authError("LAT-AUTH-INPUT-003", "Informe o nome que será exibido na sua conta.");
    }
    return Object.freeze({ email, password, displayName });
  }

  function validateConfirmationEmail(value) {
    const email = cleanText(value, 320).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw authError("LAT-AUTH-INPUT-004", "Informe um email válido para reenviar a confirmação.");
    }
    return email;
  }

  function friendlyAuthMessage(error) {
    if (error?.userMessage) return error.userMessage;
    const detail = `${error?.code ?? ""} ${error?.message ?? ""}`.toLowerCase();
    if (detail.includes("invalid login credentials")) return "Email ou senha incorretos.";
    if (detail.includes("email not confirmed")) return "Confirme seu email antes de entrar.";
    if (detail.includes("user already registered") || detail.includes("already been registered")) {
      return "Já existe uma conta com este email.";
    }
    if (detail.includes("password") && (detail.includes("short") || detail.includes("least"))) {
      return "A senha não atende aos requisitos mínimos de segurança.";
    }
    if (detail.includes("rate limit") || detail.includes("too many requests")) {
      return "Muitas tentativas foram feitas. Aguarde um pouco e tente novamente.";
    }
    if (detail.includes("fetch") || detail.includes("network") || detail.includes("offline")) {
      return "Não foi possível acessar o servidor. A ficha local continua disponível.";
    }
    return "Não foi possível concluir o acesso à conta. Tente novamente.";
  }

  function fallbackProfile(user) {
    const metadata = user?.user_metadata ?? {};
    return {
      id: user?.id ?? "",
      display_name: cleanText(metadata.display_name || metadata.full_name, 80) || null,
      avatar_url: cleanText(metadata.avatar_url, 2048) || null,
    };
  }

  function createAuthService(client, options = {}) {
    if (!client?.auth) throw authError("LAT-AUTH-CLIENT-001", "O serviço de conta não está disponível.");
    const emailRedirectTo = String(options.emailRedirectTo ?? options.siteUrl ?? "").trim();
    if (emailRedirectTo && !/^https:\/\//i.test(emailRedirectTo)) {
      throw authError("LAT-AUTH-CLIENT-002", "O endereço de confirmação da conta é inválido.");
    }

    async function snapshot(session) {
      if (!session?.user) return { session: null, user: null, profile: null, profileWarning: "" };
      let profile = null;
      let profileWarning = "";
      try {
        const result = await client
          .from("profiles")
          .select(PROFILE_COLUMNS)
          .eq("id", session.user.id)
          .maybeSingle();
        if (result.error) throw result.error;
        profile = result.data;
      } catch (error) {
        profileWarning = friendlyAuthMessage(error);
      }
      return {
        session,
        user: session.user,
        profile: profile ?? fallbackProfile(session.user),
        profileWarning,
      };
    }

    async function restore() {
      const result = await client.auth.getSession();
      if (result.error) throw authError("LAT-AUTH-SESSION-001", friendlyAuthMessage(result.error));
      return snapshot(result.data?.session ?? null);
    }

    async function signUp(input) {
      const credentials = validateAuthInput(input, "signup");
      const signUpOptions = { data: { display_name: credentials.displayName } };
      if (emailRedirectTo) signUpOptions.emailRedirectTo = emailRedirectTo;
      const result = await client.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: signUpOptions,
      });
      if (result.error) throw authError("LAT-AUTH-SIGNUP-001", friendlyAuthMessage(result.error));
      if (!result.data?.session) {
        return {
          session: null,
          user: result.data?.user ?? null,
          profile: null,
          profileWarning: "",
          pendingConfirmation: Boolean(result.data?.user),
          email: credentials.email,
        };
      }
      return { ...(await snapshot(result.data.session)), pendingConfirmation: false, email: credentials.email };
    }

    async function signIn(input) {
      const credentials = validateAuthInput(input, "login");
      const result = await client.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });
      if (result.error) throw authError("LAT-AUTH-SIGNIN-001", friendlyAuthMessage(result.error));
      return snapshot(result.data?.session ?? null);
    }

    async function resendConfirmation(input = {}) {
      if (typeof client.auth.resend !== "function") {
        throw authError("LAT-AUTH-RESEND-CLIENT-001", "O reenvio da confirmação não está disponível.");
      }
      const email = validateConfirmationEmail(input.email);
      const resendOptions = {};
      if (emailRedirectTo) resendOptions.emailRedirectTo = emailRedirectTo;
      const result = await client.auth.resend({
        type: "signup",
        email,
        options: resendOptions,
      });
      if (result.error) throw authError("LAT-AUTH-RESEND-001", friendlyAuthMessage(result.error));
      return Object.freeze({ email });
    }

    async function signOut() {
      const result = await client.auth.signOut();
      if (result.error) throw authError("LAT-AUTH-SIGNOUT-001", friendlyAuthMessage(result.error));
      return snapshot(null);
    }

    function onChange(listener) {
      const result = client.auth.onAuthStateChange((event, session) => {
        Promise.resolve()
          .then(() => snapshot(session))
          .then((next) => listener(next, event))
          .catch((error) => listener({ session, user: session?.user ?? null, profile: fallbackProfile(session?.user), profileWarning: friendlyAuthMessage(error) }, event));
      });
      return result.data?.subscription ?? null;
    }

    return Object.freeze({ restore, signUp, signIn, resendConfirmation, signOut, onChange });
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    })[character]);
  }

  function accountName(state) {
    return state.profile?.display_name || state.user?.user_metadata?.display_name || state.user?.email || "Conta";
  }

  function authDialogHtml(state = {}) {
    const message = state.message
      ? `<p class="auth-message ${state.messageKind === "error" ? "auth-message-error" : ""}" role="${state.messageKind === "error" ? "alert" : "status"}">${escapeHtml(state.message)}</p>`
      : "";
    if (state.session?.user) {
      const name = accountName(state);
      const initial = cleanText(name, 1).toUpperCase() || "M";
      return `<div class="auth-dialog stack" data-online-auth-modal>
        <div class="auth-identity">
          <span class="auth-avatar" aria-hidden="true">${escapeHtml(initial)}</span>
          <div><strong>${escapeHtml(name)}</strong><p>${escapeHtml(state.user?.email ?? "")}</p></div>
          <span class="auth-session-chip">Sessão ativa</span>
        </div>
        <p class="muted">Sua conta está conectada. A ficha vinculada é salva primeiro neste computador e depois atualizada online.</p>
        ${state.profileWarning ? `<p class="auth-message auth-message-warn" role="status">${escapeHtml(state.profileWarning)}</p>` : ""}
        ${message}
      </div>`;
    }

    const signup = state.mode === "signup";
    return `<div class="auth-dialog stack" data-online-auth-modal>
      <p class="muted">A conta prepara o acesso online sem remover o salvamento local desta ficha.</p>
      <div class="auth-mode-switch" role="group" aria-label="Forma de acesso">
        <button class="${signup ? "ghost" : "button"}" type="button" data-online-auth-action="mode" data-mode="login" aria-pressed="${!signup}">Entrar</button>
        <button class="${signup ? "button" : "ghost"}" type="button" data-online-auth-action="mode" data-mode="signup" aria-pressed="${signup}">Criar conta</button>
      </div>
      ${message}
      <form id="onlineAuthForm" class="stack" data-online-auth-form>
        ${signup ? `<div class="field"><label for="authDisplayName">Nome exibido</label><input id="authDisplayName" name="displayName" type="text" autocomplete="name" maxlength="80" required></div>` : ""}
        <div class="field"><label for="authEmail">Email</label><input id="authEmail" name="email" type="email" autocomplete="email" maxlength="320" value="${escapeHtml(state.email ?? "")}" required></div>
        <div class="field"><label for="authPassword">Senha</label><input id="authPassword" name="password" type="password" autocomplete="${signup ? "new-password" : "current-password"}" minlength="8" required></div>
        <p class="muted small">Use pelo menos 8 caracteres. A senha é enviada diretamente ao Supabase e não entra na ficha exportada.</p>
        <button class="button auth-submit" type="submit" ${state.busy ? "disabled" : ""}>${state.busy ? "Aguarde…" : signup ? "Criar conta" : "Entrar"}</button>
        ${signup ? "" : `<button class="ghost" type="button" data-online-auth-action="resend-confirmation" ${state.busy ? "disabled" : ""}>Reenviar email de confirmação</button>`}
      </form>
    </div>`;
  }

  function init(document, supabaseTools, projectConfig = {}) {
    const accountButton = document.querySelector("#onlineAccountButton");
    const accountLabel = document.querySelector("#onlineAccountLabel");
    const modalRoot = document.querySelector("#modalRoot");
    if (!accountButton || !accountLabel || !modalRoot || accountButton.dataset.authInitialized === "true") return null;
    accountButton.dataset.authInitialized = "true";

    const view = document.defaultView ?? globalThis;
    let dialogOpen = false;
    let service = null;
    let subscription = null;
    let state = {
      mode: "login",
      busy: false,
      message: "",
      messageKind: "",
      email: "",
      session: null,
      user: null,
      profile: null,
      profileWarning: "",
    };

    function renderAccountButton() {
      const signedIn = Boolean(state.session?.user);
      accountLabel.textContent = signedIn ? accountName(state) : "Entrar";
      accountButton.dataset.authState = signedIn ? "online" : service ? "offline" : "unavailable";
      accountButton.title = signedIn ? `Conta conectada: ${accountName(state)}` : "Entrar ou criar conta";
      accountButton.setAttribute("aria-label", accountButton.title);
    }

    function fallbackOpenModal(body, footer) {
      modalRoot.innerHTML = `<div class="modal-backdrop"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="onlineAuthTitle" data-stop-close data-blocking="false"><header><h2 id="onlineAuthTitle">Conta Marufia</h2><button class="icon-button" type="button" data-online-auth-action="close" aria-label="Fechar">×</button></header><div class="modal-body">${body}</div><footer>${footer}</footer></div></div>`;
    }

    function renderDialog() {
      if (!dialogOpen) return;
      const body = authDialogHtml(state);
      const footer = state.session?.user
        ? `<button class="ghost" type="button" data-online-auth-action="logout" ${state.busy ? "disabled" : ""}>${state.busy ? "Saindo…" : "Sair da conta"}</button><button class="ghost" type="button" data-action="close-modal">Fechar</button>`
        : `<button class="ghost" type="button" data-action="close-modal">Fechar</button>`;
      if (typeof view.openModal === "function") view.openModal("Conta Marufia", body, footer);
      else fallbackOpenModal(body, footer);
    }

    function announceSnapshot(eventName = "") {
      if (typeof view.dispatchEvent !== "function" || typeof view.CustomEvent !== "function") return;
      view.dispatchEvent(new view.CustomEvent("marufia:auth-state-changed", {
        detail: {
          event: String(eventName || "UPDATED"),
          signedIn: Boolean(state.session?.user),
          userId: String(state.session?.user?.id ?? ""),
        },
      }));
    }

    function applySnapshot(next, message = "", messageKind = "", eventName = "") {
      state = { ...state, ...next, busy: false, message, messageKind };
      renderAccountButton();
      renderDialog();
      announceSnapshot(eventName);
    }

    async function submitAuth(form) {
      const values = Object.fromEntries(new view.FormData(form).entries());
      state = { ...state, busy: true, message: "", messageKind: "", email: cleanText(values.email, 320) };
      renderDialog();
      try {
        const result = state.mode === "signup"
          ? await service.signUp(values)
          : await service.signIn(values);
        if (result.pendingConfirmation) {
          state.mode = "login";
          applySnapshot(result, `Enviamos uma confirmação para ${result.email}. Abra o link; ele confirma a conta no site público. Depois, volte e entre.`, "success", "PENDING_CONFIRMATION");
        } else {
          applySnapshot(result, state.mode === "signup" ? "Conta criada e conectada." : "Conta conectada.", "success", "SIGNED_IN");
        }
      } catch (error) {
        applySnapshot({}, friendlyAuthMessage(error), "error");
      }
    }

    async function logout() {
      state = { ...state, busy: true, message: "", messageKind: "" };
      renderDialog();
      try {
        state.mode = "login";
        applySnapshot(await service.signOut(), "Sessão encerrada neste dispositivo.", "success", "SIGNED_OUT");
      } catch (error) {
        applySnapshot({}, friendlyAuthMessage(error), "error");
      }
    }

    async function resendConfirmation() {
      const email = cleanText(document.querySelector("#authEmail")?.value, 320);
      state = { ...state, busy: true, message: "", messageKind: "", email };
      renderDialog();
      try {
        const result = await service.resendConfirmation({ email });
        applySnapshot({ email: result.email }, `Enviamos um novo email para ${result.email}. Use o link mais recente para confirmar a conta.`, "success", "CONFIRMATION_RESENT");
      } catch (error) {
        applySnapshot({}, friendlyAuthMessage(error), "error");
      }
    }

    document.addEventListener("click", (event) => {
      const closeButton = event.target.closest?.('button[data-action="close-modal"]');
      if (closeButton && event.target.closest?.("[data-online-auth-modal], .modal")?.querySelector?.("[data-online-auth-modal]")) {
        dialogOpen = false;
        return;
      }
      const control = event.target.closest?.("[data-online-auth-action]");
      if (!control) return;
      const action = control.dataset.onlineAuthAction;
      if (action === "open") {
        dialogOpen = true;
        state.message = "";
        state.messageKind = "";
        renderDialog();
      } else if (action === "mode") {
        state.mode = control.dataset.mode === "signup" ? "signup" : "login";
        state.message = "";
        state.messageKind = "";
        renderDialog();
      } else if (action === "logout") {
        void logout();
      } else if (action === "resend-confirmation") {
        if (!state.busy && service) void resendConfirmation();
      } else if (action === "close") {
        dialogOpen = false;
        modalRoot.innerHTML = "";
        accountButton.focus();
      }
    });

    document.addEventListener("submit", (event) => {
      if (!event.target.matches?.("[data-online-auth-form]")) return;
      event.preventDefault();
      if (!state.busy && service) void submitAuth(event.target);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && modalRoot.querySelector("[data-online-auth-modal]")) dialogOpen = false;
    }, true);

    try {
      const client = supabaseTools?.getSupabaseClient?.();
      service = client ? createAuthService(client, { emailRedirectTo: projectConfig.siteUrl }) : null;
    } catch (error) {
      state.message = friendlyAuthMessage(error);
      state.messageKind = "error";
    }
    renderAccountButton();

    if (service) {
      subscription = service.onChange((next, eventName) => applySnapshot(next, "", "", eventName));
      service.restore()
        .then((next) => applySnapshot(next, "", "", "RESTORED"))
        .catch((error) => applySnapshot({}, friendlyAuthMessage(error), "error"));
    }

    return Object.freeze({
      destroy() { subscription?.unsubscribe?.(); },
      service,
    });
  }

  return {
    PROFILE_COLUMNS,
    validateAuthInput,
    validateConfirmationEmail,
    friendlyAuthMessage,
    fallbackProfile,
    createAuthService,
    authDialogHtml,
    init,
  };
});
