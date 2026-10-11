(function initCampaignSkillPolicy(root, factory) {
  const api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.MARUFIA_CAMPAIGN_SKILL_POLICY = api;
  if (root?.document) Promise.resolve().then(() => api.init(root.document));
})(typeof window !== "undefined" ? window : globalThis, function createCampaignSkillPolicyApi(root) {
  "use strict";

  const CACHE_KEY = "marufia-campaign-skill-policy-v1";

  function cachedPolicy(storage, key) {
    try {
      const value = storage?.loadLocal?.(CACHE_KEY, {});
      const policy = value?.[key];
      return policy?.none === true || (Number.isInteger(policy?.limit) && policy.limit >= 1 && policy.limit <= 999) ? policy : null;
    } catch { return null; }
  }

  function rememberPolicy(storage, key, policy) {
    try {
      const previous = storage?.loadLocal?.(CACHE_KEY, {}) ?? {};
      storage.saveLocal(CACHE_KEY, { ...previous, [key]: policy });
      return true;
    } catch { return false; }
  }

  function init(document) {
    const view = document.defaultView ?? root;
    const bridge = view?.MARUFIA_APP_BRIDGE;
    const storage = view?.LATIO_STORAGE;
    const store = view?.MARUFIA_SHEET_SLOTS_STORE;
    const account = document.querySelector("#onlineAccountButton");
    if (!bridge?.setCampaignSkillPolicy || !storage || !store || !account) return null;
    let client = null;
    try { client = view.MARUFIA_SUPABASE?.getSupabaseClient?.(); } catch { /* Local mode. */ }
    const characterService = client && view.MARUFIA_CHARACTERS?.createCharacterService?.(client, view.LATIO_STATE);
    const campaignService = client && view.MARUFIA_CAMPAIGNS?.createCampaignService?.(client);
    let generation = 0;
    let destroyed = false;
    let failureKey = "";
    let subscribedCampaignId = "";
    let campaignChannel = null;
    const canRefresh = () => !destroyed && account.dataset.authState === "online" && characterService && campaignService && view.navigator?.onLine !== false;
    let retryScheduler = null;

    function watchCampaign(campaignId) {
      if (subscribedCampaignId === campaignId && (campaignChannel || !canRefresh())) return;
      if (campaignChannel) void client?.removeChannel?.(campaignChannel);
      campaignChannel = null;
      subscribedCampaignId = campaignId;
      if (!campaignId || !client?.channel || !canRefresh()) return;
      campaignChannel = client.channel(`campaign-rules:${campaignId}`)
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "campaigns", filter: `id=eq.${campaignId}` }, () => void refresh())
        .subscribe();
    }

    async function refresh() {
      if (destroyed) return true;
      const token = ++generation;
      const slot = store.active();
      if (!slot?.remoteId) {
        watchCampaign("");
        bridge.setCampaignSkillPolicy(null);
        return true;
      }
      const isCurrent = () => !destroyed && token === generation && store.active()?.id === slot.id;
      const key = `${slot.scope}|${slot.remoteId}`;
      const fallback = cachedPolicy(storage, key);
      // Atualizar a regra não deve apagar o último limite confirmado desta ficha.
      bridge.setCampaignSkillPolicy(fallback?.none ? null : fallback ? {
        ...fallback, ageEnabled: typeof fallback.ageEnabled === "boolean" ? fallback.ageEnabled : null,
      } : {
        campaignId: `pending:${slot.remoteId}`, name: "Campanha: regras aguardando sincronização", limit: 1, revision: 1, ageEnabled: null,
      });
      watchCampaign(fallback?.campaignId || "");
      if (!canRefresh()) { watchCampaign(""); return true; }
      try {
        const userId = await characterService.currentUserId();
        if (!isCurrent() || slot.scope !== `${view.MARUFIA_OFFLINE?.backendScope?.(view.MARUFIA_ONLINE_CONFIG) ?? "unconfigured"}|${userId}`) return true;
        const character = await characterService.loadOwn(slot.remoteId);
        if (!isCurrent()) return true;
        if (!character.campaign_id) {
          watchCampaign("");
          rememberPolicy(storage, key, { none: true });
          bridge.setCampaignSkillPolicy(null);
          failureKey = "";
          retryScheduler?.success();
          return true;
        }
        const campaigns = await campaignService.listVisible([character.campaign_id]);
        if (!isCurrent()) return true;
        const campaign = campaigns.find((item) => item.id === character.campaign_id);
        if (!campaign) throw new Error("Não foi possível consultar o limite desta campanha.");
        const policy = { campaignId: campaign.id, name: campaign.name, limit: Number(campaign.skill_limit), revision: Number(campaign.rules_revision) || 1, ageEnabled: campaign.age_mechanic_enabled };
        if (!Number.isInteger(policy.limit) || policy.limit < 1 || policy.limit > 999) throw new Error("O limite da campanha é inválido.");
        if (typeof policy.ageEnabled !== "boolean") throw new Error("A regra de idade da campanha é inválida.");
        rememberPolicy(storage, key, policy);
        bridge.setCampaignSkillPolicy(policy);
        watchCampaign(policy.campaignId);
        failureKey = "";
        retryScheduler?.success();
        return true;
      } catch (error) {
        if (!isCurrent()) return true;
        if (failureKey !== key) view.toast?.(error?.message || "Limite da campanha indisponível. Novos aumentos de perícia ficam protegidos.", "warn");
        failureKey = key;
        retryScheduler?.schedule();
        return false;
      }
    }

    const onRefresh = () => {
      if (destroyed) return Promise.resolve(true);
      retryScheduler?.destroy();
      retryScheduler = view.MARUFIA_OFFLINE?.createRetryScheduler?.(refresh, {
        isReady: canRefresh,
        setTimer: view.setTimeout?.bind(view),
        clearTimer: view.clearTimeout?.bind(view),
      });
      return refresh();
    };
    const observer = typeof view.MutationObserver === "function"
      ? new view.MutationObserver(onRefresh) : null;
    observer?.observe(account, { attributes: true, attributeFilter: ["data-auth-state"] });
    for (const name of ["marufia:sheet-switched", "marufia:character-linked", "marufia:campaign-memberships-changed", "online", "offline"]) {
      view.addEventListener?.(name, onRefresh);
    }
    const manualRefresh = (event) => event?.detail?.waitUntil?.(onRefresh().then((ok) => ({ source: "campaign", ok })));
    view.addEventListener?.("marufia:manual-sync", manualRefresh);
    const refreshOnVisible = () => { if (document.visibilityState === "visible") void onRefresh(); };
    document.addEventListener?.("visibilitychange", refreshOnVisible);
    onRefresh();
    return Object.freeze({ refresh: onRefresh, destroy() {
      destroyed = true;
      generation += 1;
      retryScheduler?.destroy();
      watchCampaign("");
      observer?.disconnect?.();
      document.removeEventListener?.("visibilitychange", refreshOnVisible);
      view.removeEventListener?.("marufia:manual-sync", manualRefresh);
      for (const name of ["marufia:sheet-switched", "marufia:character-linked", "marufia:campaign-memberships-changed", "online", "offline"]) {
        view.removeEventListener?.(name, onRefresh);
      }
    } });
  }

  return { CACHE_KEY, cachedPolicy, rememberPolicy, init };
});
