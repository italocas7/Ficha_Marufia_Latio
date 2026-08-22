"use strict";

const JOIN_CODE = "MRF-K7P4-N2";

function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function databaseError(code, message) {
  return { code, message };
}

class Query {
  constructor(server, userId, table) {
    this.server = server;
    this.userId = userId;
    this.table = table;
    this.action = "select";
    this.payload = null;
    this.filters = [];
    this.sort = null;
    this.maximum = null;
  }

  select() {
    return this;
  }

  insert(payload) {
    this.action = "insert";
    this.payload = clone(payload);
    return this;
  }

  update(payload) {
    this.action = "update";
    this.payload = clone(payload);
    return this;
  }

  eq(column, value) {
    this.filters.push({ kind: "eq", column, value });
    return this;
  }

  in(column, values) {
    this.filters.push({ kind: "in", column, value: [...values] });
    return this;
  }

  gte(column, value) {
    this.filters.push({ kind: "gte", column, value });
    return this;
  }

  order(column, options = {}) {
    this.sort = { column, ascending: options.ascending !== false };
    return this;
  }

  limit(value) {
    this.maximum = Number(value);
    return this;
  }

  single() {
    return this.server.execute(this, true);
  }

  then(resolve, reject) {
    return this.server.execute(this, false).then(resolve, reject);
  }
}

class SharedChannel {
  constructor(server, userId, name) {
    this.server = server;
    this.userId = userId;
    this.name = name;
    this.bindings = [];
    this.onStatus = () => {};
    this.active = false;
  }

  on(type, config, listener) {
    this.bindings.push({ type, config: { ...config }, listener });
    return this;
  }

  subscribe(onStatus = () => {}) {
    this.onStatus = onStatus;
    this.active = true;
    this.server.channels.add(this);
    queueMicrotask(() => {
      if (this.active) this.onStatus("SUBSCRIBED");
    });
    return this;
  }
}

class SharedSupabaseServer {
  constructor(seed = {}) {
    const saved = seed && typeof seed === "object" ? seed : {};
    this.campaigns = clone(Array.isArray(saved.campaigns) ? saved.campaigns : []);
    this.memberships = clone(Array.isArray(saved.memberships) ? saved.memberships : []);
    this.characters = clone(Array.isArray(saved.characters) ? saved.characters : []);
    this.rolls = clone(Array.isArray(saved.rolls) ? saved.rolls : []);
    this.channels = new Set();
    this.campaignSerial = this.campaigns.length;
    this.characterSerial = this.characters.length;
    const savedTimes = [...this.campaigns, ...this.memberships, ...this.characters, ...this.rolls]
      .flatMap((row) => [row.created_at, row.updated_at, row.joined_at])
      .map((value) => Date.parse(String(value ?? "")))
      .filter(Number.isFinite);
    this.clock = savedTimes.length
      ? Math.max(...savedTimes) + 1_000
      : Date.parse("2026-08-21T12:00:00.000Z");
  }

  clientFor(userId) {
    const id = String(userId).toLowerCase();
    return Object.freeze({
      auth: Object.freeze({
        getSession: async () => ({
          data: { session: { user: { id } } },
          error: null,
        }),
      }),
      from: (table) => new Query(this, id, table),
      rpc: (name, args) => this.rpc(id, name, args),
      channel: (name) => new SharedChannel(this, id, name),
      removeChannel: async (channel) => {
        channel.active = false;
        this.channels.delete(channel);
        queueMicrotask(() => channel.onStatus("CLOSED"));
        return "ok";
      },
    });
  }

  nextTime() {
    const value = new Date(this.clock).toISOString();
    this.clock += 1_000;
    return value;
  }

  nextUuid(kind) {
    const serial = kind === "campaign" ? ++this.campaignSerial : ++this.characterSerial;
    const head = kind === "campaign" ? "aaaaaaaa-aaaa-4aaa-8aaa" : "bbbbbbbb-bbbb-4bbb-8bbb";
    return `${head}-${String(serial).padStart(12, "0")}`;
  }

  membership(campaignId, userId) {
    return this.memberships.find((item) => item.campaign_id === campaignId && item.user_id === userId) ?? null;
  }

  visible(table, row, userId) {
    if (table === "campaigns") return Boolean(this.membership(row.id, userId));
    if (table === "campaign_members") {
      const own = this.membership(row.campaign_id, userId);
      return Boolean(own && (own.role === "gm" || row.user_id === userId));
    }
    if (table === "characters") {
      if (row.owner_id === userId) return true;
      return this.membership(row.campaign_id, userId)?.role === "gm";
    }
    if (table === "rolls") {
      const member = this.membership(row.campaign_id, userId);
      if (!member) return false;
      if (row.visibility === "public") return true;
      if (row.visibility === "secret") return row.user_id === userId || member.role === "gm";
      return row.visibility === "gm" && row.user_id === userId;
    }
    return false;
  }

  filteredRows(query) {
    const source = query.table === "campaign_members" ? this.memberships : this[query.table];
    if (!Array.isArray(source)) return [];
    let rows = source.filter((row) => this.visible(query.table, row, query.userId));
    for (const filter of query.filters) {
      if (filter.kind === "eq") rows = rows.filter((row) => row[filter.column] === filter.value);
      if (filter.kind === "in") rows = rows.filter((row) => filter.value.includes(row[filter.column]));
      if (filter.kind === "gte") rows = rows.filter((row) => String(row[filter.column] ?? "") >= String(filter.value));
    }
    if (query.sort) {
      const direction = query.sort.ascending ? 1 : -1;
      rows = [...rows].sort((left, right) => String(left[query.sort.column] ?? "").localeCompare(String(right[query.sort.column] ?? "")) * direction);
    }
    if (Number.isSafeInteger(query.maximum) && query.maximum >= 0) rows = rows.slice(0, query.maximum);
    return rows;
  }

  async execute(query, single) {
    if (query.action === "insert") return this.insert(query, single);
    if (query.action === "update") return this.update(query, single);
    const rows = this.filteredRows(query).map(clone);
    if (!single) return { data: rows, error: null };
    if (rows.length !== 1) return { data: null, error: databaseError("PGRST116", "single row required") };
    return { data: rows[0], error: null };
  }

  async insert(query) {
    const createdAt = this.nextTime();
    if (query.table === "campaigns") {
      const row = {
        id: this.nextUuid("campaign"),
        name: String(query.payload?.name ?? ""),
        description: String(query.payload?.description ?? ""),
        owner_id: query.userId,
        join_code: JOIN_CODE,
        created_at: createdAt,
        updated_at: createdAt,
      };
      this.campaigns.push(row);
      this.memberships.push({ campaign_id: row.id, user_id: query.userId, role: "gm", joined_at: createdAt });
      return { data: clone(row), error: null };
    }
    if (query.table === "characters") {
      const state = clone(query.payload?.state);
      const row = {
        id: this.nextUuid("character"),
        owner_id: query.userId,
        campaign_id: null,
        name: this.characterName(state),
        state,
        schema_version: Number(state?.meta?.schemaVersion),
        revision: 1,
        last_change_origin: "player",
        created_at: createdAt,
        updated_at: createdAt,
      };
      this.characters.push(row);
      return { data: clone(row), error: null };
    }
    return { data: null, error: databaseError("42P01", "unsupported insert") };
  }

  async update(query) {
    if (query.table !== "characters") {
      return { data: null, error: databaseError("42P01", "unsupported update") };
    }
    const id = query.filters.find((filter) => filter.kind === "eq" && filter.column === "id")?.value;
    const row = this.characters.find((item) => item.id === id);
    if (!row || row.owner_id !== query.userId) {
      return { data: null, error: databaseError("42501", "character owner required") };
    }
    const campaignId = query.payload?.campaign_id ?? row.campaign_id;
    if (campaignId && !this.membership(campaignId, query.userId)) {
      return { data: null, error: databaseError("42501", "campaign membership required") };
    }
    row.campaign_id = campaignId;
    row.revision += 1;
    row.last_change_origin = "player";
    row.updated_at = this.nextTime();
    this.emit("characters", "UPDATE", row);
    return { data: clone(row), error: null };
  }

  characterName(state) {
    return String(state?.character?.name ?? "").trim().slice(0, 120) || "Personagem sem nome";
  }

  async rpc(userId, name, args = {}) {
    if (name === "join_campaign") return this.joinCampaign(userId, args.p_join_code);
    if (name === "save_character_state") return this.saveCharacter(userId, args);
    if (name === "gm_set_character_hp") return this.setCharacterHp(userId, args);
    if (name === "record_roll") return this.recordRoll(userId, args);
    return { data: null, error: databaseError("42883", `unsupported rpc: ${name}`) };
  }

  async joinCampaign(userId, code) {
    const campaign = this.campaigns.find((item) => item.join_code === code);
    if (!campaign) return { data: null, error: databaseError("P0002", "campaign not found") };
    const existing = this.membership(campaign.id, userId);
    if (!existing) {
      this.memberships.push({ campaign_id: campaign.id, user_id: userId, role: "player", joined_at: this.nextTime() });
    }
    return {
      data: {
        campaign_id: campaign.id,
        campaign_name: campaign.name,
        member_role: existing?.role ?? "player",
        already_member: Boolean(existing),
      },
      error: null,
    };
  }

  async saveCharacter(userId, args) {
    const row = this.characters.find((item) => item.id === args.p_character_id);
    if (!row || row.owner_id !== userId) {
      return { data: null, error: databaseError("42501", "character owner required") };
    }
    if (row.revision !== args.p_expected_revision) {
      return { data: null, error: databaseError("40001", "character revision conflict") };
    }
    row.state = clone(args.p_state);
    row.name = this.characterName(row.state);
    row.schema_version = Number(row.state?.meta?.schemaVersion);
    row.revision += 1;
    row.last_change_origin = "player";
    row.updated_at = this.nextTime();
    this.emit("characters", "UPDATE", row);
    return { data: clone(row), error: null };
  }

  async setCharacterHp(userId, args) {
    const row = this.characters.find((item) => item.id === args.p_character_id);
    const role = row ? this.membership(row.campaign_id, userId)?.role : null;
    if (!row || role !== "gm") {
      return { data: null, error: databaseError("42501", "campaign gm required") };
    }
    if (row.revision !== args.p_expected_revision) {
      return { data: null, error: databaseError("40001", "character revision conflict") };
    }
    row.state = {
      ...clone(row.state),
      resources: { ...clone(row.state.resources), hpCurrent: args.p_hp_current },
    };
    row.revision += 1;
    row.last_change_origin = "gm";
    row.updated_at = this.nextTime();
    this.emit("characters", "UPDATE", row);
    return { data: clone(row), error: null };
  }

  async recordRoll(userId, args) {
    const character = this.characters.find((item) => item.id === args.p_character_id);
    if (!character || character.owner_id !== userId || !character.campaign_id) {
      return { data: null, error: databaseError("42501", "character owner required") };
    }
    const membership = this.membership(character.campaign_id, userId);
    if (!membership) return { data: null, error: databaseError("42501", "campaign membership required") };
    if (this.rolls.some((roll) => roll.id === args.p_roll_id)) {
      return { data: null, error: databaseError("23505", "duplicate roll") };
    }
    const visibility = membership.role === "gm" ? "gm" : args.p_visibility;
    const row = {
      id: args.p_roll_id,
      campaign_id: character.campaign_id,
      character_id: character.id,
      user_id: userId,
      character_name: character.name,
      roll_type: args.p_roll_type,
      skill_name: args.p_skill_name,
      mode: args.p_mode,
      formula: args.p_formula,
      raw_roll: clone(args.p_raw_roll),
      modifier: args.p_modifier,
      target: args.p_target,
      total: args.p_total,
      outcome: args.p_outcome,
      visibility,
      created_at: this.nextTime(),
    };
    this.rolls.push(row);
    this.emit("rolls", "INSERT", row);
    return { data: { id: row.id, visibility }, error: null };
  }

  matches(binding, table, event, row) {
    if (binding.type !== "postgres_changes" || binding.config.table !== table) return false;
    if (binding.config.event !== "*" && binding.config.event !== event) return false;
    const match = /^([a-z_]+)=eq\.(.+)$/.exec(String(binding.config.filter ?? ""));
    return !match || String(row[match[1]] ?? "").toLowerCase() === match[2].toLowerCase();
  }

  emit(table, event, row) {
    const commitTimestamp = this.nextTime();
    for (const channel of this.channels) {
      if (!channel.active || !this.visible(table, row, channel.userId)) continue;
      for (const binding of channel.bindings) {
        if (!this.matches(binding, table, event, row)) continue;
        const payload = {
          eventType: event,
          schema: "public",
          table,
          commit_timestamp: commitTimestamp,
          old: { id: row.id, campaign_id: row.campaign_id },
          new: clone(row),
        };
        queueMicrotask(() => {
          if (channel.active) binding.listener(payload);
        });
      }
    }
  }

  snapshot() {
    return clone({
      campaigns: this.campaigns,
      memberships: this.memberships,
      characters: this.characters,
      rolls: this.rolls,
    });
  }
}

function createSharedSupabase(seed) {
  return new SharedSupabaseServer(seed);
}

module.exports = {
  JOIN_CODE,
  createSharedSupabase,
};
