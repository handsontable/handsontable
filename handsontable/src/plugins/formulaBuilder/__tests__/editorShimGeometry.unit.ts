import { EDITOR_STATE } from '../../../editors/baseEditor';
import { createFormulaCellEditor } from '../formulaCellEditor';

/**
 * A rectangle as `getBoundingClientRect` returns it.
 */
interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

/**
 * The editor members the shim's `refreshDimensions` reads and writes.
 */
interface GeometryEditor {
  _hfeHidden: boolean;
  _opened: boolean;
  state: string;
  input: HTMLElement;
  TD: HTMLElement | null;
  container: HTMLElement;
  getEditedCell: () => HTMLElement;
  getEditedCellRect: () => { top: number; start: number; width: number; height: number };
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
 * Stubs `getBoundingClientRect` on an element.
 *
 * @param {HTMLElement} element The element.
 * @param {Rect} rect The rectangle to report.
 */
function placeAt(element: HTMLElement, rect: Rect): void {
  element.getBoundingClientRect = () => ({
    ...rect,
    right: rect.left + rect.width,
    bottom: rect.top + rect.height,
    x: rect.left,
    y: rect.top,
    toJSON: () => rect,
  }) as DOMRect;
}

/**
 * Appends a Walkontable-style `.wtBorder.current` side to a `.htBorders` group.
 *
 * @param {HTMLElement} borders The `.htBorders` group.
 * @param {Rect} rect The side's rectangle.
 * @param {boolean} [hidden] Whether the side is `display: none`.
 * @returns {HTMLElement}
 */
function appendBorderSide(borders: HTMLElement, rect: Rect, hidden = false): HTMLElement {
  const side = document.createElement('div');

  side.className = 'wtBorder current';

  if (hidden) {
    side.style.display = 'none';
  }

  placeAt(side, rect);
  borders.appendChild(side);

  return side;
}

/**
 * Builds an open editor over a cell inside a `.ht_master` overlay that owns a
 * `.htBorders` group, with the container's own rectangle fixed at `containerRect`.
 *
 * @param {Rect} containerRect Where the editor container reports itself on screen.
 * @returns {{ editor: GeometryEditor, borders: HTMLElement }}
 */
function makeEditorOverCell(containerRect: Rect): { editor: GeometryEditor; borders: HTMLElement } {
  const rootElement = document.createElement('div');
  const master = document.createElement('div');
  const borders = document.createElement('div');
  const cell = document.createElement('td');
  const container = document.createElement('div');
  const input = document.createElement('div');

  master.className = 'ht_master';
  borders.className = 'htBorders';
  input.appendChild(document.createElement('span'));
  master.append(cell, borders);
  rootElement.appendChild(master);
  document.body.appendChild(rootElement);
  placeAt(container, containerRect);

  const editor: GeometryEditor = {
    _hfeHidden: false,
    _opened: true,
    state: EDITOR_STATE.EDITING,
    input,
    TD: null,
    container,
    getEditedCell: () => cell,
    getEditedCellRect: () => ({ top: 10, start: 5, width: 120, height: 28 }),
    close: jest.fn(),
    hot: {
      rootElement,
      rootDocument: document,
      rootWindow: window,
      isRtl: () => false,
      view: undefined,
    },
  };

  return { editor, borders };
}

/**
 * Reads a pixel style value as a number, treating an empty value as `0`.
 *
 * @param {string} value The style value, e.g. `12px`.
 * @returns {number}
 */
function px(value: string): number {
  return Number.parseFloat(value || '0');
}

describe('refreshDimensions alignment to the current-selection border', () => {
  const windowWithRect = window as unknown as { DOMRect?: unknown };
  let hadDOMRect = true;

  // The shim returns the measured border box as a `DOMRect`; every browser has the
  // constructor, the jsdom this suite runs in does not. Install the four-field shape
  // the shim reads, and only for these tests.
  beforeAll(() => {
    if (typeof windowWithRect.DOMRect === 'undefined') {
      hadDOMRect = false;
      windowWithRect.DOMRect = class DOMRectShim {
        readonly left: number;
        readonly top: number;
        readonly width: number;
        readonly height: number;

        constructor(left: number, top: number, width: number, height: number) {
          this.left = left;
          this.top = top;
          this.width = width;
          this.height = height;
        }
      };
    }
  });

  afterAll(() => {
    if (!hadDOMRect) {
      delete windowWithRect.DOMRect;
    }
  });

  afterEach(() => {
    document.body.replaceChildren();
  });

  it('moves the container onto the selection border box and sizes the wrapper to it', () => {
    const containerRect = { top: 100, left: 50, width: 120, height: 28 };
    const { editor, borders } = makeEditorOverCell(containerRect);
    const refresh = refreshDimensions();

    refresh.call(editor);

    const baseTop = px(editor.container.style.top);
    const baseLeft = px(editor.container.style.left);

    appendBorderSide(borders, { top: 90, left: 40, width: 120, height: 2 });
    appendBorderSide(borders, { top: 118, left: 40, width: 120, height: 2 });
    appendBorderSide(borders, { top: 90, left: 40, width: 2, height: 30 });
    appendBorderSide(borders, { top: 90, left: 158, width: 2, height: 30 });

    refresh.call(editor);

    expect(px(editor.container.style.top)).toBe(baseTop + (90 - containerRect.top));
    expect(px(editor.container.style.left)).toBe(baseLeft + (40 - containerRect.left));
    expect(editor.input.style.height).toBe('30px');
  });

  it('ignores hidden sides and the corner handle when measuring the border box', () => {
    const containerRect = { top: 100, left: 50, width: 120, height: 28 };
    const { editor, borders } = makeEditorOverCell(containerRect);
    const refresh = refreshDimensions();

    refresh.call(editor);

    const baseTop = px(editor.container.style.top);
    const baseLeft = px(editor.container.style.left);
    const baseHeight = editor.input.style.height;

    appendBorderSide(borders, { top: 0, left: 0, width: 400, height: 2 }, true);
    appendBorderSide(borders, { top: 300, left: 300, width: 6, height: 6 });
    appendBorderSide(borders, { top: 0, left: 0, width: 2, height: 2 });

    refresh.call(editor);

    expect(px(editor.container.style.top)).toBe(baseTop);
    expect(px(editor.container.style.left)).toBe(baseLeft);
    expect(editor.input.style.height).toBe(baseHeight);
  });

  it('measures only the sides of the overlay that holds the edited cell', () => {
    const containerRect = { top: 100, left: 50, width: 120, height: 28 };
    const { editor, borders } = makeEditorOverCell(containerRect);
    const refresh = refreshDimensions();
    const otherOverlay = document.createElement('div');
    const otherBorders = document.createElement('div');

    otherOverlay.className = 'ht_clone_top';
    otherBorders.className = 'htBorders';
    otherOverlay.appendChild(otherBorders);
    editor.hot.rootElement.appendChild(otherOverlay);
    appendBorderSide(otherBorders, { top: 500, left: 500, width: 120, height: 2 });
    appendBorderSide(otherBorders, { top: 500, left: 500, width: 2, height: 30 });

    refresh.call(editor);

    const baseTop = px(editor.container.style.top);

    appendBorderSide(borders, { top: 90, left: 40, width: 120, height: 2 });
    appendBorderSide(borders, { top: 90, left: 40, width: 2, height: 30 });

    refresh.call(editor);

    expect(px(editor.container.style.top)).toBe(baseTop + (90 - containerRect.top));
    expect(editor.input.style.height).toBe('30px');
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
    events: null,
    handleInlineEditStart: jest.fn(),
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
    expect(editor._pending).toBeUndefined();
  });

  it('setValue() keeps the value pending while no core editor is live', () => {
    const editor = makeShimEditor(null);

    editor.setValue('=A1');

    expect(editor._pending).toBe('=A1');
  });
});
