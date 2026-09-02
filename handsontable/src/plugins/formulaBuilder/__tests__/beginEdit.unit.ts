import { HandsontableAdapter } from '../handsontableAdapter';
import type { HotStubShape } from './helpers/stubs';
import { makeAdapterOptions, makeHotStub, makePluginStub } from './helpers/stubs';

/**
 * Builds an adapter over a stub grid exposing the given active editor.
 *
 * @param {unknown} activeEditor The editor returned by the stub's `getActiveEditor`.
 * @param {Partial<HotStubShape>} [hotOverrides] Additional stub member overrides (e.g. selection, meta).
 * @returns {HandsontableAdapter}
 */
function makeAdapter(activeEditor: unknown, hotOverrides: Partial<HotStubShape> = {}) {
  const hot = makeHotStub({ getActiveEditor: () => activeEditor, ...hotOverrides });
  const overlayHost = document.createElement('div');

  document.body.appendChild(overlayHost);

  return new HandsontableAdapter(makeAdapterOptions(hot, overlayHost), makePluginStub());
}

describe('HandsontableAdapter.beginEdit', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('enables full edit mode before opening so the seed survives resolveInlineSeed', () => {
    const calls: string[] = [];
    const editor = {
      enableFullEditMode: jest.fn(() => calls.push('full')),
      beginEditing: jest.fn(() => calls.push('begin')),
    };
    const adapter = makeAdapter(editor);

    const started = adapter.beginEdit({ sheet: '', row: 0, col: 0 }, '=A1');

    expect(started).toBe(true);
    expect(calls).toEqual(['full', 'begin']);
    expect(editor.beginEditing).toHaveBeenCalledWith('=A1');
  });

  it('still opens when the editor lacks enableFullEditMode', () => {
    const editor = { beginEditing: jest.fn() };
    const adapter = makeAdapter(editor);

    expect(adapter.beginEdit({ sheet: '', row: 0, col: 0 }, '5')).toBe(true);
    expect(editor.beginEditing).toHaveBeenCalledWith('5');
  });

  it('returns false without an active editor', () => {
    const adapter = makeAdapter(undefined);

    expect(adapter.beginEdit({ sheet: '', row: 0, col: 0 })).toBe(false);
  });

  it('returns false and does not open the editor when the active cell is readOnly', () => {
    const editor = { beginEditing: jest.fn(), enableFullEditMode: jest.fn() };
    const adapter = makeAdapter(editor, {
      getSelectedRangeLast: () => ({ highlight: { row: 1, col: 3 } }),
      getCellMetaTransient: () => ({ readOnly: true }),
    });

    const started = adapter.beginEdit({ sheet: '', row: 1, col: 3 }, '=A1');

    expect(started).toBe(false);
    expect(editor.beginEditing).not.toHaveBeenCalled();
  });

  it('still opens the editor for writable cells with selection metadata present', () => {
    const editor = { beginEditing: jest.fn() };
    const adapter = makeAdapter(editor, {
      getSelectedRangeLast: () => ({ highlight: { row: 1, col: 3 } }),
      getCellMetaTransient: () => ({ readOnly: false }),
    });

    expect(adapter.beginEdit({ sheet: '', row: 1, col: 3 }, '5')).toBe(true);
    expect(editor.beginEditing).toHaveBeenCalledWith('5');
  });
});
