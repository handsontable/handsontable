/**
 * nl-view approach C. The browser builds the grid schema and applies the
 * worker's view state. costUsd is computed here from reported token usage.
 */
import { DATASETS, DATASET_NAMES } from './datasets.js';
import { DEFAULT_MODEL, MODELS, costUsd } from './pricing.js';

const DEFAULT_API = 'https://poc-nl-view-workersai.handsontable-sandbox.workers.dev';
const TOKEN_KEY = 'nl-view-workersai-token';
const LOW_CARDINALITY = 16;
const RELATIVE_DATES = new Set([
  'date_today',
  'date_yesterday',
  'date_tomorrow',
  'intl_date_today',
  'intl_date_yesterday',
  'intl_date_tomorrow',
]);

const params = new URLSearchParams(location.search);
const hash = new URLSearchParams(location.hash.replace(/^#/, ''));
const hashToken = hash.get('t');

if (hashToken) {
  localStorage.setItem(TOKEN_KEY, hashToken);
  history.replaceState(null, '', `${location.pathname}${location.search}`);
}

let hot = null;
let busy = false;

const ui = {
  dataset: document.querySelector('#dataset'),
  model: document.querySelector('#model'),
  samples: document.querySelector('#samples'),
  today: document.querySelector('#today'),
  prompt: document.querySelector('#prompt'),
  apply: document.querySelector('#apply'),
  undo: document.querySelector('#undo'),
  reset: document.querySelector('#reset'),
  explanation: document.querySelector('#explanation'),
  blocked: document.querySelector('#blocked'),
  tokenState: document.querySelector('#token-state'),
  tokenInput: document.querySelector('#token-input'),
  saveToken: document.querySelector('#save-token'),
  forgetToken: document.querySelector('#forget-token'),
  api: document.querySelector('#api'),
  debug: document.querySelector('#debug'),
  columns: document.querySelector('#columns'),
};

ui.api.textContent = apiBase();
ui.today.value = utcToday();
fillModels();
fillDatasets();
paintToken();

ui.dataset.value = DATASET_NAMES.includes(params.get('dataset')) ? params.get('dataset') : 'orders';
ui.dataset.addEventListener('change', () => {
  window.nlView.loadData(ui.dataset.value);
});
ui.apply.addEventListener('click', () => {
  runPrompt(ui.prompt.value);
});
ui.prompt.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    runPrompt(ui.prompt.value);
  }
});
ui.undo.addEventListener('click', () => {
  if (hot) {
    hot.undo();
  }
});
ui.reset.addEventListener('click', () => window.nlView.reset());
ui.saveToken.addEventListener('click', () => {
  const value = ui.tokenInput.value.trim();

  if (value) {
    localStorage.setItem(TOKEN_KEY, value);
    ui.tokenInput.value = '';
  }

  paintToken();
});
ui.forgetToken.addEventListener('click', () => {
  localStorage.removeItem(TOKEN_KEY);
  ui.tokenInput.value = '';
  paintToken();
});

hot = new Handsontable(document.querySelector('#grid'), {
  data: [],
  colHeaders: true,
  rowHeaders: true,
  width: '100%',
  height: 520,
  licenseKey: 'non-commercial-and-evaluation',
  themeName: 'ht-theme-main',
  filters: true,
  dropdownMenu: true,
  multiColumnSorting: true,
  hiddenColumns: true,
  undo: true,
  manualColumnResize: true,
  stretchH: 'all',
  autoWrapRow: true,
  autoWrapCol: true,
});

window.nlView = {
  loadData,
  reset,
  translate,
};

loadData(ui.dataset.value);

/**
 * @param {string} name
 * @param {object[]|undefined} rows
 */
function loadData(name, rows) {
  const data = rows ?? DATASETS[name];

  if (!Array.isArray(data)) {
    throw new Error(`Unknown dataset: ${name}`);
  }

  if (DATASETS[name] && ui.dataset.value !== name) {
    ui.dataset.value = name;
  }

  const importer = hot.getPlugin('importFile');
  const inferred = importer.inferColumnTypes(data, { headerRow: false });
  const converted = data.length === 0 ? data : importer.convertToInferredTypes(data, inferred);

  hot.updateSettings({
    data: converted,
    columns: inferred.columns.map(column => column.settings),
    colHeaders: inferred.columns.map(column => column.title || ''),
  });
  paintColumns();
  paintStatus('', '');
}

function reset() {
  hot.getPlugin('viewState').setViewState({
    version: 1,
    filters: [],
    sort: { columns: [] },
    hiddenColumns: [],
  }, { atomic: true, undo: 'skip' });
  paintStatus('View cleared.', '');
  paintDebug(null);
}

/**
 * @param {string} prompt
 * @param {{ today?: string, model?: string }} [options]
 * @returns {Promise<object>}
 */
async function translate(prompt, options = {}) {
  const started = performance.now();
  const today = options.today || ui.today.value || utcToday();
  const model = options.model || ui.model.value || undefined;
  const rawCalls = [];
  let turns = 0;
  let usageMissing = false;
  let cost = 0;
  let tokens = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

  const finish = (status, state, explanation) => {
    const result = {
      status,
      state,
      explanation,
      ms: Math.round(performance.now() - started),
      costUsd: usageMissing ? null : cost,
      tokens,
      turns,
    };

    paintStatus(
      status === 'not_expressible' ? '' : explanation,
      status === 'not_expressible' ? explanation : '',
    );
    paintDebug({ result, rawCalls });

    return result;
  };

  if (!readToken()) {
    return finish('error', null, 'No token. Add #t= to the URL or save one in this browser. Nothing was sent.');
  }

  if (!prompt || !String(prompt).trim()) {
    return finish('error', null, 'Prompt is empty.');
  }

  const context = buildContext();
  let repair = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    let response;
    let body;

    try {
      response = await fetch(`${apiBase()}/translate`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-poc-token': readToken(),
        },
        body: JSON.stringify({
          prompt: String(prompt),
          model,
          today,
          context,
          ...(repair ? { repair } : {}),
        }),
        signal: AbortSignal.timeout(90000),
      });
      body = await response.json();
    } catch (error) {
      return finish('error', null, `Request failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    rawCalls.push(body);
    noteUsage(body);

    if (!response.ok) {
      return finish('error', null, body.message || body.error || `HTTP ${response.status}`);
    }

    if (body.not_expressible) {
      return finish('not_expressible', null, body.reason || 'Not expressible.');
    }

    const issues = issuesFor(body.state, today);

    if (issues.length === 0) {
      const applied = hot.getPlugin('viewState').setViewState(body.state, { atomic: true, undo: 'record' });

      if (applied.error || applied.skipped.length > 0) {
        const message = applied.error ? applied.error.message : applied.skipped.map(issue => issue.message).join('\n');

        return finish('error', body.state, `Not applied. ${message}`);
      }

      return finish('applied', body.state, body.explanation || '');
    }

    if (attempt === 1) {
      return finish('error', body.state, `Not applied.\n${issues.map(issue => `${issue.path}: ${issue.message}`).join('\n')}`);
    }

    repair = { issues, rejectedState: body.state };
  }

  return finish('error', null, 'Stopped before a second retry.');

  function noteUsage(body) {
    if (body && body.called) {
      turns += 1;
    }

    if (body && body.usage) {
      tokens = {
        prompt_tokens: tokens.prompt_tokens + body.usage.prompt_tokens,
        completion_tokens: tokens.completion_tokens + body.usage.completion_tokens,
        total_tokens: tokens.total_tokens + body.usage.total_tokens,
      };
      const part = costUsd(body.model, body.usage);

      if (part == null) {
        usageMissing = true;
      } else {
        cost += part;
      }
    } else if (body && body.called) {
      usageMissing = true;
    }
  }
}

/**
 * @returns {object}
 */
function buildContext() {
  const columns = [];
  const configured = hot.getSettings().columns || [];
  const filters = hot.getPlugin('filters');

  for (let visual = 0; visual < hot.countCols(); visual++) {
    const prop = hot.colToProp(visual);

    if (typeof prop !== 'string') {
      continue;
    }

    const inferredType = (configured[visual] && configured[visual].type) || 'text';
    const column = {
      prop,
      inferredType,
      conditions: filters.getAvailableConditions(visual).map(({ name, inputsCount }) => ({ name, inputsCount })),
    };
    const sampleValues = sampleColumn(prop, inferredType);

    if (sampleValues) {
      column.sampleValues = sampleValues;
    }

    columns.push(column);
  }

  return { columns, currentState: viewForModel() };
}

/**
 * @returns {object}
 */
function viewForModel() {
  const raw = hot.getPlugin('viewState').getViewState() || {};

  return {
    version: 1,
    filters: (raw.filters || []).map(entry => ({
      column: propOf(entry.column),
      operation: entry.operation,
      conditions: entry.conditions,
    })).filter(entry => entry.column != null),
    sort: {
      columns: ((raw.sort && raw.sort.columns) || []).map(column => ({
        column: propOf(column.column),
        sortOrder: column.sortOrder,
      })).filter(column => column.column != null),
    },
    hiddenColumns: (raw.hiddenColumns || []).map(propOf).filter(prop => prop != null),
  };
}

/**
 * @param {number|string} physical
 * @returns {string|null}
 */
function propOf(physical) {
  if (typeof physical === 'string') {
    return physical;
  }

  if (typeof physical !== 'number') {
    return null;
  }

  const visual = hot.toVisualColumn(physical);

  if (visual == null || visual < 0) {
    return null;
  }

  const prop = hot.colToProp(visual);

  return typeof prop === 'string' ? prop : null;
}

/**
 * @param {string} prop
 * @param {string} inferredType
 * @returns {unknown[]|null}
 */
function sampleColumn(prop, inferredType) {
  if (!ui.samples.checked) {
    return null;
  }

  if (inferredType !== 'text' && inferredType !== 'dropdown') {
    return null;
  }

  const rows = hot.getSourceData() || [];
  const seen = [];
  const keys = new Set();

  for (let i = 0; i < rows.length && i < 5000; i++) {
    const row = rows[i];

    if (!row || typeof row !== 'object' || Array.isArray(row)) {
      continue;
    }

    const value = row[prop];

    if (value == null || value === '') {
      continue;
    }

    const key = typeof value === 'string' ? value : JSON.stringify(value);

    if (keys.has(key)) {
      continue;
    }

    keys.add(key);

    if (keys.size > LOW_CARDINALITY) {
      return null;
    }

    seen.push(value);
  }

  return seen.length ? seen : null;
}

/**
 * @param {object} state
 * @param {string} today
 * @returns {Array<{ path: string, message: string }>}
 */
function issuesFor(state, today) {
  const issues = relativeAndValueIssues(state, today);

  if (!state || typeof state !== 'object') {
    issues.push({ path: 'state', message: 'state was not an object' });

    return issues;
  }

  const result = hot.getPlugin('viewState').validateViewState(state);

  if (result.error) {
    issues.push({ path: 'state', message: result.error.message });
  }

  (result.skipped || []).forEach((skip) => {
    issues.push({ path: skip.path || skip.part, message: skip.message });
  });

  return issues;
}

/**
 * validateViewState does not check by_value membership, and relative date
 * conditions would ignore the eval's today. Both are rejected here.
 *
 * @param {object} state
 * @param {string} today
 * @returns {Array<{ path: string, message: string }>}
 */
function relativeAndValueIssues(state, today) {
  const issues = [];
  const filters = state && Array.isArray(state.filters) ? state.filters : [];

  filters.forEach((entry, filterIndex) => {
    const conditions = entry && Array.isArray(entry.conditions) ? entry.conditions : [];

    conditions.forEach((condition, conditionIndex) => {
      if (!condition || typeof condition !== 'object') {
        return;
      }

      const path = `filters[${filterIndex}].conditions[${conditionIndex}]`;

      if (RELATIVE_DATES.has(condition.name)) {
        issues.push({
          path: `${path}.name`,
          message: `${condition.name} is a relative date. Use between or intl_date_between with two absolute YYYY-MM-DD dates computed from today ${today}.`,
        });
      }

      if (condition.name === 'by_value') {
        issues.push(...byValueIssues(entry.column, condition, path));
      }
    });
  });

  return issues;
}

/**
 * @param {string} prop
 * @param {object} condition
 * @param {string} path
 * @returns {Array<{ path: string, message: string }>}
 */
function byValueIssues(prop, condition, path) {
  const args = condition.args;

  if (!Array.isArray(args) || args.length !== 1 || !Array.isArray(args[0])) {
    return [{
      path: `${path}.args`,
      message: 'by_value args must be [[...values to keep]]. Those values are not checked by validateViewState; each one must occur in the column.',
    }];
  }

  const present = valueSet(prop);

  if (!present) {
    return [{ path: `${path}.args`, message: `column ${prop} is not on the grid` }];
  }

  const issues = [];

  args[0].forEach((value, index) => {
    if (!present.has(canon(value))) {
      issues.push({
        path: `${path}.args[0][${index}]`,
        message: `${JSON.stringify(value)} is not a value in column ${prop}.`,
      });
    }
  });

  return issues;
}

/**
 * @param {string} prop
 * @returns {Set<string>|null}
 */
function valueSet(prop) {
  const visual = hot.propToCol(prop);

  if (typeof visual !== 'number') {
    return null;
  }

  const present = new Set();
  const rows = hot.getSourceData() || [];

  rows.forEach((row) => {
    if (!row || typeof row !== 'object') {
      return;
    }

    const value = Array.isArray(row) ? row[visual] : row[prop];

    if (value == null || value === '') {
      return;
    }

    present.add(canon(value));
  });

  return present;
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function canon(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return `n:${value}`;
  }

  if (typeof value === 'boolean') {
    return `b:${value}`;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();

    if (trimmed !== '' && /^-?\d+(?:\.\d+)?$/.test(trimmed)) {
      return `n:${Number(trimmed)}`;
    }

    return `s:${trimmed}`;
  }

  return `s:${String(value)}`;
}

/**
 * @param {string} prompt
 */
async function runPrompt(prompt) {
  if (busy) {
    return;
  }

  busy = true;
  ui.apply.disabled = true;
  paintStatus('Asking the worker…', '');

  try {
    await translate(prompt, { today: ui.today.value, model: ui.model.value });
  } finally {
    busy = false;
    ui.apply.disabled = false;
  }
}

function fillModels() {
  Object.entries(MODELS).forEach(([id, model]) => {
    const option = document.createElement('option');

    option.value = id;
    option.textContent = id === DEFAULT_MODEL ? `${model.label} (default)` : model.label;
    ui.model.append(option);
  });
  ui.model.value = DEFAULT_MODEL;
}

function fillDatasets() {
  DATASET_NAMES.forEach((name) => {
    const option = document.createElement('option');

    option.value = name;
    option.textContent = name;
    ui.dataset.append(option);
  });
}

function paintColumns() {
  const context = buildContext();

  ui.columns.textContent = context.columns.map((column) => {
    const names = column.conditions.map(condition => condition.name).join(', ');
    const samples = column.sampleValues ? ` samples=${column.sampleValues.length}` : '';

    return `${column.prop}  ${column.inferredType}  ${names}${samples}`;
  }).join('\n');
}

function paintToken() {
  ui.tokenState.textContent = readToken() ? 'token saved in this browser' : 'no token yet';
}

/**
 * @param {string} explanation
 * @param {string} blocked
 */
function paintStatus(explanation, blocked) {
  ui.explanation.textContent = explanation || '';
  ui.blocked.hidden = !blocked;
  ui.blocked.textContent = blocked ? `Not expressible: ${blocked}` : '';
}

/**
 * @param {object|null} payload
 */
function paintDebug(payload) {
  ui.debug.textContent = payload ? JSON.stringify(payload, null, 2) : '';
}

function apiBase() {
  const configured = params.get('api') || DEFAULT_API;

  return configured.replace(/\/$/, '');
}

function readToken() {
  return localStorage.getItem(TOKEN_KEY) || '';
}

function utcToday() {
  return new Date().toISOString().slice(0, 10);
}
