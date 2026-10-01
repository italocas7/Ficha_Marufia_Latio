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

    async function refresh() {
      const token = ++generation;
      const slot = store.active();
      if (!slot?.remoteId) {
        bridge.setCampaignSkillPolicy(null);
        return;
      }
      const key = `${slot.scope}|${slot.remoteId}`;
      const fallback = cachedPolicy(storage, key);
      const canRefresh = account.dataset.authState === "online" && characterService && campaignService && view.navigator?.onLine !== false;
      bridge.setCampaignSkillPolicy(!canRefresh && fallback?.none ? null : !canRefresh && fallback ? fallback : {
        campaignId: `pending:${slot.remoteId}`, name: "Campanha: limite aguardando sincronização", limit: 1, revision: 1,
      });
      if (!canRefresh) return;
      try {
        const userId = await characterService.currentUserId();
        if (slot.scope !== `${view.MARUFIA_OFFLINE?.backendScope?.(view.MARUFIA_ONLINE_CONFIG) ?? "unconfigured"}|${userId}`) return;
        const character = await characterService.loadOwn(slot.remoteId);
        if (token !== generation || store.active()?.id !== slot.id) return;
        if (!character.campaign_id) {
          rememberPolicy(storage, key, { none: true });
          bridge.setCampaignSkillPolicy(null);
          return;
        }
        const campaigns = await campaignService.listVisible([character.campaign_id]);
        if (token !== generation || store.active()?.id !== slot.id) return;
        const campaign = campaigns.find((item) => item.id === character.campaign_id);
        if (!campaign) throw new Error("Não foi possível consultar o limite desta campanha.");
        const policy = { campaignId: campaign.id, name: campaign.name, limit: Number(campaign.skill_limit), revision: Number(campaign.rules_revision) || 1 };
        if (!Number.isInteger(policy.limit) || policy.limit < 1 || policy.limit > 999) throw new Error("O limite da campanha é inválido.");
        rememberPolicy(storage, key, policy);
        bridge.setCampaignSkillPolicy(policy);
      } catch (error) {
        view.toast?.(error?.message || "Limite da campanha indisponível. Novos aumentos de perícia ficam protegidos.", "warn");
      }
    }

    const onRefresh = () => void refresh();
    const observer = typeof view.MutationObserver === "function"
      ? new view.MutationObserver(onRefresh) : null;
    observer?.observe(account, { attributes: true, attributeFilter: ["data-auth-state"] });
    for (const name of ["marufia:sheet-switched", "marufia:character-linked", "marufia:campaign-memberships-changed", "online"]) {
      view.addEventListener?.(name, onRefresh);
    }
    onRefresh();
    return Object.freeze({ refresh, destroy() {
      generation += 1;
      observer?.disconnect?.();
      for (const name of ["marufia:sheet-switched", "marufia:character-linked", "marufia:campaign-memberships-changed", "online"]) {
        view.removeEventListener?.(name, onRefresh);
      }
    } });
  }

  return { CACHE_KEY, cachedPolicy, rememberPolicy, init };
});
