import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { repoRoot } from '../lib/repo-root.mjs';
import { job, steps } from '../lib/workflow-text.mjs';

// The Component Source ZIP is a customer deliverable. A buyer opens `example/index.html` from disk, where
// `location.host` is empty, so the `*.handsontable.com` exception does not apply and a grid with no key
// shows the blocking lock (19.0). This file pins what the ZIP tells the buyer:
//
//   1. the example carries the commented `licenseKey` line the docs examples use, with a pointer to a key;
//   2. the example never ships an active key, and never the internal test key;
//   3. the ZIP's documentation text says the example needs a key and where to put it.

const workflow = readFileSync(path.join(repoRoot(), '.github', 'workflows', 'componentsource.yml'), 'utf8');
const assemble = steps(job(workflow, 'build-componentsource'))
  .find(step => /^- name: Assemble demo artifact$/m.test(step)) ?? '';
const [, exampleHtml = ''] = assemble.match(/<<'HTML'\n([\s\S]*?)\n\s*HTML\n/) ?? [];
const licenseNote = assemble.split('\n').find(line => line.includes('>> "$DOCS/documentation.txt"')) ?? '';

test('the assemble step and the example page are found', () => {
  assert.notEqual(assemble, '');
  assert.match(exampleHtml, /new Handsontable\(/);
  assert.notEqual(licenseNote, '');
});

test('the example carries the commented licenseKey line with a pointer to a key', () => {
  assert.match(
    exampleHtml,
    /^\s*\/\/ licenseKey: 'your-license-key', \/\/ get a key at https:\/\/handsontable\.com\/pricing\/$/m
  );
});

test('uncommenting the licenseKey line leaves a script that parses', () => {
  const [, script = ''] = exampleHtml.match(/<script>\n([\s\S]*?)<\/script>/) ?? [];
  const uncommented = script.replace(/\/\/ (licenseKey: 'your-license-key',) \/\/ .*/, '$1');

  assert.match(uncommented, /^\s*licenseKey: 'your-license-key',$/m);
  assert.doesNotThrow(() => new Function(uncommented));
  assert.doesNotThrow(() => new Function(script));
});

test('the example ships no active license key and no test key', () => {
  const activeKey = exampleHtml
    .split('\n')
    .filter(line => !/^\s*(\/\/|<!--)/.test(line))
    .filter(line => /license/i.test(line));

  assert.deepEqual(activeKey, []);
  assert.doesNotMatch(workflow, /TEST_LICENSE_KEY/);
});

test('the documentation text tells the buyer what to do about the license key', () => {
  assert.match(licenseNote, /license key/);
  assert.match(licenseNote, /blocking license message/);
  assert.match(licenseNote, /example\/index\.html/);
  assert.match(licenseNote, /uncomment the licenseKey line/);
  assert.match(licenseNote, /https:\/\/handsontable\.com\/pricing\//);
});
