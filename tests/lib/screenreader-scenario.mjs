/**
 * The screen reader scenarios: the shape of a `screenreader/scenarios/<surface>.scenario.json` file,
 * and the validator that `lib/__tests__/screenreader-scenarios.test.mjs` (root `test:tooling`) runs
 * every committed file through, so a scenario that would fail inside a 30-minute Windows job fails on
 * a pull request instead.
 *
 * A scenario is data, not code: the fixture page, the setup that puts the focus in the grid, and the
 * ordered steps a keyboard user takes, each with the phrase groups its announcement must carry. The
 * same file drives every screen reader lane (NVDA now, VoiceOver next), because what differs per
 * screen reader is the wording, which the goldens hold per project, not the path or the required
 * tokens (`tests/AGENTS.md`, "Screen readers: the NVDA lane").
 *
 * No I/O in here except `loadScenarios()`, which the spec and the tooling test share.
 */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { normalizeAnnouncement } from './screenreader-transcript.mjs';

export const SCENARIO_SCHEMA = 1;
export const SCENARIO_FILE_SUFFIX = '.scenario.json';
/**
 * The action vocabulary. `press` is a Playwright key or chord (`ArrowRight`, `Shift+F10`), sent to the
 * page with `page.keyboard.press()`, so the screen reader sees the page react and never the keystroke;
 * `type` is text typed into the focused element; `selectCell` is `[row, col]` through the instance's
 * `selectCell()`, which is how a step reaches a cell without a pointer and how the setup puts the focus
 * in the grid before the first key.
 */
export const ACTIONS = ['press', 'type', 'selectCell'];
/**
 * The modifiers a `press` chord may start with, joined to the key by `+` (`Shift+F10`,
 * `Control+Alt+M`), as Playwright names them.
 */
export const PRESS_MODIFIERS = ['Shift', 'Control', 'Alt', 'Meta', 'ControlOrMeta'];
/**
 * The named keys a `press` may end with, as Playwright names them; any other key is one printable
 * character (`a`, `M`, `/`).
 */
export const PRESS_KEYS = [
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Escape', 'Tab', 'Backspace', 'Delete', 'Insert',
  'Home', 'End', 'PageUp', 'PageDown', 'Space', 'F1..F12', 'Digit0..9', 'KeyA..KeyZ',
];
/**
 * A `press` value Playwright accepts: an optional chord of `PRESS_MODIFIERS` joined by `+`, then one of
 * `PRESS_KEYS` or a single printable character. A misspelled key (`ArrowRigth`) is refused on the pull
 * request: `page.keyboard.press()` would throw only inside the Windows job, or, for an unknown single
 * word, type nothing a user could.
 */
export const PRESS_PATTERN = new RegExp(
  `^(?:(?:${PRESS_MODIFIERS.join('|')})\\+)*`
  + '(?:Arrow(?:Up|Down|Left|Right)|Enter|Escape|Tab|Backspace|Delete|Insert|Home|End|PageUp|PageDown|Space'
  + '|F(?:1[0-2]|[1-9])|Digit[0-9]|Key[A-Z]|[^\\p{C}\\s])$',
  'u',
);
/**
 * A scenario or step id: a kebab-case slug that starts with a letter. A step id is a key of the golden's
 * `steps` object, and `JSON.parse` moves an integer-like key (`"2"`) ahead of every other, so such an id
 * would read as a reordered step.
 */
const ID_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const QUERY_PATTERN = /^[A-Za-z0-9=&_.-]*$/;
const SELECTOR_LIMIT = 200;

/**
 * Validates one scenario document.
 *
 * @param {unknown} doc The parsed JSON.
 * @param {object} [options] Options.
 * @param {string[]} [options.fixtures] The fixture file names under `fixtures/demo/`; when given, the
 * scenario's fixture must be one of them.
 * @param {string} [options.fileName] The file's name, which must be `<id>.scenario.json`.
 * @returns {string[]} The problems, empty when the scenario is valid.
 */
export function validateScenario(doc, { fixtures, fileName } = {}) {
  const problems = [];

  if (!isPlainObject(doc)) {
    return ['the scenario is not an object'];
  }

  const known = new Set(['schema', 'id', 'surface', 'fixture', 'query', 'setup', 'steps']);

  Object.keys(doc).filter(key => !known.has(key)).forEach(key => problems.push(`unknown field "${key}"`));

  if (doc.schema !== SCENARIO_SCHEMA) {
    problems.push(`schema must be ${SCENARIO_SCHEMA}, got ${JSON.stringify(doc.schema)}`);
  }
  if (typeof doc.id !== 'string' || !ID_PATTERN.test(doc.id)) {
    problems.push(`id must be a kebab-case slug that starts with a letter, got ${JSON.stringify(doc.id)}`);
  } else if (fileName !== undefined && fileName !== `${doc.id}${SCENARIO_FILE_SUFFIX}`) {
    problems.push(`the file is named "${fileName}", the scenario "${doc.id}": the name must be "${doc.id}${SCENARIO_FILE_SUFFIX}"`);
  }
  if (typeof doc.surface !== 'string' || doc.surface.trim().length < 10) {
    problems.push('surface must say what the scenario covers, in at least ten characters');
  }
  if (typeof doc.fixture !== 'string' || !/^[a-z0-9-]+\.html$/.test(doc.fixture)) {
    problems.push(`fixture must be a file name under fixtures/demo/, got ${JSON.stringify(doc.fixture)}`);
  } else if (fixtures && !fixtures.includes(doc.fixture)) {
    problems.push(`fixture "${doc.fixture}" is not under fixtures/demo/`);
  }
  if (doc.query !== undefined && (typeof doc.query !== 'string' || !QUERY_PATTERN.test(doc.query))) {
    problems.push(`query must be a query string without "?" (key=value&key=value), got ${JSON.stringify(doc.query)}`);
  }
  if (doc.setup !== undefined) {
    if (!Array.isArray(doc.setup)) {
      problems.push('setup must be an array of actions');
    } else {
      doc.setup.forEach((action, index) => validateAction(action, `setup[${index}]`).forEach(problem => problems.push(problem)));
    }
  }
  if (!Array.isArray(doc.steps) || doc.steps.length === 0) {
    problems.push('steps must be a non-empty array');
  } else {
    const ids = new Set();

    doc.steps.forEach((step, index) => {
      validateStep(step, `steps[${index}]`).forEach(problem => problems.push(problem));

      if (isPlainObject(step) && typeof step.id === 'string') {
        if (ids.has(step.id)) {
          problems.push(`steps[${index}]: duplicate id "${step.id}"`);
        }
        ids.add(step.id);
      }
    });
  }

  return problems;
}

/**
 * Validates one step.
 *
 * @param {unknown} step The step.
 * @param {string} where Its place, for the message.
 * @returns {string[]} The problems.
 */
function validateStep(step, where) {
  if (!isPlainObject(step)) {
    return [`${where}: a step must be an object`];
  }

  const problems = [];
  const known = new Set(['id', 'action', 'expect', 'after', 'note']);

  Object.keys(step).filter(key => !known.has(key)).forEach(key => problems.push(`${where}: unknown field "${key}"`));

  if (typeof step.id !== 'string' || !ID_PATTERN.test(step.id)) {
    problems.push(`${where}: id must be a kebab-case slug that starts with a letter, got ${JSON.stringify(step.id)}`);
  }
  validateAction(step.action, `${where}.action`).forEach(problem => problems.push(problem));

  if (!Array.isArray(step.expect)) {
    problems.push(`${where}: expect must be an array of token groups (an empty array for a step that asserts nothing)`);
  } else {
    step.expect.forEach((group, index) => {
      if (!Array.isArray(group) || group.length === 0
        || group.some(token => typeof token !== 'string' || token.trim() === '')) {
        problems.push(`${where}.expect[${index}]: a token group is a non-empty array of non-empty strings`);

        return;
      }
      // A synonym that normalizes to nothing (punctuation alone, or the screen reader's own chatter)
      // can never match, so its group would fail every night once the lane gates.
      group.filter(token => normalizeAnnouncement(token) === '').forEach((token) => {
        problems.push(`${where}.expect[${index}]: step "${step.id}": the synonym ${JSON.stringify(token)} normalizes to an empty string `
          + '(punctuation or screen reader chatter alone), so it can never match');
      });
    });
  }
  if (step.after !== undefined) {
    if (!isPlainObject(step.after) || Object.keys(step.after).length !== 1
      || !['visible', 'hidden'].includes(Object.keys(step.after)[0])
      || typeof Object.values(step.after)[0] !== 'string' || Object.values(step.after)[0].length === 0
      || Object.values(step.after)[0].length > SELECTOR_LIMIT) {
      problems.push(`${where}: after must be { "visible": "<selector>" } or { "hidden": "<selector>" }`);
    }
  }
  if (step.note !== undefined && typeof step.note !== 'string') {
    problems.push(`${where}: note must be a string`);
  }

  return problems;
}

/**
 * Validates one action: an object with exactly one key from `ACTIONS` and a value of its shape.
 *
 * @param {unknown} action The action.
 * @param {string} where Its place, for the message.
 * @returns {string[]} The problems.
 */
function validateAction(action, where) {
  if (!isPlainObject(action) || Object.keys(action).length !== 1) {
    return [`${where}: an action is an object with exactly one of ${ACTIONS.join(', ')}`];
  }

  const [name] = Object.keys(action);
  const value = action[name];

  if (!ACTIONS.includes(name)) {
    return [`${where}: unknown action "${name}" (one of ${ACTIONS.join(', ')})`];
  }
  if ((name === 'press' || name === 'type') && (typeof value !== 'string' || value.length === 0)) {
    return [`${where}: ${name} takes a non-empty string`];
  }
  if (name === 'press' && !PRESS_PATTERN.test(value)) {
    return [`${where}: press "${value}" is not a Playwright key: an optional chord of ${PRESS_MODIFIERS.join(', ')} joined by "+", `
      + `then one of ${PRESS_KEYS.join(', ')} or a single printable character`];
  }
  if (name === 'selectCell' && !(Array.isArray(value) && value.length === 2 && value.every(Number.isInteger))) {
    return [`${where}: selectCell takes [row, col]`];
  }

  return [];
}

/**
 * Reads every `*.scenario.json` of a directory, sorted by name, and validates each.
 *
 * @param {string} directory The scenarios directory.
 * @param {object} [options] Options.
 * @param {string[]} [options.fixtures] The fixture file names, passed to `validateScenario()`.
 * @returns {{fileName: string, scenario: object, problems: string[]}[]} One entry per file.
 */
export function loadScenarios(directory, { fixtures } = {}) {
  return readdirSync(directory)
    .filter(name => name.endsWith(SCENARIO_FILE_SUFFIX))
    .sort()
    .map((fileName) => {
      let scenario = null;

      // Only the parse is caught: an exception from the validator is a bug in it, never invalid JSON.
      try {
        scenario = JSON.parse(readFileSync(path.join(directory, fileName), 'utf8'));
      } catch (error) {
        return { fileName, scenario, problems: [`not valid JSON: ${error instanceof Error ? error.message : String(error)}`] };
      }

      return { fileName, scenario, problems: validateScenario(scenario, { fixtures, fileName }) };
    });
}

/**
 * The fixture URL of a scenario: the fixture page with the project's theme and bundle first, then the
 * scenario's own query.
 *
 * @param {{fixture: string, query?: string}} scenario The scenario.
 * @param {{theme?: string, bundle?: string}} [options] The project's theme and bundle.
 * @returns {string} The path and query, relative to the server root.
 */
export function scenarioUrl(scenario, { theme = 'main', bundle = 'umd' } = {}) {
  const query = [`theme=${theme}`, `bundle=${bundle}`, scenario.query].filter(Boolean).join('&');

  return `/tests/fixtures/demo/${scenario.fixture}?${query}`;
}

/**
 * Whether a value is a plain object.
 *
 * @param {unknown} value The value.
 * @returns {boolean} Whether it is a plain object.
 */
function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
