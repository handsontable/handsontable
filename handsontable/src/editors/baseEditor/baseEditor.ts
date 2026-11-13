import type { HotInstance } from '../../core/types';
import type { CellProperties } from '../../settings';
import type { default as CellRange } from '../../3rdparty/walkontable/src/cell/range';
import { stringify } from '../../helpers/mixed';
import { throwWithCause } from '../../helpers/errors';
import { warn } from '../../helpers/console';
import { mixin } from '../../helpers/object';
import hooksRefRegisterer from '../../mixins/hooksRefRegisterer';
import {
  getScrollbarWidth,
  offset,
  standsBehindRowHeader,
  isStartGapCovered,
  hasVerticalScrollbar,
  hasHorizontalScrollbar,
  outerWidth,
  outerHeight,
} from '../../helpers/dom/element';
import { getValueGetterValue } from '../../utils/valueAccessors';
import { collectSelectionFillChanges, selectionFillsOtherCells } from '../../selection/fillSelection';
import { markEditorSaveChangeSets } from './editorSaveChangeSets';

export const EDITOR_TYPE = 'base';

/**
 * The source every editor write and validation runs with. The validation wait tells the editor's own
 * answer from another validation of the same cell (a `validateCells()` batch) by it.
 */
const EDIT_SOURCE = 'edit';

/**
 * A wait for the validator that decides whether the editor closes.
 */
interface ValidationWait {
  /**
   * The sources the edited cell was validated with during the editor's own save. A third-party editor
   * whose `saveValue()` override writes with another source (or none) validates with that source.
   */
  sources: Set<string | undefined>;
  /**
   * `true` when the save validated no cell at all (a `saveValue()` override that writes later, after a
   * timer or a request): the wait then ends on the first answer, whatever cell, as it did before it
   * matched the edited cell.
   */
  acceptsAnyAnswer: boolean;
  /**
   * The cells a single-cell save validated when it never validated the edited cell (a `saveValue()` override
   * or a `beforeChange` listener moved the write to another cell), each as its stored cell meta with the source
   * it was validated with. The wait then ends on the first answer among them. `null` otherwise.
   */
  validatedCells: Array<{ meta: CellProperties, source: string | undefined }> | null;
}

/**
 * A cell a save asked to validate, as `beforeValidate` names it: by its visual row and by its property (or
 * its visual column for a data accessor function), with the validation source.
 */
interface ValidatedCell {
  row: number;
  col: number | string;
  source: string | undefined;
}

/**
 * Tells whether a validation hook's cell (`beforeValidate` or `postAfterValidate`) is the cell of a stored
 * cell meta. The hooks name the cell the way `Core#validateCell` does: by the meta's `visualRow`, and by its
 * `prop`, or its `visualCol` when the property is a data accessor function.
 *
 * @param {CellProperties} meta The stored cell meta.
 * @param {number} row The visual row of the hook.
 * @param {number|string} col The column property of the hook, or the visual column for an accessor.
 * @returns {boolean}
 */
function isCellOfMeta(meta: CellProperties, row: number, col: number | string): boolean {
  if (row !== meta.visualRow) {
    return false;
  }

  return typeof meta.prop === 'function' ? col === meta.visualCol : col === meta.prop;
}

export const EDITOR_STATE = Object.freeze({
  VIRGIN: 'STATE_VIRGIN', // before editing
  EDITING: 'STATE_EDITING',
  WAITING: 'STATE_WAITING', // waiting for async validation
  FINISHED: 'STATE_FINISHED'
});

/**
 * The abstract base class for Handsontable DataGrid cell editors.
 *
 * Extend it to create an editor that controls how a cell enters edit mode, reads and writes values,
 * and returns focus to the grid. Concrete editors implement `init()`, `getValue()`, `setValue()`,
 * `open()`, `close()`, and `focus()`. `beginEditing()` passes the cell value to `setValue()`. An
 * editor that needs a string stringifies that value itself.
 *
 * @class BaseEditor
 * @see https://handsontable.com/docs/javascript-data-grid/cell-editor/
 * @see https://handsontable.com/docs/javascript-data-grid/cell-function/
 * @see https://handsontable.com/docs/javascript-data-grid/api/options/#editor
 * @see https://handsontable.com/docs/react-data-grid/api/hooks/#afterbeginediting
 */
export class BaseEditor {
  /**
   * Returns the unique editor type identifier for the base editor.
   */
  static get EDITOR_TYPE() {
    return EDITOR_TYPE;
  }

  /**
   * A reference to the source instance of the Handsontable.
   *
   * @type {Handsontable}
   */
  declare hot: HotInstance;
  /**
   * Editor's state.
   *
   * @type {string}
   */
  state: string = EDITOR_STATE.VIRGIN;
  /**
   * Flag to store information about editor's opening status.
   *
   * @private
   *
   * @type {boolean}
   */
  _opened: boolean = false;
  /**
   * Defines the editor's editing mode. When false, then an editor works in fast editing mode.
   *
   * @private
   *
   * @type {boolean}
   */
  _fullEditMode: boolean = false;
  /**
   * Callback to call after closing editor.
   *
   * @private
   *
   * @type {Function}
   */
  _closeCallback: ((result: boolean) => void) | null = null;
  /**
   * Flag to specify if the editor should be closed after data change.
   *
   * @type {boolean}
   */
  _closeAfterDataChange = true;
  /**
   * Currently rendered cell's `TD` element.
   *
   * @type {HTMLTableCellElement}
   */
  TD: HTMLTableCellElement | null = null;
  // Declared without an initializer on purpose. An editor that never assigns one has to keep
  // reading `undefined`, which is what it read while this property lived on `editorFactory`'s own
  // type, and what `editors/__tests__/index.spec.js` asserts.
  /**
   * An element the editor renders OUTSIDE its own container – a dropdown, popover or third-party
   * picker appended to the document body. The grid treats this element and its whole subtree as a
   * part of the editor, so neither a click landing in it nor the browser focus moving into it
   * counts as a click or a focus loss outside the grid.
   *
   * @type {HTMLElement|null}
   */
  preventCloseElement?: HTMLElement | null;
  /**
   * Visual row index.
   *
   * @type {number}
   */
  row: number | null = null;
  /**
   * Visual column index.
   *
   * @type {number}
   */
  col: number | null = null;
  /**
   * Column property name or a column index, if datasource is an array of arrays.
   *
   * @type {number|string}
   */
  prop: number | string | null = null;
  /**
   * Original cell's value.
   *
   * @type {*}
   */
  originalValue: unknown = null;
  /**
   * The string form of the value the editor was opened with, when it was opened from the cell.
   *
   * Taken from the seed in `beginEditing()`, not from `getValue()` after `setValue()`. `DateEditor`
   * substitutes `defaultDate` inside `setValue()`, so a later `getValue()` is not the cell. A text
   * editor's `getValue()` is this string, and an untouched confirm has to match it. Reading
   * `getValue()` instead would save `''` over a `null` cell (#3927).
   */
  #seededString: unknown = null;

  /**
   * The same seed after the value getter and before stringifying, when the editor was opened from
   * the cell.
   *
   * An editor whose `getValue()` returns the argument `setValue()` received matches this on an
   * untouched confirm. Seeded the same way as `#seededString`, and for the same reason. `DateEditor`
   * may have substituted `defaultDate`, so `getValue()` after `setValue()` is not the cell.
   */
  #seededCellValue: unknown = null;

  /**
   * Whether the seeded baselines hold a value at all.
   *
   * Kept separate from the value: `getValue()` is typed `unknown`, and a custom editor is free to
   * return `null` or `undefined` from it. Using the value itself as the "armed" marker would arm the
   * guard with `undefined` for such an editor, `undefined === undefined` would hold on every confirm,
   * and the cell could never be saved.
   */
  #hasValueBeforeEdit: boolean = false;

  /**
   * The wait for the validator that decides whether the editor closes. Each wait gets a new object,
   * and its `postAfterValidate` listener acts only while that object is still the current one, so a
   * wait ended early by `_endValidationWait()` or `cancelChanges()` cannot reopen the editor when its
   * validator answers.
   */
  #validationWait: ValidationWait | null = null;

  /**
   * The `postAfterValidate` listener of the current wait. It removes itself on the editor's own first
   * answer that is not stale, and it is removed when the wait is ended (`_endValidationWait()`,
   * `cancelChanges()`) or replaced by the next one. A wait ended early cannot count on its own answer to
   * remove it, because the answer of a dropped call is stale.
   */
  #validationWaitListener: (
    (result: boolean, value: unknown, row: number, col: number | string, source?: string) => void
  ) | null = null;

  /**
   * The functions run each time the editor finishes an edit (`discardEditor()`): it closes, or reopens on a
   * rejection. See `_addFinishListener()`.
   */
  #finishListeners: Set<() => void> = new Set();

  /**
   * Re-arms the unchanged-edit guard after the editor's content has been reloaded from the data
   * source, so the baseline describes what the editor shows now rather than what it showed when it
   * opened. Does nothing while the guard is disarmed.
   */
  protected resetValueBeforeEdit(): void {
    if (!this.#hasValueBeforeEdit) {
      return;
    }

    this.#seededString = this.getValue();
    // The same post-getter value `beginEditing()` stores. `originalValue` is the stored cell,
    // and seeding that here treats a later edit of the stored value as untouched.
    this.#seededCellValue = getValueGetterValue(this.originalValue, this.cellProperties);
  }
  /**
   * Object containing the cell's properties.
   *
   * @type {object}
   */
  declare cellProperties: CellProperties;

  // Mixin-injected methods from hooksRefRegisterer
  /**
   * Internal storage map for hook callbacks registered on this editor instance.
   */
  declare _hooksStorage: Record<string, Function[]>;
  /**
   * Registers a hook callback for the given hook name on this editor instance.
   */
  declare addHook: (...args: unknown[]) => unknown;
  /**
   * Removes all hook callbacks registered under the given key on this editor instance.
   */
  declare removeHooksByKey: (...args: unknown[]) => unknown;
  /**
   * Removes all hook callbacks registered on this editor instance.
   */
  declare clearHooks: (...args: unknown[]) => unknown;

  /**
   * @param {Handsontable} hotInstance A reference to the source instance of the Handsontable.
   */
  constructor(hotInstance: HotInstance) {
    this.hot = hotInstance;
    this.init();
  }

  /**
   * Fires callback after closing editor.
   *
   * @private
   * @param {boolean} result The editor value.
   */
  _fireCallbacks(result: boolean): void {
    if (this._closeCallback) {
      this._closeCallback(result);
      this._closeCallback = null;
    }
  }

  /**
   * Initializes an editor's intance.
   */
  init(): void { // intentionally empty
  }

  /**
   * Required method to get current value from editable element.
   */
  getValue(): unknown {
    throwWithCause('Editor getValue() method unimplemented');
  }

  /**
   * Required method to set new value into editable element.
   *
   * `beginEditing()` passes the cell value after the value getter, or the string it was given.
   * When the editor needs a string, use `value == null ? '' : String(value)`.
   *
   * @param {*} value The editor value.
   */
  setValue(value?: unknown): void {
    throwWithCause('Editor setValue() method unimplemented');
  }

  /**
   * Required method to open editor.
   */
  open(_event?: Event): void {
    throwWithCause('Editor open() method unimplemented');
  }

  /**
   * Required method to close editor.
   */
  close(): void {
    throwWithCause('Editor close() method unimplemented');
  }

  /**
   * Required method to focus editor.
   */
  focus(): void {
    throwWithCause('Editor focus() method unimplemented');
  }

  /**
   * Prepares editor's meta data.
   *
   * @param {number} row The visual row index.
   * @param {number} col The visual column index.
   * @param {number|string} prop The column property (passed when datasource is an array of objects).
   * @param {HTMLTableCellElement} td The rendered cell element.
   * @param {*} value The rendered value.
   * @param {object} cellProperties The cell meta object (see {@link Core#getCellMeta}).
   */
  prepare(
    row: number, col: number, prop: string | number,
    td: HTMLTableCellElement, value: unknown, cellProperties: CellProperties): void {
    this.TD = td;
    this.row = row;
    this.col = col;
    this.prop = prop;
    this.originalValue = value;
    this.cellProperties = cellProperties;
    this.state = this.isOpened() ? this.state : EDITOR_STATE.VIRGIN;
  }

  /**
   * Fallback method to provide extendable editors in ES5.
   *
   * @returns {Function}
   */
  extend(): unknown {
    return (class Editor extends (this.constructor as { new(...args: unknown[]): BaseEditor }) {});
  }

  /**
   * Saves value from editor into data storage.
   *
   * With `ctrlDown` the value goes into every cell of **every** selection layer, not only the layer
   * that holds the focus - the same reach the grid's own `Ctrl`/`Cmd`+`Enter` fill has when no
   * editor is open. The whole fill leaves through one `setDataAtCell()` call, so it fires one
   * `afterChange` and costs one undo step however many layers it spans.
   *
   * @param {*} value The editor value.
   * @param {boolean} ctrlDown If `true`, applies value to each cell in every selected range.
   */
  saveValue(value: unknown, ctrlDown?: boolean): void {
    // if ctrl+enter and multiple cells selected, behave like Excel (finish editing and apply to all cells)
    if (ctrlDown) {
      const selectedRanges = this.hot.getSelectedRange();

      // The editor can outlive the selection - a custom editor saving from a detached UI, say - and
      // then there is no layer to fill, so the value goes to the cell the editor was opened on.
      if (selectedRanges?.length) {
        this.#saveValueToSelection(value, selectedRanges);

        return;
      }
    }

    this.#saveValueToEditedCell(value as unknown[][]);
  }

  /**
   * Writes the editor's value into the single cell the editor was opened on.
   *
   * @param {Array[]} value The editor value, in the 2D form `saveValue()` receives it.
   */
  #saveValueToEditedCell(value: unknown[][]): void {
    let visualRow: number | null = this.row;
    let visualColumn: number | null = this.col;

    const modifiedCellCoords = this.hot.runHooks('modifyGetCellCoords', visualRow, visualColumn, false, 'meta');

    if (Array.isArray(modifiedCellCoords)) {
      [visualRow, visualColumn] = modifiedCellCoords as [number, number];
    }

    // Saving values using the modified coordinates.
    this.hot.populateFromArray(visualRow as number, visualColumn as number, value, null, null, EDIT_SOURCE);
  }

  /**
   * Writes the editor's value into every cell of every selection layer.
   *
   * The collecting is shared with the grid's own `Ctrl`/`Cmd`+`Enter` fill, so both answer that
   * keystroke the same way - see `selection/fillSelection.ts` for what the walk skips and why the
   * whole fill has to leave through a single `setDataAtCell()` call.
   *
   * Only the first cell of the 2D wrapper is read. A fill writes one value into every selected
   * cell, so there is nothing to tile - unlike `#saveValueToEditedCell()`, which hands the block to
   * `populateFromArray()` and does tile it over a rectangle. A custom editor passing a real 2D block
   * with `ctrlDown` therefore has every cell of that block but the first ignored.
   *
   * @param {*} value The editor value, as `saveValue()` receives it.
   * @param {CellRange[]} selectedRanges The selection layers to fill.
   */
  #saveValueToSelection(value: unknown, selectedRanges: CellRange[]): void {
    // `saveValue()` is called with the value wrapped in a 2D array, which is the shape
    // `populateFromArray()` tiles over a rectangle. A fill writes one value into every cell, so the
    // wrapper is unwrapped here rather than indexed per cell - and anything that is not that shape
    // (a custom editor passing the raw value) is written as it stands instead of being indexed into
    // characters.
    const cellValue: unknown = Array.isArray(value) && Array.isArray(value[0]) ? value[0][0] : value;
    const changes = collectSelectionFillChanges(this.hot, cellValue, selectedRanges);

    if (changes.length > 0) {
      this.hot.setDataAtCell(changes, null, null, EDIT_SOURCE);
    }
  }

  /**
   * Begins editing on a highlighted cell and hides fillHandle corner if was present.
   *
   * In full edit mode, a string `newInitialValue` is passed to `setValue()` unchanged. Any other
   * value, including `undefined`, passes the cell value after the value getter.
   *
   * @param {*} newInitialValue The initial editor value.
   * @param {Event} event The keyboard event object.
   */
  beginEditing(newInitialValue?: unknown, event?: Event): void {
    if (this.state !== EDITOR_STATE.VIRGIN) {
      return;
    }

    if (this.row === null || this.col === null) {
      warn('Editor opened without valid cell coordinates.');

      return;
    }

    const hotInstance = this.hot;
    // We have to convert visual indexes into renderable indexes
    // due to hidden columns don't participate in the rendering process
    const renderableRowIndex = hotInstance.rowIndexMapper.getRenderableFromVisualIndex(this.row);
    const renderableColumnIndex = hotInstance.columnIndexMapper.getRenderableFromVisualIndex(this.col);

    if (renderableRowIndex !== null && renderableColumnIndex !== null) {
      hotInstance.view
        .scrollViewport({ row: renderableRowIndex, col: renderableColumnIndex });
    }

    this.state = EDITOR_STATE.EDITING;

    // Set the editor value only in the full edit mode. In other mode the focusable element has to be empty,
    // otherwise IME (editor for Asia users) doesn't work.
    let seededFromCell = false;
    let seededValue: unknown = null;
    let rawSeed: unknown = null;

    if (this.isInFullEditMode()) {
      const originalValue = getValueGetterValue(this.originalValue, this.hot.getCellMeta(this.row, this.col));
      const openedFromCell = typeof newInitialValue !== 'string';

      seededFromCell = openedFromCell;
      seededValue = openedFromCell ? stringify(originalValue) : newInitialValue;
      rawSeed = openedFromCell ? originalValue : null;

      this.setValue(openedFromCell ? originalValue : newInitialValue);
    }

    this.open(event);
    this._opened = true;
    this.focus();

    this.#hasValueBeforeEdit = seededFromCell;
    this.#seededString = seededFromCell ? seededValue : null;
    this.#seededCellValue = rawSeed;

    // only rerender the selections (FillHandle should disappear when beginEditing is triggered)
    hotInstance.view.render();
    hotInstance.runHooks('afterBeginEditing', this.row, this.col);

    this.addHook('beforeDialogShow', () => this.cancelChanges());
  }

  /**
   * Finishes editing and start saving or restoring process for the editing cell, or for every selected range.
   *
   * @param {boolean} restoreOriginalValue If true, then closes editor without saving value from the editor into a cell.
   * @param {boolean} ctrlDown If true, then saveValue will save editor's value to each cell in every selected range.
   * @param {Function} callback The callback function, fired after editor closing.
   */
  finishEditing(restoreOriginalValue?: boolean, ctrlDown?: boolean, callback?: Function): void {
    if (callback) {
      const previousCloseCallback = this._closeCallback;

      this._closeCallback = (result) => {
        if (previousCloseCallback) {
          previousCloseCallback(result);
        }

        callback(result);
        this.hot.view.render();
      };
    }

    if (this.isWaiting()) {
      return;
    }

    if (this.state === EDITOR_STATE.VIRGIN) {
      this.hot._registerTimeout(() => {
        this._fireCallbacks(true);
      });

      return;
    }

    if (this.state === EDITOR_STATE.EDITING) {
      if (restoreOriginalValue) {
        this.cancelChanges();
        this.hot.view.render();

        return;
      }

      let value = this.getValue();

      // Compared after trim and `valueParser`, so an untouched `"5"` still becomes the number 5.
      // `held` has to match as well: a parser result equal to the getter display is a new edit when
      // that text changed. Trim stays in front, so an untouched `"  hi  "` still saves `"hi"`.
      if (this.cellProperties.trimWhitespace) {
        value = typeof value === 'string' ? String.prototype.trim.call(value || '') : value;
      }

      const held = value;

      if (typeof this.cellProperties.valueParser === 'function') {
        value = this.cellProperties.valueParser(value, this.cellProperties);
      }

      // Ctrl/Meta + Enter over a real range copies the edited value into every other cell of the
      // selection, so an unchanged editor still has work to do there. Where it writes only the
      // edited cell it is the same gesture as a plain Enter, and the guard has to stay armed: that
      // is the #3927 case, where the editor's `''` was written over a `null` cell.
      //
      // The question is asked of the cells the fill would actually reach, not of the selection's
      // shape. A single-cell active layer says nothing about the other layers (DEV-103), and a
      // layer that contributes no writable cell - all `readOnly`, or a header - is not work either.
      //
      // It is asked of the NORMALIZED value, which is the one `saveValue()` goes on to write. A
      // `valueParser` returning an object would otherwise have the guard read the raw string and the
      // write read the object, and the two answer the object-cell rule differently.
      const fillsOtherCells = ctrlDown === true &&
        selectionFillsOtherCells(this.hot, value, this.row, this.col);

      const isUnchanged = !fillsOtherCells && this.isEditUnchanged(held, value);

      if (isUnchanged) {
        this.#finishUnchangedEdit();

        return;
      }

      this.state = EDITOR_STATE.WAITING;

      if (!this.hot.getCellValidator(this.cellProperties)) {
        markEditorSaveChangeSets(this.hot, () => this.saveValue([[value]], ctrlDown));

        // A listener of the save (`beforeChange`, `afterChange`, ...) destroyed the grid, and the
        // editor's DOM went with it.
        if (this.hot.isDestroyed) {
          return;
        }

        this.state = EDITOR_STATE.FINISHED;
        this.discardEditor(true);

        return;
      }

      const finishWait = this.#waitForValidation((result) => {
        this.discardEditor(result);
      });
      const { validatesEditedCell, validatedCells, writtenCells, startsWrite } =
        this.#saveValueValidatingEditedCell(value, ctrlDown);

      // A listener of the save destroyed the grid, and the editor's DOM went with it.
      if (this.hot.isDestroyed) {
        return;
      }

      if (validatesEditedCell || !this.isWaiting()) {
        return;
      }

      if (validatedCells.length > 0 && fillsOtherCells) {
        // A `beforeChange` listener took the edited cell out of a Ctrl+Enter fill, so no answer of the editor's
        // own will ever come. The editor closes as on a save the listener chose not to write: a rejection of
        // another cell of the fill must not reopen it on a cell the listener refuses to write (re-confirming
        // would loop). A veto of the whole write has already canceled the editor (`isWaiting()` is false).
        finishWait(true);

      } else if (validatedCells.length > 0) {
        if (this.#validationWait) {
          // A single-cell save validated another cell but never the edited one: a `saveValue()` override or a
          // `beforeChange` listener moved the write. The first answer among the cells the save wrote ends the
          // wait, and a rejection under `allowInvalid: false` reopens the editor. A cell the save validated
          // without writing it (a Formulas dependent of the moved write) is not the save's answer. The cells
          // are kept as their stored meta, whose `visualRow` follows the record, as `#isEditedCell()` does.
          const ownCells = validatedCells.filter(cell => writtenCells.some(
            ([row, prop]) => row === cell.row && (prop === cell.col || prop === this.hot.colToProp(cell.col as number))
          ));

          if (ownCells.length === 0) {
            // The save validated only cells it did not write (dependents of a write to a cell without a
            // validator), so nothing the save wrote can be rejected and no answer is the save's own.
            finishWait(true);

          } else {
            this.#validationWait.validatedCells = ownCells.map(({ row, col, source }) => ({
              meta: this.#getMetaOfValidatedCell(row, col),
              source,
            }));
          }
        }

      } else if (startsWrite) {
        // The save wrote, but nothing it wrote has a validator (a `beforeChange` listener took the edited cell
        // out of a Ctrl+Enter fill whose other cells have none, or moved the write to such a cell), so no
        // answer will ever come.
        finishWait(true);

      } else if (this.#validationWait) {
        // The save validated nothing yet: a `saveValue()` override that writes later. Its answer cannot be
        // told from a foreign one, so the first answer ends the wait.
        this.#validationWait.acceptsAnyAnswer = true;
      }
    }
  }

  /**
   * Saves the editor value and tells whether the save asked for the edited cell's own validation. The
   * request is seen on `beforeValidate`, which `Core#validateCell` runs synchronously, so the answer is
   * known when `saveValue()` returns. The source of every validation of the edited cell made during the
   * save is recorded on the wait, so the answer of a `saveValue()` override that writes with another
   * source (or none, as a bare `setDataAtCell(row, column, value)` does) still counts as the editor's own.
   *
   * It also lists every cell the save asked to validate, which a save that writes later leaves empty, and
   * the cells of the change sets the save made that wait for their validators (`[visualRow, prop]`, copied
   * before any answer takes a rejected change out of its set). And it tells whether the save started a write
   * (`beforeChange` ran during it), which a save that writes later does not.
   *
   * @param {*} value The value to save.
   * @param {boolean} [ctrlDown] If `true`, applies the value to each cell in every selected range.
   * @returns {{ validatesEditedCell: boolean, validatedCells: ValidatedCell[], writtenCells: Array[], startsWrite: boolean }}
   */
  #saveValueValidatingEditedCell(value: unknown, ctrlDown?: boolean): {
    validatesEditedCell: boolean,
    validatedCells: ValidatedCell[],
    writtenCells: Array<[number, unknown]>,
    startsWrite: boolean,
  } {
    let validatesEditedCell = false;
    let startsWrite = false;
    const onBeforeChange = () => {
      startsWrite = true;
    };
    const validatedCells: ValidatedCell[] = [];
    const onBeforeValidate = (cellValue: unknown, row: number, col: number | string, source?: string) => {
      validatedCells.push({ row, col, source });

      if (this.#isEditedCell(row, col)) {
        validatesEditedCell = true;
        this.#validationWait?.sources.add(source);
      }
    };

    this.hot.addHook('beforeValidate', onBeforeValidate);
    this.hot.addHook('beforeChange', onBeforeChange);

    let writtenCells: Array<[number, unknown]> = [];

    try {
      writtenCells = markEditorSaveChangeSets(this.hot, () => this.saveValue([[value]], ctrlDown))
        .flatMap(changes => changes.map(([row, prop]): [number, unknown] => [row, prop]));
    } finally {
      if (!this.hot.isDestroyed) {
        this.hot.removeHook('beforeValidate', onBeforeValidate);
        this.hot.removeHook('beforeChange', onBeforeChange);
      }
    }

    return { validatesEditedCell, validatedCells, writtenCells, startsWrite };
  }

  /**
   * Returns the stored cell meta of a cell a validation hook names. The hook names the column by its `prop`:
   * the physical column for array data, a key for object data, so the visual column comes from
   * `propToCol()`. Only for a data accessor function is it the visual column itself, so that is the fallback
   * when the column `propToCol()` finds is not the cell the hook names.
   *
   * @param {number} row The visual row the hook names.
   * @param {number|string} col The column property the hook names, or the visual column for an accessor.
   * @returns {CellProperties}
   */
  #getMetaOfValidatedCell(row: number, col: number | string): CellProperties {
    const visualColumn = this.hot.propToCol(col);

    if (typeof visualColumn === 'number') {
      const meta = this.hot.getCellMeta(row, visualColumn);

      if (isCellOfMeta(meta, row, col)) {
        return meta;
      }
    }

    return this.hot.getCellMeta(row, col as number);
  }

  /**
   * Tells whether the edit being confirmed leaves the cell as it was, so the confirm writes nothing. The
   * base rule compares the value the editor holds and the value that would be written with the seeds
   * taken when editing began. An editor whose `getValue()` resolves its text into another form (the
   * autocomplete editor turns a label into a key/value entry) adds its own rule.
   *
   * @private
   * @param {*} held The editor value after `trimWhitespace`.
   * @param {*} value The value that would be written, after `valueParser`.
   * @returns {boolean}
   */
  protected isEditUnchanged(held: unknown, value: unknown): boolean {
    const heldIsSeed = held === this.#seededString || held === this.#seededCellValue;
    const valueIsSeed = value === this.#seededString || value === this.#seededCellValue;

    return this.#hasValueBeforeEdit && heldIsSeed && valueIsSeed;
  }

  /**
   * Closes an editor whose content the user never changed, without writing anything.
   *
   * Nothing is written on either branch, so the stored value is untouched and no `afterChange` fires
   * for an edit that never happened - whether or not the cell has a validator. Writing the value back
   * to trigger validation was tried and rejected: re-entering the write path re-applies `valueSetter`
   * and `emptyValue` to an already-stored value, which can change it, and it made the event fire in a
   * validated column but not an unvalidated one, a split nothing in the configuration predicted.
   *
   * A validated cell is still validated, because `allowInvalid: false` has to keep the editor open on
   * an invalid value however the user got there. `discardEditor()` is driven from `postAfterValidate`
   * rather than from `validateCell()`'s own callback: the callback runs first, and closing from there
   * leaves the `allowInvalid: false` reopen unable to hold the editor open.
   *
   * Renders on the way out, matching `beginEditing()` and the `cancelChanges()` path. The normal save
   * path gets its render from `populateFromArray()`, which this one deliberately never reaches.
   */
  #finishUnchangedEdit(): void {
    if (!this.hot.getCellValidator(this.cellProperties)) {
      this.state = EDITOR_STATE.FINISHED;
      this.discardEditor(true);
      this.hot.view.render();

      return;
    }

    this.state = EDITOR_STATE.WAITING;

    this.#waitForValidation((result) => {
      this.discardEditor(result);
      this.hot.view.render();
    });

    this.hot.validateCell(this.originalValue, this.cellProperties, () => {}, EDIT_SOURCE);
  }

  /**
   * Starts a wait for the next `postAfterValidate`, which finishes the editor with the validator's
   * answer. The wait starts before the value is saved, so a `loadData()` from a listener of the save's own
   * hooks finds it and ends it. An answer to a validator call made before the last `loadData()`
   * (`_isAnsweringStaleValidation()`) is skipped: it belongs to a change the load dropped, and taken as
   * this wait's answer it closed the editor before its own value was validated, or reopened it. The answer
   * is ignored once the wait has been ended or replaced.
   *
   * The wait also ends on the editor's own answer only: the edited cell (`#isEditedCell()`), validated with
   * the editor's source or a source its save validated the cell with (`#saveValueValidatingEditedCell()`),
   * unless the save validated no cell at all (`ValidationWait#acceptsAnyAnswer`). `postAfterValidate` is
   * instance-wide: the Formulas plugin validates
   * the cells that depend on the edited one, and a `validateCells()` batch can still be in flight, also for
   * the edited cell itself (its old value), so another answer often arrives first. Taken as this wait's
   * answer, a `true` closed the editor and the own rejection under `allowInvalid: false` then landed on
   * nothing, and a `false` reopened it. Such an answer is skipped and the listener stays registered.
   *
   * @param {Function} onAnswer Called with the validation result once the editor is `FINISHED`.
   * @returns {Function} Finishes the wait with a result, as its own answer would. Does nothing once the wait
   *   has been ended or replaced.
   */
  #waitForValidation(onAnswer: (result: boolean) => void): (result: boolean) => void {
    const wait: ValidationWait = { sources: new Set(), acceptsAnyAnswer: false, validatedCells: null };
    const finish = (result: boolean) => {
      this.hot.removeHook('postAfterValidate', onPostAfterValidate);

      if (this.#validationWait !== wait) {
        return;
      }

      this.#validationWait = null;
      this.#validationWaitListener = null;
      this.state = EDITOR_STATE.FINISHED;
      onAnswer(result);
    };
    const onPostAfterValidate = (
      result: boolean, value: unknown, row: number, col: number | string, source?: string
    ) => {
      // An earlier `postAfterValidate` listener destroyed the grid. The hook registry still reaches
      // this listener, and every method of the destroyed instance throws.
      if (this.hot.isDestroyed) {
        return;
      }

      if (this.hot._isAnsweringStaleValidation()) {
        return;
      }

      if (!wait.acceptsAnyAnswer && !this.#isAnswerOfWait(wait, row, col, source)) {
        return;
      }

      finish(result);
    };

    this.#removeValidationWaitListener();
    this.#validationWait = wait;
    this.#validationWaitListener = onPostAfterValidate;
    this.hot.addHook('postAfterValidate', onPostAfterValidate);

    return finish;
  }

  /**
   * Tells whether an answer belongs to the wait: the edited cell's, validated with the editor's source or a
   * source the save validated the cell with, or, when a single-cell save never validated the edited cell, an
   * answer for one of the cells it validated, with the source it validated that cell with.
   *
   * @param {ValidationWait} wait The wait.
   * @param {number} row The visual row the answer is for.
   * @param {number|string} col The column property the answer is for, or the visual column for an accessor.
   * @param {string} [source] The validation source.
   * @returns {boolean}
   */
  #isAnswerOfWait(wait: ValidationWait, row: number, col: number | string, source?: string): boolean {
    if (wait.validatedCells !== null) {
      return wait.validatedCells.some(cell => cell.source === source && isCellOfMeta(cell.meta, row, col));
    }

    return this.#isEditedCell(row, col) && (source === EDIT_SOURCE || wait.sources.has(source));
  }

  /**
   * Tells whether a validation (its `beforeValidate` request or its `postAfterValidate` answer) is for the
   * cell this editor edits. The hooks name the cell the way `Core#validateCell` does: by the meta's
   * `visualRow`, and by its `prop`, or its `visualCol` when the property is a data accessor function.
   *
   * The comparison is with the cell meta the editor holds, never with `this.row`/`this.prop`. The meta is
   * the stored object the save validates, and its `visualRow` follows the record when a row is inserted or
   * removed above it during the wait, while `EditorManager` rebinds the editor's coordinates only before
   * the save (a waiting editor kept the old row and took its own answer for a foreign one). The meta also
   * names the cell a `modifyGetCellCoords` listener redirected the save to.
   *
   * @param {number} row The visual row the validation is for.
   * @param {number|string} col The column property the validation is for, or the visual column for an accessor.
   * @returns {boolean}
   */
  #isEditedCell(row: number, col: number | string): boolean {
    return isCellOfMeta(this.cellProperties, row, col);
  }

  /**
   * Removes the `postAfterValidate` listener of the current wait, if there is one.
   */
  #removeValidationWaitListener(): void {
    if (this.#validationWaitListener) {
      this.hot.removeHook('postAfterValidate', this.#validationWaitListener);
      this.#validationWaitListener = null;
    }
  }

  /**
   * Closes an editor that waits for a validator whose answer no longer applies, because `loadData()`
   * replaced the data the editor saved its value to. Nothing is written, and the answer, when it
   * arrives, leaves the editor closed instead of reopening it on a record of the loaded data. Does
   * nothing unless the editor is waiting.
   *
   * The close callbacks are not run here: the caller is inside the load, before the new data is in, and
   * a callback that reads `true` as "saved" re-prepared the editor against the replaced data. They are
   * returned instead, for the caller to run with `false` once the load is done.
   *
   * @private
   * @returns {Function|null} Runs the close callbacks with `false`, or `null` when the editor was not waiting.
   */
  _endValidationWait(): (() => void) | null {
    if (!this.isWaiting()) {
      return null;
    }

    const closeCallback = this._closeCallback;

    this._closeCallback = null;
    this.#validationWait = null;
    this.#removeValidationWaitListener();
    this.cancelChanges();

    return closeCallback ? () => closeCallback(false) : null;
  }

  /**
   * Finishes editing without saving value.
   */
  cancelChanges(): void {
    // A canceled wait is over: its answer, or another validation of the cell, must not close or reopen
    // the editor later.
    this.#validationWait = null;
    this.#removeValidationWaitListener();
    this.state = EDITOR_STATE.FINISHED;
    this.discardEditor();
  }

  /**
   * Verifies result of validation or closes editor if user's canceled changes.
   *
   * @param {boolean|undefined} result If `false` and the cell using allowInvalid option,
   *                                   then an editor won't be closed until validation is passed.
   */
  discardEditor(result?: boolean): void {
    if (this.state !== EDITOR_STATE.FINISHED) {
      return;
    }

    try {
      this.#discardFinishedEditor(result);
    } finally {
      if (!this.hot.isDestroyed) {
        [...this.#finishListeners].forEach(listener => listener());
      }
    }
  }

  /**
   * Adds a function run each time the editor finishes an edit: it closes (saved, canceled by Escape or by a
   * `beforeChange` veto, or its wait canceled without an answer) or reopens on a rejection. An edit can end
   * with no validation at all, so code that waits for the editor (a header sort) cannot rely on
   * `postAfterValidate` alone. Adding a function that is already there changes nothing.
   *
   * @private
   * @param {Function} listener The function to add.
   */
  _addFinishListener(listener: () => void): void {
    this.#finishListeners.add(listener);
  }

  /**
   * Removes a function `_addFinishListener()` added.
   *
   * @private
   * @param {Function} listener The function to remove.
   */
  _removeFinishListener(listener: () => void): void {
    this.#finishListeners.delete(listener);
  }

  /**
   * Closes a finished editor, or reopens it in `EDITING` on a rejection under `allowInvalid: false`.
   *
   * @param {boolean|undefined} result The validation result.
   */
  #discardFinishedEditor(result?: boolean): void {
    // validator was defined and failed
    if (result === false && this.cellProperties.allowInvalid !== true) {
      if (this.row === null || this.col === null) {
        return;
      }

      this.hot.selectCell(this.row, this.col);
      this.focus();
      this.state = EDITOR_STATE.EDITING;
      this._fireCallbacks(false);

    } else {
      this.close();

      this._opened = false;
      this._fullEditMode = false;
      // Released only once the editor really closes - this branch. `allowInvalid: false` returns to
      // EDITING through the branch above without closing, so the baseline has to survive that: a
      // rejected edit leaves the same editor open, and disarming here would let the NEXT confirm of
      // that session write the editor's stringified value, reintroducing #3927.
      this.#hasValueBeforeEdit = false;
      this.#seededString = null;
      this.#seededCellValue = null;
      this.state = EDITOR_STATE.VIRGIN;
      this._fireCallbacks(true);

      const shortcutManager = this.hot.getShortcutManager();

      shortcutManager.setActiveContextName('grid');
    }
  }

  /**
   * Switch editor into full edit mode. In this state navigation keys don't close editor. This mode is activated
   * automatically after hit ENTER or F2 key on the cell or while editing cell press F2 key.
   */
  enableFullEditMode(): void {
    this._fullEditMode = true;
  }

  /**
   * Checks if editor is in full edit mode.
   *
   * @returns {boolean}
   */
  isInFullEditMode(): boolean {
    return this._fullEditMode;
  }

  /**
   * Returns information whether the editor is open.
   *
   * @returns {boolean}
   */
  isOpened(): boolean {
    return this._opened;
  }

  /**
   * Refreshes the editor's value from the source data. Overridden in editors that support it.
   */
  refreshValue?(): void;

  /**
   * Returns information whether the editor is waiting, eg.: for async validation.
   *
   * @returns {boolean}
   */
  isWaiting(): boolean {
    return this.state === EDITOR_STATE.WAITING;
  }

  /**
   * Gets the object that provides information about the edited cell size and its position
   * relative to the table viewport.
   *
   * The rectangle has six integer properties:
   *  - `top` The top position relative to the table viewport
   *  - `start` The left (or right in RTL) position relative to the table viewport
   *  - `width` The cell's current width;
   *  - `maxWidth` The maximum cell's width after which the editor goes out of the table viewport
   *  - `height` The cell's current height;
   *  - `maxHeight` The maximum cell's height after which the editor goes out of the table viewport
   *
   * @returns {{top: number, start: number, width: number, maxWidth: number, height: number, maxHeight: number} | undefined}
   */
  getEditedCellRect(): {
    top: number, start: number, width: number, maxWidth: number, height: number, maxHeight: number
  } | undefined {
    const TD = this.getEditedCell();

    // TD is outside of the viewport.
    if (!TD) {
      return;
    }

    const { wtOverlays, wtViewport } = this.hot.view._wt;
    const rootWindow = this.hot.rootWindow;
    const currentOffset = offset(TD);
    const cellWidth = outerWidth(TD);
    const containerOffset = offset(this.hot.rootElement);
    const containerWidth = outerWidth(this.hot.rootElement);
    const scrollableContainerTop = wtOverlays.topOverlay?.holder;
    const scrollableContainerLeft = wtOverlays.inlineStartOverlay?.holder;
    const containerScrollTop = scrollableContainerTop !== rootWindow ?
      (scrollableContainerTop as HTMLElement).scrollTop : 0;
    const containerScrollLeft = scrollableContainerLeft !== rootWindow ?
      (scrollableContainerLeft as HTMLElement).scrollLeft : 0;
    const gridMostRightPos = rootWindow.innerWidth - containerOffset.left - containerWidth;
    const { wtTable: overlayTable } = wtOverlays.getParentOverlay(TD) ?? this.hot.view._wt;
    const overlayName = overlayTable.name;
    // `offset()` walks the layout chain and misses the transform that places the spreader
    // (`walkontable/src/overlay/spreaderOffset.ts`); fold that offset into the cell's document position.
    const spreaderOffset = overlayTable.getSpreaderOffset();

    currentOffset.top += spreaderOffset.y;
    currentOffset.left += spreaderOffset.x;

    const scrollTop = ['master', 'inline_start', 'inline_end'].includes(overlayName) ? containerScrollTop : 0;
    const scrollLeft = ['master', 'top', 'bottom'].includes(overlayName) ? containerScrollLeft : 0;

    // If colHeaders is disabled, cells in the first row have border-top
    const editTopModifier = currentOffset.top === containerOffset.top ? 0 : 1;

    let topPos = currentOffset.top - containerOffset.top - editTopModifier - scrollTop;
    let inlineStartPos = 0;

    if (this.hot.isRtl()) {
      inlineStartPos = rootWindow.innerWidth - currentOffset.left - cellWidth - gridMostRightPos - 1 + scrollLeft;
    } else {
      inlineStartPos = currentOffset.left - containerOffset.left - 1 - scrollLeft;
    }

    // When the scrollable element is Window object then the editor position needs to be compensated
    // by the overlays' position (position relative to the table viewport). In other cases, the overlay's
    // position always returns 0.
    // Only the part the offset chain cannot see: a clone pinned with `position: sticky` is already
    // shifted in the layout `offset()` walks (DEV-126 on this axis).
    if (['top', 'top_inline_start_corner', 'top_inline_end_corner'].includes(overlayName)) {
      topPos += wtOverlays.topOverlay?.getOverlayTransformOffset() ?? 0;
    }

    // Only the part the offset chain cannot see: a clone pinned with `position: sticky` is already
    // shifted in the layout `offset()` walks (DEV-127).
    if (['inline_start', 'top_inline_start_corner'].includes(overlayName)) {
      inlineStartPos += Math.abs(wtOverlays.inlineStartOverlay?.getOverlayTransformOffset() ?? 0);
    }

    // The same for the clones pinned to the inline-end edge, which have an overlay of their own.
    if (['inline_end', 'top_inline_end_corner'].includes(overlayName)) {
      inlineStartPos += Math.abs(wtOverlays.inlineEndOverlay?.getOverlayTransformOffset() ?? 0);
    }

    const hasColumnHeaders = this.hot.hasColHeaders();
    const renderableRow = this.hot.rowIndexMapper.getRenderableFromVisualIndex(this.row ?? 0);
    const nrOfRenderableRowIndexes = this.hot.rowIndexMapper.getRenderableIndexesLength();
    const firstRowIndexOfTheBottomOverlay =
      nrOfRenderableRowIndexes - (this.hot.view._wt.getSetting('fixedRowsBottom') as number);

    if (hasColumnHeaders && (renderableRow ?? 0) <= 0 || renderableRow === firstRowIndexOfTheBottomOverlay) {
      topPos += 1;
    }

    const cellComputedStyle = rootWindow.getComputedStyle(TD);
    const borderPhysicalWidthProp = this.hot.isRtl() ? 'borderRightWidth' : 'borderLeftWidth';
    const ownsInlineStartBorder = Number.parseFloat(cellComputedStyle[borderPhysicalWidthProp]) > 0;
    const inlineStartBorderCompensation = ownsInlineStartBorder || this.#isStartPixelCovered(TD, overlayName) ? 0 : 1;

    // The position above shifted the editor 1px towards the inline start so that it covers the
    // gridline the previous cell draws on its inline-end side. A cell that draws its OWN
    // inline-start border keeps that gridline inside its box, and one whose gridline is covered by
    // the inline-start overlay shows nothing of the shifted pixel, so the shift is canceled for both.
    // Which cells those are is not a fixed index: `htFirstDatasetColumnNotRendered` takes the border
    // off the first rendered column - so read the DOM rather than the index, and key it off the same
    // value that sizes the editor below, or the two disagree by a pixel.
    if (inlineStartBorderCompensation === 0) {
      inlineStartPos += 1;
    }

    const firstRowOffset = wtViewport.rowsRenderCalculator?.startPosition ?? 0;
    const firstColumnOffset = wtViewport.columnsRenderCalculator?.startPosition ?? 0;
    const horizontalScrollPosition = Math.abs(wtOverlays.inlineStartOverlay?.getScrollPosition() ?? 0);
    const verticalScrollPosition = wtOverlays.topOverlay?.getScrollPosition() ?? 0;
    const scrollbarWidth = getScrollbarWidth(this.hot.rootDocument);
    const cellTopOffset = this.#calcCellTopOffset(TD, overlayName, firstRowOffset,
      verticalScrollPosition, scrollbarWidth);
    // The end clones are pinned to the inline-end edge, so a position inside the clone says nothing about
    // where the cell stands in the grid. The editor's own inline-start position is measured from the grid's
    // inline-start edge already, and the width the editor may grow to is the room left from there. When the
    // window scrolls the grid, that position is in the page, so the scroll comes off it, the way it does for
    // the cells of the main table.
    const cellStartOffset = ['inline_end', 'top_inline_end_corner', 'bottom_inline_end_corner'].includes(overlayName) ?
      inlineStartPos - (wtOverlays.inlineStartOverlay?.mainTableScrollableElement === rootWindow ?
        horizontalScrollPosition : 0) :
      this.#calcCellStartOffset(TD, overlayName, overlayTable, cellWidth, firstColumnOffset, horizontalScrollPosition);

    const topBorderCompensation = Number.parseFloat(cellComputedStyle.borderTopWidth) > 0 ? 0 : 1;
    const width = outerWidth(TD) + inlineStartBorderCompensation;
    const height = outerHeight(TD) + topBorderCompensation;
    const actualVerticalScrollbarWidth = scrollableContainerTop &&
      hasVerticalScrollbar(scrollableContainerTop) ? scrollbarWidth : 0;
    const actualHorizontalScrollbarWidth = scrollableContainerLeft &&
      hasHorizontalScrollbar(scrollableContainerLeft) ? scrollbarWidth : 0;
    // The end clones paint over the master editor (z-index), so the room it may grow into ends where the band starts.
    const maxWidth = Math.max(this.hot.view.maximumVisibleElementWidth(cellStartOffset) -
      actualVerticalScrollbarWidth + inlineStartBorderCompensation - this.#calcEndBandWidth(overlayName), 0);
    const maxHeight = Math.max(this.hot.view.maximumVisibleElementHeight(cellTopOffset ?? 0) -
      actualHorizontalScrollbarWidth + topBorderCompensation, this.hot.stylesHandler.getDefaultRowHeight() ?? 0);

    return {
      top: topPos,
      start: inlineStartPos,
      height,
      maxHeight,
      width,
      maxWidth,
    };
  }

  /**
   * Whether the pixel in front of the edited cell lies under an inline-start overlay, so the editor
   * would show nothing of it. That is the gridline the row header owns in front of column 0 and, for a
   * cell of the master table or of a frozen top or bottom row, the one in front of the first column
   * after the overlay: the first visible column of a scrolled grid, the first one past `fixedColumnsStart`.
   *
   * The overlay that can cover it is the one whose layer is above the editor's own holder: the
   * inline-start clone (120) over the master's (100), the top start corner (180) over the top clone's
   * (160), and the bottom start corner (150) over the bottom clone's (130). A frozen column's holder is
   * part of its own clone and paints over the row header by DOM order, so it never loses the pixel. It
   * is canceled there too, by the row header test alone, so that column A is the same width with and
   * without `fixedColumnsStart`.
   *
   * @param {HTMLTableCellElement} TD The edited cell.
   * @param {string} overlayName The name of the overlay containing the edited cell.
   * @returns {boolean}
   */
  #isStartPixelCovered(TD: HTMLTableCellElement, overlayName: string): boolean {
    if (standsBehindRowHeader(TD)) {
      return true;
    }

    const { wtOverlays } = this.hot.view._wt;
    const coveringOverlay = {
      master: wtOverlays.inlineStartOverlay,
      top: wtOverlays.topInlineStartCornerOverlay,
      bottom: wtOverlays.bottomInlineStartCornerOverlay,
    }[overlayName];

    // A grid with nothing frozen on that side has no overlay there to paint over anything.
    if (!coveringOverlay?.needFullRender || !coveringOverlay.clone) {
      return false;
    }

    return isStartGapCovered(
      TD.getBoundingClientRect(),
      coveringOverlay.clone.wtTable.TABLE.getBoundingClientRect(),
      this.hot.isRtl()
    );
  }

  /**
   * Calculates the width the editor of a cell may not grow into because the frozen end columns (`fixedColumnsEnd`)
   * are painted over it, the pixel their first column reaches over the freeze line included. It is `0` for a cell
   * of an end clone, which stands at the band itself, and for a grid without end columns.
   *
   * @param {string} overlayName The name of the overlay containing the edited cell.
   * @returns {number}
   */
  #calcEndBandWidth(overlayName: string): number {
    if (['inline_end', 'top_inline_end_corner', 'bottom_inline_end_corner'].includes(overlayName)) {
      return 0;
    }

    const { wtOverlays, wtViewport, wtTable } = this.hot.view._wt;
    const bandWidth = wtOverlays.inlineEndOverlay?.getBandWidth() ?? 0;

    if (bandWidth === 0) {
      return 0;
    }

    // Without a horizontal scroll the columns do not fill the holder and the band rests against the last column,
    // so the free room between the two counts as taken as well.
    const restingGap = wtViewport.hasHorizontalScroll() ?
      0 : Math.max(wtViewport.getWorkspaceWidth() - wtTable.getTotalWidth(), 0);
    // The band's first column reaches over the freeze line, and the end clones paint that pixel too.
    const freezeLineOverlap = wtOverlays.inlineEndOverlay?.getFreezeLineOverlap() ?? 0;

    return bandWidth + restingGap + freezeLineOverlap;
  }

  /**
   * Calculates the top offset of the edited cell within the overlay's coordinate space.
   *
   * @param {HTMLTableCellElement} TD The edited cell element.
   * @param {string} overlayName The name of the overlay containing the cell.
   * @param {number} firstRowOffset The start position of the rows render calculator.
   * @param {number} verticalScrollPosition The current vertical scroll position.
   * @param {number} scrollbarWidth The scrollbar width in pixels.
   * @returns {number}
   */
  #calcCellTopOffset(
    TD: HTMLTableCellElement, overlayName: string,
    firstRowOffset: number, verticalScrollPosition: number, scrollbarWidth: number
  ): number {
    let cellTopOffset = TD.offsetTop;
    const { wtOverlays } = this.hot.view._wt;

    if (['inline_start', 'inline_end', 'master'].includes(overlayName)) {
      cellTopOffset += firstRowOffset - verticalScrollPosition;
    }

    if (
      ['bottom', 'bottom_inline_start_corner', 'bottom_inline_end_corner'].includes(overlayName) &&
      wtOverlays.bottomOverlay?.clone
    ) {
      const {
        wtViewport: bottomWtViewport,
        wtTable: bottomWtTable,
      } = wtOverlays.bottomOverlay!.clone!;

      cellTopOffset += bottomWtViewport.getWorkspaceHeight() - bottomWtTable.getHeight() - scrollbarWidth;
    }

    return cellTopOffset;
  }

  /**
   * Calculates the inline-start offset of the edited cell within the overlay's coordinate space.
   *
   * @param {HTMLTableCellElement} TD The edited cell element.
   * @param {string} overlayName The name of the overlay containing the cell.
   * @param {object} overlayTable The Walkontable table instance for the overlay.
   * @param {number} cellWidth The width of the edited cell.
   * @param {number} firstColumnOffset The start position of the columns render calculator.
   * @param {number} horizontalScrollPosition The current horizontal scroll position.
   * @returns {number}
   */
  #calcCellStartOffset(
    TD: HTMLTableCellElement, overlayName: string, overlayTable: { getWidth(): number },
    cellWidth: number, firstColumnOffset: number, horizontalScrollPosition: number
  ): number {
    let cellStartOffset = TD.offsetLeft;

    if (this.hot.isRtl()) {
      if (cellStartOffset >= 0) {
        cellStartOffset = overlayTable.getWidth() - TD.offsetLeft;
      } else {
        // The `offsetLeft` returns negative values when the parent offset element has position relative
        // (it happens when on the cell the selection is applied - the `area` CSS class).
        // When it happens the `offsetLeft` value is calculated from the right edge of the parent element.
        cellStartOffset = Math.abs(cellStartOffset);
      }

      cellStartOffset += firstColumnOffset - horizontalScrollPosition - cellWidth;

    } else if (['top', 'master', 'bottom'].includes(overlayName)) {
      cellStartOffset += firstColumnOffset - horizontalScrollPosition;
    }

    return cellStartOffset;
  }

  /**
   * Gets the `className` of the edited cell, if it exists.
   *
   * @returns {string}
   */
  getEditedCellsLayerClass(): string {
    const editorSection = this.checkEditorSection();

    switch (editorSection) {
      case 'inline-start':
        return 'ht_clone_left ht_clone_inline_start';
      case 'inline-end':
        return 'ht_clone_inline_end';
      case 'bottom':
        return 'ht_clone_bottom';
      case 'bottom-inline-start-corner':
        return 'ht_clone_bottom_left_corner ht_clone_bottom_inline_start_corner';
      case 'bottom-inline-end-corner':
        return 'ht_clone_bottom_inline_end_corner';
      case 'top':
        return 'ht_clone_top';
      case 'top-inline-start-corner':
        return 'ht_clone_top_left_corner ht_clone_top_inline_start_corner';
      case 'top-inline-end-corner':
        return 'ht_clone_top_inline_end_corner';
      default:
        return 'ht_clone_master';
    }
  }

  /**
   * Gets the `HTMLTableCellElement` of the edited cell, if it exists.
   *
   * @returns {HTMLTableCellElement|null}
   */
  getEditedCell(): HTMLTableCellElement | null {
    if (this.row === null || this.col === null) {
      return null;
    }

    return this.hot.getCell(this.row, this.col, true);
  }

  /**
   * Returns name of the overlay, where editor is placed.
   *
   * @private
   * @returns {string}
   */
  checkEditorSection(): string {
    if (this.row === null || this.col === null) {
      return '';
    }

    const totalRows = this.hot.countRows();
    const totalColumns = this.hot.countCols();
    const fixedColumnsStart = this.hot.view.countFixedColumnsStart();
    const fixedRowsBottom = this.hot.view.countFixedRowsBottom();
    // The start band has priority, so only the columns it leaves can belong to the end band.
    const firstFixedColumnEnd = totalColumns - this.hot.view.countFixedColumnsEnd();
    const isInlineStart = this.col < fixedColumnsStart;
    const isInlineEnd = !isInlineStart && this.col >= firstFixedColumnEnd;
    let section = '';

    if (this.row < this.hot.view.countFixedRowsTop()) {
      if (isInlineStart) {
        section = 'top-inline-start-corner';
      } else if (isInlineEnd) {
        section = 'top-inline-end-corner';
      } else {
        section = 'top';
      }
    } else if (fixedRowsBottom && this.row >= totalRows - fixedRowsBottom) {
      if (isInlineStart) {
        section = 'bottom-inline-start-corner';
      } else if (isInlineEnd) {
        section = 'bottom-inline-end-corner';
      } else {
        section = 'bottom';
      }
    } else if (isInlineStart) {
      section = 'inline-start';
    } else if (isInlineEnd) {
      section = 'inline-end';
    }

    return section;
  }
}

mixin(BaseEditor, hooksRefRegisterer);
