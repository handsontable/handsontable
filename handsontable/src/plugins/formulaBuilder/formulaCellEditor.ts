import { editorFactory } from '../../editors/factory';
import { EDITOR_STATE } from '../../editors/baseEditor';
import { getEditor, hasEditor, registerEditor } from '../../editors/registry';
import EventManager from '../../eventManager';
import { addClass, isHTMLElement, removeClass } from '../../helpers/dom/element';
import type { FormulaEditorHandle } from './types';

export const FORMULA_EDITOR_ALIAS = 'formula';
export const EDITING_CELL_CLASS = 'ht-formula-builder__editing-cell';
export const INLINE_EDITOR_CLASS = 'ht-formula-builder__inline-editor';
/**
 * The class the grid's text editor puts on its container. The plain-textarea fallback carries it while
 * mounted, so the textarea is styled like the text editor's (the rules are scoped to this class).
 */
const TEXT_EDITOR_HOLDER_CLASS = 'handsontableInputHolder';

/**
 * Marks every editor class `createFormulaCellEditor()` builds, so a copy built by another bundle on the
 * page (or a test) is not mistaken for an application's own `formula` editor.
 */
const FORMULA_SHIM_MARK = Symbol.for('handsontable.formulaBuilder.formulaCellEditor');

/**
 * Every layer class `BaseEditor#getEditedCellsLayerClass()` can return. The editor container
 * carries the one of the edited cell's overlay, so the shared z-index map
 * (`styles/base/_z-index-map.scss`) stacks it the way it stacks the text editor: above its own
 * pane, below every frozen pane that overlaps it.
 */
const EDITOR_LAYER_CLASSES = [
  'ht_clone_master',
  'ht_clone_left',
  'ht_clone_inline_start',
  'ht_clone_inline_end',
  'ht_clone_bottom',
  'ht_clone_bottom_left_corner',
  'ht_clone_bottom_inline_start_corner',
  'ht_clone_bottom_inline_end_corner',
  'ht_clone_top',
  'ht_clone_top_left_corner',
  'ht_clone_top_inline_start_corner',
  'ht_clone_top_inline_end_corner',
];

/**
 * Constructor shape returned by the editor factory.
 */
interface BaseEditorCtor {
  new (instance: unknown): object;
}

/**
 * The state the formula editor shim keeps on Handsontable's editor instance. The plugin reads
 * the same instance through `hot.getActiveEditor()`, so this one interface describes it everywhere.
 */
export interface FormulaHostEditor {
  /**
   * The visual row of the edited cell.
   */
  row?: number;
  /**
   * The visual column of the edited cell.
   */
  col?: number;
  /**
   * The wrapper element the formula editor mounts into.
   */
  input: HTMLElement;
  /**
   * The printable-key seed captured by `setValue` before the formula editor attaches.
   */
  _pending?: string;
  /**
   * The cell's original value captured in `beforeOpen`; the `getValue` fallback.
   */
  _original?: string;
  /**
   * Hides the inline editor while the formula bar edits the cell.
   */
  _hiddenByFormulaBar?: boolean;
  /**
   * The keyboard guard of the current edit session, `null` between sessions.
   */
  _keyboardGuard?: EventManager | null;
  /**
   * The plain-textarea fallback mounted when the plugin is disabled.
   */
  _fallbackInput?: HTMLTextAreaElement;
  /**
   * Re-measures and re-positions the editor.
   */
  refreshDimensions?(force?: boolean): void;
  /**
   * Replaces the editor value.
   */
  setValue?(value: string): void;
  /**
   * Opens the editor, optionally seeded with a value.
   */
  beginEditing?(value?: string): void;
  /**
   * Switches the editor to full edit mode (arrow keys move the caret).
   */
  enableFullEditMode?(): void;
  /**
   * Closes the editor, saving or restoring the value.
   */
  finishEditing?(restoreOriginal?: boolean, ctrlDown?: boolean, callback?: () => void): void;
  /**
   * Moves the focus into the editor.
   */
  focus?(): void;
}

/**
 * The surface of the FormulaBuilder plugin the editor shim delegates to.
 */
export interface FormulaEditorPluginSurface {
  /**
   * Whether the plugin is currently enabled.
   */
  enabled?: boolean;
  /**
   * Mounts the formula editor into the inline wrapper.
   *
   * @param {HTMLElement} mount The wrapper element.
   * @param {string} seed The initial editor content.
   * @returns {boolean} Whether the formula editor was mounted.
   */
  handleInlineEditStart(mount: HTMLElement, seed: string): boolean;
  /**
   * Tears the formula editor down after the shim closes.
   */
  handleInlineEditClose(): void;
  /**
   * Returns the live formula editor, or `null` when not editing.
   *
   * @returns {FormulaEditorHandle | null}
   */
  getActiveEditor(): FormulaEditorHandle | null;
}

/**
 * Host shape used to reach the plugin from an editor instance.
 */
interface EditorHost {
  hot: {
    getPlugin(name: string): unknown;
    rootDocument: Document;
  };
}

/**
 * Resolves the FormulaBuilder plugin from an editor instance.
 *
 * @param {unknown} editor The editor instance.
 * @returns {FormulaEditorPluginSurface | null}
 */
function resolvePlugin(editor: unknown): FormulaEditorPluginSurface | null {
  const plugin = (editor as EditorHost).hot.getPlugin('formulaBuilder');

  return (plugin as FormulaEditorPluginSurface | undefined) ?? null;
}

/**
 * Mounts a bare textarea into the shim wrapper so editing still works when the
 * FormulaBuilder plugin is disabled but cells retain `editor: 'formula'` meta.
 *
 * The shim's custom `refreshDimensions` only shows and sizes the container once
 * the wrapper has content - the factory's `open()` calls `refreshDimensions()`
 * BEFORE `afterOpen()` runs, so that first pass always finds an empty wrapper
 * and leaves the container `display: none`. The enabled-plugin path recovers
 * because `handleInlineEditStart` triggers its own forced refresh (via
 * `setInlineEditorVisible`); this fallback has no such plugin call, so it
 * must force one itself - otherwise the mounted textarea sits inside a hidden,
 * zero-size container and can never actually receive focus.
 *
 * @param {object} editor The editor instance.
 */
function mountFallbackTextarea(editor: FormulaHostEditor & EditorHost & { container: HTMLElement }): void {
  const textarea = editor.hot.rootDocument.createElement('textarea');

  textarea.className = 'handsontableInput';
  // A grid input, like the text editor's: the focus manager keeps the focus in it when the selection
  // changes while it is open.
  textarea.setAttribute('data-hot-input', '');
  // The same seed the formula editor gets: the cell value for Enter or F2, and an empty string when
  // typing opened the editor, so the typed character lands in an empty textarea.
  textarea.value = resolveInlineSeed(editor as SeedSourceEditor);
  editor.input.replaceChildren(textarea);
  editor._fallbackInput = textarea;
  addClass(editor.container, TEXT_EDITOR_HOLDER_CLASS);
  editor.refreshDimensions?.(true);
  textarea.focus();
  textarea.setSelectionRange(textarea.value.length, textarea.value.length);
}

/**
 * Editor shape consumed by {@link resolveInlineSeed}.
 */
interface SeedSourceEditor {
  isInFullEditMode?: () => boolean;
  _pending?: string;
}

/**
 * Returns the seed for an inline edit session: the cell value in full-edit mode (Enter or F2 opened
 * the editor), and an empty string in fast-edit mode (typing opened it, and the typed character
 * follows).
 *
 * @param {SeedSourceEditor} editor The editor instance.
 * @returns {string}
 */
export function resolveInlineSeed(editor: SeedSourceEditor): string {
  if (editor.isInFullEditMode?.()) {
    return editor._pending ?? '';
  }

  return '';
}

/**
 * Editor shape used by the dimension/stacking logic.
 */
interface ScrollAwareEditor extends FormulaHostEditor {
  state: string;
  getEditedCell(): HTMLElement | null | undefined;
  getEditedCellsLayerClass(): string;
  container: HTMLElement;
  TD: HTMLElement | null;
  hot: {
    rootWindow: Window & typeof globalThis;
    isRtl(): boolean;
    view?: {
      getOverlayByName(overlayName: string): { holder: HTMLElement | Window } | null;
    };
  };
}

/**
 * Constrains the editor width so long formulas stop at the scrollable content edge.
 *
 * @param {ScrollAwareEditor} editor The editor instance.
 * @param {HTMLElement} editedCell The edited cell element.
 */
function applyContentEdgeWidth(editor: ScrollAwareEditor, editedCell: HTMLElement): void {
  const holderCandidate = editor.hot.view?.getOverlayByName('top')?.holder;
  // `isHTMLElement()`: a grid in an iframe has elements of its own realm, which `instanceof` rejects.
  const holder = isHTMLElement(holderCandidate) ? holderCandidate : null;

  if (!holder) {
    editor.input.style.removeProperty('--hfe-editor-max-width');

    return;
  }

  const holderRect = holder.getBoundingClientRect();
  const cellRect = editedCell.getBoundingClientRect();
  const available = editor.hot.isRtl() ?
    cellRect.right - (holderRect.left + holder.clientLeft) :
    holderRect.left + holder.clientWidth - cellRect.left;

  editor.input.style.setProperty(
    '--hfe-editor-max-width',
    `${Math.max(0, Math.floor(available))}px`,
  );
}

/**
 * Gives the editor container the layer class of the edited cell's overlay, replacing the
 * previous one, so the shared z-index map stacks it (see {@link EDITOR_LAYER_CLASSES}).
 *
 * @param {ScrollAwareEditor} editor The editor instance.
 */
function applyEditorLayerClass(editor: ScrollAwareEditor): void {
  removeClass(editor.container, EDITOR_LAYER_CLASSES);
  addClass(editor.container, editor.getEditedCellsLayerClass());
}

/**
 * Re-measures and re-positions the inline editor. Replaces the factory's own
 * `refreshDimensions`, which it calls first.
 *
 * @param {ScrollAwareEditor} editor The editor instance.
 * @param {Function} baseRefreshDimensions The factory's `refreshDimensions`.
 * @param {boolean} force Whether to refresh outside the EDITING state.
 */
function refreshFormulaEditorDimensions(
  editor: ScrollAwareEditor,
  baseRefreshDimensions: (force?: boolean) => void,
  force: boolean,
): void {
  if (editor._hiddenByFormulaBar || editor.input.childElementCount === 0) {
    editor.container.style.display = 'none';

    return;
  }

  if (editor.state !== EDITOR_STATE.EDITING && !force) {
    return;
  }

  const editedCell = editor.getEditedCell();

  if (!editedCell) {
    editor.TD = null;
    editor.container.style.display = '';
    editor.container.style.opacity = '0';
    editor.container.style.pointerEvents = 'none';

    return;
  }

  editor.container.style.display = '';
  editor.container.style.opacity = '';
  editor.container.style.pointerEvents = '';
  baseRefreshDimensions.call(editor, force);
  editor.container.style.height = '';
  editor.input.style.height = `${editedCell.offsetHeight}px`;
  editedCell.classList.add(EDITING_CELL_CLASS);
  applyContentEdgeWidth(editor, editedCell);
  applyEditorLayerClass(editor);
}

/**
 * Starts the keyboard guard of an edit session: a key the formula editor handled (it calls
 * `preventDefault()` on it: Enter, Tab, Escape, the point-mode arrows, ...) stops at its wrapper, so
 * the grid's document-level shortcut recorder never handles it a second time. Every other key goes on
 * to the grid, the way it does from the grid's own editors: `beforeKeyDown` and
 * `afterDocumentKeyDown` fire, and an arrow key commits a quick edit and moves the selection.
 * The package's point-mode toggle (F2, mod+E) emits no event, so a handled F2 or mod+E keydown
 * enters full edit mode here: the arrows then move the caret instead of committing the quick edit.
 *
 * @param {FormulaHostEditor} editor The editor instance.
 */
function startKeyboardGuard(editor: FormulaHostEditor): void {
  if (editor._keyboardGuard) {
    return;
  }

  // Each guard gets a context object of its own. `EventManager` stores its listeners on the
  // context, and `destroy()` clears every listener stored there, so a guard built on the editor
  // itself would, one task after its session closed, also strip the guard of a session that
  // reopened in the meantime.
  const guard = new EventManager({});
  // The key of the last `keydown` that was stopped; its `keypress` and `keyup` are stopped too.
  let stoppedKey: string | null = null;
  const stopHandledKeyDown = (event: KeyboardEvent) => {
    stoppedKey = event.defaultPrevented ? event.key : null;

    if (stoppedKey !== null) {
      event.stopPropagation();

      if (event.key === 'F2' || ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'e')) {
        editor.enableFullEditMode?.();
      }
    }
  };
  const stopFollowUp = (event: KeyboardEvent) => {
    if (event.key === stoppedKey) {
      event.stopPropagation();
    }
  };

  guard.addEventListener(editor.input, 'keydown', stopHandledKeyDown);
  guard.addEventListener(editor.input, 'keyup', stopFollowUp);
  guard.addEventListener(editor.input, 'keypress', stopFollowUp);
  editor._keyboardGuard = guard;
}

/**
 * Builds the formula cell editor class: a Handsontable editor shim whose content
 * is the formula editor mounted by the plugin. The keyboard guard is created per
 * edit session (in `afterOpen`) and destroyed one task after close, so it still
 * guards the keystroke that closed the session.
 *
 * Save-value invariant: `getValue()` never fabricates a value - while the formula
 * editor is attached it returns the live buffer; once it is gone it falls back to
 * `_original` (captured in `beforeOpen`), never `_pending` (the printable-key seed).
 *
 * @returns {Function} The editor class.
 */
export function createFormulaCellEditor(): BaseEditorCtor {
  const EditorClass = editorFactory<FormulaHostEditor>({
    init(editor) {
      const wrap = editor.hot.rootDocument.createElement('div');

      wrap.className = INLINE_EDITOR_CLASS;
      editor.input = wrap;
      (editor as unknown as { autoResize: object }).autoResize = {
        init: () => {},
        unObserve: () => {},
      };
    },
    beforeOpen(editor, { originalValue }) {
      const original = originalValue === null || originalValue === undefined ?
        '' : String(originalValue);

      editor._pending = original;
      editor._original = original;
      editor._hiddenByFormulaBar = false;
    },
    afterOpen(editor) {
      const plugin = resolvePlugin(editor);

      editor._fallbackInput = undefined;
      removeClass(editor.container, TEXT_EDITOR_HOLDER_CLASS);
      editor.input.replaceChildren();

      if (
        !plugin ||
        plugin.enabled === false ||
        !plugin.handleInlineEditStart(editor.input, resolveInlineSeed(editor as SeedSourceEditor))
      ) {
        mountFallbackTextarea(editor);

        return;
      }

      startKeyboardGuard(editor);
    },
    onFocus(editor) {
      if (editor._fallbackInput) {
        editor._fallbackInput.focus();

        return;
      }
      resolvePlugin(editor)?.getActiveEditor()?.focus();
    },
    getValue(editor) {
      if (editor._fallbackInput) {
        return editor._fallbackInput.value;
      }

      const activeEditor = resolvePlugin(editor)?.getActiveEditor();

      if (activeEditor) {
        // A plain read: `getValue()` is public through `getActiveEditor()`, so it must not change
        // the buffer. The parens are closed on the commit path, in `finishEditing()` below.
        return activeEditor.getValue();
      }

      return editor._original ?? editor._pending ?? '';
    },
    setValue(editor, value) {
      const stringValue = value === null || value === undefined ? '' : String(value);
      const inner = resolvePlugin(editor)?.getActiveEditor();

      if (editor._fallbackInput) {
        editor._fallbackInput.value = stringValue;
      } else if (inner) {
        inner.setValue(stringValue);
      }

      editor._pending = stringValue;
    },
    afterClose(editor) {
      const guard = editor._keyboardGuard;

      if (guard) {
        editor._keyboardGuard = null;
        // The keystroke that committed the edit is still bubbling when `afterClose`
        // runs (the commit closes the editor synchronously), so removing the guard now
        // would let the grid's document-level shortcut recorder re-handle that event
        // (e.g. Enter re-opening the editor one row below). A microtask is NOT enough:
        // trusted-event dispatch checkpoints microtasks between listener invocations, so
        // it would still unbind mid-bubble. Defer a full task; `_registerTimeout`
        // self-clears on destroy.
        editor.hot._registerTimeout(() => guard.destroy());
      }

      editor._fallbackInput = undefined;
      removeClass(editor.container, TEXT_EDITOR_HOLDER_CLASS);
      editor.input.replaceChildren();
      resolvePlugin(editor)?.handleInlineEditClose();
    },
  });

  const prototype = (
    EditorClass as unknown as {
      prototype: ScrollAwareEditor & {
        refreshDimensions(force?: boolean): void;
        finishEditing(restoreOriginalValue?: boolean, ...rest: unknown[]): void;
      };
    }
  ).prototype;
  const baseRefreshDimensions = prototype.refreshDimensions;
  const baseFinishEditing = prototype.finishEditing;

  prototype.refreshDimensions = function refreshDimensions(
    this: ScrollAwareEditor,
    force = false,
  ): void {
    refreshFormulaEditorDimensions(this, baseRefreshDimensions, force);
  };

  // The formula editor's own commit keys close unbalanced parens, but a native commit (an outside
  // click) reads the value through `getValue()` and would save `=SUM(A1` as-is. Closing them here,
  // and only for an edit that is saved, keeps a plain `getValue()` read from changing the buffer.
  prototype.finishEditing = function finishEditing(
    this: ScrollAwareEditor,
    restoreOriginalValue?: boolean,
    ...rest: unknown[]
  ): void {
    if (!restoreOriginalValue && this.state === EDITOR_STATE.EDITING && !this._fallbackInput) {
      resolvePlugin(this)?.getActiveEditor()?.closeUnbalancedParens();
    }

    baseFinishEditing.call(this, restoreOriginalValue, ...rest);
  };

  (EditorClass as unknown as Record<symbol, boolean>)[FORMULA_SHIM_MARK] = true;

  return EditorClass as unknown as BaseEditorCtor;
}

let formulaEditorClass: BaseEditorCtor | null = null;

/**
 * Checks whether the given editor (alias or class) is the formula editor. An application editor
 * registered under the alias is not: its cells use that editor, as the plugin's warning says, so the
 * plugin must not mark them, describe them, or drive them from the formula bar.
 *
 * @param {unknown} editor The editor alias or class.
 * @returns {boolean}
 */
export function isFormulaEditor(editor: unknown): boolean {
  if (editor === FORMULA_EDITOR_ALIAS) {
    return !isFormulaAliasForeign();
  }

  return editor !== undefined && editor === formulaEditorClass &&
    (editor as Record<symbol, boolean>)[FORMULA_SHIM_MARK] === true;
}

/**
 * Checks whether the `formula` alias belongs to an editor that is not the plugin's, which an
 * application may register under that name. The plugin warns about it only from `enablePlugin()`:
 * with the full bundle every grid builds the plugin, and a grid that never turns it on has no
 * conflict to report.
 *
 * @returns {boolean}
 */
export function isFormulaAliasForeign(): boolean {
  if (!hasEditor(FORMULA_EDITOR_ALIAS)) {
    return false;
  }

  const registered = getEditor(FORMULA_EDITOR_ALIAS) as unknown as Record<symbol, boolean> | undefined;

  return registered?.[FORMULA_SHIM_MARK] !== true;
}

/**
 * Registers the formula editor under its alias, once per page. Runs from the plugin
 * constructor, never from `enablePlugin()`: a cell configured with
 * `editor: 'formula'` must resolve whether or not the plugin managed to enable, or selecting it throws
 * `No registered editor found under "formula" name`. With the plugin off, the shim mounts a
 * plain textarea instead.
 */
export function registerFormulaEditor(): void {
  if (hasEditor(FORMULA_EDITOR_ALIAS)) {
    // Another copy of the plugin (or the application) may own the alias already; reuse it.
    const registered = getEditor(FORMULA_EDITOR_ALIAS) as unknown as BaseEditorCtor;

    formulaEditorClass = registered;

    return;
  }

  formulaEditorClass ??= createFormulaCellEditor();
  registerEditor(FORMULA_EDITOR_ALIAS, formulaEditorClass as never);
}
