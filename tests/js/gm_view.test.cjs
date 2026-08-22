const test = require("node:test");
const assert = require("node:assert/strict");

const viewer = require("../../src/online/gm_view.js");

test("accepts a schema v5 state only from the parent with the exact viewer token", () => {
  const parent = {};
  const state = { meta: { appId: "marufia-latio", schemaVersion: 5 } };
  const event = { source: parent, data: { type: viewer.MESSAGE_TYPE, token: "safe-token", state } };
  assert.equal(viewer.validMessage(event, "safe-token", parent), true);
  assert.equal(viewer.validMessage(event, "wrong-token", parent), false);
  assert.equal(viewer.validMessage({ ...event, source: {} }, "safe-token", parent), false);
  assert.equal(viewer.validMessage({ ...event, data: { ...event.data, state: { meta: { appId: "other", schemaVersion: 5 } } } }, "safe-token", parent), false);
});

test("reads the isolated viewer token without accepting malformed locations", () => {
  assert.equal(viewer.viewerToken({ search: "?token=abc-123" }), "abc-123");
  assert.equal(viewer.viewerToken({ search: "" }), "");
  assert.equal(viewer.viewerToken(null), "");
});
