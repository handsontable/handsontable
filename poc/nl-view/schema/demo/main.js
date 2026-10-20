import Handsontable from '@hot/index.ts';
import '@hot/styles/handsontable.scss';
import '@hot/themes/static/css/theme/ht-theme-main.css';
import '@hot/themes/static/css/icons/ht-icons-main.css';
import './style.css';

import { normalizeRows, placeholderRows } from '../src/datasets.js';
import { inferGridColumns } from '../src/schema.js';
import { readToken } from '../src/llm.js';
import { translateView } from '../src/translate.js';

const container = document.querySelector('#grid');
const datasetSelect = document.querySelector('#dataset');
const promptInput = document.querySelector('#prompt');
const applyButton = document.querySelector('#apply');
const undoButton = document.querySelector('#undo');
const resetButton = document.querySelector('#reset');
const sampleInput = document.querySelector('#sample');
const explanationEl = document.querySelector('#explanation');
const notExpressibleEl = document.querySelector('#not-expressible');
const errorEl = document.querySelector('#error');
const metaEl = document.querySelector('#meta');
const debugEl = document.querySelector('#debug-body');

let hot = null;
let columns = [];
let datasetName = 'orders';

function queryDataset() {
  const name = new URLSearchParams(location.search).get('dataset');

  return name === 'tickets' ? 'tickets' : 'orders';
}

function showMessage(result) {
  explanationEl.textContent = result?.status === 'applied' ? (result.explanation || '') : '';
  notExpressibleEl.hidden = result?.status !== 'not_expressible';
  notExpressibleEl.textContent = result?.status === 'not_expressible'
    ? `Not expressible: ${result.explanation}`
    : '';
  errorEl.hidden = result?.status !== 'error';
  errorEl.textContent = result?.status === 'error' ? result.explanation : '';

  const token = readToken();
  const rows = hot ? hot.countRows() : 0;
  const bits = [
    token ? 'token ready' : 'token missing',
    `${rows} visible rows`,
  ];

  if (result) {
    bits.push(`${result.ms} ms`, `$${Number(result.costUsd).toFixed(6)}`, `${result.tokens} tokens`, `${result.turns} turn${result.turns === 1 ? '' : 's'}`);
  }

  metaEl.textContent = bits.join(' · ');
  debugEl.textContent = JSON.stringify({
    state: result?.state ?? (hot ? hot.getPlugin('viewState').getViewState() : null),
    debug: result?.debug ?? null,
    status: result?.status ?? null,
  }, null, 2);
  document.body.dataset.status = result?.status || '';
}

function mount(name, rows) {
  const normalized = normalizeRows(name, rows);
  const described = inferGridColumns(normalized.rows, normalized.props);

  columns = described;
  datasetName = name;

  if (hot) {
    hot.destroy();
  }

  hot = new Handsontable(container, {
    data: normalized.rows,
    columns: described.map(({ inferredType, ...column }) => column),
    colHeaders: normalized.props,
    rowHeaders: true,
    height: 520,
    width: '100%',
    themeName: 'ht-theme-main',
    licenseKey: 'non-commercial-and-evaluation',
    filters: true,
    dropdownMenu: true,
    multiColumnSorting: true,
    hiddenColumns: true,
    undo: true,
    manualColumnResize: true,
    autoWrapRow: true,
    afterRender() {
      const rowsNow = hot && !hot.isDestroyed ? hot.countRows() : 0;
      const base = metaEl.textContent.replace(/\d+ visible rows/, `${rowsNow} visible rows`);

      if (!metaEl.textContent.includes('visible rows')) {
        return;
      }

      metaEl.textContent = base;
    },
  });
  window.hot = hot;
  showMessage(null);
  document.body.dataset.ready = '1';
  document.body.dataset.dataset = name;
}

function loadData(name, rows) {
  const nextRows = rows ?? placeholderRows(name);

  datasetSelect.value = name === 'tickets' ? 'tickets' : (name === 'orders' ? 'orders' : datasetSelect.value);
  mount(name, nextRows);

  return { name, rows: nextRows.length, columns: columns.map(column => column.data) };
}

function reset() {
  if (!hot) {
    return null;
  }

  const result = hot.getPlugin('viewState').setViewState({
    version: 1,
    sort: { columns: [] },
    filters: [],
    hiddenColumns: [],
  }, { atomic: true, undo: 'skip' });

  showMessage(null);

  return result;
}

async function translate(prompt, options = {}) {
  const sampleValues = options.sampleValues ?? sampleInput.checked;
  const result = await translateView(hot, columns, prompt, { ...options, sampleValues }, readToken());

  showMessage(result);
  window.nlView.last = result;

  return {
    status: result.status,
    state: result.state,
    explanation: result.explanation,
    ms: result.ms,
    costUsd: result.costUsd,
    tokens: result.tokens,
    turns: result.turns,
  };
}

window.nlView = { loadData, reset, translate };

datasetName = queryDataset();
datasetSelect.value = datasetName;
loadData(datasetName);

applyButton.addEventListener('click', async () => {
  const prompt = promptInput.value.trim();

  if (!prompt) {
    return;
  }

  applyButton.disabled = true;
  explanationEl.textContent = 'Working…';
  notExpressibleEl.hidden = true;
  errorEl.hidden = true;

  try {
    await translate(prompt, { today: '2026-10-20' });
  } finally {
    applyButton.disabled = false;
  }
});

promptInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    applyButton.click();
  }
});

undoButton.addEventListener('click', () => {
  hot?.getPlugin('undoRedo')?.undo();
  showMessage(window.nlView.last || null);
});

resetButton.addEventListener('click', () => {
  reset();
});

datasetSelect.addEventListener('change', () => {
  const url = new URL(location.href);

  url.searchParams.set('dataset', datasetSelect.value);
  history.replaceState(null, '', url);
  loadData(datasetSelect.value);
});
