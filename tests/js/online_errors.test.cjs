"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const errorTools = require("../../src/online/errors.js");

test("uses the approved local-first synchronization failure message", () => {
  const message = errorTools.friendlyOnlineError("sync");
  assert.equal(message.title, "Não foi possível sincronizar sua ficha.");
  assert.equal(message.detail, "Os dados continuam salvos neste computador.");
});

test("explains a temporarily unavailable Marufia Server without discarding local work", () => {
  const message = errorTools.friendlyOnlineError("server");
  assert.equal(message.title, "Servidor de Marufia indisponível.");
  assert.match(message.detail, /dados locais/i);
  assert.match(message.detail, /sincronizadas quando a conexão retornar/i);
});

test("records only bounded diagnostics and never retains sensitive error content", () => {
  const log = errorTools.createSafeErrorLog({ now: () => "2026-08-22T05:00:00.000Z" });
  const failure = Object.assign(
    new Error("password=nao-guardar Bearer token-nao-guardar service_role_key=nao-guardar"),
    { code: "SECRET_TOKEN_NAO_GUARDAR", password: "nao-guardar" },
  );
  const entry = log.record(failure, {
    scope: "password-nao-guardar",
    operation: "service-role-nao-guardar",
    token: "nao-guardar",
  });
  const serialized = JSON.stringify({ entry, entries: log.entries() });

  assert.equal(entry.code, "LAT-ONLINE-UNKNOWN");
  assert.equal(entry.scope, "online");
  assert.equal(entry.operation, "unknown");
  assert.equal(entry.kind, "unknown");
  assert.doesNotMatch(serialized, /nao-guardar|password=|bearer|service_role_key/i);
  assert.doesNotMatch(serialized, /stack|payload|context/i);
});

test("keeps the in-memory error log small, newest-first, and immutable", () => {
  let tick = 0;
  const log = errorTools.createSafeErrorLog({ limit: 2, now: () => `t${++tick}` });
  log.record(Object.assign(new Error("fetch failed"), { code: "NETWORK" }), { scope: "sync", operation: "save" });
  log.record(Object.assign(new Error("permission denied"), { code: "42501" }), { scope: "online", operation: "load" });
  log.record(Object.assign(new Error("invalid value"), { code: "22023" }), { scope: "online", operation: "update" });
  const entries = log.entries();

  assert.equal(entries.length, 2);
  assert.deepEqual(entries.map((entry) => entry.at), ["t3", "t2"]);
  assert.deepEqual(entries.map((entry) => entry.kind), ["validation", "permission"]);
  assert.equal(Object.isFrozen(entries), true);
  assert.equal(Object.isFrozen(entries[0]), true);
});

test("dispatches only the sanitized entry and can record silently", () => {
  const events = [];
  const view = {
    CustomEvent: class CustomEvent {
      constructor(type, options) { this.type = type; this.detail = options.detail; }
    },
    dispatchEvent(event) { events.push(event); },
  };
  errorTools.clear();
  errorTools.report(new Error("token=oculto"), { scope: "sync", operation: "save" }, view);
  errorTools.report(new Error("password=oculta"), { scope: "realtime", operation: "subscribe", show: false }, view);

  assert.equal(events.length, 1);
  assert.equal(events[0].type, errorTools.ONLINE_ERROR_EVENT);
  assert.equal(events[0].detail.scope, "sync");
  assert.doesNotMatch(JSON.stringify(events), /token=oculto|password=oculta/i);
  assert.equal(errorTools.entries().length, 2);
});

test("renders an accessible error without interpolating technical content", () => {
  function element(tagName) {
    return {
      tagName,
      className: "",
      dataset: {},
      children: [],
      attributes: {},
      textContent: "",
      setAttribute(name, value) { this.attributes[name] = value; },
      append(...children) { this.children.push(...children); },
      remove() { this.removed = true; },
    };
  }
  const toastRoot = element("div");
  toastRoot.querySelector = () => null;
  const document = {
    defaultView: { setTimeout() {} },
    querySelector(selector) { return selector === "#toastRoot" ? toastRoot : null; },
    createElement: element,
  };
  const entry = errorTools.createSafeErrorLog().record(
    new Error("password e token não podem aparecer"),
    { scope: "sync", operation: "save" },
  );
  const toast = errorTools.showOnlineError(document, entry);

  assert.equal(toast.attributes.role, "alert");
  assert.equal(toast.dataset.onlineErrorKey, "sync:save");
  assert.deepEqual(toast.children.map((child) => child.textContent), [
    "Não foi possível sincronizar sua ficha.",
    "Os dados continuam salvos neste computador.",
  ]);
  assert.doesNotMatch(JSON.stringify(toast), /password e token/i);
});
