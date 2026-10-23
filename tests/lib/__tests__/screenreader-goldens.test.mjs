import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadScenarios } from '../screenreader-scenario.mjs';
import { GOLDEN_SCHEMA, normalizeAnnouncement } from '../screenreader-transcript.mjs';

// tests/AGENTS.md ("Screen readers: the NVDA lane", "Recording goldens"): a golden is recorded on the
// Windows runner and committed by hand, so nothing but this test reads it before the next nightly. A
// golden whose steps no longer match its scenario (a step renamed, added, removed or reordered) would
// show as golden differences on every night until it is re-recorded; this fails on the pull request
// instead, and names what to re-record.

const TESTS_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const GOLDENS_DIR = path.join(TESTS_ROOT, 'screenreader/goldens');
const SCENARIOS_DIR = path.join(TESTS_ROOT, 'screenreader/scenarios');
const CONFIG = path.join(TESTS_ROOT, 'playwright.screenreader.config.ts');
const DOM_ECHO_PROJECT = 'dom-echo-chromium';

/**
 * The project names `playwright.screenreader.config.ts` declares, read from its text: the tooling job
 * installs no dependencies, so the config cannot be imported.
 *
 * @returns {string[]} The project names.
 */
function configProjects() {
  return [...readFileSync(CONFIG, 'utf8').matchAll(/name: '([a-z0-9-]+)'/g)].map(match => match[1]);
}

/**
 * Every committed golden, with its project directory and file name.
 *
 * @returns {{project: string, fileName: string, file: string}[]} The goldens.
 */
function committedGoldens() {
  return readdirSync(GOLDENS_DIR, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .flatMap(entry => readdirSync(path.join(GOLDENS_DIR, entry.name))
      .map(fileName => ({ project: entry.name, fileName, file: path.join(GOLDENS_DIR, entry.name, fileName) })));
}

test('the config declares the projects a golden can belong to', () => {
  const projects = configProjects();

  assert.deepEqual(projects, ['nvda-chromium', 'nvda-firefox', 'vo-webkit', 'vo-chromium', DOM_ECHO_PROJECT],
    'the project names this test reads from playwright.screenreader.config.ts');
});

test('every committed golden belongs to a screen reader project and its scenario, step for step', () => {
  const projects = configProjects();
  const scenarios = new Map(loadScenarios(SCENARIOS_DIR).map(({ scenario }) => [scenario.id, scenario]));
  const goldens = committedGoldens();

  assert.ok(goldens.length > 0, 'the NVDA goldens are committed');
  assert.equal(existsSync(path.join(GOLDENS_DIR, DOM_ECHO_PROJECT)), false,
    `${DOM_ECHO_PROJECT} has no committed golden: the dom-echo lane reads the DOM, it says nothing about a screen reader`);

  goldens.forEach(({ project, fileName, file }) => {
    const where = `screenreader/goldens/${project}/${fileName}`;

    assert.match(fileName, /^[a-z0-9-]+\.json$/, `${where}: a golden is <scenario>.json`);

    let golden;

    assert.doesNotThrow(() => {
      golden = JSON.parse(readFileSync(file, 'utf8'));
    }, `${where} parses as JSON`);

    const id = fileName.slice(0, -'.json'.length);
    const scenario = scenarios.get(id);

    assert.equal(golden.schema, GOLDEN_SCHEMA, `${where}: schema ${GOLDEN_SCHEMA}`);
    assert.equal(golden.scenario, id, `${where}: "scenario" is the file's name`);
    assert.equal(golden.project, project, `${where}: "project" is the directory's name`);
    assert.ok(projects.includes(project), `${where}: "${project}" is a project of playwright.screenreader.config.ts`);
    assert.notEqual(project, DOM_ECHO_PROJECT, `${where}: the dom-echo lane's goldens are never committed`);
    assert.ok(scenario, `${where}: the scenario "${id}" exists under screenreader/scenarios/`);
    assert.ok(typeof golden.steps === 'object' && golden.steps !== null && !Array.isArray(golden.steps),
      `${where}: "steps" is an object of step id to normalized announcement, got ${JSON.stringify(golden.steps)}`);
    assert.deepEqual(Object.keys(golden.steps), scenario.steps.map(step => step.id),
      `${where}: the golden's steps are the scenario's step ids, in order. A step renamed, added, removed or moved needs the golden re-recorded (the nightly's update-goldens dispatch).`);
    Object.entries(golden.steps).forEach(([step, announcement]) => {
      assert.equal(typeof announcement, 'string', `${where}: step "${step}" is a string, got ${JSON.stringify(announcement)}`);
      assert.equal(announcement, normalizeAnnouncement(announcement),
        `${where}: step "${step}" holds the normalized announcement, as the update mode writes it; a raw or hand-edited text would differ on every run`);
    });

    if (project.startsWith('nvda-')) {
      assert.match(String(golden.recorded?.screenReader), /^NVDA/, `${where}: an NVDA project's golden was recorded by NVDA`);
    }
  });
});
