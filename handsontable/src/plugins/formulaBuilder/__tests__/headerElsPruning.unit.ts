import type { RangeHighlight } from '@hfe/core';
import type { HotInstance } from '../../../core/types';
import { HandsontableAdapter } from '../handsontableAdapter';
import { makeAdapterOptions, makeHotStub, makePluginStub } from './helpers/stubs';

/**
 * Builds a Handsontable stub with a working hook registry.
 *
 * @returns {{ hot: HotInstance, hooks: object }}
 */
function makeHot(): {
  hot: HotInstance;
  hooks: Record<string, ((...args: unknown[]) => void)[]>;
  } {
  const hooks: Record<string, ((...args: unknown[]) => void)[]> = {};
  const hot = makeHotStub({
    getCell: jest.fn(() => document.createElement('td')),
    addHook: (name, callback) => {
      const listeners = hooks[name] ?? [];

      listeners.push(callback);
      hooks[name] = listeners;
    },
    removeHook: (name, callback) => {
      hooks[name] = (hooks[name] ?? []).filter(listener => listener !== callback);
    },
  });

  return { hot, hooks };
}

/**
 * Builds a whole-column header highlight.
 *
 * @param {number} col The column index.
 * @returns {RangeHighlight}
 */
function wholeColHighlight(col: number): RangeHighlight {
  return {
    range: { start: { sheet: '', row: 0, col }, end: { sheet: '', row: 0, col } },
    color: 'red',
    whole: 'column',
  };
}

/**
 * Builds a whole-row header highlight.
 *
 * @param {number} row The row index.
 * @returns {RangeHighlight}
 */
function wholeRowHighlight(row: number): RangeHighlight {
  return {
    range: { start: { sheet: '', row, col: 0 }, end: { sheet: '', row, col: 0 } },
    color: 'blue',
    whole: 'row',
  };
}

describe('HandsontableAdapter header element pruning', () => {
  it('drops detached column-header elements on afterViewRender', () => {
    const { hot, hooks } = makeHot();
    const overlayHost = document.createElement('div');

    document.body.appendChild(overlayHost);

    const adapter = new HandsontableAdapter(makeAdapterOptions(hot, overlayHost), makePluginStub());

    const detachedTh = document.createElement('th');
    const connectedTh = document.createElement('th');

    overlayHost.appendChild(detachedTh);
    overlayHost.appendChild(connectedTh);
    hooks.afterGetColHeader?.[0]?.(2, detachedTh);
    hooks.afterGetColHeader?.[0]?.(3, connectedTh);
    detachedTh.remove();

    for (const pruneListener of hooks.afterViewRender ?? []) {
      pruneListener();
    }

    adapter.setHighlights([wholeColHighlight(2), wholeColHighlight(3)]);

    expect(detachedTh.style.backgroundColor).toBe('');
    expect(connectedTh.style.backgroundColor).not.toBe('');

    adapter.destroy();
    overlayHost.remove();
  });

  it('drops detached row-header elements on afterViewRender', () => {
    const { hot, hooks } = makeHot();
    const overlayHost = document.createElement('div');

    document.body.appendChild(overlayHost);

    const adapter = new HandsontableAdapter(makeAdapterOptions(hot, overlayHost), makePluginStub());

    const detachedTh = document.createElement('th');
    const connectedTh = document.createElement('th');

    overlayHost.appendChild(detachedTh);
    overlayHost.appendChild(connectedTh);
    hooks.afterGetRowHeader?.[0]?.(7, detachedTh);
    hooks.afterGetRowHeader?.[0]?.(8, connectedTh);
    detachedTh.remove();

    for (const pruneListener of hooks.afterViewRender ?? []) {
      pruneListener();
    }

    adapter.setHighlights([wholeRowHighlight(7), wholeRowHighlight(8)]);

    expect(detachedTh.style.backgroundColor).toBe('');
    expect(connectedTh.style.backgroundColor).not.toBe('');

    adapter.destroy();
    overlayHost.remove();
  });

  it('removes the pruning hook on destroy', () => {
    const { hot, hooks } = makeHot();
    const overlayHost = document.createElement('div');

    document.body.appendChild(overlayHost);

    const adapter = new HandsontableAdapter(makeAdapterOptions(hot, overlayHost), makePluginStub());
    const registeredCount = (hooks.afterViewRender ?? []).length;

    expect(registeredCount).toBeGreaterThan(0);

    adapter.destroy();

    expect((hooks.afterViewRender ?? []).length).toBeLessThan(registeredCount);

    overlayHost.remove();
  });
});
