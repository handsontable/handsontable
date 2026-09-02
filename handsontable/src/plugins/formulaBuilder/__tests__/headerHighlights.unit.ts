import type { RangeHighlight } from '@hfe/core';
import type { HotInstance } from '../../../core/types';
import { HandsontableAdapter } from '../handsontableAdapter';
import { makeAdapterOptions, makeHotStub, makePluginStub } from './helpers/stubs';

/**
 * Builds a Handsontable stub with a working hook registry and a render spy.
 *
 * @returns {{ hot: HotInstance, hooks: object, renderMock: Function }}
 */
function makeHot(): {
  hot: HotInstance;
  hooks: Record<string, ((...args: unknown[]) => void)[]>;
  renderMock: jest.Mock;
  } {
  const hooks: Record<string, ((...args: unknown[]) => void)[]> = {};
  const renderMock = jest.fn();
  const viewRenderMock = jest.fn();
  const hot = makeHotStub({
    view: { getOverlayByName: () => null, render: viewRenderMock },
    getCell: jest.fn(() => document.createElement('td')),
    addHook: (name, callback) => {
      const listeners = hooks[name] ?? [];

      listeners.push(callback);
      hooks[name] = listeners;
    },
    removeHook: (name, callback) => {
      hooks[name] = (hooks[name] ?? []).filter(listener => listener !== callback);
    },
    render: renderMock,
  });

  return { hot, hooks, renderMock };
}

/**
 * Builds a whole-column reference highlight.
 *
 * @param {number} col The highlighted column index.
 * @param {string} color The highlight color.
 * @returns {RangeHighlight}
 */
function wholeColHighlight(col: number, color = 'red'): RangeHighlight {
  return {
    range: { start: { sheet: '', row: 0, col }, end: { sheet: '', row: 9, col } },
    color,
    whole: 'column',
  };
}

/**
 * Builds a whole-row reference highlight.
 *
 * @param {number} row The highlighted row index.
 * @param {string} color The highlight color.
 * @returns {RangeHighlight}
 */
function wholeRowHighlight(row: number, color = 'blue'): RangeHighlight {
  return {
    range: { start: { sheet: '', row, col: 0 }, end: { sheet: '', row, col: 9 } },
    color,
    whole: 'row',
  };
}

describe('HandsontableAdapter header highlights', () => {
  it('redraws through the fast view render, never a full host render', () => {
    const { hot, renderMock } = makeHot();
    const viewRenderMock = hot.view.render as jest.Mock;
    const overlayHost = document.createElement('div');

    document.body.appendChild(overlayHost);

    const adapter = new HandsontableAdapter(makeAdapterOptions(hot, overlayHost), makePluginStub());

    adapter.setHighlights([wholeColHighlight(0)]);
    adapter.clearHighlights();

    expect(renderMock).not.toHaveBeenCalled();
    expect(viewRenderMock).toHaveBeenCalled();

    adapter.destroy();
    overlayHost.remove();
  });

  it('skips the redraw when the highlight set is unchanged', () => {
    const { hot } = makeHot();
    const viewRenderMock = hot.view.render as jest.Mock;
    const overlayHost = document.createElement('div');

    document.body.appendChild(overlayHost);

    const adapter = new HandsontableAdapter(makeAdapterOptions(hot, overlayHost), makePluginStub());

    adapter.setHighlights([wholeColHighlight(0)]);
    viewRenderMock.mockClear();
    adapter.setHighlights([wholeColHighlight(0)]);

    expect(viewRenderMock).not.toHaveBeenCalled();

    adapter.destroy();
    overlayHost.remove();
  });

  it('afterGetColHeader hook applies backgroundColor for the highlighted column', () => {
    const { hot, hooks } = makeHot();
    const overlayHost = document.createElement('div');

    document.body.appendChild(overlayHost);

    const adapter = new HandsontableAdapter(makeAdapterOptions(hot, overlayHost), makePluginStub());

    adapter.setHighlights([wholeColHighlight(2)]);

    const th = document.createElement('th');

    overlayHost.appendChild(th);
    hooks.afterGetColHeader?.[0]?.(2, th);
    hooks.afterViewRender?.forEach(listener => listener());

    expect(th.style.backgroundColor).not.toBe('');

    adapter.destroy();
    overlayHost.remove();
  });

  it('afterGetColHeader hook leaves non-highlighted columns unstyled', () => {
    const { hot, hooks } = makeHot();
    const overlayHost = document.createElement('div');

    document.body.appendChild(overlayHost);

    const adapter = new HandsontableAdapter(makeAdapterOptions(hot, overlayHost), makePluginStub());

    adapter.setHighlights([wholeColHighlight(2)]);

    const th = document.createElement('th');

    overlayHost.appendChild(th);
    hooks.afterGetColHeader?.[0]?.(5, th);
    hooks.afterViewRender?.forEach(listener => listener());

    expect(th.style.backgroundColor).toBe('');

    adapter.destroy();
    overlayHost.remove();
  });

  it('afterGetRowHeader hook applies backgroundColor for the highlighted row', () => {
    const { hot, hooks } = makeHot();
    const overlayHost = document.createElement('div');

    document.body.appendChild(overlayHost);

    const adapter = new HandsontableAdapter(makeAdapterOptions(hot, overlayHost), makePluginStub());

    adapter.setHighlights([wholeRowHighlight(3)]);

    const th = document.createElement('th');

    overlayHost.appendChild(th);
    hooks.afterGetRowHeader?.[0]?.(3, th);
    hooks.afterViewRender?.forEach(listener => listener());

    expect(th.style.backgroundColor).not.toBe('');

    adapter.destroy();
    overlayHost.remove();
  });

  it('clearHighlights removes header highlighting without a host render', () => {
    const { hot, hooks, renderMock } = makeHot();
    const overlayHost = document.createElement('div');

    document.body.appendChild(overlayHost);

    const adapter = new HandsontableAdapter(makeAdapterOptions(hot, overlayHost), makePluginStub());

    adapter.setHighlights([wholeColHighlight(0)]);

    const th = document.createElement('th');

    overlayHost.appendChild(th);
    hooks.afterGetColHeader?.[0]?.(0, th);
    hooks.afterViewRender?.forEach(listener => listener());

    expect(th.style.backgroundColor).not.toBe('');

    renderMock.mockClear();
    adapter.clearHighlights();

    expect(renderMock).not.toHaveBeenCalled();
    expect(th.style.backgroundColor).toBe('');

    adapter.destroy();
    overlayHost.remove();
  });

  it('setOverlayClassName toggles the theming class on the overlay host', () => {
    const { hot } = makeHot();
    const overlayHost = document.createElement('div');

    document.body.appendChild(overlayHost);

    const adapter = new HandsontableAdapter(makeAdapterOptions(hot, overlayHost), makePluginStub());

    adapter.setOverlayClassName('my-theme');

    expect(overlayHost.classList.contains('my-theme')).toBe(true);

    adapter.setOverlayClassName('other-theme');

    expect(overlayHost.classList.contains('my-theme')).toBe(false);
    expect(overlayHost.classList.contains('other-theme')).toBe(true);

    adapter.setOverlayClassName(null);

    expect(overlayHost.classList.contains('other-theme')).toBe(false);

    adapter.destroy();
    overlayHost.remove();
  });

  it('destroy removes the applied theming class from the overlay host', () => {
    const { hot } = makeHot();
    const overlayHost = document.createElement('div');

    document.body.appendChild(overlayHost);

    const adapter = new HandsontableAdapter(makeAdapterOptions(hot, overlayHost), makePluginStub());

    adapter.setOverlayClassName('my-theme');
    adapter.destroy();

    expect(overlayHost.classList.contains('my-theme')).toBe(false);

    overlayHost.remove();
  });

  it('destroy unregisters the col and row header hooks', () => {
    const { hot, hooks } = makeHot();
    const overlayHost = document.createElement('div');

    document.body.appendChild(overlayHost);

    const adapter = new HandsontableAdapter(makeAdapterOptions(hot, overlayHost), makePluginStub());

    adapter.destroy();
    overlayHost.remove();

    expect(hooks.afterGetColHeader ?? []).toHaveLength(0);
    expect(hooks.afterGetRowHeader ?? []).toHaveLength(0);
  });

  it('defers header tint to a single flush per render pass', () => {
    const { hot, hooks } = makeHot();
    const overlayHost = document.createElement('div');

    document.body.appendChild(overlayHost);

    const adapter = new HandsontableAdapter(makeAdapterOptions(hot, overlayHost), makePluginStub());

    adapter.setHighlights([wholeColHighlight(2)]);

    const th = document.createElement('th');

    overlayHost.appendChild(th);
    hooks.afterGetColHeader?.[0]?.(2, th);

    expect(th.style.backgroundColor).toBe('');

    hooks.afterViewRender?.forEach(listener => listener());

    expect(th.style.backgroundColor).not.toBe('');

    adapter.destroy();
    overlayHost.remove();
  });
});
