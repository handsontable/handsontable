import type { EventManager, EventScope, FormulaEditor } from '@hfe/core';
import { editorFactory } from '../../editors/factory';
import { EDITOR_STATE } from '../../editors/baseEditor';
import { getEditor, registerEditor } from '../../editors/registry';

export const FORMULA_EDITOR_ALIAS = 'formula';
export const EDITING_CELL_CLASS = 'ht-formula-builder__editing-cell';
export const INLINE_EDITOR_CLASS = 'ht-formula-builder__inline-editor';

/**
 * Constructor shape returned by the editor factory.
 */
interface BaseEditorCtor {
  new (instance: unknown): object;
}

/**
 * Extra state the formula editor shim keeps on the editor instance.
 */
interface FormulaEditorProperties {
  /**
   * The wrapper element the core formula editor mounts into.
   */
  input: HTMLElement;
  /**
   * The printable-key seed captured by `setValue` before the overlay editor attaches.
   */
  _pending?: string;
  /**
   * The cell's original value captured in `beforeOpen`; the `getValue` fallback.
   */
  _original?: string;
  /**
   * Marks the editor as hidden by the formula bar handoff.
   */
  _hfeHidden?: boolean;
  /**
   * The keyboard guard scope of the current edit session, `null` between sessions.
   */
  _guardScope?: EventScope | null;
  /**
   * The plain-textarea fallback mounted when the plugin is disabled or missing.
   */
  _fallbackInput?: HTMLTextAreaElement;
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
   * The plugin's DOM event manager (used for the keyboard guard scope),
   * `null` while the plugin is disabled.
   */
  events: EventManager | null;
  /**
   * Mounts the core formula editor into the inline wrapper.
   *
   * @param {HTMLElement} mount The wrapper element.
   * @param {string} seed The initial editor content.
   */
  handleInlineEditStart(mount: HTMLElement, seed: string): void;
  /**
   * Tears the core formula editor down after the shim closes.
   */
  handleInlineEditClose(): void;
  /**
   * Returns the live core formula editor, or `null` when not editing.
   *
   * @returns {FormulaEditor | null}
   */
  getActiveEditor(): FormulaEditor | null;
}

/**
 * Host shape used to reach the plugin from an editor instance.
 */
interface EditorHost {
  instance?: {
    getPlugin?(name: string): unknown;
    rootDocument?: Document;
  };
  hot?: {
    getPlugin?(name: string): unknown;
    rootDocument?: Document;
  };
}

/**
 * Resolves the FormulaBuilder plugin from an editor instance.
 *
 * @param {unknown} editor The editor instance.
 * @returns {FormulaEditorPluginSurface | null}
 */
function resolvePlugin(editor: unknown): FormulaEditorPluginSurface | null {
  const host = editor as EditorHost;
  const hot = host.instance ?? host.hot;
  const plugin = hot?.getPlugin?.('formulaBuilder');

  return (plugin as FormulaEditorPluginSurface | undefined) ?? null;
}

/**
 * Resolves the host document from an editor instance.
 *
 * @param {unknown} editor The editor instance.
 * @returns {Document}
 */
function resolveDocument(editor: unknown): Document {
  const host = editor as EditorHost;

  return (host.instance ?? host.hot)!.rootDocument!;
}

/**
 * Mounts a bare textarea into the shim wrapper so editing still works when the
 * FormulaBuilder plugin is disabled but cells retain `editor: 'formula'` meta.
 *
 * The shim's custom `refreshDimensions` only shows and sizes the container once
 * the wrapper has content - the factory's `open()` calls `refreshDimensions()`
 * BEFORE `afterOpen()` runs, so that first pass always finds an empty wrapper
 * and leaves the container `display: none`. The enabled-plugin path recovers
 * because `handleInlineEditStart` happens to trigger its own forced refresh
 * (via `setInlineEditorVisible`); this fallback has no such plugin call, so it
 * must force one itself - otherwise the mounted textarea sits inside a hidden,
 * zero-size container and can never actually receive focus.
 *
 * @param {object} editor The editor instance.
 */
function mountFallbackTextarea(editor: {
  input: HTMLElement;
  _original?: string;
  _fallbackInput?: HTMLTextAreaElement;
  refreshDimensions?(force?: boolean): void;
}): void {
  const textarea = resolveDocument(editor).createElement('textarea');

  textarea.className = 'handsontableInput';
  textarea.value = editor._original ?? '';
  editor.input.replaceChildren(textarea);
  editor._fallbackInput = textarea;
  editor.refreshDimensions?.(true);
  textarea.focus();
}

/**
 * Editor shape consumed by {@link resolveInlineSeed}.
 */
interface SeedSourceEditor {
  isInFullEditMode?: () => boolean;
  _pending?: string;
}

/**
 * Returns the printable-key seed for an inline edit session: the pending value
 * in fast-edit mode (typing started the edit), empty otherwise (Enter/F2 opened it).
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
interface ScrollAwareEditor {
  state: string;
  getEditedCell(): HTMLElement | null | undefined;
  close(): void;
  container: HTMLElement;
  input: HTMLElement;
  TD: HTMLElement | null;
  hot: {
    rootElement: HTMLElement;
    rootWindow: Window & typeof globalThis;
    isRtl?(): boolean;
    view?: {
      getOverlayByName(overlayName: string): {
        holder: HTMLElement | Window;
        clone: { wtTable: { wtRootElement: HTMLElement } } | null;
      } | null;
    };
  };
  autoResize?: { init(...args: unknown[]): void; unObserve(): void };
  _hfeHidden?: boolean;
}

/**
 * Constrains the editor width so long formulas stop at the scrollable content edge.
 *
 * @param {ScrollAwareEditor} editor The editor instance.
 * @param {HTMLElement} editedCell The edited cell element.
 */
function applyContentEdgeWidth(editor: ScrollAwareEditor, editedCell: HTMLElement): void {
  const holderCandidate = editor.hot.view?.getOverlayByName('top')?.holder;
  const holder = holderCandidate instanceof HTMLElement ? holderCandidate : null;

  if (!holder) {
    editor.input.style.removeProperty('--hfe-editor-max-width');

    return;
  }

  const holderRect = holder.getBoundingClientRect();
  const cellRect = editedCell.getBoundingClientRect();
  const rtl = editor.hot.isRtl?.() ??
    editor.hot.rootWindow.getComputedStyle(editedCell).direction === 'rtl';
  const available = rtl ?
    cellRect.right - (holderRect.left + holder.clientLeft) :
    holderRect.left + holder.clientWidth - cellRect.left;

  editor.input.style.setProperty(
    '--hfe-editor-max-width',
    `${Math.max(0, Math.floor(available))}px`,
  );
}

const ABOVE_ORDINARY_OVERLAY_Z_INDEX = 11;

/**
 * Collects the z-indexes of every frozen-pane clone except the editor's own container.
 *
 * @param {ScrollAwareEditor} editor The editor instance.
 * @returns {number[]}
 */
function frozenPaneZIndexes(editor: ScrollAwareEditor): number[] {
  const zIndexes: number[] = [];

  for (const overlay of editor.hot.rootElement.querySelectorAll<HTMLElement>(
    '[class*="ht_clone"]',
  )) {
    if (overlay === editor.container) {
      continue;
    }

    const zIndex = Number.parseInt(editor.hot.rootWindow.getComputedStyle(overlay).zIndex, 10);

    if (!Number.isNaN(zIndex)) {
      zIndexes.push(zIndex);
    }
  }

  return zIndexes;
}

/**
 * Stacks the editor container so it renders above its own pane but below any
 * frozen pane that overlaps it.
 *
 * @param {ScrollAwareEditor} editor The editor instance.
 * @param {HTMLElement} editedCell The edited cell element.
 */
function stackEditorAgainstOverlays(editor: ScrollAwareEditor, editedCell: HTMLElement): void {
  const frozenZIndexes = frozenPaneZIndexes(editor);
  const cellPane = editedCell.closest<HTMLElement>('[class*="ht_clone"]');
  const cellPaneZIndex = cellPane ?
    Number.parseInt(editor.hot.rootWindow.getComputedStyle(cellPane).zIndex, 10) :
    Number.NaN;
  const isScrollAreaCell = Number.isNaN(cellPaneZIndex);
  const panesAbove = frozenZIndexes.filter(zIndex => isScrollAreaCell || zIndex > cellPaneZIndex);

  let stackedZIndex: number;

  if (panesAbove.length > 0) {
    stackedZIndex = Math.min(...panesAbove) - 1;
  } else if (isScrollAreaCell) {
    stackedZIndex = ABOVE_ORDINARY_OVERLAY_Z_INDEX;
  } else {
    stackedZIndex = cellPaneZIndex + 1;
  }

  editor.container.style.zIndex = String(Math.max(stackedZIndex, ABOVE_ORDINARY_OVERLAY_Z_INDEX));
}

/**
 * Measures the current-selection border box drawn by Walkontable around the edited cell.
 *
 * @param {HTMLElement} editedCell The edited cell element.
 * @returns {DOMRect | null}
 */
function currentSelectionBorderBox(editedCell: HTMLElement): DOMRect | null {
  const overlay = editedCell.closest<HTMLElement>('[class*="ht_clone"], .ht_master');

  if (!overlay) {
    return null;
  }

  const ownerWindow = editedCell.ownerDocument.defaultView;

  if (!ownerWindow) {
    return null;
  }

  const sides = [...overlay.querySelectorAll<HTMLElement>('.htBorders .wtBorder.current')].filter(
    (border) => {
      if (ownerWindow.getComputedStyle(border).display === 'none') {
        return false;
      }

      const rect = border.getBoundingClientRect();

      return Math.min(rect.width, rect.height) <= 3 && Math.max(rect.width, rect.height) > 10;
    },
  );

  if (sides.length === 0) {
    return null;
  }

  const rects = sides.map(border => border.getBoundingClientRect());
  const top = Math.min(...rects.map(rect => rect.top));
  const bottom = Math.max(...rects.map(rect => rect.bottom));
  const left = Math.min(...rects.map(rect => rect.left));
  const right = Math.max(...rects.map(rect => rect.right));

  return new DOMRect(left, top, right - left, bottom - top);
}

/**
 * Nudges the editor container so it sits exactly on the selection border.
 *
 * @param {HTMLElement} container The editor container element.
 * @param {HTMLElement} wrap The inline wrapper element.
 * @param {HTMLElement} editedCell The edited cell element.
 */
function alignContainerToSelectionBorder(
  container: HTMLElement,
  wrap: HTMLElement,
  editedCell: HTMLElement,
): void {
  const selectionBox = currentSelectionBorderBox(editedCell);

  if (!selectionBox) {
    return;
  }

  const containerRect = container.getBoundingClientRect();
  const topDelta = selectionBox.top - containerRect.top;
  const leftDelta = selectionBox.left - containerRect.left;

  container.style.top = `${Number.parseFloat(container.style.top || '0') + topDelta}px`;
  container.style.left = `${Number.parseFloat(container.style.left || '0') + leftDelta}px`;
  wrap.style.height = `${selectionBox.height}px`;
}

/**
 * Builds the formula cell editor class: a Handsontable editor shim whose content
 * is the core formula editor mounted by the plugin. The keyboard guard scope is
 * created per edit session (in `afterOpen`) and disposed one task after close, so
 * it still guards the keystroke that closed the session yet never outlives the
 * plugin's enable cycle.
 *
 * Save-value invariant: `getValue()` never fabricates a value - while the overlay
 * editor is attached it returns the live buffer; once it is gone it falls back to
 * `_original` (captured in `beforeOpen`), never `_pending` (the printable-key seed).
 *
 * @returns {Function} The editor class.
 */
export function createFormulaCellEditor(): BaseEditorCtor {
  const EditorClass = editorFactory<FormulaEditorProperties>({
    init(editor) {
      const wrap = resolveDocument(editor).createElement('div');

      wrap.className = INLINE_EDITOR_CLASS;
      wrap.style.width = '100%';
      wrap.style.height = '100%';

      editor.input = wrap;
      (editor as unknown as ScrollAwareEditor).autoResize = {
        init: () => {},
        unObserve: () => {},
      };
    },
    beforeOpen(editor, { originalValue }) {
      const original = originalValue === null || originalValue === undefined ?
        '' : String(originalValue);

      editor._pending = original;
      editor._original = original;
      editor._hfeHidden = false;
    },
    afterOpen(editor) {
      const plugin = resolvePlugin(editor);

      if (!plugin || plugin.enabled === false) {
        mountFallbackTextarea(editor);

        return;
      }

      editor._fallbackInput = undefined;

      if (plugin.events && !editor._guardScope) {
        const guardScope = plugin.events.createScope('cell-editor-guard', {
          stopPropagation: true,
        });

        guardScope.listen(editor.input, 'keydown', () => {});
        guardScope.listen(editor.input, 'keyup', () => {});
        guardScope.listen(editor.input, 'keypress', () => {});
        guardScope.activate();
        editor._guardScope = guardScope;
      }

      editor.input.replaceChildren();
      plugin.handleInlineEditStart(editor.input, resolveInlineSeed(editor as SeedSourceEditor));
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
        return activeEditor.getValue();
      }

      return editor._original ?? editor._pending ?? '';
    },
    setValue(editor, value) {
      const stringValue = value === null || value === undefined ? '' : String(value);
      const inner = resolvePlugin(editor)?.getActiveEditor();

      if (inner) {
        inner.setValue(stringValue);
      } else {
        editor._pending = stringValue;
      }
    },
    afterClose(editor) {
      const guardScope = editor._guardScope;

      if (guardScope) {
        editor._guardScope = null;
        // The keystroke that committed the edit is still bubbling when `afterClose`
        // runs (the commit closes the editor synchronously), so disposing now would
        // un-guard that in-flight event and let the grid's document-level shortcut
        // recorder re-handle it (e.g. Enter re-opening the editor one row below).
        // A microtask is NOT enough: trusted-event dispatch checkpoints microtasks
        // between listener invocations, so it would still unbind mid-bubble. Defer a
        // full task; `dispose()` is idempotent, so a plugin-teardown `disposeAll()`
        // firing first stays safe, and `_registerTimeout` self-clears on destroy.
        editor.hot._registerTimeout(() => guardScope.dispose());
      }

      editor._fallbackInput = undefined;
      editor.input.replaceChildren();
      resolvePlugin(editor)?.handleInlineEditClose();
    },
  });

  const prototype = (
    EditorClass as unknown as {
      prototype: ScrollAwareEditor & {
        refreshDimensions(force?: boolean): void;
      };
    }
  ).prototype;
  const baseRefreshDimensions = prototype.refreshDimensions;

  prototype.refreshDimensions = function refreshDimensions(
    this: ScrollAwareEditor,
    force = false,
  ): void {
    if (this._hfeHidden) {
      this.container.style.display = 'none';

      return;
    }

    if (this.input.childElementCount === 0) {
      this.container.style.display = 'none';

      return;
    }

    if (this.state !== EDITOR_STATE.EDITING && !force) {
      return;
    }

    const editedCell = this.getEditedCell();

    if (!editedCell) {
      this.TD = null;
      this.container.style.display = '';
      this.container.style.opacity = '0';
      this.container.style.pointerEvents = 'none';

      return;
    }

    this.container.style.display = '';
    this.container.style.opacity = '';
    this.container.style.pointerEvents = '';
    baseRefreshDimensions.call(this, force);
    this.container.style.height = '';
    this.input.style.height = `${editedCell.offsetHeight}px`;
    alignContainerToSelectionBorder(this.container, this.input, editedCell);
    editedCell.classList.add(EDITING_CELL_CLASS);
    applyContentEdgeWidth(this, editedCell);
    stackEditorAgainstOverlays(this, editedCell);
  };

  return EditorClass as unknown as BaseEditorCtor;
}

let formulaEditorClassCache: unknown = null;

/**
 * Resolves (and memoizes) the registered formula editor class - this runs once
 * per rendered cell via `isFormulaEditor`, so the registry lookup with its
 * try/catch must not repeat per call.
 *
 * @returns {unknown}
 */
function resolveFormulaEditorClass(): unknown {
  if (formulaEditorClassCache === null) {
    try {
      formulaEditorClassCache = getEditor(FORMULA_EDITOR_ALIAS);
    } catch {
      return null;
    }
  }

  return formulaEditorClassCache;
}

/**
 * Checks whether the given editor (alias or class) is the formula editor.
 *
 * @param {unknown} editor The editor alias or class.
 * @returns {boolean}
 */
export function isFormulaEditor(editor: unknown): boolean {
  if (editor === FORMULA_EDITOR_ALIAS) {
    return true;
  }

  return editor !== undefined && editor === resolveFormulaEditorClass();
}

/**
 * Registers the formula editor under its alias, once.
 */
export function registerFormulaEditor(): void {
  let registered = true;

  try {
    getEditor(FORMULA_EDITOR_ALIAS);
  } catch {
    registered = false;
  }

  if (!registered) {
    registerEditor(FORMULA_EDITOR_ALIAS, createFormulaCellEditor() as never);
  }
}
