/**
 * Demo page and the eval contract: window.nlView.loadData / reset / translate.
 */

import { columnProps, placeholderDataset } from './datasets.js';
import { translatePrompt } from './loop.js';

const TOKEN_KEY = 'nl-view-token';

installToken();

const gridEl = document.querySelector('#grid');
const datasetEl = document.querySelector('#dataset');
const todayEl = document.querySelector('#today');
const promptEl = document.querySelector('#prompt');
const explanationEl = document.querySelector('#explanation');
const noticeEl = document.querySelector('#notice');
const debugEl = document.querySelector('#debug-body');
const formEl = document.querySelector('#prompt-form');

let hot = null;
let datasetName = 'orders';

todayEl.value = '2026-10-20';

const search = new URLSearchParams(location.search);

datasetName = search.get('dataset') === 'tickets' ? 'tickets' : 'orders';
datasetEl.value = datasetName;

const variant = search.get('variant') === 'fast' ? 'fast' : 'default';
const variantEl = document.querySelector('#variant');

variantEl.textContent = variant === 'fast' ? 'variant: fast' : 'variant: default';

const initial = placeholderDataset(datasetName);

window.__orders = placeholderDataset('orders').rows;
window.__tickets = placeholderDataset('tickets').rows;
mount(datasetName, initial.rows);

datasetEl.addEventListener('change', () => {
  const next = placeholderDataset(datasetEl.value);

  mount(next.name, next.rows);
  setStatus('', '');
});

document.querySelector('#reset').addEventListener('click', () => {
  window.nlView.reset();
});

document.querySelector('#undo').addEventListener('click', () => {
  hot.getPlugin('undoRedo').undo();
});

formEl.addEventListener('submit', async (event) => {
  event.preventDefault();

  const prompt = promptEl.value.trim();

  if (!prompt) {
    return;
  }

  setBusy(true);

  try {
    const result = await window.nlView.translate(prompt, { today: todayEl.value || undefined });

    showResult(result);
  } finally {
    setBusy(false);
  }
});

document.querySelectorAll('[data-prompt]').forEach((button) => {
  button.addEventListener('click', () => {
    if (button.dataset.dataset) {
      datasetEl.value = button.dataset.dataset;
      datasetEl.dispatchEvent(new Event('change'));
    }

    promptEl.value = button.dataset.prompt;
    promptEl.focus();
  });
});

window.nlView = {
  loadData(name, rows) {
    const list = Array.isArray(rows) ? rows : [];

    mount(String(name || datasetName), list);

    if (datasetEl.querySelector(`option[value="${CSS.escape(String(name))}"]`)) {
      datasetEl.value = String(name);
    }

    setStatus('', '');
  },

  reset() {
    applyState({
      version: 1,
      filters: [],
      sort: { columns: [] },
      hiddenColumns: [],
    }, 'skip');
    hot.getPlugin('undoRedo').clear();
    setStatus('', '');
    debugEl.textContent = 'View reset.';
  },

  async translate(prompt, options = {}) {
    const today = options && options.today ? options.today : (todayEl.value || undefined);
    const packed = await translatePrompt(hot, prompt, { today, token: readToken(), variant });

    window.__nlViewDebug = packed.debug;
    showResult(packed.result);

    return packed.result;
  },
};

/**
 * @param {string} name
 * @param {object[]} rows
 */
function mount(name, rows) {
  datasetName = name;
  const props = columnProps(name, rows);
  const plain = props.map(prop => ({ data: prop, title: prop }));
  const settings = {
    data: rows,
    columns: plain,
    colHeaders: props,
    rowHeaders: true,
    filters: true,
    dropdownMenu: true,
    multiColumnSorting: true,
    hiddenColumns: true,
    undo: true,
    manualColumnResize: true,
    height: 460,
    width: '100%',
    licenseKey: 'non-commercial-and-evaluation',
    themeName: 'ht-theme-main',
    autoWrapRow: true,
    autoWrapCol: true,
  };

  if (!hot) {
    hot = new window.Handsontable(gridEl, settings);
  } else {
    hot.updateSettings(settings);
  }

  const typed = columnsFromInference(rows, props);

  hot.updateSettings({ data: rows, columns: typed, colHeaders: props });
  window.__nlHot = hot;
}

/**
 * @param {object[]} rows
 * @param {string[]} props
 * @returns {object[]}
 */
function columnsFromInference(rows, props) {
  let inferred = [];

  try {
    inferred = hot.getPlugin('importFile').inferColumnTypes(rows, { headerRow: false }).columns || [];
  } catch (error) {
    inferred = [];
  }

  const byProp = new Map();

  inferred.forEach((column) => {
    const prop = column.settings?.data ?? column.title;

    if (prop != null) {
      byProp.set(String(prop), column.settings || {});
    }
  });

  return props.map((prop) => {
    const settings = { ...(byProp.get(prop) || { type: 'text' }) };

    settings.data = prop;
    settings.title = prop;

    return settings;
  });
}

/**
 * @param {object} state
 * @param {'record'|'skip'} undo
 */
function applyState(state, undo) {
  hot.getPlugin('viewState').setViewState(state, { atomic: true, undo });
}

/**
 * @param {object} result
 */
function showResult(result) {
  const debug = window.__nlViewDebug || {};

  explanationEl.textContent = result.explanation || '';
  noticeEl.hidden = result.status === 'applied';
  noticeEl.className = result.status === 'error' ? 'error' : 'not-expressible';
  noticeEl.textContent = result.status === 'applied'
    ? ''
    : result.status === 'not_expressible'
      ? `Not expressible. ${result.explanation || ''}`
      : `Error. ${result.explanation || ''}`;

  const upstream = debug.upstreamMs != null ? debug.upstreamMs : 0;

  debugEl.textContent = [
    `variant ${variant}  status ${result.status}  wall ${result.ms} ms  upstream ${upstream} ms  turns ${result.turns}  cost $${Number(result.costUsd).toFixed(6)}  tokens ${result.tokens}`,
    `reasoning items passed back: ${countReasoning(debug)}  stripped: ${debug.strippedReasoning ? 'yes' : 'no'}`,
    JSON.stringify({ state: result.state, trace: debug.trace }, null, 2),
  ].join('\n');
}

/**
 * @param {object} debug
 * @returns {number}
 */
function countReasoning(debug) {
  return (debug.trace || []).reduce((sum, step) => sum + (step.reasoningItems || 0), 0);
}

/**
 * @param {string} explanation
 * @param {string} notice
 */
function setStatus(explanation, notice) {
  explanationEl.textContent = explanation;
  noticeEl.hidden = !notice;
  noticeEl.textContent = notice;
}

/**
 * @param {boolean} busy
 */
function setBusy(busy) {
  formEl.querySelector('button').disabled = busy;
  promptEl.disabled = busy;
}

/**
 * Saves #t=<token> into localStorage and drops it from the hash.
 */
function installToken() {
  const params = new URLSearchParams(location.hash.replace(/^#/, ''));
  const fromHash = params.get('t');

  if (!fromHash) {
    return;
  }

  localStorage.setItem(TOKEN_KEY, fromHash);
  params.delete('t');
  const rest = params.toString();

  history.replaceState(null, '', `${location.pathname}${location.search}${rest ? `#${rest}` : ''}`);
}

/**
 * @returns {string}
 */
function readToken() {
  return localStorage.getItem(TOKEN_KEY) || '';
}
