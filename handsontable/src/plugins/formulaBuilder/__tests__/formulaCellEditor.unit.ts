import { EDITOR_STATE } from '../../../editors/baseEditor';
import { getEditor } from '../../../editors/registry';
import {
  createFormulaCellEditor,
  FORMULA_EDITOR_ALIAS,
  isFormulaEditor,
  registerFormulaEditor,
  resolveInlineSeed,
} from '../formulaCellEditor';

interface RefreshableEditorPrototype {
  refreshDimensions(force?: boolean): void;
}

/**
 * Builds a fresh formula editor class and returns its prototype.
 *
 * @returns {RefreshableEditorPrototype}
 */
function makeEditorPrototype(): RefreshableEditorPrototype {
  const EditorClass = createFormulaCellEditor() as unknown as {
    prototype: RefreshableEditorPrototype;
  };

  return EditorClass.prototype;
}

interface OverlayView {
  getOverlayByName(overlayName: string): {
    holder: HTMLElement | Window;
    clone: { wtTable: { wtRootElement: HTMLElement } } | null;
  } | null;
}

/**
 * Creates a root element attached to the document body.
 *
 * @returns {HTMLElement}
 */
function makeRoot(): HTMLElement {
  const rootElement = document.createElement('div');

  document.body.appendChild(rootElement);

  return rootElement;
}

/**
 * Appends an `ht_clone_top` overlay with the given z-index to a root element.
 *
 * @param {HTMLElement} rootElement The grid root element.
 * @param {string} zIndex The overlay z-index.
 */
function appendOverlay(rootElement: HTMLElement, zIndex: string): void {
  const overlay = document.createElement('div');

  overlay.className = 'ht_clone_top';
  overlay.style.position = 'absolute';
  overlay.style.zIndex = zIndex;
  rootElement.appendChild(overlay);
}

/**
 * Creates an attached root element pre-populated with `ht_clone` overlays.
 *
 * @param {string[]} zIndexes The overlay z-indexes.
 * @returns {HTMLElement}
 */
function makeRootWithOverlays(zIndexes: string[]): HTMLElement {
  const rootElement = document.createElement('div');

  for (const zIndex of zIndexes) {
    appendOverlay(rootElement, zIndex);
  }

  document.body.appendChild(rootElement);

  return rootElement;
}

/**
 * Appends a frozen `ht_clone_inline_start` pane holding one cell to a root element.
 *
 * @param {HTMLElement} rootElement The grid root element.
 * @param {string} paneZIndex The frozen pane z-index.
 * @returns {HTMLTableCellElement} The cell inside the pane.
 */
function appendFrozenCell(rootElement: HTMLElement, paneZIndex: string): HTMLTableCellElement {
  const pane = document.createElement('div');

  pane.className = 'ht_clone_inline_start';
  pane.style.position = 'absolute';
  pane.style.zIndex = paneZIndex;

  const cell = document.createElement('td');

  pane.appendChild(cell);
  rootElement.appendChild(pane);

  return cell;
}

/**
 * Builds an editor instance stub in the "open and editing" state.
 *
 * @param {HTMLElement} rootElement The grid root element.
 * @param {OverlayView} [view] Optional overlay view stub.
 * @returns {object} The editor stub.
 */
function makeOpenEditorStub(rootElement: HTMLElement, view?: OverlayView) {
  const inputEl = document.createElement('div');

  inputEl.appendChild(document.createElement('span'));

  return {
    _hfeHidden: false,
    _opened: true,
    state: EDITOR_STATE.EDITING as string,
    input: inputEl,
    TD: null as HTMLElement | null,
    container: document.createElement('div'),
    getEditedCell: () => document.createElement('td'),
    getEditedCellRect: () => ({ top: 10, start: 5, width: 120, height: 28 }),
    close: jest.fn(),
    hot: {
      rootElement,
      rootDocument: document,
      rootWindow: window,
      isRtl: () => false,
      view,
    },
  };
}

describe('registerFormulaEditor', () => {
  it('registers the \'formula\' editor alias', () => {
    registerFormulaEditor();

    expect(typeof getEditor(FORMULA_EDITOR_ALIAS)).toBe('function');
  });

  it('keeps the already-registered class on a second call', () => {
    registerFormulaEditor();

    const firstRegistered = getEditor(FORMULA_EDITOR_ALIAS);

    registerFormulaEditor();

    expect(getEditor(FORMULA_EDITOR_ALIAS)).toBe(firstRegistered);
  });
});

describe('isFormulaEditor', () => {
  it('accepts the alias string', () => {
    expect(isFormulaEditor(FORMULA_EDITOR_ALIAS)).toBe(true);
  });

  it('accepts the registered editor class', () => {
    registerFormulaEditor();

    expect(isFormulaEditor(getEditor(FORMULA_EDITOR_ALIAS))).toBe(true);
  });

  it('rejects other editor aliases and classes', () => {
    registerFormulaEditor();

    expect(isFormulaEditor('text')).toBe(false);
    expect(isFormulaEditor(class OtherEditor {})).toBe(false);
    expect(isFormulaEditor(undefined)).toBe(false);
  });
});

describe('refreshDimensions with _hfeHidden', () => {
  it('hides the container and skips the cell lookup while _hfeHidden is set', () => {
    const prototype = makeEditorPrototype();
    const editor = makeOpenEditorStub(makeRoot());
    const getEditedCell = jest.fn(() => document.createElement('td'));

    editor._hfeHidden = true;
    editor.getEditedCell = getEditedCell;

    prototype.refreshDimensions.call(editor);

    expect(editor.container.style.display).toBe('none');
    expect(getEditedCell).not.toHaveBeenCalled();
    expect(editor.close).not.toHaveBeenCalled();
  });

  it('shows the container again after _hfeHidden is cleared', () => {
    const prototype = makeEditorPrototype();
    const editor = makeOpenEditorStub(makeRoot());

    editor._hfeHidden = true;
    prototype.refreshDimensions.call(editor);

    expect(editor.container.style.display).toBe('none');

    editor._hfeHidden = false;
    prototype.refreshDimensions.call(editor);

    expect(editor.container.style.display).toBe('block');
  });
});

describe('refreshDimensions inline host height', () => {
  it('sets the inline wrap height to the edited cell height', () => {
    const prototype = makeEditorPrototype();
    const editor = makeOpenEditorStub(makeRoot());
    const editedCell = document.createElement('td');

    Object.defineProperty(editedCell, 'offsetHeight', { value: 48, configurable: true });
    editor.getEditedCell = () => editedCell;

    prototype.refreshDimensions.call(editor);

    expect(editor.input.style.height).toBe('48px');
  });
});

describe('refreshDimensions overlay stacking for a scroll-area cell', () => {
  it('drops the container below the lowest ht_clone overlay', () => {
    const prototype = makeEditorPrototype();
    const editor = makeOpenEditorStub(makeRootWithOverlays(['105', '120', '90']));

    prototype.refreshDimensions.call(editor);

    expect(editor.container.style.display).toBe('block');
    expect(editor.container.style.zIndex).toBe('89');
  });

  it('falls back to the ordinary-overlay z-index when no frozen overlays exist', () => {
    const prototype = makeEditorPrototype();
    const editor = makeOpenEditorStub(makeRootWithOverlays([]));

    prototype.refreshDimensions.call(editor);

    expect(editor.container.style.zIndex).toBe('11');
  });

  it('never drops below the ordinary-overlay floor even when a frozen overlay sits low', () => {
    const prototype = makeEditorPrototype();
    const editor = makeOpenEditorStub(makeRootWithOverlays(['5']));

    prototype.refreshDimensions.call(editor);

    expect(editor.container.style.zIndex).toBe('11');
  });

  it('recomputes on every refresh instead of caching a stale value', () => {
    const prototype = makeEditorPrototype();
    const rootElement = makeRootWithOverlays(['105']);
    const editor = makeOpenEditorStub(rootElement);

    prototype.refreshDimensions.call(editor);

    expect(editor.container.style.zIndex).toBe('104');

    appendOverlay(rootElement, '50');
    prototype.refreshDimensions.call(editor);

    expect(editor.container.style.zIndex).toBe('49');
  });
});

describe('refreshDimensions overlay stacking for a frozen cell', () => {
  it('stacks just below the next pane above the cell\'s own frozen pane', () => {
    const prototype = makeEditorPrototype();
    const rootElement = makeRootWithOverlays(['180']);
    const editor = makeOpenEditorStub(rootElement);
    const cell = appendFrozenCell(rootElement, '160');

    editor.getEditedCell = () => cell;

    prototype.refreshDimensions.call(editor);

    expect(editor.container.style.zIndex).toBe('179');
  });

  it('keeps a top-corner cell above every pane', () => {
    const prototype = makeEditorPrototype();
    const rootElement = makeRootWithOverlays(['120', '160']);
    const editor = makeOpenEditorStub(rootElement);
    const cell = appendFrozenCell(rootElement, '180');

    editor.getEditedCell = () => cell;

    prototype.refreshDimensions.call(editor);

    expect(editor.container.style.zIndex).toBe('181');
  });

  it('never drops below the ordinary-overlay floor', () => {
    const prototype = makeEditorPrototype();
    const rootElement = makeRootWithOverlays(['8']);
    const editor = makeOpenEditorStub(rootElement);
    const cell = appendFrozenCell(rootElement, '5');

    editor.getEditedCell = () => cell;

    prototype.refreshDimensions.call(editor);

    expect(editor.container.style.zIndex).toBe('11');
  });
});

describe('refreshDimensions content-edge width RTL detection', () => {
  it('uses hot.isRtl() rather than computed style to pick the content-edge formula', () => {
    const prototype = makeEditorPrototype();
    const holder = document.createElement('div');
    const view: OverlayView = {
      getOverlayByName: overlayName => (overlayName === 'top' ? { holder, clone: null } : null),
    };
    const editor = makeOpenEditorStub(makeRoot(), view);
    const isRtl = jest.fn(() => true);
    const editedCell = document.createElement('td');

    Object.defineProperty(holder, 'clientLeft', { value: 10, configurable: true });
    Object.defineProperty(holder, 'clientWidth', { value: 500, configurable: true });
    holder.getBoundingClientRect = jest.fn(() => ({ left: 0 }) as unknown as DOMRect);
    editedCell.getBoundingClientRect = jest.fn(
      () => ({ left: 50, right: 150 }) as unknown as DOMRect,
    );
    editor.hot = {
      rootElement: editor.hot.rootElement,
      rootDocument: document,
      rootWindow: window,
      isRtl,
      view,
    };
    editor.getEditedCell = () => editedCell;

    prototype.refreshDimensions.call(editor);

    expect(isRtl).toHaveBeenCalled();
    expect(editor.input.style.getPropertyValue('--hfe-editor-max-width')).toBe('140px');
  });
});

describe('getValue fallback alignment', () => {
  interface ShimEditor {
    hot: { getPlugin(name: string): unknown };
    _opened: boolean;
    _pending?: string;
    _original?: string;
    getValue(): string;
    prepare(
      row: number,
      col: number,
      prop: string,
      td: HTMLTableCellElement,
      value: unknown,
      cellProperties: object,
    ): void;
  }

  /**
   * Builds a closed editor shim whose plugin reports the given overlay editor value.
   *
   * @param {string | null} activeEditorValue The overlay editor value, or `null` when detached.
   * @returns {ShimEditor}
   */
  function makeShimEditor(activeEditorValue: string | null): ShimEditor & {
    closeUnbalancedParensSpy: jest.Mock;
  } {
    registerFormulaEditor();

    const EditorClass = getEditor(FORMULA_EDITOR_ALIAS) as unknown as { prototype: object };
    const editor = Object.create(EditorClass.prototype) as ShimEditor & {
      closeUnbalancedParensSpy: jest.Mock;
    };
    const closeUnbalancedParensSpy = jest.fn();
    const activeEditor = activeEditorValue === null ? null : {
      getValue: () => activeEditorValue,
      closeUnbalancedParens: closeUnbalancedParensSpy,
    };

    editor.hot = { getPlugin: () => ({ getActiveEditor: () => activeEditor }) };
    editor._opened = false;
    editor.closeUnbalancedParensSpy = closeUnbalancedParensSpy;

    return editor;
  }

  it('returns the live overlay buffer while the overlay editor is attached', () => {
    const editor = makeShimEditor('=A1+B2');

    editor._pending = '=';
    editor._original = '=SUM(B1)';

    expect(editor.getValue()).toBe('=A1+B2');
  });

  it('closes unbalanced parens before reading the committed value', () => {
    const editor = makeShimEditor('=SUM(A1');

    editor.getValue();

    expect(editor.closeUnbalancedParensSpy).toHaveBeenCalledTimes(1);
  });

  it('falls back to the original cell value when the overlay editor is gone', () => {
    const editor = makeShimEditor(null);

    editor._pending = '=';
    editor._original = '=SUM(B1)';

    expect(editor.getValue()).toBe('=SUM(B1)');
  });

  it('falls back to the pending seed when no original was captured', () => {
    const editor = makeShimEditor(null);

    editor._pending = '=';

    expect(editor.getValue()).toBe('=');
  });

  it('prepare captures the original cell value for the fallback', () => {
    const editor = makeShimEditor(null);

    editor.prepare(0, 0, 'a', document.createElement('td'), '=SUM(B1)', {});

    expect(editor._original).toBe('=SUM(B1)');
    expect(editor.getValue()).toBe('=SUM(B1)');
  });
});

describe('plain-textarea fallback for a disabled or missing plugin', () => {
  interface FallbackPluginSurface {
    events?: unknown;
    handleInlineEditStart: jest.Mock;
    handleInlineEditClose: jest.Mock;
    getActiveEditor: () => null;
    enabled?: boolean;
  }

  interface FallbackEditor {
    input: HTMLElement;
    open(): void;
    close(): void;
    getValue(): unknown;
    _original?: string;
    refreshDimensions?(force?: boolean): void;
  }

  /**
   * Builds a constructible editor instance wired to a plugin surface that may be
   * missing (`null`) or report `enabled: false` - the shape `getPlugin('formulaBuilder')`
   * returns once `updateSettings({ formulaBuilder: false })` disables the plugin while
   * cells keep their `editor: 'formula'` meta.
   *
   * @param {{ enabled: boolean } | null} plugin The plugin surface config, or `null` when the plugin is unregistered.
   * @returns {{ editor: FallbackEditor; plugin: FallbackPluginSurface | null }}
   */
  function buildEditor(
    plugin: { enabled: boolean } | null,
  ): { editor: FallbackEditor; plugin: FallbackPluginSurface | null } {
    // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
    const core = require('@hfe/core');
    const pluginSurface: FallbackPluginSurface | null = plugin === null ? null : {
      events: new core.EventManager(),
      handleInlineEditStart: jest.fn(),
      handleInlineEditClose: jest.fn(),
      getActiveEditor: () => null,
      enabled: plugin.enabled,
    };
    const shortcutContext = { addShortcuts: jest.fn(), removeShortcutsByGroup: jest.fn() };
    const rootElement = document.createElement('div');

    // The fallback textarea must actually receive focus (verified against
    // `document.activeElement`), and jsdom only focuses elements connected to
    // the document.
    document.body.appendChild(rootElement);

    const hotStub = {
      rootDocument: document,
      rootElement,
      rootWindow: window,
      getPlugin: () => pluginSurface ?? undefined,
      addHook: jest.fn(),
      removeHook: jest.fn(),
      _registerTimeout: (callback: () => void, delay?: number) => setTimeout(callback, delay),
      getShortcutManager: () => ({
        setActiveContextName: jest.fn(),
        getContext: () => shortcutContext,
      }),
    };
    const EditorClass = createFormulaCellEditor() as unknown as new (hot: unknown) => FallbackEditor;

    return { editor: new EditorClass(hotStub), plugin: pluginSurface };
  }

  it('mounts a plain-textarea fallback when the plugin is disabled', () => {
    const { editor } = buildEditor({ enabled: false });

    editor._original = '=B2*C2';
    editor.open();

    const fallback = editor.input.querySelector('textarea');

    expect(fallback).not.toBeNull();
    expect(fallback!.value).toBe('=B2*C2');
    fallback!.value = '=B2*C2+1';
    expect(editor.getValue()).toBe('=B2*C2+1');
  });

  it('mounts the fallback when the plugin is missing entirely', () => {
    const { editor } = buildEditor(null);

    editor._original = '5';
    editor.open();

    expect(editor.input.querySelector('textarea')).not.toBeNull();
  });

  it('forces a dimension refresh after mounting so the fallback container is not left ' +
    'hidden at zero size (the factory calls refreshDimensions before afterOpen, so the ' +
    'first pass always finds an empty, still-unmounted wrapper)', () => {
    const { editor } = buildEditor({ enabled: false });
    const refreshSpy = jest.spyOn(editor, 'refreshDimensions');

    editor._original = '=B2*C2';
    editor.open();

    expect(refreshSpy).toHaveBeenCalledWith(true);
  });

  it('focuses the fallback textarea, not the previously active element', () => {
    const { editor } = buildEditor({ enabled: false });

    editor._original = '=B2*C2';
    editor.open();

    expect(document.activeElement).toBe(editor.input.querySelector('textarea'));
  });

  it('does not mount the fallback when the plugin is enabled', () => {
    const { editor, plugin } = buildEditor({ enabled: true });

    editor.open();

    expect(editor.input.querySelector('textarea')).toBeNull();
    expect(plugin!.handleInlineEditStart).toHaveBeenCalled();
  });
});

describe('resolveInlineSeed', () => {
  it('returns the pending original value in full edit mode', () => {
    expect(resolveInlineSeed({ isInFullEditMode: () => true, _pending: '=SUM(A1:A3)' })).toBe(
      '=SUM(A1:A3)',
    );
  });

  it('returns an empty seed in fast-edit mode so the keystroke replaces the content', () => {
    expect(resolveInlineSeed({ isInFullEditMode: () => false, _pending: '=SUM(A1:A3)' })).toBe('');
  });

  it('returns an empty seed when the editor exposes no mode probe', () => {
    expect(resolveInlineSeed({ _pending: '=SUM(A1:A3)' })).toBe('');
  });

  it('returns an empty seed in full edit mode when nothing is pending', () => {
    expect(resolveInlineSeed({ isInFullEditMode: () => true })).toBe('');
  });
});

describe('cell-editor-guard scope lifecycle', () => {
  /**
   * Builds a constructible editor instance wired to a plugin surface with a real
   * core EventManager.
   *
   * @returns {{ editor: object }}
   */
  function makeGuardHarness(): {
    editor: { input: HTMLElement; open(): void; close(): void };
    rootElement: HTMLElement;
    } {
    // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
    const core = require('@hfe/core');
    const pluginSurface = {
      events: new core.EventManager(),
      handleInlineEditStart: jest.fn(),
      handleInlineEditClose: jest.fn(),
      getActiveEditor: () => null,
    };
    const shortcutContext = { addShortcuts: jest.fn(), removeShortcutsByGroup: jest.fn() };
    const hotStub = {
      rootDocument: document,
      rootElement: document.createElement('div'),
      rootWindow: window,
      getPlugin: (name: string) => (name === 'formulaBuilder' ? pluginSurface : undefined),
      addHook: jest.fn(),
      removeHook: jest.fn(),
      _registerTimeout: (callback: () => void, delay?: number) => setTimeout(callback, delay),
      getShortcutManager: () => ({
        setActiveContextName: jest.fn(),
        getContext: () => shortcutContext,
      }),
    };
    const EditorClass = createFormulaCellEditor() as unknown as new (hot: unknown) => {
      input: HTMLElement;
      open(): void;
      close(): void;
    };

    return { editor: new EditorClass(hotStub), rootElement: hotStub.rootElement };
  }

  it('attaches guard listeners on open and removes them a full task after close', async() => {
    const { editor } = makeGuardHarness();
    const addSpy = jest.spyOn(editor.input, 'addEventListener');
    const removeSpy = jest.spyOn(editor.input, 'removeEventListener');

    editor.open();

    expect(addSpy.mock.calls.map(call => call[0])).toEqual(
      expect.arrayContaining(['keydown', 'keyup', 'keypress']),
    );

    editor.close();

    // The keystroke that committed the edit is still bubbling when the editor
    // closes — the guard must stay armed for it.
    expect(removeSpy).not.toHaveBeenCalled();

    // A microtask flush must NOT unbind it either: trusted-event dispatch runs a
    // microtask checkpoint between listener invocations, so a microtask-deferred
    // disposal would still un-guard the in-flight keystroke mid-bubble.
    await Promise.resolve();

    expect(removeSpy).not.toHaveBeenCalled();

    // Only a later task may unbind.
    await new Promise((resolve) => { setTimeout(resolve, 0); });

    expect(removeSpy.mock.calls.map(call => call[0])).toEqual(
      expect.arrayContaining(['keydown', 'keyup', 'keypress']),
    );
  });

  it('still stops the committing keystroke from reaching the document after close', async() => {
    const { editor, rootElement } = makeGuardHarness();

    document.body.appendChild(rootElement);

    const documentKeydown = jest.fn();

    document.addEventListener('keydown', documentKeydown);

    try {
      editor.open();
      editor.close();

      // Same tick as close: the event that triggered the commit is still
      // in flight — the guard must swallow it.
      editor.input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

      expect(documentKeydown).not.toHaveBeenCalled();

      await new Promise((resolve) => { setTimeout(resolve, 0); });

      // After the deferred disposal the guard is gone.
      editor.input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

      expect(documentKeydown).toHaveBeenCalledTimes(1);
    } finally {
      document.removeEventListener('keydown', documentKeydown);
      rootElement.remove();
    }
  });

  it('re-arms the guard on a later edit session', () => {
    const { editor } = makeGuardHarness();

    editor.open();
    editor.close();

    const addSpy = jest.spyOn(editor.input, 'addEventListener');

    editor.open();

    expect(addSpy.mock.calls.map(call => call[0])).toEqual(
      expect.arrayContaining(['keydown', 'keyup', 'keypress']),
    );

    editor.close();
  });
});
