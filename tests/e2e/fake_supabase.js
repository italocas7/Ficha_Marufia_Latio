(function installFakeSupabase(root) {
  "use strict";

  const SESSION_KEY = "marufia-e2e-session";
  const PROFILE_KEY = "marufia-e2e-profile";
  const CAMPAIGNS_KEY = "marufia-e2e-campaigns";
  const MEMBERSHIPS_KEY = "marufia-e2e-campaign-memberships";
  const CHARACTERS_KEY = "marufia-e2e-characters";
  const CHARACTER_WRITES_KEY = "marufia-e2e-character-writes";
  const CHARACTER_FAILURE_KEY = "marufia-e2e-character-save-fails";
  const ROLLS_KEY = "marufia-e2e-rolls";
  const PRESENCE_KEY = "marufia-e2e-campaign-presence";
  const EVENTS_KEY = "marufia-e2e-campaign-events";
  const SESSIONS_KEY = "marufia-e2e-campaign-sessions";
  const USER_ID = "11111111-1111-4111-8111-111111111111";
  const EXTERNAL_CAMPAIGN_ID = "22222222-2222-4222-8222-222222222222";

  function read(key) {
    try {
      return JSON.parse(root.localStorage.getItem(key));
    } catch {
      return null;
    }
  }

  function write(key, value) {
    if (value == null) root.localStorage.removeItem(key);
    else root.localStorage.setItem(key, JSON.stringify(value));
  }

  function ensureInvitableCampaign() {
    const campaigns = read(CAMPAIGNS_KEY) ?? [];
    if (campaigns.some((campaign) => campaign.id === EXTERNAL_CAMPAIGN_ID)) return;
    const createdAt = "2026-08-20T12:00:00.000Z";
    campaigns.push({
      id: EXTERNAL_CAMPAIGN_ID,
      name: "Campanha Convidada",
      description: "Campanha preparada para validar a entrada por código.",
      owner_id: "e2e-external-owner",
      join_code: "MRF-PLAY-ER",
      created_at: createdAt,
      updated_at: createdAt,
    });
    write(CAMPAIGNS_KEY, campaigns);
    const memberships = read(MEMBERSHIPS_KEY) ?? [];
    memberships.push({
      campaign_id: EXTERNAL_CAMPAIGN_ID,
      user_id: "e2e-external-owner",
      role: "gm",
      joined_at: createdAt,
    });
    write(MEMBERSHIPS_KEY, memberships);
  }

  function createClient() {
    ensureInvitableCampaign();
    const listeners = new Set();
    const channels = new Set();

    function emit(event, session) {
      queueMicrotask(() => {
        for (const listener of listeners) listener(event, session);
      });
    }

    function matchesRealtimeFilter(binding, record) {
      const match = /^(id|campaign_id)=eq\.(.+)$/.exec(String(binding?.filter ?? ""));
      return Boolean(match && String(record?.[match[1]] ?? "") === match[2]);
    }

    function emitCharacterChange(character) {
      const snapshot = JSON.parse(JSON.stringify(character));
      queueMicrotask(() => {
        for (const channel of channels) {
          for (const binding of channel.bindings) {
            if (binding.type !== "postgres_changes"
              || !["UPDATE", "*"].includes(binding.config?.event)
              || binding.config?.schema !== "public"
              || binding.config?.table !== "characters"
              || !matchesRealtimeFilter(binding.config, snapshot)) continue;
            binding.listener({
              eventType: "UPDATE",
              schema: "public",
              table: "characters",
              commit_timestamp: new Date().toISOString(),
              new: JSON.parse(JSON.stringify(snapshot)),
              old: { id: snapshot.id },
            });
          }
        }
      });
    }

    function emitPresenceChange(presence, eventType) {
      const snapshot = JSON.parse(JSON.stringify(presence));
      queueMicrotask(() => {
        for (const channel of channels) {
          for (const binding of channel.bindings) {
            if (binding.type !== "postgres_changes"
              || ![eventType, "*"].includes(binding.config?.event)
              || binding.config?.schema !== "public"
              || binding.config?.table !== "campaign_presence"
              || !matchesRealtimeFilter(binding.config, snapshot)) continue;
            binding.listener({
              eventType,
              schema: "public",
              table: "campaign_presence",
              commit_timestamp: new Date().toISOString(),
              new: JSON.parse(JSON.stringify(snapshot)),
              old: eventType === "INSERT" ? {} : { campaign_id: snapshot.campaign_id, user_id: snapshot.user_id },
            });
          }
        }
      });
    }

    function emitRollChange(roll) {
      const snapshot = JSON.parse(JSON.stringify(roll));
      queueMicrotask(() => {
        for (const channel of channels) {
          for (const binding of channel.bindings) {
            if (binding.type !== "postgres_changes"
              || binding.config?.event !== "INSERT"
              || binding.config?.schema !== "public"
              || binding.config?.table !== "rolls"
              || !matchesRealtimeFilter(binding.config, snapshot)) continue;
            binding.listener({
              eventType: "INSERT",
              schema: "public",
              table: "rolls",
              commit_timestamp: new Date().toISOString(),
              new: JSON.parse(JSON.stringify(snapshot)),
              old: {},
            });
          }
        }
      });
    }

    function emitCampaignEvent(event) {
      const snapshot = JSON.parse(JSON.stringify(event));
      queueMicrotask(() => {
        for (const channel of channels) {
          for (const binding of channel.bindings) {
            if (binding.type !== "postgres_changes"
              || binding.config?.event !== "INSERT"
              || binding.config?.schema !== "public"
              || binding.config?.table !== "campaign_events"
              || !matchesRealtimeFilter(binding.config, snapshot)) continue;
            binding.listener({
              eventType: "INSERT",
              schema: "public",
              table: "campaign_events",
              commit_timestamp: snapshot.created_at,
              new: JSON.parse(JSON.stringify(snapshot)),
              old: {},
            });
          }
        }
      });
    }

    function emitCampaignSession(session, eventType) {
      const snapshot = JSON.parse(JSON.stringify(session));
      queueMicrotask(() => {
        for (const channel of channels) {
          for (const binding of channel.bindings) {
            if (binding.type !== "postgres_changes"
              || ![eventType, "*"].includes(binding.config?.event)
              || binding.config?.schema !== "public"
              || binding.config?.table !== "campaign_sessions"
              || !matchesRealtimeFilter(binding.config, snapshot)) continue;
            binding.listener({
              eventType,
              schema: "public",
              table: "campaign_sessions",
              commit_timestamp: new Date().toISOString(),
              new: JSON.parse(JSON.stringify(snapshot)),
              old: eventType === "INSERT" ? {} : { id: snapshot.id, campaign_id: snapshot.campaign_id },
            });
          }
        }
      });
    }

    function appendCampaignEvent(character, actorId, eventType, payload) {
      if (!character?.campaign_id) return null;
      const events = read(EVENTS_KEY) ?? [];
      const sequence = String(events.length + 1).padStart(12, "0");
      const activeSession = (read(SESSIONS_KEY) ?? []).find((session) => (
        session.campaign_id === character.campaign_id && session.status === "active"
      ));
      const event = {
        id: `aaaaaaaa-aaaa-4aaa-8aaa-${sequence}`,
        campaign_id: character.campaign_id,
        character_id: character.id,
        actor_id: actorId,
        session_id: activeSession?.id ?? null,
        event_type: eventType,
        payload: { character_name: character.name, ...payload },
        created_at: new Date().toISOString(),
      };
      events.unshift(event);
      write(EVENTS_KEY, events);
      emitCampaignEvent(event);
      return event;
    }

    function recordCharacterEvents(character, previousState, actorId) {
      const previous = previousState ?? {};
      const next = character.state ?? {};
      const changed = (left, right) => JSON.stringify(left) !== JSON.stringify(right);
      if (changed(previous.resources?.hpCurrent, next.resources?.hpCurrent)) {
        appendCampaignEvent(character, actorId, "hp_changed", {
          old_value: previous.resources?.hpCurrent ?? null,
          new_value: next.resources?.hpCurrent ?? null,
          origin: character.last_change_origin,
        });
      }
      if (changed(previous.resources?.pmCurrent, next.resources?.pmCurrent)) {
        appendCampaignEvent(character, actorId, "pm_changed", {
          old_value: previous.resources?.pmCurrent ?? null,
          new_value: next.resources?.pmCurrent ?? null,
          origin: character.last_change_origin,
        });
      }
      const previousConditions = [previous.effects, previous.resources?.injury, previous.resources?.unconscious, previous.resources?.dying];
      const nextConditions = [next.effects, next.resources?.injury, next.resources?.unconscious, next.resources?.dying];
      if (changed(previousConditions, nextConditions)) {
        appendCampaignEvent(character, actorId, "conditions_changed", {
          old_count: Array.isArray(previous.effects) ? previous.effects.length : 0,
          new_count: Array.isArray(next.effects) ? next.effects.length : 0,
          origin: character.last_change_origin,
        });
      }
      const previousItems = [previous.inventory?.weapons, previous.inventory?.equipment];
      const nextItems = [next.inventory?.weapons, next.inventory?.equipment];
      if (changed(previousItems, nextItems)) {
        appendCampaignEvent(character, actorId, "item_changed", {
          old_count: (previous.inventory?.weapons?.length ?? 0) + (previous.inventory?.equipment?.length ?? 0),
          new_count: (next.inventory?.weapons?.length ?? 0) + (next.inventory?.equipment?.length ?? 0),
          origin: character.last_change_origin,
        });
      }
    }

    root.__marufiaFakeRemoteUpdate = (characterId, state, origin = "gm") => {
      const characters = read(CHARACTERS_KEY) ?? [];
      const character = characters.find((item) => item.id === characterId);
      if (!character) return null;
      const previousState = JSON.parse(JSON.stringify(character.state));
      character.state = JSON.parse(JSON.stringify(state));
      character.name = String(state?.character?.name ?? "").trim() || "Personagem sem nome";
      character.schema_version = Number(state?.meta?.schemaVersion);
      character.revision = Number(character.revision ?? 1) + 1;
      character.last_change_origin = ["player", "gm", "system"].includes(origin) ? origin : "system";
      character.updated_at = new Date().toISOString();
      write(CHARACTERS_KEY, characters);
      recordCharacterEvents(character, previousState, read(SESSION_KEY)?.user?.id ?? null);
      emitCharacterChange(character);
      return JSON.parse(JSON.stringify(character));
    };

    const auth = {
      async getSession() {
        return { data: { session: read(SESSION_KEY) }, error: null };
      },
      async signUp({ email, options }) {
        const user = {
          id: USER_ID,
          email,
          user_metadata: { display_name: options?.data?.display_name ?? "" },
        };
        const session = { access_token: "e2e-public-session", user };
        write(PROFILE_KEY, { id: user.id, display_name: user.user_metadata.display_name, avatar_url: null });
        write(SESSION_KEY, session);
        emit("SIGNED_IN", session);
        return { data: { user, session }, error: null };
      },
      async signInWithPassword({ email }) {
        const profile = read(PROFILE_KEY);
        const user = { id: profile?.id ?? USER_ID, email, user_metadata: { display_name: profile?.display_name ?? "Jogador" } };
        const session = { access_token: "e2e-public-session", user };
        write(SESSION_KEY, session);
        emit("SIGNED_IN", session);
        return { data: { user, session }, error: null };
      },
      async signOut() {
        write(SESSION_KEY, null);
        emit("SIGNED_OUT", null);
        return { error: null };
      },
      onAuthStateChange(listener) {
        listeners.add(listener);
        return { data: { subscription: { unsubscribe: () => listeners.delete(listener) } } };
      },
    };

    return {
      auth,
      channel(name) {
        const channel = {
          name,
          bindings: [],
          statusListener: null,
          on(type, config, listener) {
            this.bindings.push({ type, config, listener });
            return this;
          },
          subscribe(listener) {
            this.statusListener = listener;
            channels.add(this);
            queueMicrotask(() => listener?.("SUBSCRIBED"));
            return this;
          },
        };
        return channel;
      },
      async removeChannel(channel) {
        channels.delete(channel);
        queueMicrotask(() => channel?.statusListener?.("CLOSED"));
        return "ok";
      },
      async rpc(name, args) {
        const session = read(SESSION_KEY);
        if (!session?.user) return { data: null, error: { code: "42501", message: "authentication required" } };
        if (name === "save_character_state") {
          await new Promise((resolve) => setTimeout(resolve, 250));
          if (read(CHARACTER_FAILURE_KEY)) return { data: null, error: { code: "NETWORK", message: "fetch failed" } };
          const characters = read(CHARACTERS_KEY) ?? [];
          const character = characters.find((item) => (
            item.id === args?.p_character_id && item.owner_id === session.user.id
          ));
          if (!character) return { data: null, error: { code: "42501", message: "character owner required" } };
          if (Number(character.revision) !== Number(args?.p_expected_revision)) {
            return { data: null, error: { code: "40001", message: "character revision conflict" } };
          }
          const previousState = JSON.parse(JSON.stringify(character.state));
          character.state = JSON.parse(JSON.stringify(args.p_state));
          character.name = String(args.p_state?.character?.name ?? "").trim() || "Personagem sem nome";
          character.schema_version = Number(args.p_state?.meta?.schemaVersion);
          character.revision += 1;
          character.last_change_origin = "player";
          character.updated_at = new Date().toISOString();
          write(CHARACTER_WRITES_KEY, Number(read(CHARACTER_WRITES_KEY) ?? 0) + 1);
          write(CHARACTERS_KEY, characters);
          recordCharacterEvents(character, previousState, session.user.id);
          emitCharacterChange(character);
          return { data: JSON.parse(JSON.stringify(character)), error: null };
        }
        if ([
          "gm_set_character_hp",
          "gm_set_character_pm",
          "gm_add_character_condition",
          "gm_remove_character_condition",
          "gm_add_character_item",
          "gm_remove_character_item",
        ].includes(name)) {
          const characters = read(CHARACTERS_KEY) ?? [];
          const character = characters.find((item) => item.id === args?.p_character_id);
          const membership = (read(MEMBERSHIPS_KEY) ?? []).find((item) => (
            item.campaign_id === character?.campaign_id && item.user_id === session.user.id && item.role === "gm"
          ));
          if (!character?.campaign_id || !membership) return { data: null, error: { code: "42501", message: "campaign gm required" } };
          if (Number(character.revision) !== Number(args?.p_expected_revision)) {
            return { data: null, error: { code: "40001", message: "character revision conflict" } };
          }
          const previousState = JSON.parse(JSON.stringify(character.state));
          character.state = JSON.parse(JSON.stringify(character.state));
          if (name === "gm_set_character_hp") {
            const hp = Number(args?.p_hp_current);
            if (!Number.isSafeInteger(hp) || hp < 0 || hp > 1_000_000) {
              return { data: null, error: { code: "22023", message: "invalid character hp value" } };
            }
            character.state.resources.hpCurrent = hp;
          } else if (name === "gm_set_character_pm") {
            const pm = Number(args?.p_pm_current);
            if (!Number.isSafeInteger(pm) || pm < 0 || pm > 1_000_000) {
              return { data: null, error: { code: "22023", message: "invalid character pm value" } };
            }
            character.state.resources.pmCurrent = pm;
          } else if (name === "gm_add_character_condition") {
            const conditionName = String(args?.p_condition_name ?? "").trim();
            if (!conditionName) return { data: null, error: { code: "22023", message: "invalid character condition" } };
            const block = Number(args?.p_block);
            character.state.effects.push({
              id: `gm:condition-${character.state.effects.length + 1}`,
              name: conditionName,
              ca: Number(args?.p_ca),
              block: { cortante: block, perfurante: block, contundente: block },
            });
          } else if (name === "gm_remove_character_condition") {
            const before = character.state.effects.length;
            character.state.effects = character.state.effects.filter((effect) => effect.id !== args?.p_condition_id);
            if (character.state.effects.length === before) return { data: null, error: { code: "P0002", message: "character condition not found" } };
          } else if (name === "gm_add_character_item") {
            const kind = String(args?.p_item_kind ?? "");
            const target = kind === "weapon" ? "weapons" : kind === "equipment" ? "equipment" : "";
            if (!target || !String(args?.p_name ?? "").trim()) return { data: null, error: { code: "22023", message: "invalid character item" } };
            const item = kind === "weapon" ? {
              id: `gm:weapon-${character.state.inventory.weapons.length + 1}`,
              type: args.p_category,
              name: args.p_name,
              damage: args.p_damage,
              weight: args.p_weight,
              property: args.p_property,
              description: args.p_description,
            } : {
              id: `gm:equipment-${character.state.inventory.equipment.length + 1}`,
              name: args.p_name,
              category: args.p_category,
              qty: args.p_quantity,
              weight: args.p_weight,
              description: args.p_description,
            };
            character.state.inventory[target].push(item);
          } else if (name === "gm_remove_character_item") {
            const target = args?.p_item_kind === "weapon" ? "weapons" : args?.p_item_kind === "equipment" ? "equipment" : "";
            if (!target) return { data: null, error: { code: "22023", message: "invalid character item id" } };
            const before = character.state.inventory[target].length;
            character.state.inventory[target] = character.state.inventory[target].filter((item) => item.id !== args?.p_item_id);
            if (character.state.inventory[target].length === before) return { data: null, error: { code: "P0002", message: "character item not found" } };
            if (target === "weapons" && character.state.inventory.selectedWeaponId === args?.p_item_id) character.state.inventory.selectedWeaponId = "";
          }
          character.revision += 1;
          character.last_change_origin = "gm";
          character.updated_at = new Date().toISOString();
          write(CHARACTERS_KEY, characters);
          recordCharacterEvents(character, previousState, session.user.id);
          emitCharacterChange(character);
          return { data: JSON.parse(JSON.stringify(character)), error: null };
        }
        if (name === "start_campaign_session") {
          const campaignId = String(args?.p_campaign_id ?? "");
          const membership = (read(MEMBERSHIPS_KEY) ?? []).find((item) => (
            item.campaign_id === campaignId && item.user_id === session.user.id && item.role === "gm"
          ));
          if (!membership) return { data: null, error: { code: "42501", message: "campaign gm required" } };
          const sessionName = String(args?.p_name ?? "").trim();
          if (!sessionName || sessionName.length > 120) {
            return { data: null, error: { code: "22023", message: "invalid campaign session name" } };
          }
          const sessions = read(SESSIONS_KEY) ?? [];
          if (sessions.some((item) => item.campaign_id === campaignId && item.status === "active")) {
            return { data: null, error: { code: "23505", message: "campaign session already active" } };
          }
          const sequence = String(sessions.length + 1).padStart(12, "0");
          const campaignSession = {
            id: `bbbbbbbb-bbbb-4bbb-8bbb-${sequence}`,
            campaign_id: campaignId,
            name: sessionName,
            started_at: new Date().toISOString(),
            ended_at: null,
            status: "active",
          };
          sessions.unshift(campaignSession);
          write(SESSIONS_KEY, sessions);
          emitCampaignSession(campaignSession, "INSERT");
          return { data: JSON.parse(JSON.stringify(campaignSession)), error: null };
        }
        if (name === "end_campaign_session") {
          const sessions = read(SESSIONS_KEY) ?? [];
          const campaignSession = sessions.find((item) => item.id === args?.p_session_id);
          const membership = (read(MEMBERSHIPS_KEY) ?? []).find((item) => (
            item.campaign_id === campaignSession?.campaign_id && item.user_id === session.user.id && item.role === "gm"
          ));
          if (!campaignSession || !membership) return { data: null, error: { code: "42501", message: "campaign gm required" } };
          if (campaignSession.status === "active") {
            campaignSession.status = "ended";
            campaignSession.ended_at = new Date().toISOString();
            write(SESSIONS_KEY, sessions);
            emitCampaignSession(campaignSession, "UPDATE");
          }
          return { data: JSON.parse(JSON.stringify(campaignSession)), error: null };
        }
        if (name === "record_roll") {
          const characters = read(CHARACTERS_KEY) ?? [];
          const character = characters.find((item) => (
            item.id === args?.p_character_id && item.owner_id === session.user.id
          ));
          if (!character) return { data: null, error: { code: "42501", message: "character owner required" } };
          if (!character.campaign_id) return { data: null, error: { code: "P0002", message: "character campaign required" } };
          const membership = (read(MEMBERSHIPS_KEY) ?? []).find((item) => (
            item.campaign_id === character.campaign_id && item.user_id === session.user.id
          ));
          if (!membership) return { data: null, error: { code: "42501", message: "campaign membership required" } };
          if (!["public", "secret"].includes(args?.p_visibility)) {
            return { data: null, error: { code: "22023", message: "invalid requested roll visibility" } };
          }
          const visibility = membership.role === "gm" ? "gm" : args.p_visibility;
          const rolls = read(ROLLS_KEY) ?? [];
          const existing = rolls.find((item) => item.id === args?.p_roll_id);
          if (existing) return { data: { id: existing.id, visibility: existing.visibility }, error: null };
          const roll = {
            id: args.p_roll_id,
            campaign_id: character.campaign_id,
            character_id: character.id,
            user_id: session.user.id,
            character_name: character.name,
            roll_type: args.p_roll_type,
            skill_name: args.p_skill_name,
            mode: args.p_mode,
            formula: args.p_formula,
            raw_roll: args.p_raw_roll,
            modifier: args.p_modifier,
            target: args.p_target,
            total: args.p_total,
            outcome: args.p_outcome,
            visibility,
            created_at: new Date().toISOString(),
          };
          rolls.push(roll);
          write(ROLLS_KEY, rolls);
          appendCampaignEvent(character, session.user.id, "roll", {
            roll_id: roll.id,
            roll_type: roll.roll_type,
            skill_name: roll.skill_name,
            total: roll.total,
            outcome: roll.outcome,
            visibility: roll.visibility,
          });
          emitRollChange(roll);
          return { data: { id: args.p_roll_id, visibility }, error: null };
        }
        if (name === "touch_campaign_presence") {
          const campaignId = String(args?.p_campaign_id ?? "");
          const membership = (read(MEMBERSHIPS_KEY) ?? []).find((item) => (
            item.campaign_id === campaignId && item.user_id === session.user.id
          ));
          if (!membership) return { data: null, error: { code: "42501", message: "campaign membership required" } };
          const rows = read(PRESENCE_KEY) ?? [];
          let presence = rows.find((item) => item.campaign_id === campaignId && item.user_id === session.user.id);
          const eventType = presence ? "UPDATE" : "INSERT";
          if (!presence) {
            presence = { campaign_id: campaignId, user_id: session.user.id, seen_at: "", active_at: "" };
            rows.push(presence);
          }
          presence.seen_at = new Date().toISOString();
          if (args?.p_active !== false || !presence.active_at) presence.active_at = presence.seen_at;
          write(PRESENCE_KEY, rows);
          emitPresenceChange(presence, eventType);
          return { data: presence.seen_at, error: null };
        }
        if (name !== "join_campaign") return { data: null, error: { code: "PGRST202", message: "function not found" } };
        const code = String(args?.p_join_code ?? "").trim().toUpperCase();
        if (!/^MRF-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{2}$/.test(code)) {
          return { data: null, error: { code: "22023", message: "invalid campaign join code" } };
        }
        const campaign = (read(CAMPAIGNS_KEY) ?? []).find((item) => item.join_code === code);
        if (!campaign) return { data: null, error: { code: "P0002", message: "campaign not found" } };
        const memberships = read(MEMBERSHIPS_KEY) ?? [];
        const existing = memberships.find((membership) => (
          membership.campaign_id === campaign.id && membership.user_id === session.user.id
        ));
        if (existing) {
          return { data: [{
            campaign_id: campaign.id,
            campaign_name: campaign.name,
            member_role: existing.role,
            already_member: true,
          }], error: null };
        }
        const joinedAt = new Date().toISOString();
        memberships.push({ campaign_id: campaign.id, user_id: session.user.id, role: "player", joined_at: joinedAt });
        write(MEMBERSHIPS_KEY, memberships);
        return { data: [{
          campaign_id: campaign.id,
          campaign_name: campaign.name,
          member_role: "player",
          already_member: false,
        }], error: null };
      },
      from(table) {
        if (table === "profiles") {
          return {
            select() { return this; },
            eq() { return this; },
            async maybeSingle() { return { data: read(PROFILE_KEY), error: null }; },
          };
        }
        if (table === "campaigns") {
          let inserted = null;
          let selectedIds = [];
          return {
            select() { return this; },
            in(column, values) {
              if (column !== "id") throw new Error(`Filtro inesperado: ${column}`);
              selectedIds = values;
              return this;
            },
            insert(payload) {
              inserted = payload;
              return this;
            },
            async order() {
              const userId = read(SESSION_KEY)?.user?.id;
              const visibleIds = new Set((read(MEMBERSHIPS_KEY) ?? [])
                .filter((membership) => membership.user_id === userId)
                .map((membership) => membership.campaign_id));
              const campaigns = (read(CAMPAIGNS_KEY) ?? []).filter((campaign) => (
                selectedIds.includes(campaign.id) && visibleIds.has(campaign.id)
              ));
              return { data: campaigns, error: null };
            },
            async single() {
              const session = read(SESSION_KEY);
              if (!session?.user) return { data: null, error: { code: "42501", message: "authentication required" } };
              const campaigns = read(CAMPAIGNS_KEY) ?? [];
              const now = new Date().toISOString();
              const campaign = {
                id: `33333333-3333-4333-8333-${String(campaigns.length + 1).padStart(12, "0")}`,
                name: inserted?.name ?? "",
                description: inserted?.description ?? "",
                owner_id: session.user.id,
                join_code: `MRF-K7P4-N${(campaigns.length % 8) + 2}`,
                created_at: now,
                updated_at: now,
              };
              campaigns.unshift(campaign);
              write(CAMPAIGNS_KEY, campaigns);
              const memberships = read(MEMBERSHIPS_KEY) ?? [];
              memberships.push({
                campaign_id: campaign.id,
                user_id: session.user.id,
                role: "gm",
                joined_at: now,
              });
              write(MEMBERSHIPS_KEY, memberships);
              return { data: campaign, error: null };
            },
          };
        }
        if (table === "campaign_members") {
          let campaignIds = [];
          let selectedUserId = "";
          return {
            select() { return this; },
            in(column, values) {
              if (column !== "campaign_id") throw new Error(`Filtro inesperado: ${column}`);
              campaignIds = values;
              return this;
            },
            eq(column, value) {
              if (column !== "user_id") throw new Error(`Filtro inesperado: ${column}`);
              selectedUserId = value;
              return this;
            },
            async order() {
              const session = read(SESSION_KEY);
              const allMemberships = read(MEMBERSHIPS_KEY) ?? [];
              const gmCampaigns = new Set(allMemberships
                .filter((membership) => membership.user_id === session?.user?.id && membership.role === "gm")
                .map((membership) => membership.campaign_id));
              const memberships = allMemberships.filter((membership) => {
                const requested = selectedUserId
                  ? membership.user_id === selectedUserId
                  : campaignIds.includes(membership.campaign_id);
                const visible = membership.user_id === session?.user?.id || gmCampaigns.has(membership.campaign_id);
                return requested && visible;
              });
              return { data: memberships, error: null };
            },
          };
        }
        if (table === "rolls") {
          let campaignId = "";
          return {
            select() { return this; },
            eq(column, value) {
              if (column !== "campaign_id") throw new Error(`Filtro inesperado: ${column}`);
              campaignId = value;
              return this;
            },
            order() { return this; },
            async limit(value) {
              const session = read(SESSION_KEY);
              const memberships = read(MEMBERSHIPS_KEY) ?? [];
              const rolls = (read(ROLLS_KEY) ?? [])
                .filter((roll) => {
                  if (roll.campaign_id !== campaignId) return false;
                  const membership = memberships.find((item) => (
                    item.campaign_id === roll.campaign_id && item.user_id === session?.user?.id
                  ));
                  if (!membership) return false;
                  return roll.visibility === "public"
                    || (roll.visibility === "secret" && (roll.user_id === session.user.id || membership.role === "gm"))
                    || (roll.visibility === "gm" && roll.user_id === session.user.id && membership.role === "gm");
                })
                .sort((left, right) => String(right.created_at).localeCompare(String(left.created_at)))
                .slice(0, Number(value));
              return { data: rolls, error: null };
            },
          };
        }
        if (table === "campaign_presence") {
          let campaignId = "";
          let cutoff = "";
          return {
            select() { return this; },
            eq(column, value) {
              if (column !== "campaign_id") throw new Error(`Filtro inesperado: ${column}`);
              campaignId = value;
              return this;
            },
            gte(column, value) {
              if (column !== "seen_at") throw new Error(`Filtro inesperado: ${column}`);
              cutoff = value;
              return this;
            },
            async order() {
              const session = read(SESSION_KEY);
              const isGm = (read(MEMBERSHIPS_KEY) ?? []).some((membership) => (
                membership.campaign_id === campaignId
                && membership.user_id === session?.user?.id
                && membership.role === "gm"
              ));
              const data = isGm ? (read(PRESENCE_KEY) ?? [])
                .filter((presence) => presence.campaign_id === campaignId && presence.seen_at >= cutoff)
                .sort((left, right) => String(right.seen_at).localeCompare(String(left.seen_at))) : [];
              return { data, error: null };
            },
          };
        }
        if (table === "campaign_events") {
          let campaignId = "";
          let maximum = 80;
          return {
            select() { return this; },
            eq(column, value) {
              if (column !== "campaign_id") throw new Error(`Filtro inesperado: ${column}`);
              campaignId = value;
              return this;
            },
            order() { return this; },
            async limit(value) {
              maximum = Number(value);
              const session = read(SESSION_KEY);
              const membership = (read(MEMBERSHIPS_KEY) ?? []).find((item) => (
                item.campaign_id === campaignId && item.user_id === session?.user?.id && item.role === "gm"
              ));
              const data = membership ? (read(EVENTS_KEY) ?? [])
                .filter((event) => event.campaign_id === campaignId)
                .filter((event) => event.event_type !== "roll"
                  || event.payload?.visibility !== "gm"
                  || event.actor_id === session.user.id)
                .sort((left, right) => String(right.created_at).localeCompare(String(left.created_at)))
                .slice(0, maximum) : [];
              return { data, error: null };
            },
          };
        }
        if (table === "campaign_sessions") {
          let campaignId = "";
          let maximum = 30;
          return {
            select() { return this; },
            eq(column, value) {
              if (column !== "campaign_id") throw new Error(`Filtro inesperado: ${column}`);
              campaignId = value;
              return this;
            },
            order() { return this; },
            async limit(value) {
              maximum = Number(value);
              const session = read(SESSION_KEY);
              const membership = (read(MEMBERSHIPS_KEY) ?? []).find((item) => (
                item.campaign_id === campaignId && item.user_id === session?.user?.id && item.role === "gm"
              ));
              const data = membership ? (read(SESSIONS_KEY) ?? [])
                .filter((campaignSession) => campaignSession.campaign_id === campaignId)
                .sort((left, right) => String(right.started_at).localeCompare(String(left.started_at)))
                .slice(0, maximum) : [];
              return { data, error: null };
            },
          };
        }
        if (table === "characters") {
          let operation = "list";
          let payload = null;
          let filterColumn = "";
          let filterValue = "";
          return {
            select() { return this; },
            eq(column, value) {
              filterColumn = column;
              filterValue = value;
              return this;
            },
            insert(value) {
              operation = "insert";
              payload = value;
              return this;
            },
            update(value) {
              operation = "update";
              payload = value;
              return this;
            },
            async order() {
              const userId = read(SESSION_KEY)?.user?.id;
              const gmCampaigns = new Set((read(MEMBERSHIPS_KEY) ?? [])
                .filter((membership) => membership.user_id === userId && membership.role === "gm")
                .map((membership) => membership.campaign_id));
              const characters = (read(CHARACTERS_KEY) ?? [])
                .filter((character) => (
                  (character.owner_id === userId || gmCampaigns.has(character.campaign_id))
                  && (!filterColumn || character[filterColumn] === filterValue)
                ))
                .sort((left, right) => String(right.updated_at).localeCompare(String(left.updated_at)));
              return { data: characters, error: null };
            },
            async single() {
              const session = read(SESSION_KEY);
              if (!session?.user) return { data: null, error: { code: "42501", message: "authentication required" } };
              const characters = read(CHARACTERS_KEY) ?? [];
              if (operation === "insert") {
                const now = new Date().toISOString();
                const character = {
                  id: `44444444-4444-4444-8444-${String(characters.length + 1).padStart(12, "0")}`,
                  owner_id: session.user.id,
                  campaign_id: null,
                  name: String(payload?.state?.character?.name ?? "").trim() || "Personagem sem nome",
                  state: payload.state,
                  schema_version: Number(payload?.state?.meta?.schemaVersion),
                  revision: 1,
                  last_change_origin: "player",
                  created_at: now,
                  updated_at: now,
                };
                characters.push(character);
                write(CHARACTERS_KEY, characters);
                return { data: character, error: null };
              }
              const character = characters.find((item) => item.id === filterValue && item.owner_id === session.user.id);
              if (!character) return { data: null, error: { code: "PGRST116", message: "row not found" } };
              if (operation === "update") {
                if (Object.hasOwn(payload ?? {}, "campaign_id")) {
                  character.campaign_id = payload.campaign_id;
                  character.revision += 1;
                  character.last_change_origin = "player";
                }
                character.updated_at = new Date().toISOString();
                write(CHARACTERS_KEY, characters);
                emitCharacterChange(character);
              }
              return { data: character, error: null };
            },
          };
        }
        throw new Error(`Tabela inesperada no teste: ${table}`);
      },
    };
  }

  root.supabase = { createClient };
})(window);
