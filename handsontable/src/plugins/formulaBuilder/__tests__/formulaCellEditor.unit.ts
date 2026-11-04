import { EDITOR_STATE } from '../../../editors/baseEditor';
import { getEditor } from '../../../editors/registry';
import {
  createFormulaCellEditor,
  FORMULA_EDITOR_ALIAS,
  isFormulaEditor,
  registerFormulaEditor,
  resolveInlineSeed,
} from '../formulaCellEditor';
import { makeEditorHotStub } from './helpers/pluginHotStub';

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
    _hiddenByFormulaBar: false,
    _opened: true,
    state: EDITOR_STATE.EDITING as string,
    input: inputEl,
    TD: null as HTMLElement | null,
    container: document.createElement('div'),
    getEditedCell: () => document.createElement('td'),
    getEditedCellRect: () => ({ top: 10, start: 5, width: 120, height: 28 }),
    getEditedCellsLayerClass: () => 'ht_clone_master',
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

describe('registerFormulaEditor in a fresh module registry', () => {
  /**
   * Loads the given modules in an isolated module registry, so the editor registry starts empty
   * and nothing registered by another test is visible.
   *
   * @param {Function} body Receives the isolated modules.
   */
  function withFreshModules(body: (modules: {
    registry: typeof import('../../../editors/registry');
    editorModule: typeof import('../formulaCellEditor');
    removeAlias: () => void;
  }) => void): void {
    jest.isolateModules(() => {
      /* eslint-disable global-require, @typescript-eslint/no-var-requires */
      const registry = require('../../../editors/registry');
      const editorModule = require('../formulaCellEditor');
      const { collection } = require('../../../utils/staticRegister');
      /* eslint-enable global-require, @typescript-eslint/no-var-requires */

      body({
        registry,
        editorModule,
        removeAlias: () => collection.get('editors').delete(FORMULA_EDITOR_ALIAS),
      });
    });
  }

  it('leaves the editor registry alone when the plugin module loads, and lists the alias on the class', () => {
    jest.isolateModules(() => {
      /* eslint-disable global-require, @typescript-eslint/no-var-requires */
      const registry = require('../../../editors/registry');
      const { FormulaBuilder } = require('../formulaBuilder');
      /* eslint-enable global-require, @typescript-eslint/no-var-requires */

      // Importing a plugin must register nothing but the plugin (the `registerAll*` registry tests),
      // so the alias waits for the first instance; `validateSettings()` reads `EDITORS` meanwhile.
      expect(registry.hasEditor(FORMULA_EDITOR_ALIAS)).toBe(false);
      expect(FormulaBuilder.EDITORS).toEqual([FORMULA_EDITOR_ALIAS]);
    });
  });

  it('does not create a second class on a second call', () => {
    withFreshModules(({ registry, editorModule }) => {
      editorModule.registerFormulaEditor();

      const first = registry.getEditor(FORMULA_EDITOR_ALIAS);

      editorModule.registerFormulaEditor();

      expect(registry.getEditor(FORMULA_EDITOR_ALIAS)).toBe(first);
    });
  });

  it('re-registers the same class after the alias is removed from the registry', () => {
    withFreshModules(({ registry, editorModule, removeAlias }) => {
      editorModule.registerFormulaEditor();

      const first = registry.getEditor(FORMULA_EDITOR_ALIAS);

      removeAlias();

      expect(registry.hasEditor(FORMULA_EDITOR_ALIAS)).toBe(false);

      editorModule.registerFormulaEditor();

      expect(registry.hasEditor(FORMULA_EDITOR_ALIAS)).toBe(true);
      expect(registry.getEditor(FORMULA_EDITOR_ALIAS)).toBe(first);
      expect(editorModule.isFormulaEditor(first)).toBe(true);
    });
  });

  it('reuses a class another copy registered under the alias and matches it', () => {
    withFreshModules(({ registry, editorModule }) => {
      const ForeignFormulaEditor = editorModule.createFormulaCellEditor();

      registry.registerEditor(FORMULA_EDITOR_ALIAS, ForeignFormulaEditor as never);
      editorModule.registerFormulaEditor();

      expect(registry.getEditor(FORMULA_EDITOR_ALIAS)).toBe(ForeignFormulaEditor);
      expect(editorModule.isFormulaEditor(ForeignFormulaEditor)).toBe(true);
    });
  });

  it('does not treat an application editor registered under the alias as the formula editor', () => {
    withFreshModules(({ registry, editorModule }) => {
      class ApplicationEditor {}

      registry.registerEditor(FORMULA_EDITOR_ALIAS, ApplicationEditor as never);
      editorModule.registerFormulaEditor();

      // Those cells use the application's editor, as the plugin's warning says, so the plugin
      // must not mark them, describe them, or drive them from the formula bar.
      expect(editorModule.isFormulaEditor(FORMULA_EDITOR_ALIAS)).toBe(false);
      expect(editorModule.isFormulaEditor(ApplicationEditor)).toBe(false);
    });
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

describe('refreshDimensions with _hiddenByFormulaBar', () => {
  it('hides the container and skips the cell lookup while _hiddenByFormulaBar is set', () => {
    const prototype = makeEditorPrototype();
    const editor = makeOpenEditorStub(makeRoot());
    const getEditedCell = jest.fn(() => document.createElement('td'));

    editor._hiddenByFormulaBar = true;
    editor.getEditedCell = getEditedCell;

    prototype.refreshDimensions.call(editor);

    expect(editor.container.style.display).toBe('none');
    expect(getEditedCell).not.toHaveBeenCalled();
    expect(editor.close).not.toHaveBeenCalled();
  });

  it('shows the container again after _hiddenByFormulaBar is cleared', () => {
    const prototype = makeEditorPrototype();
    const editor = makeOpenEditorStub(makeRoot());

    editor._hiddenByFormulaBar = true;
    prototype.refreshDimensions.call(editor);

    expect(editor.container.style.display).toBe('none');

    editor._hiddenByFormulaBar = false;
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

  it('reads the value without closing unbalanced parens', () => {
    const editor = makeShimEditor('=SUM(A1');

    expect(editor.getValue()).toBe('=SUM(A1');
    expect(editor.closeUnbalancedParensSpy).not.toHaveBeenCalled();
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

  afterEach(() => {
    document.body.replaceChildren();
  });

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
    const pluginSurface: FallbackPluginSurface | null = plugin === null ? null : {
      handleInlineEditStart: jest.fn(() => true),
      handleInlineEditClose: jest.fn(),
      getActiveEditor: () => null,
      enabled: plugin.enabled,
    };
    // The fallback textarea must actually receive focus (verified against
    // `document.activeElement`), and jsdom only focuses elements connected to
    // the document - the stub's root element is attached.
    const hotStub = makeEditorHotStub(pluginSurface ?? undefined);
    const EditorClass = createFormulaCellEditor() as unknown as new (hot: unknown) => FallbackEditor;

    return { editor: new EditorClass(hotStub), plugin: pluginSurface };
  }

  it('mounts a plain-textarea fallback when the plugin is disabled', () => {
    const { editor } = buildEditor({ enabled: false });

    editor._original = '=B2*C2';
    editor._pending = '=B2*C2';
    editor.enableFullEditMode();
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

describe('keyboard guard lifecycle', () => {
  interface GuardEditor {
    input: HTMLElement;
    _keyboardGuard?: unknown;
    open(): void;
    close(): void;
  }

  let documentKeyListener: jest.Mock;

  beforeEach(() => {
    documentKeyListener = jest.fn();
    document.addEventListener('keydown', documentKeyListener);
    document.addEventListener('keyup', documentKeyListener);
    document.addEventListener('keypress', documentKeyListener);
  });

  afterEach(() => {
    document.removeEventListener('keydown', documentKeyListener);
    document.removeEventListener('keyup', documentKeyListener);
    document.removeEventListener('keypress', documentKeyListener);
    document.body.replaceChildren();
  });

  /**
   * Builds an editor shim wired to an enabled plugin surface, with its wrapper attached inside
   * the grid root so key events bubble up to the document.
   *
   * @returns {{ editor: GuardEditor, hot: ReturnType<typeof makeEditorHotStub> }}
   */
  function makeGuardHarness() {
    const pluginSurface = {
      enabled: true,
      handleInlineEditStart: jest.fn(() => true),
      handleInlineEditClose: jest.fn(),
      getActiveEditor: () => null,
    };
    const hot = makeEditorHotStub(pluginSurface);
    const EditorClass = createFormulaCellEditor() as unknown as new (hot: unknown) => GuardEditor;
    const editor = new EditorClass(hot);

    hot.rootElement.appendChild(editor.input);

    return { editor, hot };
  }

  /**
   * Dispatches a bubbling keyboard event on the editor wrapper.
   *
   * @param {GuardEditor} editor The editor shim.
   * @param {string} type The event type.
   */
  function press(editor: GuardEditor, type = 'keydown'): void {
    const event = new KeyboardEvent(type, { key: 'Enter', bubbles: true, cancelable: true });

    // The formula editor handled the key: its own listener, below the wrapper, prevented the default.
    if (type === 'keydown') {
      event.preventDefault();
    }

    editor.input.dispatchEvent(event);
  }

  /**
   * Resolves after the next macrotask, the earliest a `_registerTimeout` callback runs.
   *
   * @returns {Promise<void>}
   */
  function nextTask(): Promise<void> {
    return new Promise((resolve) => { setTimeout(resolve, 0); });
  }

  it('keeps keydown, keyup and keypress on the editor input from reaching the document while open', () => {
    const { editor } = makeGuardHarness();

    editor.open();
    press(editor, 'keydown');
    press(editor, 'keyup');
    press(editor, 'keypress');

    expect(documentKeyListener).not.toHaveBeenCalled();

    editor.close();
  });

  it.each([
    ['F2', { key: 'F2' }, true],
    ['Ctrl+E', { key: 'e', ctrlKey: true }, true],
    ['Cmd+E', { key: 'E', metaKey: true }, true],
    ['a plain e', { key: 'e' }, false],
    ['Enter', { key: 'Enter' }, false],
  ])('enters full edit mode on a handled %s keydown: %s', (_name, init, expected) => {
    const { editor } = makeGuardHarness();
    const enableFullEditMode = jest.fn();

    (editor as unknown as { enableFullEditMode: () => void }).enableFullEditMode = enableFullEditMode;
    editor.open();

    const event = new KeyboardEvent('keydown', { ...init, bubbles: true, cancelable: true });

    event.preventDefault();
    editor.input.dispatchEvent(event);

    expect(enableFullEditMode).toHaveBeenCalledTimes(expected ? 1 : 0);

    editor.close();
  });

  it('does not enter full edit mode on an F2 the formula editor did not handle', () => {
    const { editor } = makeGuardHarness();
    const enableFullEditMode = jest.fn();

    (editor as unknown as { enableFullEditMode: () => void }).enableFullEditMode = enableFullEditMode;
    editor.open();
    editor.input.dispatchEvent(new KeyboardEvent('keydown', { key: 'F2', bubbles: true, cancelable: true }));

    expect(enableFullEditMode).not.toHaveBeenCalled();

    editor.close();
  });

  it('lets keys through before the session opens', () => {
    const { editor } = makeGuardHarness();

    press(editor);

    expect(documentKeyListener).toHaveBeenCalledTimes(1);
  });

  it('still guards the committing keystroke after close, in the same task and after a microtask', async() => {
    const { editor, hot } = makeGuardHarness();

    editor.open();
    editor.close();

    // The keystroke that committed the edit is still bubbling when the editor closes.
    press(editor);

    expect(documentKeyListener).not.toHaveBeenCalled();

    // Trusted-event dispatch runs a microtask checkpoint between listeners, so a
    // microtask-deferred disposal would un-guard the in-flight keystroke mid-bubble.
    await Promise.resolve();
    press(editor);

    expect(documentKeyListener).not.toHaveBeenCalled();
    expect(editor._keyboardGuard).toBeNull();
    expect(hot._registerTimeout).toHaveBeenCalledTimes(1);
    expect(hot._registerTimeout.mock.calls[0][1]).toBeUndefined();
  });

  it('lets keys reach the document once the timeout task has destroyed the guard', async() => {
    const { editor } = makeGuardHarness();

    editor.open();
    editor.close();
    await nextTask();
    press(editor);

    expect(documentKeyListener).toHaveBeenCalledTimes(1);
  });

  it('arms a new guard for the next session', async() => {
    const { editor } = makeGuardHarness();

    editor.open();
    editor.close();
    await nextTask();
    editor.open();
    press(editor);

    expect(documentKeyListener).not.toHaveBeenCalled();

    editor.close();
  });

  it('keeps the new session guarded when it opens before the previous guard is destroyed', async() => {
    const { editor } = makeGuardHarness();

    editor.open();
    editor.close();
    editor.open();

    // The previous session's deferred destroy runs now; it must not take the new guard with it.
    await nextTask();
    press(editor);

    expect(documentKeyListener).not.toHaveBeenCalled();

    editor.close();
  });
});
