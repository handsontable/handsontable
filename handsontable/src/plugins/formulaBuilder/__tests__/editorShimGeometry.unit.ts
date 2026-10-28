import { EDITOR_STATE } from '../../../editors/baseEditor';
import { createFormulaCellEditor } from '../formulaCellEditor';

/**
 * The editor members the shim's `refreshDimensions` reads and writes.
 */
interface GeometryEditor {
  _hiddenByFormulaBar: boolean;
  _opened: boolean;
  state: string;
  input: HTMLElement;
  TD: HTMLElement | null;
  container: HTMLElement;
  getEditedCell: () => HTMLElement;
  getEditedCellRect: () => { top: number; start: number; width: number; height: number };
  getEditedCellsLayerClass: () => string;
  close: jest.Mock;
  hot: {
    rootElement: HTMLElement;
    rootDocument: Document;
    rootWindow: Window & typeof globalThis;
    isRtl: () => boolean;
    view: undefined;
  };
}

/**
 * Builds a fresh formula editor class and returns its patched `refreshDimensions`.
 *
 * @returns {Function}
 */
function refreshDimensions(): (this: GeometryEditor, force?: boolean) => void {
  const EditorClass = createFormulaCellEditor() as unknown as {
    prototype: { refreshDimensions(force?: boolean): void };
  };

  return EditorClass.prototype.refreshDimensions;
}

/**
 * Builds an open editor over a cell whose overlay layer class the test controls.
 *
 * @param {{ layer: string }} state The mutable layer class the editor reports.
 * @returns {GeometryEditor}
 */
function makeEditorOverCell(state: { layer: string }): GeometryEditor {
  const rootElement = document.createElement('div');
  const cell = document.createElement('td');
  const container = document.createElement('div');
  const input = document.createElement('div');

  container.className = 'handsontableInputHolder';
  input.appendChild(document.createElement('span'));
  rootElement.appendChild(cell);
  document.body.appendChild(rootElement);

  return {
    _hiddenByFormulaBar: false,
    _opened: true,
    state: EDITOR_STATE.EDITING,
    input,
    TD: null,
    container,
    getEditedCell: () => cell,
    getEditedCellRect: () => ({ top: 10, start: 5, width: 120, height: 28 }),
    getEditedCellsLayerClass: () => state.layer,
    close: jest.fn(),
    hot: {
      rootElement,
      rootDocument: document,
      rootWindow: window,
      isRtl: () => false,
      view: undefined,
    },
  };
}

/**
 * Lists the overlay layer classes the container carries.
 *
 * @param {HTMLElement} container The editor container.
 * @returns {string[]}
 */
function layerClassesOf(container: HTMLElement): string[] {
  return [...container.classList].filter(className => className.startsWith('ht_clone_'));
}

describe('refreshDimensions overlay layer class', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('gives the container the layer class of the edited cell', () => {
    const state = { layer: 'ht_clone_top_inline_start_corner' };
    const editor = makeEditorOverCell(state);

    refreshDimensions().call(editor);

    expect(layerClassesOf(editor.container)).toEqual(['ht_clone_top_inline_start_corner']);
    expect(editor.container.classList.contains('handsontableInputHolder')).toBe(true);
  });

  it('swaps the layer class when the edited cell moves to another overlay', () => {
    const state = { layer: 'ht_clone_top' };
    const editor = makeEditorOverCell(state);
    const refresh = refreshDimensions();

    refresh.call(editor);
    state.layer = 'ht_clone_master';
    refresh.call(editor);

    expect(layerClassesOf(editor.container)).toEqual(['ht_clone_master']);

    state.layer = 'ht_clone_bottom_inline_end_corner';
    refresh.call(editor);

    expect(layerClassesOf(editor.container)).toEqual(['ht_clone_bottom_inline_end_corner']);
    expect(editor.container.classList.contains('handsontableInputHolder')).toBe(true);
  });

  it('leaves the layer class alone while the formula bar hides the editor', () => {
    const state = { layer: 'ht_clone_top' };
    const editor = makeEditorOverCell(state);
    const refresh = refreshDimensions();

    refresh.call(editor);
    editor._hiddenByFormulaBar = true;
    state.layer = 'ht_clone_master';
    refresh.call(editor);

    expect(editor.container.style.display).toBe('none');
    expect(layerClassesOf(editor.container)).toEqual(['ht_clone_top']);
  });
});

/**
 * The shim editor members the focus and value tests use.
 */
interface ShimEditor {
  _pending?: string;
  focus(): void;
  setValue(value: unknown): void;
}

/**
 * Builds a shim editor whose plugin reports the given core editor as active.
 *
 * @param {object | null} activeEditor The core editor the plugin exposes, or `null` when idle.
 * @returns {ShimEditor}
 */
function makeShimEditor(activeEditor: { focus: jest.Mock; setValue: jest.Mock } | null): ShimEditor {
  const plugin = {
    enabled: true,
    handleInlineEditStart: jest.fn(() => true),
    handleInlineEditClose: jest.fn(),
    getActiveEditor: () => activeEditor,
  };
  const hotStub = {
    rootDocument: document,
    rootElement: document.body,
    rootWindow: window,
    getPlugin: () => plugin,
    addHook: jest.fn(),
    removeHook: jest.fn(),
    _registerTimeout: (callback: () => void, delay?: number) => setTimeout(callback, delay),
    getShortcutManager: () => ({
      setActiveContextName: jest.fn(),
      getContext: () => ({ addShortcuts: jest.fn(), removeShortcutsByGroup: jest.fn() }),
    }),
  };
  const EditorClass = createFormulaCellEditor() as unknown as new (hot: unknown) => ShimEditor;

  return new EditorClass(hotStub);
}

describe('formula editor shim focus and value delegation', () => {
  it('focus() focuses the live core editor', () => {
    const activeEditor = { focus: jest.fn(), setValue: jest.fn() };
    const editor = makeShimEditor(activeEditor);

    editor.focus();

    expect(activeEditor.focus).toHaveBeenCalledTimes(1);
  });

  it('setValue() writes into the live core editor as a string', () => {
    const activeEditor = { focus: jest.fn(), setValue: jest.fn() };
    const editor = makeShimEditor(activeEditor);

    editor.setValue(42);
    editor.setValue(null);

    expect(activeEditor.setValue.mock.calls).toEqual([['42'], ['']]);
    // `_pending` mirrors the last value, for the plain-textarea fallback.
    expect(editor._pending).toBe('');
  });

  it('setValue() keeps the value pending while no core editor is live', () => {
    const editor = makeShimEditor(null);

    editor.setValue('=A1');

    expect(editor._pending).toBe('=A1');
  });
});
