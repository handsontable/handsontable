/**
 * Gold oracle for window.nlView. Looks up the hand-checked state and applies it.
 * This is not an nl-view approach and it does not call an LLM.
 */
import { ORDER_COLUMNS, TICKET_COLUMNS, TODAY } from '../lib/schema.mjs';

const COLUMNS = {
  orders: ORDER_COLUMNS,
  tickets: TICKET_COLUMNS,
};

const CLEAR = {
  version: 1,
  filters: [],
  sort: { columns: [] },
  hiddenColumns: [],
};

let promptsPromise;

function loadPrompts() {
  if (!promptsPromise) {
    promptsPromise = fetch('/prompts.json').then((response) => {
      if (!response.ok) {
        throw new Error(`prompts.json ${response.status}`);
      }

      return response.json();
    });
  }

  return promptsPromise;
}

function handsontableConstructor() {
  const exported = window.Handsontable;

  if (typeof exported === 'function') {
    return exported;
  }

  if (exported && typeof exported.default === 'function') {
    return exported.default;
  }

  throw new Error('Handsontable is not on window');
}

function result(status, state, explanation, started) {
  return {
    status,
    state,
    explanation,
    ms: Math.round(performance.now() - started),
    costUsd: 0,
    tokens: 0,
    turns: 0,
  };
}

const nlView = {
  hot: null,
  dataset: null,

  async loadData(name, rows) {
    const columns = COLUMNS[name];

    if (!columns) {
      throw new Error(`unknown dataset ${name}`);
    }

    if (nlView.hot && !nlView.hot.isDestroyed) {
      nlView.hot.destroy();
    }

    const container = document.querySelector('#grid');
    container.replaceChildren();

    const Handsontable = handsontableConstructor();
    nlView.hot = new Handsontable(container, {
      data: rows,
      columns,
      colHeaders: columns.map((column) => column.data),
      rowHeaders: true,
      filters: true,
      dropdownMenu: true,
      hiddenRows: true,
      hiddenColumns: true,
      multiColumnSorting: true,
      autoColumnSize: false,
      autoRowSize: false,
      width: 1000,
      height: 420,
      licenseKey: 'non-commercial-and-evaluation',
    });
    nlView.dataset = name;
  },

  async reset() {
    const hot = nlView.hot;

    if (!hot) {
      throw new Error('loadData before reset');
    }

    const restore = hot.getPlugin('viewState').setViewState(CLEAR, { atomic: true, undo: 'record' });

    if (restore.error) {
      throw new Error(restore.error.message);
    }
  },

  async translate(prompt, options = {}) {
    const started = performance.now();

    if (options.today !== TODAY) {
      return result('error', null, `oracle today is ${TODAY}`, started);
    }

    const prompts = await loadPrompts();
    const item = prompts.find((entry) => entry.dataset === nlView.dataset && entry.prompt === prompt);

    if (!item) {
      return result('error', null, 'prompt is not in the eval set', started);
    }

    if (!item.expressible) {
      return result('not_expressible', null, item.notes, started);
    }

    const plugin = nlView.hot.getPlugin('viewState');
    const validation = plugin.validateViewState(item.gold);

    if (!validation.valid) {
      const message = validation.error?.message
        || validation.skipped.map((issue) => issue.message).join('; ')
        || 'gold state is invalid';

      return result('error', item.gold, message, started);
    }

    const restore = plugin.setViewState(item.gold, { atomic: true, undo: 'record' });

    if (restore.error) {
      return result('error', item.gold, restore.error.message, started);
    }

    return result(
      'applied',
      item.gold,
      'Gold oracle applied the hand-checked ViewState. This page is not an nl-view approach.',
      started,
    );
  },
};

window.nlView = nlView;
