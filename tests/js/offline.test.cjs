"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const offlineTools = require("../../src/online/offline.js");

function timers() {
  let sequence = 0;
  const pending = new Map();
  const delays = [];
  return {
    pending,
    delays,
    set(callback, delay) {
      sequence += 1;
      pending.set(sequence, callback);
      delays.push(delay);
      return sequence;
    },
    clear(id) { pending.delete(id); },
    runNext() {
      const entry = pending.entries().next().value;
      if (!entry) return false;
      pending.delete(entry[0]);
      entry[1]();
      return true;
    },
  };
}

async function settle() {
  await new Promise((resolve) => setImmediate(resolve));
}

test("separates local identities by backend without using the public key", () => {
  const cloud = offlineTools.backendScope({
    backendMode: "cloud",
    supabaseUrl: "https://project.supabase.co/",
    publishableKey: "not-part-of-the-scope",
  });
  const selfHosted = offlineTools.backendScope({
    backendMode: "selfhosted",
    supabaseUrl: "https://api.marufiarpg.org",
    publishableKey: "another-public-key",
  });
  assert.equal(cloud, "cloud@https://project.supabase.co");
  assert.equal(selfHosted, "selfhosted@https://api.marufiarpg.org");
  assert.notEqual(cloud, selfHosted);
  assert.equal(offlineTools.scopedIdentity(selfHosted, "user", "character"), `${selfHosted}|user|character`);
  assert.equal(offlineTools.allowsLegacyCloudRecords(cloud), true);
  assert.equal(offlineTools.allowsLegacyCloudRecords(selfHosted), false);
  assert.doesNotMatch(cloud + selfHosted, /public-key|not-part/i);
});

test("retries a server task with bounded backoff until it succeeds", async () => {
  const clock = timers();
  let calls = 0;
  const scheduler = offlineTools.createRetryScheduler(async () => {
    calls += 1;
    return calls >= 3;
  }, {
    delays: [10, 20, 30],
    setTimer: clock.set,
    clearTimer: clock.clear,
  });

  assert.equal(scheduler.schedule(), true);
  assert.equal(scheduler.schedule(), false, "A mesma falha não deve criar timers duplicados.");
  assert.deepEqual(clock.delays, [10]);

  assert.equal(clock.runNext(), true);
  await settle();
  assert.equal(calls, 1);
  assert.equal(scheduler.attempt(), 1);
  assert.deepEqual(clock.delays, [10, 20]);

  clock.runNext();
  await settle();
  assert.equal(calls, 2);
  assert.deepEqual(clock.delays, [10, 20, 30]);

  clock.runNext();
  await settle();
  assert.equal(calls, 3);
  assert.equal(scheduler.attempt(), 0);
  assert.equal(scheduler.pending(), false);
});

test("pauses offline and wakes immediately when the connection can be used", async () => {
  const clock = timers();
  let ready = false;
  let calls = 0;
  const scheduler = offlineTools.createRetryScheduler(async () => {
    calls += 1;
    return true;
  }, {
    delays: [25],
    isReady: () => ready,
    setTimer: clock.set,
    clearTimer: clock.clear,
  });

  assert.equal(scheduler.schedule(), false);
  ready = true;
  assert.equal(await scheduler.wake(), true);
  assert.equal(calls, 1);
  scheduler.schedule();
  assert.equal(scheduler.pending(), true);
  scheduler.pause();
  assert.equal(scheduler.pending(), false);
  scheduler.destroy();
  assert.equal(scheduler.schedule(), false);
});

test("loads the offline coordinator before synchronization and roll registration", () => {
  const root = path.resolve(__dirname, "..", "..");
  const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const build = fs.readFileSync(path.join(root, "tools", "build.py"), "utf8");
  const offlinePosition = index.indexOf('src="src/online/offline.js"');
  const syncPosition = index.indexOf('src="src/online/character_sync.js"');
  const rollsPosition = index.indexOf('src="src/online/rolls.js"');
  assert.ok(offlinePosition >= 0 && syncPosition > offlinePosition && rollsPosition > offlinePosition);
  assert.match(build, /"src\/online\/offline\.js"/);
});
