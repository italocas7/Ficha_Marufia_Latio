(function initMarufiaDiceTray(root, factory) {
  const rolls = root?.LATIO_ROLLS
    ?? (typeof module === "object" && module.exports ? require("../core/rolls.js") : null);
  const api = factory(root, rolls);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.MARUFIA_DICE_TRAY = api;
  if (root?.document) Promise.resolve().then(() => api.init(root.document));
})(typeof window !== "undefined" ? window : globalThis, function createMarufiaDiceTrayApi(root, rolls) {
  "use strict";

  const THEMES = Object.freeze([
    ["wine", "Vinho"], ["azure", "Azul"], ["forest", "Verde"], ["amethyst", "Roxo"],
    ["gold", "Dourado"], ["obsidian", "Preto"], ["ivory", "Marfim"], ["copper", "Cobre"],
    ["rose", "Rosa"], ["turquoise", "Turquesa"],
  ]);
  const THEME_IDS = new Set(THEMES.map(([id]) => id));
  const TRAY_COLUMNS = "id,campaign_id,character_id,user_id,character_name,player_name,roll_type,formula,raw_roll,total,visibility,dice_theme,dice_pool,session_id,created_at";
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const PREFS_PREFIX = "marufia-dice-prefs-v1:";
  const HISTORY_PREFIX = "marufia-dice-history-v1:";

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;",
    })[character]);
  }

  function normalizeTrayRow(value) {
    if (value?.roll_type !== "tray" || !UUID.test(String(value.id))
      || !UUID.test(String(value.campaign_id)) || !UUID.test(String(value.user_id))
      || (value.character_id && !UUID.test(String(value.character_id)))
      || (value.session_id && !UUID.test(String(value.session_id)))
      || !["public", "secret"].includes(value.visibility)
      || !THEME_IDS.has(value.dice_theme)
      || !String(value.character_name ?? "").trim()
      || !String(value.player_name ?? "").trim()
      || Number.isNaN(Date.parse(String(value.created_at ?? "")))) {
      throw new TypeError("Registro da bandeja inválido.");
    }
    const result = rolls.normalizeTrayResults(value.dice_pool, value.raw_roll);
    if (result.total !== Number(value.total) || result.formula !== value.formula) {
      throw new TypeError("O total da bandeja não corresponde aos dados.");
    }
    return Object.freeze({
      id: value.id, campaignId: value.campaign_id, characterId: value.character_id,
      sessionId: value.session_id ?? null, userId: value.user_id,
      characterName: value.character_name, playerName: value.player_name,
      pool: result.pool, dice: result.dice, formula: result.formula, total: result.total,
      theme: value.dice_theme, visibility: value.visibility, createdAt: value.created_at,
      local: false,
    });
  }

  function normalizeLocalEntry(value) {
    if (value?.local !== true || !String(value.id ?? "").startsWith("local-")
      || !THEME_IDS.has(value.theme) || !["public", "secret"].includes(value.visibility)
      || !String(value.playerName ?? "").trim() || !String(value.characterName ?? "").trim()
      || Number.isNaN(Date.parse(String(value.createdAt ?? "")))) return null;
    try {
      const result = rolls.normalizeTrayResults(value.pool, value.dice);
      if (result.total !== value.total || result.formula !== value.formula) return null;
      return { ...value, ...result, local: true };
    } catch { return null; }
  }

  function mergeHistory(local, remote, limit = 50) {
    const byId = new Map();
    for (const entry of [...local, ...remote]) {
      if (entry?.id && !byId.has(entry.id)) byId.set(entry.id, entry);
    }
    return [...byId.values()]
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .slice(0, limit);
  }

  function allowedHistory(history, filter, userId, role) {
    const permitted = history.filter((roll) => roll.local || roll.visibility === "public"
      || roll.userId === userId || role === "gm");
    if (filter === "mine") return permitted.filter((roll) => roll.local || roll.userId === userId);
    if (filter === "private" && role === "gm") return permitted.filter((roll) => !roll.local && roll.visibility === "secret");
    return permitted;
  }

  function readJson(storage, key, fallback) {
    try {
      return JSON.parse(storage.getItem(key) || "null") ?? fallback;
    } catch {
      return fallback;
    }
  }

  function writeJson(storage, key, value) {
    try {
      storage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  function randomUuid(cryptoApi) {
    if (typeof cryptoApi?.randomUUID === "function") return cryptoApi.randomUUID();
    if (typeof cryptoApi?.getRandomValues !== "function") throw new TypeError("Fonte segura de identificadores indisponível.");
    const bytes = cryptoApi.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  function formatTime(value) {
    try { return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }).format(new Date(value)); }
    catch { return "--/-- --:--"; }
  }

  function historyItemHtml(roll) {
    const dice = roll.dice.map((die) => `<span><b>${escapeHtml(die.type)}</b> ${die.result}</span>`).join("");
    const d100 = roll.dice.filter((die) => die.type === "d100").map((die) =>
      `<p>d10 dezenas: ${String(die.tens).padStart(2, "0")} · d10 unidades: ${die.units} · Resultado: ${die.result}</p>`).join("");
    return `<article class="dice-history-item" data-history-id="${escapeHtml(roll.id)}">
      <div class="dice-history-heading"><strong>${escapeHtml(roll.playerName)}</strong><time datetime="${escapeHtml(roll.createdAt)}">${escapeHtml(formatTime(roll.createdAt))}</time></div>
      <small>${escapeHtml(roll.characterName)} · ${roll.local ? "Local" : roll.visibility === "secret" ? "Privada" : "Pública"} · ${escapeHtml(THEMES.find(([id]) => id === roll.theme)?.[1] ?? "Vinho")}</small>
      <div class="dice-history-formula"><span>${escapeHtml(roll.formula)}</span><strong>${roll.total}</strong></div>
      <details><summary>Ver dados</summary><div class="dice-history-results">${dice}</div>${d100}</details>
    </article>`;
  }

  function init(document) {
    const button = document.querySelector("#diceTrayButton");
    const mount = document.querySelector("#diceTrayRoot");
    if (!button || !mount || !rolls || mount.dataset.initialized === "true") return null;
    mount.dataset.initialized = "true";
    const view = document.defaultView ?? root;
    const storage = view.localStorage;
    const client = view.MARUFIA_SUPABASE?.getSupabaseClient?.() ?? null;
    const appBridge = view.MARUFIA_APP_BRIDGE;
    const importer = view.MARUFIA_CHARACTER_IMPORT;
    const scope = view.MARUFIA_OFFLINE?.backendScope?.(view.MARUFIA_ONLINE_CONFIG) ?? "local";
    const state = {
      open: false, tab: "tray", filter: "all", pool: {},
      theme: "wine", visibility: "public", colorOpen: false,
      local: [], remote: [], result: null, busy: false, animating: false,
      message: "", context: null, userId: "", playerName: "", role: "",
      prefKey: "", historyKey: "", generation: 0, subscription: null,
      previousFocus: null, previousOverflow: "", pendingIds: new Set(),
    };
    let preferenceWrites = Promise.resolve();

    function sheetId() {
      return String(appBridge?.snapshot?.()?.meta?.createdAt || "unsaved");
    }

    function keys(userId = state.userId) {
      const id = `${scope}:${userId || "guest"}`;
      return { prefs: `${PREFS_PREFIX}${id}`, history: `${HISTORY_PREFIX}${id}:${sheetId()}` };
    }

    function loadLocal() {
      const next = keys();
      state.prefKey = next.prefs;
      state.historyKey = next.history;
      const prefs = readJson(storage, next.prefs, {});
      state.theme = THEME_IDS.has(prefs.theme) ? prefs.theme : "wine";
      state.visibility = ["public", "secret"].includes(prefs.visibility) ? prefs.visibility : "public";
      const local = readJson(storage, next.history, []);
      state.local = Array.isArray(local) ? local.map(normalizeLocalEntry).filter(Boolean).slice(0, 50) : [];
      state.result = null;
    }

    function savePreferences() {
      const prefs = { theme: state.theme, visibility: state.visibility, dirty: Boolean(state.userId) };
      writeJson(storage, state.prefKey, prefs);
      if (!state.userId || !client || view.navigator?.onLine === false) return Promise.resolve();
      const userId = state.userId;
      const key = state.prefKey;
      preferenceWrites = preferenceWrites.catch(() => {}).then(async () => {
        if (userId !== state.userId || key !== state.prefKey) return;
        const latest = { theme: state.theme, visibility: state.visibility };
        try {
          const result = await client.from("profiles")
            .update({ dice_theme: latest.theme, default_roll_visibility: latest.visibility })
            .eq("id", userId);
          if (!result.error && userId === state.userId && key === state.prefKey
            && latest.theme === state.theme && latest.visibility === state.visibility) {
            writeJson(storage, key, { ...latest, dirty: false });
          }
        } catch {
          // A preferência local continua válida e será reenviada ao reconectar.
        }
      });
      return preferenceWrites;
    }

    async function syncPreferences(userId, generation) {
      if (!client || !userId || view.navigator?.onLine === false) return;
      const local = readJson(storage, state.prefKey, {});
      try {
        if (local.dirty) {
          await savePreferences();
          return;
        }
        const result = await client.from("profiles")
          .select("dice_theme,default_roll_visibility").eq("id", userId).maybeSingle();
        if (generation !== state.generation || result.error || !result.data) return;
        state.theme = THEME_IDS.has(result.data.dice_theme) ? result.data.dice_theme : "wine";
        state.visibility = result.data.default_roll_visibility === "secret" ? "secret" : "public";
        writeJson(storage, state.prefKey, { theme: state.theme, visibility: state.visibility, dirty: false });
        render();
      } catch {
        // A bandeja pode ser usada sem o perfil remoto.
      }
    }

    async function unsubscribe() {
      if (!state.subscription || !client) return;
      const current = state.subscription;
      state.subscription = null;
      try { await client.removeChannel(current); } catch { /* Conexão já encerrada. */ }
    }

    function notify(roll) {
      const notifications = document.querySelector("#diceNotificationRoot");
      if (!notifications || roll.userId === state.userId
        || (roll.visibility !== "public" && !(roll.visibility === "secret" && state.role === "gm"))) return;
      const item = document.createElement("div");
      item.className = "dice-notification";
      item.setAttribute("role", "status");
      item.textContent = `${roll.visibility === "secret" ? "Privada · " : ""}${roll.playerName} rolou ${roll.formula}: ${roll.total}`;
      notifications.append(item);
      view.setTimeout(() => item.remove(), 4500);
    }

    function addRemote(roll, announce = false) {
      if (state.context?.campaignId !== roll.campaignId) return;
      if (roll.visibility === "secret" && roll.userId !== state.userId && state.role !== "gm") return;
      if (state.remote.some((item) => item.id === roll.id)) return;
      state.remote = mergeHistory([], [roll, ...state.remote]);
      if (announce && !state.pendingIds.has(roll.id)) notify(roll);
      render();
    }

    async function refresh() {
      const generation = ++state.generation;
      await unsubscribe();
      state.context = null;
      state.remote = [];
      state.role = "";
      state.message = "";
      let session = null;
      try { session = (await client?.auth?.getSession?.())?.data?.session ?? null; } catch { /* Modo local. */ }
      if (generation !== state.generation) return;
      const userId = String(session?.user?.id ?? "");
      if (state.userId !== userId || !state.prefKey || state.historyKey !== keys(userId).history) {
        state.userId = userId;
        loadLocal();
      }
      state.playerName = String(session?.user?.user_metadata?.display_name || session?.user?.email || "Jogador");
      render();
      if (!client || !userId || view.navigator?.onLine === false) return;
      void syncPreferences(userId, generation);
      try {
        const identity = importer?.localSheetIdentity?.(appBridge?.snapshot?.());
        const characterId = importer?.importedCharacterId?.(view.LATIO_STORAGE, userId, identity, scope);
        if (!characterId) return;
        const characterResult = await client.from("characters")
          .select("id,campaign_id,name").eq("id", characterId).single();
        if (generation !== state.generation || characterResult.error || !characterResult.data?.campaign_id) return;
        const campaignId = characterResult.data.campaign_id;
        const membershipResult = await client.from("campaign_members")
          .select("role").eq("campaign_id", campaignId).eq("user_id", userId).maybeSingle();
        if (generation !== state.generation || membershipResult.error || !membershipResult.data?.role) return;
        const nextContext = { campaignId, characterId, characterName: characterResult.data.name };
        state.role = membershipResult.data.role;
        if (state.role !== "gm" && state.filter === "private") state.filter = "all";
        const profileResult = await client.from("profiles")
          .select("display_name").eq("id", userId).maybeSingle();
        if (generation === state.generation && profileResult.data?.display_name) {
          state.playerName = profileResult.data.display_name;
        }
        const history = await client.from("rolls").select(TRAY_COLUMNS)
          .eq("campaign_id", campaignId).eq("roll_type", "tray")
          .order("created_at", { ascending: false }).limit(50);
        if (generation !== state.generation) return;
        if (history.error) {
          state.context = null;
          state.role = "";
          state.message = "Bandeja online indisponível nesta mesa. Rolagens locais não serão enviadas.";
          render();
          return;
        }
        state.context = nextContext;
        state.remote = (history.data || []).flatMap((row) => {
          try { return [normalizeTrayRow(row)]; } catch { return []; }
        });
        render();
        const channel = client.channel(`marufia-dice-tray:${campaignId}`)
          .on("postgres_changes", {
            event: "INSERT", schema: "public", table: "rolls", filter: `campaign_id=eq.${campaignId}`,
          }, (payload) => {
            if (payload?.new?.roll_type !== "tray") return;
            try { addRemote(normalizeTrayRow(payload.new), true); } catch { /* Linha inválida. */ }
          }).subscribe();
        if (generation === state.generation) state.subscription = channel;
        else await client.removeChannel(channel);
      } catch {
        state.message = "A mesa não está disponível agora. Você ainda pode rolar localmente.";
        render();
      }
    }

    function historyHtml() {
      const history = allowedHistory(mergeHistory(state.local, state.remote), state.filter, state.userId, state.role);
      return `<section class="dice-history" aria-label="Histórico de dados">
        <div class="dice-history-top"><h3>Histórico</h3><div class="dice-history-filters" role="group" aria-label="Filtrar histórico">
          ${[["all", "Todas"], ["mine", "Minhas"], ...(state.role === "gm" ? [["private", "Privadas"]] : [])]
            .map(([id, label]) => `<button type="button" data-dice-action="filter" data-filter="${id}" aria-pressed="${state.filter === id}">${label}</button>`).join("")}
        </div></div>
        <div class="dice-history-list">${history.map(historyItemHtml).join("") || '<p class="dice-empty">Nenhuma rolagem neste filtro.</p>'}</div>
      </section>`;
    }

    function resultHtml() {
      if (!state.result) return '<div class="dice-tray-empty"><span class="dice-tray-mark" aria-hidden="true">⚄</span><p>Bandeja vazia</p></div>';
      const dice = state.result.dice.map((die, index) => `<div class="dice-result-die" style="--die-order:${index}" data-type="${die.type}">
        <span>${die.type}</span><strong>${die.result}</strong>
        ${die.type === "d100" ? `<small>${String(die.tens).padStart(2, "0")} + ${die.units}</small>` : ""}
      </div>`).join("");
      return `<div class="dice-tray-outcome">
        <div class="dice-result-head"><span>${state.result.local ? "ROLAGEM LOCAL" : "ROLAGEM DA MESA"}</span><span>${escapeHtml(state.result.formula)}</span></div>
        <div class="dice-result-dice-list">${dice}</div>
        <div class="dice-result-total"><span>TOTAL</span><strong>${state.result.total}</strong></div>
      </div>`;
    }

    function controlsHtml() {
      const count = Object.values(state.pool).reduce((sum, value) => sum + value, 0);
      const selection = rolls.TRAY_DICE.filter((type) => state.pool[type]).map((type) =>
        `<span class="dice-selected-token">${state.pool[type]}${type}<button type="button" data-dice-action="remove" data-die="${type}" aria-label="Remover um ${type}">−</button></span>`).join("");
      return `<div class="dice-controls">
        <div class="dice-selection-summary"><span>Selecionados: <strong>${count}/50</strong></span><div class="dice-selected-list">${selection || '<span class="muted">Escolha os dados abaixo.</span>'}</div><button class="ghost" type="button" data-dice-action="clear" ${count ? "" : "disabled"}>Limpar</button></div>
        <div class="dice-picker" role="group" aria-label="Adicionar dados">
          ${rolls.TRAY_DICE.map((type) => `<button class="dice-pick" type="button" data-dice-action="add" data-die="${type}" aria-label="Adicionar ${type}" ${count >= 50 || state.busy ? "disabled" : ""}><span class="dice-pick-add" aria-hidden="true">+</span><span class="dice-pick-shape" data-type="${type}"></span><strong>${type}</strong></button>`).join("")}
        </div>
        <div class="dice-control-bottom">
          <div class="dice-color-control"><button class="ghost" type="button" data-dice-action="palette" aria-expanded="${state.colorOpen}" aria-label="Cor dos dados">Cor: ${escapeHtml(THEMES.find(([id]) => id === state.theme)?.[1])}</button>
            ${state.colorOpen ? `<div class="dice-palette" role="group" aria-label="Escolher cor dos dados">${THEMES.map(([id, label]) => `<button type="button" data-dice-action="theme" data-theme="${id}" class="dice-swatch" aria-label="${label}" aria-pressed="${state.theme === id}" title="${label}"><span data-dice-theme="${id}"></span></button>`).join("")}</div>` : ""}
          </div>
          <label class="dice-privacy"><span>Visibilidade</span><select data-dice-visibility aria-label="Visibilidade da rolagem"><option value="public" ${state.visibility === "public" ? "selected" : ""}>Público</option><option value="secret" ${state.visibility === "secret" ? "selected" : ""}>Privado</option></select></label>
          <button class="button dice-roll-button" type="button" data-dice-action="roll" ${!count || state.busy ? "disabled" : ""}>${state.busy ? "Rolando…" : "Rolar"}</button>
        </div>
        <p class="dice-status" role="status" aria-live="polite">${escapeHtml(state.message || (state.context && view.navigator?.onLine !== false ? "Conectado à mesa." : "Rolagem local neste dispositivo."))}</p>
      </div>`;
    }

    function render() {
      if (!state.open) return;
      const previous = document.activeElement;
      const action = previous?.dataset?.diceAction;
      const die = previous?.dataset?.die;
      const filter = previous?.dataset?.filter;
      const tab = previous?.dataset?.tab;
      const visibilityFocused = previous?.matches?.("[data-dice-visibility]");
      const historyScroll = mount.querySelector(".dice-history-list")?.scrollTop ?? 0;
      mount.innerHTML = `<div class="dice-overlay" data-dice-action="backdrop"></div>
        <section class="dice-panel" role="dialog" aria-modal="true" aria-labelledby="dicePanelTitle" data-dice-theme="${state.theme}" data-animating="${state.animating}">
          <header class="dice-panel-header"><div><span class="dice-eyebrow">MARUFIA · DADOS</span><h2 id="dicePanelTitle">Bandeja de Rolagem</h2></div><button type="button" class="icon-button" data-dice-action="close" aria-label="Fechar bandeja">×</button></header>
          <div class="dice-mobile-tabs" role="tablist" aria-label="Bandeja de dados"><button type="button" role="tab" data-dice-action="tab" data-tab="tray" aria-selected="${state.tab === "tray"}">Bandeja</button><button type="button" role="tab" data-dice-action="tab" data-tab="history" aria-selected="${state.tab === "history"}">Histórico</button></div>
          <div class="dice-panel-body" data-mobile-tab="${state.tab}">
            <div class="dice-panel-main"><div class="dice-tray" aria-live="polite">${resultHtml()}</div>${controlsHtml()}</div>
            ${historyHtml()}
          </div>
        </section>`;
      const next = action && [...mount.querySelectorAll("[data-dice-action]")].find((item) =>
        item.dataset.diceAction === action && (!die || item.dataset.die === die)
        && (!filter || item.dataset.filter === filter) && (!tab || item.dataset.tab === tab));
      if (next && !next.disabled) next.focus({ preventScroll: true });
      else if (visibilityFocused) mount.querySelector("[data-dice-visibility]")?.focus({ preventScroll: true });
      else if (action === "theme") mount.querySelector('[data-dice-action="palette"]')?.focus({ preventScroll: true });
      else if (!mount.contains(previous)) mount.querySelector('[data-dice-action="close"]')?.focus({ preventScroll: true });
      const list = mount.querySelector(".dice-history-list");
      if (list) list.scrollTop = historyScroll;
    }

    function open() {
      if (state.open) return;
      state.previousFocus = document.activeElement;
      state.previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      state.open = true;
      state.message = "";
      render();
      mount.querySelector('[data-dice-action="close"]')?.focus();
      void refresh();
    }

    function close() {
      if (!state.open) return;
      state.open = false;
      mount.innerHTML = "";
      document.body.style.overflow = state.previousOverflow;
      (state.previousFocus?.isConnected ? state.previousFocus : button)?.focus?.();
    }

    async function roll() {
      if (state.busy) return;
      let pool;
      try {
        pool = rolls.normalizeTrayPool(rolls.TRAY_DICE.filter((type) => state.pool[type])
          .map((type) => ({ type, count: state.pool[type] })));
      } catch (error) {
        state.message = error.message;
        render();
        return;
      }
      state.busy = true;
      state.message = "";
      render();
      try {
        let entry;
        if (state.context && client && view.navigator?.onLine !== false) {
          const id = randomUuid(view.crypto);
          state.pendingIds.add(id);
          try {
            const response = await client.rpc("roll_dice_tray", {
              p_roll_id: id, p_character_id: state.context.characterId,
              p_dice: pool, p_visibility: state.visibility, p_dice_theme: state.theme,
            });
            if (response.error) throw response.error;
            entry = normalizeTrayRow(response.data);
            addRemote(entry);
          } finally {
            state.pendingIds.delete(id);
          }
        } else {
          const result = rolls.rollTray(pool);
          entry = {
            id: `local-${view.crypto ? randomUuid(view.crypto) : `${Date.now()}-${Math.random()}`}`,
            campaignId: state.context?.campaignId ?? null,
            userId: state.userId || "local", characterName: state.context?.characterName
              || appBridge?.snapshot?.()?.character?.name || "Personagem",
            playerName: state.playerName || "Jogador local", ...result,
            theme: state.theme, visibility: state.visibility,
            createdAt: new Date().toISOString(), local: true,
          };
          state.local = mergeHistory([entry], state.local);
          writeJson(storage, state.historyKey, state.local);
        }
        state.result = entry;
        state.animating = true;
        state.message = entry.local ? "Rolagem local · não enviada à mesa." : "Resultado registrado na mesa.";
        render();
        view.setTimeout(() => {
          if (state.result?.id === entry.id) { state.animating = false; render(); }
        }, 1250);
      } catch (error) {
        state.message = "Não foi possível registrar a rolagem. Tente novamente.";
        if (view.navigator?.onLine === false) state.message = "Sem conexão. Role novamente para usar a bandeja local.";
        render();
      } finally {
        state.busy = false;
        render();
      }
    }

    document.addEventListener("click", (event) => {
      if (event.target.closest?.("#diceTrayButton")) { open(); return; }
      const control = event.target.closest?.("[data-dice-action]");
      if (!control || !mount.contains(control)) return;
      const action = control.dataset.diceAction;
      const type = control.dataset.die;
      if (action === "close" || action === "backdrop") { close(); return; }
      if (action === "add" && !state.busy) {
        const total = Object.values(state.pool).reduce((sum, count) => sum + count, 0);
        if (rolls.TRAY_DICE.includes(type) && total < 50) state.pool[type] = (state.pool[type] ?? 0) + 1;
      } else if (action === "remove" && state.pool[type]) {
        state.pool[type] -= 1;
        if (!state.pool[type]) delete state.pool[type];
      } else if (action === "clear") state.pool = {};
      else if (action === "palette") state.colorOpen = !state.colorOpen;
      else if (action === "theme" && THEME_IDS.has(control.dataset.theme)) {
        state.theme = control.dataset.theme;
        state.colorOpen = false;
        void savePreferences();
      } else if (action === "filter") state.filter = control.dataset.filter;
      else if (action === "tab") state.tab = control.dataset.tab;
      else if (action === "roll") { void roll(); return; }
      render();
    });
    document.addEventListener("change", (event) => {
      if (!event.target.matches?.("[data-dice-visibility]")) return;
      state.visibility = event.target.value === "secret" ? "secret" : "public";
      void savePreferences();
      render();
    });
    document.addEventListener("keydown", (event) => {
      if (!state.open) return;
      if (event.key === "Escape") { event.preventDefault(); event.stopImmediatePropagation(); close(); return; }
      if (event.key !== "Tab") return;
      const focusable = [...mount.querySelectorAll("button:not([disabled]), select:not([disabled]), summary, a[href]")]
        .filter((item) => item.getClientRects().length > 0);
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first) return;
      if (!mount.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
        return;
      }
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }, true);
    const onAuth = () => void refresh();
    view.addEventListener("marufia:auth-state-changed", onAuth);
    view.addEventListener("marufia:character-linked", onAuth);
    view.addEventListener("marufia:campaign-memberships-changed", onAuth);
    view.addEventListener("online", onAuth);
    view.addEventListener("offline", onAuth);
    view.addEventListener("marufia:roll-history-cleared", (event) => {
      if (event.detail?.campaignId === state.context?.campaignId) { state.remote = []; render(); }
    });
    loadLocal();
    void refresh();
    return Object.freeze({ open, close, refresh, getState: () => state });
  }

  return Object.freeze({
    THEMES, TRAY_COLUMNS, normalizeTrayRow, mergeHistory, allowedHistory,
    historyItemHtml, randomUuid, init,
  });
});
