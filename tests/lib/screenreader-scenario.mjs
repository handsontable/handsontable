/**
 * The screen reader scenarios: the shape of a `screenreader/scenarios/<surface>.scenario.json` file,
 * and the validator that `lib/__tests__/screenreader-scenarios.test.mjs` (root `test:tooling`) runs
 * every committed file through, so a scenario that would fail inside a Windows or macOS job fails on
 * a pull request instead.
 *
 * A scenario is data, not code: the page (a catalog page of `a11y/pages.mjs`, or a fixture file), the
 * setup that puts the user where the scenario starts, and the ordered steps a user takes, each with the
 * phrase groups its announcement must carry. The same file drives every screen reader lane (NVDA and
 * VoiceOver), because what differs per screen reader is how a primitive is driven and how a fact is
 * phrased, which the readers and the goldens hold, not the path or the required tokens (`tests/AGENTS.md`,
 * "Screen readers: the NVDA and VoiceOver lanes").
 *
 * No I/O in here except `loadScenarios()`, which the spec and the tooling test share.
 */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { A11Y_PAGES } from '../a11y/pages.mjs';
import { WCAG_CRITERIA } from './a11y-evidence.mjs';
import { SCENARIO_GROUPS } from './screenreader-matrix.mjs';
import { TOKEN_SEVERITIES, describeAction, normalizeAnnouncement } from './screenreader-transcript.mjs';

export const SCENARIO_SCHEMA = 1;
export const SCENARIO_FILE_SUFFIX = '.scenario.json';
/**
 * The step primitives, one per step. `press` is a Playwright key or chord (`ArrowRight`, `Shift+F10`),
 * sent to the page with `page.keyboard.press()`, so the screen reader sees the page react and never the
 * keystroke, identically on every lane; `type` is text typed into the focused element; `selectCell` is
 * `[row, col]` through the instance's `selectCell()`, which is how a host moves the focus without a
 * pointer. `read` (`next`, `previous`, `in`, `out`) and `activate` are the screen reader's own commands,
 * which each reader drives its way (`LANE_PRIMITIVES`): the reading mode a user moves through the page
 * with, and the reader's activate gesture. `call` is a host event, not a user action: `["name", ...args]`
 * calls a function the fixture puts on `window` (`window.resolveRequest(0, "New A")`, the server answering
 * a pending request), so a scenario reaches a status message that no key causes (WCAG 4.1.3). Its name is
 * an identifier, never a path, so a scenario calls only what the fixture exposes for it, and a function the
 * page lacks is a red test, never a silent step.
 */
export const ACTIONS = ['press', 'type', 'selectCell', 'read', 'activate', 'call'];
/**
 * What a `setup` may do before the reader settles: the step primitives the page drives (`press`, `type`,
 * `selectCell`), and three that set the scene without a user's key: `updateSettings` (an object passed to
 * the instance's `updateSettings()`, to turn a catalog page into the shape a scenario needs: frozen panes,
 * a navigation mode), `spreadsheetData` (`[rows, columns]`: the grid loads that many rows of `A1`-style
 * values, the way `Handsontable.helper.createSpreadsheetData()` builds them, for a grid larger than its
 * viewport), `sentinels` (`true`: a button before and one after the grid's root container, so a
 * Tab out of the grid lands on the page and never leaves the document, as the keyboard walker brackets a
 * grid), `focus` (a selector of an element to focus, such as a sentinel) and `call` (a host event, as
 * in a step: a request the scenario starts before the reader settles). The reader's own commands never run
 * in the setup: a reader that cannot drive one would have no way to declare it.
 */
export const SETUP_ACTIONS = ['press', 'type', 'selectCell', 'updateSettings', 'spreadsheetData', 'sentinels', 'focus', 'call'];
/**
 * The name a `call` names: a JavaScript identifier, the property of `window` the fixture sets. A dot or a
 * bracket would reach into the page's objects, which a scenario has no business doing.
 */
export const CALL_NAME_PATTERN = /^[A-Za-z_$][\w$]*$/;
/**
 * The largest grid a `spreadsheetData` setup loads: enough rows for a virtualized grid, few enough that a
 * scenario never waits on the load.
 */
export const SPREADSHEET_LIMITS = Object.freeze({ rows: 1000, columns: 26 });
export const READ_DIRECTIONS = ['next', 'previous', 'in', 'out'];
/**
 * The screen reader lanes a step can declare `unsupported` on, by the reader that drives them. A project
 * belongs to its lane by its name's prefix (`laneOfProject()`); the iOS and TalkBack lanes join this list
 * when their readers exist.
 */
export const SCREENREADER_LANES = ['nvda', 'voiceover'];
/**
 * The reader primitives each lane drives, and how: a step whose primitive its lane cannot drive declares
 * `unsupported: { "<lane>": "<reason>" }`, and the runner skips it there and reports it as a gap, never
 * silently. The validator refuses a step that needs a declaration and has none.
 *
 * - NVDA reads in browse mode (the runner switches to it, then sends NVDA's Down and Up Arrow) and
 *   activates with Enter in browse mode. It has no interaction level: browse mode reads into a table
 *   without entering it, so `read in` and `read out` mean nothing to it.
 * - VoiceOver reads with VO-Right and VO-Left, enters and leaves an element with VO-Shift-Down and
 *   VO-Shift-Up (interacting), and activates with VO-Space.
 */
export const LANE_PRIMITIVES = Object.freeze({
  nvda: { read: ['next', 'previous'], activate: true },
  voiceover: { read: ['next', 'previous', 'in', 'out'], activate: true },
});
/**
 * Where the reader starts. `grid` (the default): the reader enters the page's first item, the grid,
 * before the setup (VoiceOver interacts with it), the way the focus-driven scenarios have always run.
 * `page`: the reader stays at the top of the page and enters nothing, so the steps reach the grid the way
 * a user who arrives on the page does (a Tab from a sentinel, a `read next` past the page's toolbar).
 */
export const STARTS = ['grid', 'page'];
/**
 * The scenario groups a lane job runs one of, re-exported from `screenreader-matrix.mjs` (the
 * dependency-free list the workflows' `check-inputs` and `verdict` jobs read), so a scenario's `group` is
 * validated here against the same list the matrix is pinned to.
 */
export { SCENARIO_GROUPS };
/**
 * What a scenario may take on a slow runner: a step costs four to five seconds on VoiceOver and about
 * thirteen when it is silent, and a run on a busy macOS runner took every step 1.7 to 2 times as long, so a
 * 38-step traversal that reads in under four minutes on a quiet runner ran out a fixed five-minute budget
 * twice. The budget per step covers that slower runner, and the entry covers loading the page and entering
 * it. The runner's test timeout is this budget, never below the config's five minutes
 * (`screenreader/screenreader.spec.ts`), and the workflow's run step fits every group's budgets plus one
 * retry of its largest scenario (`.github/scripts/__tests__/screenreader-workflow.test.mjs`).
 */
export const STEP_BUDGET_MS = 12_000;
export const ENTRY_BUDGET_MS = 60_000;

/**
 * A scenario's budget on a slow runner: the entry plus a step budget per step.
 *
 * @param {{steps: unknown[]}} scenario The scenario.
 * @returns {number} The budget, in milliseconds.
 */
export function scenarioBudgetMs(scenario) {
  return ENTRY_BUDGET_MS + (scenario.steps.length * STEP_BUDGET_MS);
}
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
 * request: `page.keyboard.press()` would throw only inside a lane job, or, for an unknown single
 * word, type nothing a user could.
 */
export const PRESS_PATTERN = new RegExp(
  `^(?:(?:${PRESS_MODIFIERS.join('|')})\\+)*`
  + '(?:Arrow(?:Up|Down|Left|Right)|Enter|Escape|Tab|Backspace|Delete|Insert|Home|End|PageUp|PageDown|Space'
  + '|F(?:1[0-2]|[1-9])|Digit[0-9]|Key[A-Z]|[^\\p{C}\\s])$',
  'u',
);
/**
 * The values a scenario's `query` may give the project's `theme` and `bundle`, the fixtures' allowlists:
 * a scenario that runs on another theme says so in its query (`theme=horizon`), and the runner puts it in
 * the project's place, because a fixture reads the first value of a repeated parameter.
 */
export const QUERY_THEMES = ['main', 'horizon', 'classic'];
export const QUERY_BUNDLES = ['umd', 'full-min'];
/**
 * The root container of a page's grid when its catalog entry names none, as the axe scan's harness has it.
 */
export const DEFAULT_ROOT = '[data-testid="grid"]';
/**
 * A scenario or step id: a kebab-case slug that starts with a letter. A step id is a key of the golden's
 * `steps` object, and `JSON.parse` moves an integer-like key (`"2"`) ahead of every other, so such an id
 * would read as a reordered step.
 */
const ID_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const QUERY_PATTERN = /^[A-Za-z0-9=&_.-]*$/;
const SELECTOR_LIMIT = 200;
const REASON_MINIMUM = 10;
/**
 * The fields a variant (`variantOf`) may set: it is its base's steps on another theme, query or setup, so
 * the steps, the page and the traversal come from the base and stay one copy.
 */
const VARIANT_FIELDS = new Set(['schema', 'id', 'surface', 'variantOf', 'query', 'setup', 'criteria', 'group']);
const PAGE_IDS = new Set(A11Y_PAGES.map(page => page.id));

/**
 * The lane a Playwright project of `playwright.screenreader.config.ts` belongs to, by its name's prefix.
 *
 * @param {string} project The project (`nvda-chromium`, `vo-webkit`, `dom-echo-chromium`).
 * @returns {string} The lane (`nvda`, `voiceover`, `dom-echo`), or the project's name when no prefix matches.
 */
export function laneOfProject(project) {
  if (project.startsWith('nvda-')) {
    return 'nvda';
  }
  if (project.startsWith('vo-')) {
    return 'voiceover';
  }
  if (project.startsWith('dom-echo-')) {
    return 'dom-echo';
  }

  return project;
}

/**
 * Whether a lane can drive a step's action without a declaration: the page's own actions everywhere, and a
 * reader primitive where `LANE_PRIMITIVES` lists it. The `dom-echo` lane drives every primitive, because it
 * proves the plumbing, not a reader.
 *
 * @param {string} lane The lane.
 * @param {object} action The step's action.
 * @returns {boolean} Whether the lane drives it.
 */
export function laneDrives(lane, action) {
  const primitives = Object.hasOwn(LANE_PRIMITIVES, lane) ? LANE_PRIMITIVES[lane] : null;

  if (lane === 'dom-echo' || !primitives) {
    return true;
  }
  if ('read' in action) {
    return primitives.read.includes(action.read);
  }
  if ('activate' in action) {
    return primitives.activate === true;
  }

  return true;
}

/**
 * The reason a step is skipped on a lane: its own `unsupported` declaration for that lane, or `null` when
 * the lane runs it.
 *
 * @param {{unsupported?: Record<string, string>}} step The step.
 * @param {string} lane The lane.
 * @returns {string|null} The reason.
 */
export function unsupportedReason(step, lane) {
  return step.unsupported && Object.hasOwn(step.unsupported, lane) ? step.unsupported[lane] : null;
}

/**
 * The primitives a lane does not drive across a set of scenarios: every step a scenario declares
 * `unsupported` on that lane, as its action reads (`read in`), each once, sorted. It is what the job
 * summary lists per lane and what the matrix in `docs/content/data/accessibility.json` records.
 *
 * @param {{steps: {action: object, unsupported?: Record<string, string>}[]}[]} scenarios The resolved scenarios.
 * @param {string} lane The lane.
 * @returns {string[]} The primitives.
 */
export function laneUnsupported(scenarios, lane) {
  return [...new Set(scenarios.flatMap(scenario => scenario.steps
    .filter(step => unsupportedReason(step, lane) !== null)
    .map(step => describeAction(step.action))))].sort();
}

/**
 * Validates one scenario document, as written in its file (a variant before it is resolved).
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

  const variant = doc.variantOf !== undefined;
  const known = variant
    ? VARIANT_FIELDS
    : new Set(['schema', 'id', 'surface', 'group', 'page', 'state', 'fixture', 'catalogPages', 'query', 'start', 'criteria', 'setup', 'steps', 'traversal']);

  Object.keys(doc).filter(key => !known.has(key)).forEach(key => problems.push(variant
    ? `field "${key}" is not allowed in a variant: a variant takes its base's ${key}, and sets only ${[...VARIANT_FIELDS].join(', ')}`
    : `unknown field "${key}"`));

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
  if (variant && doc.criteria === undefined) {
    // A variant without criteria evidences what its base does.
  } else if (!Array.isArray(doc.criteria) || doc.criteria.length === 0) {
    problems.push('criteria must name the WCAG 2.2 success criteria the scenario evidences (`["4.1.2"]`)');
  } else {
    doc.criteria.filter(id => !Object.hasOwn(WCAG_CRITERIA, id)).forEach(id => problems.push(`criteria: ${JSON.stringify(id)} is not a WCAG 2.2 success criterion`));
    if (new Set(doc.criteria).size !== doc.criteria.length) {
      problems.push('criteria lists a criterion twice');
    }
  }
  if (!(variant && doc.group === undefined) && !SCENARIO_GROUPS.includes(doc.group)) {
    problems.push(`group must be one of ${SCENARIO_GROUPS.join(', ')}, the job that runs the scenario, got ${JSON.stringify(doc.group)}`);
  }
  problems.push(...queryProblems(doc.query));
  if (doc.setup !== undefined) {
    if (!Array.isArray(doc.setup)) {
      problems.push('setup must be an array of actions');
    } else {
      doc.setup.forEach((action, index) => validateAction(action, `setup[${index}]`, SETUP_ACTIONS).forEach(problem => problems.push(problem)));
    }
  }

  if (variant) {
    if (typeof doc.variantOf !== 'string' || !ID_PATTERN.test(doc.variantOf)) {
      problems.push(`variantOf must name the scenario this one varies, got ${JSON.stringify(doc.variantOf)}`);
    } else if (doc.variantOf === doc.id) {
      problems.push('variantOf names the scenario itself');
    }

    return problems;
  }

  problems.push(...placeProblems(doc, fixtures));
  problems.push(...catalogPageProblems(doc));
  if (doc.start !== undefined && !STARTS.includes(doc.start)) {
    problems.push(`start must be one of ${STARTS.join(', ')}, got ${JSON.stringify(doc.start)}`);
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
    if (doc.traversal !== undefined) {
      problems.push(...traversalProblems(doc.traversal, doc.steps));
    }
  }

  return problems;
}

/**
 * The problems of where a scenario opens: exactly one of `page` (a catalog page of `a11y/pages.mjs`, whose
 * fixture, query and root container it opens) or `fixture` (a file under `fixtures/demo/`, for a page the
 * catalog does not hold). A scenario on a fixture names the catalog pages it stands for (`catalogPages`),
 * the pages `screenreader/coverage.mjs` lists it under, so the coverage test can match the two.
 *
 * @param {object} doc The scenario.
 * @param {string[]|undefined} fixtures The fixture file names.
 * @returns {string[]} The problems.
 */
function placeProblems(doc, fixtures) {
  if ((doc.page === undefined) === (doc.fixture === undefined)) {
    return ['a scenario names exactly one of page (a catalog page of tests/a11y/pages.mjs) or fixture (a file under fixtures/demo/)'];
  }
  if (doc.page !== undefined) {
    if (doc.catalogPages !== undefined) {
      return ['catalogPages is for a scenario on a fixture: a scenario on a catalog page stands for that page'];
    }

    return typeof doc.page === 'string' && PAGE_IDS.has(doc.page)
      ? []
      : [`page ${JSON.stringify(doc.page)} is not a page of tests/a11y/pages.mjs`];
  }
  if (typeof doc.fixture !== 'string' || !/^[a-z0-9-]+\.html$/.test(doc.fixture)) {
    return [`fixture must be a file name under fixtures/demo/, got ${JSON.stringify(doc.fixture)}`];
  }
  if (fixtures && !fixtures.includes(doc.fixture)) {
    return [`fixture "${doc.fixture}" is not under fixtures/demo/`];
  }
  if (!Array.isArray(doc.catalogPages) || doc.catalogPages.length === 0 || new Set(doc.catalogPages).size !== doc.catalogPages.length
    || doc.catalogPages.some(page => typeof page !== 'string' || !PAGE_IDS.has(page))) {
    return [`catalogPages must list the pages of tests/a11y/pages.mjs this fixture stands for, each once, the pages screenreader/coverage.mjs lists it under, got ${JSON.stringify(doc.catalogPages)}`];
  }

  return [];
}

/**
 * The problems of a scenario on a catalog page that the runner cannot set up. The runner opens the page's
 * fixture, query and root container at rest, never its `state` (a menu or an editor the axe scan opens
 * first) or its `device`, so:
 *
 * - a page with a `device` is refused: the screen reader lanes run desktop browsers;
 * - a page whose state is not `none` needs the scenario's `state` to name it: the scenario's own steps
 *   reach that state (they open the editor or the menu with the keys a user presses), and a scenario that
 *   never reaches it would close the page's gap in `screenreader/coverage.mjs` without reading the surface;
 * - a page at rest takes no `state`;
 * - the scenario's query never sets a key the page's query sets: the fixtures read the first value of a
 *   repeated key, so the page's would win and the scenario would run on the page's grid while it says
 *   otherwise (`theme` and `bundle` excepted: the runner puts the scenario's first).
 *
 * @param {{page?: unknown, state?: unknown, query?: unknown, fixture?: unknown}} scenario The scenario, or a
 * resolved variant.
 * @returns {string[]} The problems.
 */
function catalogPageProblems(scenario) {
  const entry = typeof scenario.page === 'string' ? A11Y_PAGES.find(page => page.id === scenario.page) : undefined;

  if (!entry) {
    return scenario.state === undefined ? [] : ['state names the catalog state of the scenario\'s page: a scenario on a fixture has none'];
  }

  const problems = [];
  const pageState = entry.state ?? 'none';

  if (entry.device !== undefined) {
    problems.push(`page "${entry.id}" emulates a device (${entry.device}), and the screen reader lanes run desktop browsers`);
  }
  if (pageState === 'none' && scenario.state !== undefined) {
    problems.push(`state: page "${entry.id}" is at rest in the catalog, so a scenario on it names no state`);
  } else if (pageState !== 'none' && scenario.state !== pageState) {
    problems.push(`page "${entry.id}" is in the "${pageState}" state in the catalog, which the runner does not set up: the scenario's steps reach it, and the scenario says so with "state": "${pageState}"`);
  }
  if (typeof scenario.query === 'string' && typeof entry.query === 'string') {
    const pageKeys = new Set(new URLSearchParams(entry.query).keys());

    [...new Set(new URLSearchParams(scenario.query).keys())]
      .filter(key => key !== 'theme' && key !== 'bundle' && pageKeys.has(key))
      .forEach(key => problems.push(`query sets "${key}", which page "${entry.id}" sets already (${entry.query}): the fixture reads the page's first value, so the scenario's would never apply`));
  }

  return problems;
}

/**
 * The problems of a scenario's query: a query string without `?`, whose `theme` and `bundle`, when it sets
 * them, are values the fixtures accept.
 *
 * @param {unknown} query The query.
 * @returns {string[]} The problems.
 */
function queryProblems(query) {
  if (query === undefined) {
    return [];
  }
  if (typeof query !== 'string' || !QUERY_PATTERN.test(query)) {
    return [`query must be a query string without "?" (key=value&key=value), got ${JSON.stringify(query)}`];
  }

  const params = new URLSearchParams(query);
  const problems = [];

  [['theme', QUERY_THEMES], ['bundle', QUERY_BUNDLES]].forEach(([name, allowed]) => {
    const values = params.getAll(name);

    if (values.length > 1) {
      problems.push(`query sets ${name} more than once`);
    } else if (values.length === 1 && !allowed.includes(values[0])) {
      problems.push(`query: ${name}=${values[0]} is not one of ${allowed.join(', ')}`);
    }
  });

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
  const known = new Set(['id', 'action', 'expect', 'severity', 'after', 'note', 'unsupported']);

  Object.keys(step).filter(key => !known.has(key)).forEach(key => problems.push(`${where}: unknown field "${key}"`));

  if (typeof step.id !== 'string' || !ID_PATTERN.test(step.id)) {
    problems.push(`${where}: id must be a kebab-case slug that starts with a letter, got ${JSON.stringify(step.id)}`);
  }

  const actionProblems = validateAction(step.action, `${where}.action`, ACTIONS);

  problems.push(...actionProblems);

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
  if (step.severity !== undefined) {
    validateSeverity(step.severity, Array.isArray(step.expect) ? step.expect : [], where).forEach(problem => problems.push(problem));
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
  if (step.unsupported !== undefined) {
    if (!isPlainObject(step.unsupported) || Object.keys(step.unsupported).length === 0) {
      problems.push(`${where}: unsupported must be an object of lane to reason ({ "nvda": "<why>" })`);
    } else {
      Object.entries(step.unsupported).forEach(([lane, reason]) => {
        if (!SCREENREADER_LANES.includes(lane)) {
          problems.push(`${where}: unsupported names "${lane}", not a lane (${SCREENREADER_LANES.join(', ')})`);
        }
        if (typeof reason !== 'string' || reason.trim().length < REASON_MINIMUM) {
          problems.push(`${where}: unsupported.${lane} must say why, in at least ${REASON_MINIMUM} characters`);
        }
      });
    }
  }
  // A lane that cannot drive the primitive skips the step only when the step says so: the skip is a gap
  // the report lists, never a silent one.
  if (actionProblems.length === 0) {
    SCREENREADER_LANES.filter(lane => !laneDrives(lane, step.action) && unsupportedReason(step, lane) === null)
      .forEach(lane => problems.push(`${where}: step "${step.id}": the ${lane} lane cannot drive ${JSON.stringify(step.action)} `
        + `(LANE_PRIMITIVES), so the step declares unsupported.${lane} with the reason`));
  }

  return problems;
}

/**
 * Validates a step's `severity`: an object that gives some of its token groups a severity other than the
 * default (serious), each group named by its first synonym. A name that is not the first synonym of exactly one
 * group names nothing, so renaming a group cannot leave its severity behind on another.
 *
 * @param {unknown} severity The declaration.
 * @param {unknown[]} groups The step's token groups.
 * @param {string} where The step's place, for the message.
 * @returns {string[]} The problems.
 */
function validateSeverity(severity, groups, where) {
  if (!isPlainObject(severity)) {
    return [`${where}: severity must be an object of { "<first synonym of a group>": "<severity>" }`];
  }

  const names = Object.keys(severity);

  if (names.length === 0) {
    return [`${where}: severity must name at least one token group`];
  }

  const firsts = groups.filter(group => Array.isArray(group) && typeof group[0] === 'string').map(group => group[0]);
  const problems = [];

  for (const name of names) {
    const value = severity[name];
    const groupsNamed = firsts.filter(first => first === name).length;

    if (!TOKEN_SEVERITIES.includes(value)) {
      problems.push(`${where}: severity of ${JSON.stringify(name)} must be one of ${TOKEN_SEVERITIES.join(', ')}, got ${JSON.stringify(value)}`);
    }
    if (groupsNamed === 0) {
      problems.push(`${where}: severity names ${JSON.stringify(name)}, which is not the first synonym of a token group of the step (${firsts.join(', ')})`);
    } else if (groupsNamed > 1) {
      problems.push(`${where}: severity names ${JSON.stringify(name)}, the first synonym of more than one token group, so it names none of them`);
    }
  }

  return problems;
}

/**
 * Validates one action: an object with exactly one key from the vocabulary and a value of its shape.
 *
 * @param {unknown} action The action.
 * @param {string} where Its place, for the message.
 * @param {string[]} vocabulary The actions allowed there (`ACTIONS` for a step, `SETUP_ACTIONS` for the setup).
 * @returns {string[]} The problems.
 */
function validateAction(action, where, vocabulary) {
  if (!isPlainObject(action) || Object.keys(action).length !== 1) {
    return [`${where}: an action is an object with exactly one of ${vocabulary.join(', ')}`];
  }

  const [name] = Object.keys(action);
  const value = action[name];

  if (!vocabulary.includes(name)) {
    return [`${where}: unknown action "${name}" (one of ${vocabulary.join(', ')})`];
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
  if (name === 'read' && !READ_DIRECTIONS.includes(value)) {
    return [`${where}: read takes one of ${READ_DIRECTIONS.join(', ')}, got ${JSON.stringify(value)}`];
  }
  if ((name === 'activate' || name === 'sentinels') && value !== true) {
    return [`${where}: ${name} takes true`];
  }
  if (name === 'updateSettings' && (!isPlainObject(value) || Object.keys(value).length === 0)) {
    return [`${where}: updateSettings takes an object of settings`];
  }
  if (name === 'spreadsheetData' && !(Array.isArray(value) && value.length === 2 && value.every(Number.isInteger)
    && value[0] >= 1 && value[0] <= SPREADSHEET_LIMITS.rows && value[1] >= 1 && value[1] <= SPREADSHEET_LIMITS.columns)) {
    return [`${where}: spreadsheetData takes [rows, columns], at most ${SPREADSHEET_LIMITS.rows} rows and ${SPREADSHEET_LIMITS.columns} columns`];
  }
  if (name === 'focus' && (typeof value !== 'string' || value.length === 0 || value.length > SELECTOR_LIMIT)) {
    return [`${where}: focus takes the selector of the element to focus`];
  }
  if (name === 'call' && !(Array.isArray(value) && typeof value[0] === 'string' && CALL_NAME_PATTERN.test(value[0]))) {
    return [`${where}: call takes ["name", ...args], where name is a function the fixture puts on window (an identifier, `
      + `${CALL_NAME_PATTERN}), and args are JSON values`];
  }

  return [];
}

/**
 * The problems of a scenario's `traversal`: the read steps (`from` to `to`, inclusive, in step order) and
 * the items that must each be announced exactly once across them, in order.
 *
 * @param {unknown} traversal The traversal.
 * @param {object[]} steps The scenario's steps.
 * @returns {string[]} The problems.
 */
function traversalProblems(traversal, steps) {
  if (!isPlainObject(traversal)) {
    return ['traversal must be { "from": "<step id>", "to": "<step id>", "items": [...] }'];
  }

  const problems = [];
  const ids = steps.map(step => step?.id);

  Object.keys(traversal).filter(key => !['from', 'to', 'items'].includes(key)).forEach(key => problems.push(`traversal: unknown field "${key}"`));
  ['from', 'to'].forEach((key) => {
    const step = steps.find(item => item?.id === traversal[key]);

    if (!step) {
      problems.push(`traversal.${key} must be a step id, got ${JSON.stringify(traversal[key])}`);
    } else if (isPlainObject(step.unsupported) && Object.keys(step.unsupported).length > 0) {
      // A lane skips an unsupported step, so the window would lose its bound there and widen to the run.
      problems.push(`traversal.${key} names step "${step.id}", which ${Object.keys(step.unsupported).join(' and ')} does not drive: a bound of the window is a step every lane runs`);
    }
  });
  if (ids.includes(traversal.from) && ids.includes(traversal.to) && ids.indexOf(traversal.from) > ids.indexOf(traversal.to)) {
    problems.push('traversal.from comes after traversal.to');
  }
  const synonyms = Array.isArray(traversal.items) ? traversal.items.map(item => (Array.isArray(item) ? item : [item])) : [];

  if (!Array.isArray(traversal.items) || traversal.items.length === 0
    || synonyms.some(group => group.length === 0 || group.some(item => typeof item !== 'string' || normalizeAnnouncement(item) === ''))) {
    problems.push('traversal.items must be a non-empty array of items, each a string with a fact in it, or a list of synonyms for one');
  } else {
    const all = synonyms.flat().map(item => normalizeAnnouncement(item));

    if (new Set(all).size !== all.length) {
      problems.push('traversal.items lists an item twice: each must be announced exactly once, so each, and each synonym, is distinct');
    }
  }

  return problems;
}

/**
 * Resolves the variants of a loaded set: a variant takes its base's page or fixture, start, steps and
 * traversal, and its own id, surface, criteria, query, setup and group (the base's when it sets none). A variant
 * whose base is missing, or is itself a variant, gets a problem and stays unresolved.
 *
 * @param {{fileName: string, scenario: object|null, problems: string[]}[]} loaded The loaded files.
 * @returns {{fileName: string, scenario: object|null, problems: string[]}[]} The same entries, resolved.
 */
export function resolveVariants(loaded) {
  // Every loaded scenario, valid or not, so a variant of a base that fails validation is told so, not
  // that its base is missing.
  const byId = new Map(loaded.filter(entry => isPlainObject(entry.scenario) && typeof entry.scenario.id === 'string')
    .map(entry => [entry.scenario.id, entry]));

  return loaded.map((entry) => {
    if (!entry.scenario || entry.scenario.variantOf === undefined || entry.problems.length > 0) {
      return entry;
    }

    const baseEntry = byId.get(entry.scenario.variantOf);

    if (!baseEntry) {
      return { ...entry, problems: [`variantOf "${entry.scenario.variantOf}" is not a committed scenario`] };
    }
    if (baseEntry.problems.length > 0) {
      return { ...entry, problems: [`variantOf "${entry.scenario.variantOf}" names a scenario that does not validate (${baseEntry.fileName}): fix it first`] };
    }

    const base = baseEntry.scenario;

    if (base.variantOf !== undefined) {
      return { ...entry, problems: [`variantOf "${base.id}" is a variant itself: a variant varies a scenario with steps`] };
    }

    const { query, setup, group } = entry.scenario;
    const resolved = {
      ...base,
      ...entry.scenario,
      query: query ?? base.query,
      setup: setup ?? base.setup,
      group: group ?? base.group,
    };

    const scenario = Object.fromEntries(Object.entries(resolved).filter(([, value]) => value !== undefined));
    // The variant's query meets its base's page only here.
    const problems = catalogPageProblems(scenario);

    return { ...entry, scenario, problems };
  });
}

/**
 * Reads every `*.scenario.json` of a directory, sorted by name, validates each and resolves the variants.
 *
 * @param {string} directory The scenarios directory.
 * @param {object} [options] Options.
 * @param {string[]} [options.fixtures] The fixture file names, passed to `validateScenario()`.
 * @returns {{fileName: string, scenario: object, problems: string[]}[]} One entry per file.
 */
export function loadScenarios(directory, { fixtures } = {}) {
  return resolveVariants(readdirSync(directory)
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
    }));
}

/**
 * Where a scenario opens: the fixture file, the catalog page's query (when it opens a catalog page) and the
 * root container of its grid.
 *
 * @param {{page?: string, fixture?: string}} scenario The scenario.
 * @returns {{fixture: string, pageQuery: string|undefined, root: string}} The place.
 */
export function scenarioPlace(scenario) {
  if (scenario.page !== undefined) {
    const entry = A11Y_PAGES.find(page => page.id === scenario.page);

    if (!entry) {
      throw new Error(`Scenario page "${scenario.page}" is not in tests/a11y/pages.mjs.`);
    }

    // Such a page needs a key only the TypeScript `fixtureUrl()` of `a11y/harness.ts` can build. Opened
    // without it, the grid has no license bar, and the scenario would describe another page.
    if (entry.licensePreset !== undefined) {
      throw new Error(`Scenario page "${scenario.page}" names a license preset, which this lane cannot open yet: ` +
        'its fixture needs the preset\'s tiers and key.');
    }

    return { fixture: entry.fixture, pageQuery: entry.query, root: entry.root ?? DEFAULT_ROOT };
  }

  return { fixture: scenario.fixture, pageQuery: undefined, root: DEFAULT_ROOT };
}

/**
 * The page a scenario's transcript and evidence name: its catalog page, or its fixture's file name without
 * the extension when it opens a fixture the catalog does not hold.
 *
 * @param {{page?: string, fixture?: string}} scenario The scenario.
 * @returns {string} The page.
 */
export function scenarioPageId(scenario) {
  return scenario.page ?? String(scenario.fixture).replace(/\.html$/, '');
}

/**
 * The fixture URL of a scenario: the fixture page with the theme and bundle first (the project's, or the
 * scenario query's when it sets them), then the catalog page's query, then the rest of the scenario's.
 *
 * @param {{page?: string, fixture?: string, query?: string}} scenario The scenario.
 * @param {{theme?: string, bundle?: string}} [options] The project's theme and bundle.
 * @returns {string} The path and query, relative to the server root.
 */
export function scenarioUrl(scenario, { theme = 'main', bundle = 'umd' } = {}) {
  const { fixture, pageQuery } = scenarioPlace(scenario);
  const own = new URLSearchParams(scenario.query ?? '');
  const first = `theme=${own.get('theme') ?? theme}&bundle=${own.get('bundle') ?? bundle}`;

  own.delete('theme');
  own.delete('bundle');

  return `/tests/fixtures/demo/${fixture}?${[first, pageQuery, own.toString()].filter(Boolean).join('&')}`;
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
