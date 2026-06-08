import moment from 'moment';
import Pikaday from '@handsontable/pikaday';
import { EDITOR_STATE } from '../baseEditor';
import { TextEditor } from '../textEditor';
import { addClass, eventTargetEl, hasClass, outerHeight, outerWidth } from '../../helpers/dom/element';
import { deepExtend } from '../../helpers/object';
import { isFunctionKey } from '../../helpers/unicode';
import { isMobileBrowser } from '../../helpers/browser';
import { deprecatedWarn } from '../../helpers/console';
import { throwWithCause } from '../../helpers/errors';
import { clamp } from '../../helpers/number';

export const EDITOR_TYPE = 'date';
const SHORTCUTS_GROUP_EDITOR = 'dateEditor';
const DEFAULT_DATE_FORMAT = 'DD/MM/YYYY';
const deprecatedMessageShown = new WeakSet();

interface PikadayInstance {
  destroy(): void;
  adjustDate(action: string, amount: number): void;
  useMoment?(momentLib: unknown): void;
  _onInputFocus: Function;
  setMoment(moment: unknown, preventOnSelect?: boolean): void;
  gotoToday(): void;
  hide(): void;
  [key: string]: unknown;
}

/**
 * @private
 * @class DateEditor
 */
export class DateEditor extends TextEditor {
  /**
   * Returns the unique editor type identifier for the date editor.
   */
  static get EDITOR_TYPE() {
    return EDITOR_TYPE;
  }

  /**
   * @type {boolean}
   */
  parentDestroyed: boolean = false;
  /**
   * @type {Pikaday}
   */
  $datePicker: PikadayInstance | null = null;
  /**
   * @type {HTMLDivElement}
   */
  declare datePicker: HTMLDivElement;
  /**
   * @type {CSSStyleDeclaration}
   */
  declare datePickerStyle: CSSStyleDeclaration;

  /**
   * Verifies that moment.js and Pikaday are available, then initializes the editor and registers lifecycle hooks.
   */
  init(): void {
    if (typeof moment !== 'function') {
      throwWithCause('You need to include moment.js to your project.');
    }

    if (typeof Pikaday !== 'function') {
      throwWithCause('You need to include Pikaday to your project.');
    }

    super.init();

    this.hot.addHook('afterDestroy', () => {
      this.parentDestroyed = true;
      this.destroyElements();
    });

    this.hot.addHook('afterSetTheme', (themeName: string, firstRun: boolean) => {
      if (!firstRun) {
        this.close();
      }
    });
  }

  /**
   * Create data picker instance.
   */
  createElements(): void {
    super.createElements();

    this.datePicker = this.hot.rootDocument.createElement('div') as HTMLDivElement;
    this.datePickerStyle = this.datePicker.style;
    this.datePickerStyle.position = 'absolute';
    this.datePickerStyle.top = '0';
    this.datePickerStyle.left = '0';
    this.datePickerStyle.zIndex = '9999';

    this.datePicker.setAttribute('dir', this.hot.isRtl() ? 'rtl' : 'ltr');

    addClass(this.datePicker, 'htDatepickerHolder');

    this.hot.rootPortalElement.appendChild(this.datePicker);

    /**
     * Prevent recognizing clicking on datepicker as clicking outside of table.
     */
    this.eventManager.addEventListener(this.datePicker, 'mousedown', (event) => {
      if (hasClass(eventTargetEl(event)!, 'pika-day')) {
        this.hideDatepicker();
      }

      (event as Event).stopPropagation();
    });
  }

  /**
   * Destroy data picker instance.
   */
  destroyElements(): void {
    const datePickerParentElement = this.datePicker.parentNode;

    if (this.$datePicker) {
      this.$datePicker.destroy();
    }

    if (datePickerParentElement) {
      datePickerParentElement.removeChild(this.datePicker);
    }
  }

  /**
   * Prepare editor to appear.
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
    td: HTMLTableCellElement, value: unknown, cellProperties: Record<string, unknown>): void {
    super.prepare(row, col, prop, td, value, cellProperties);
  }

  /**
   * Open editor.
   *
   * @param {Event} [event=null] The event object.
   */
  open(event: Event | null = null): void {
    if (!deprecatedMessageShown.has(this.cellProperties.instance as object)) {
      deprecatedMessageShown.add(this.cellProperties.instance as object);
      deprecatedWarn(
        'The Pikaday-based `date` editor is deprecated and will be removed in the next major release, ' +
        'replaced by the native HTML date input.\n\n' +
        'Migration guide: https://handsontable.com/docs/migration-from-16.2-to-17.0/\n' +
        '`date` cell type documentation: https://handsontable.com/docs/date-cell-type/'
      );
    }

    const shortcutManager = this.hot.getShortcutManager();
    const editorContext = shortcutManager.getContext('editor');

    this.showDatepicker(event ?? undefined);
    super.open();

    editorContext!.addShortcuts([{
      keys: [['ArrowLeft']],
      callback: () => {
        this.$datePicker!.adjustDate('subtract', 1);
      },
    }, {
      keys: [['ArrowRight']],
      callback: () => {
        this.$datePicker!.adjustDate('add', 1);
      },
    }, {
      keys: [['ArrowUp']],
      callback: () => {
        this.$datePicker!.adjustDate('subtract', 7);
      },
    }, {
      keys: [['ArrowDown']],
      callback: () => {
        this.$datePicker!.adjustDate('add', 7);
      },
    }], {
      group: SHORTCUTS_GROUP_EDITOR,
    });
  }

  /**
   * Close editor.
   */
  close(): void {
    // If the date picker was never initialized (e.g. during autofill), there's nothing to destroy.
    if (this.$datePicker?.destroy) {
      this.$datePicker.destroy();
    }

    this.hot._registerTimeout(() => {
      const editorManager = this.hot._getEditorManager();

      editorManager.closeEditor();
      this.hot.view.render();
      editorManager.prepareEditor();
    });

    const shortcutManager = this.hot.getShortcutManager();
    const editorContext = shortcutManager.getContext('editor');

    editorContext!.removeShortcutsByGroup(SHORTCUTS_GROUP_EDITOR);

    super.close();
  }

  /**
   * Finishes editing and start saving or restoring process for editing cell or last selected range.
   *
   * @param {boolean} restoreOriginalValue If true, then closes editor without saving value from the editor into a cell.
   * @param {boolean} ctrlDown If true, then saveValue will save editor's value to each cell in the last selected range.
   */
  finishEditing(restoreOriginalValue: boolean = false, ctrlDown: boolean = false): void {
    super.finishEditing(restoreOriginalValue, ctrlDown);
  }

  /**
   * Show data picker.
   *
   * @param {Event} event The event object.
   */
  showDatepicker(event?: Event): void {
    const dateFormat = this.#getDateFormat();
    const isMouseDown = this.hot.view.isMouseDown();
    const isMeta = event ? isFunctionKey((event as KeyboardEvent).keyCode) : false;
    let dateStr;

    this.datePicker.style.display = 'block';

    this.$datePicker = new Pikaday(this.getDatePickerConfig()) as unknown as PikadayInstance;

    if (typeof this.$datePicker.useMoment === 'function') {
      this.$datePicker.useMoment(moment);
    }

    this.$datePicker._onInputFocus = function() {};

    if (this.originalValue) {
      dateStr = this.originalValue;

      if (moment(dateStr, dateFormat, true).isValid()) {
        this.$datePicker.setMoment(moment(dateStr, dateFormat), true);
      }

      // workaround for date/time cells - pikaday resets the cell value to 12:00 AM by default, this will overwrite the value.
      if (this.getValue() !== this.originalValue) {
        this.setValue(this.originalValue);
      }

      if (!isMeta && !isMouseDown) {
        this.setValue('');
      }

    } else if (this.cellProperties.defaultDate) {
      dateStr = this.cellProperties.defaultDate;

      if (moment(dateStr, dateFormat, true).isValid()) {
        this.$datePicker.setMoment(moment(dateStr, dateFormat), true);
      }

      if (!isMeta && !isMouseDown) {
        this.setValue('');
      }
    } else {
      // if a default date is not defined, set a soft-default-date: display the current day and month in the
      // datepicker, but don't fill the editor input
      this.$datePicker.gotoToday();
    }
  }

  /**
   * Hide data picker.
   */
  hideDatepicker(): void {
    this.datePickerStyle.display = 'none';
    this.$datePicker!.hide();
  }

  /**
   * Get date picker options.
   *
   * @returns {object}
   */
  getDatePickerConfig(): Record<string, unknown> {
    const htInput = this.TEXTAREA;
    const options: Record<string, unknown> = {};

    if (this.cellProperties && this.cellProperties.datePickerConfig) {
      deepExtend(options, this.cellProperties.datePickerConfig as Record<string, unknown>);
    }
    const origOnSelect = options.onSelect as (() => void) | undefined;
    const origOnClose = options.onClose as (() => void) | undefined;

    options.field = htInput;
    options.trigger = htInput;
    options.container = this.datePicker;
    options.bound = false;
    options.keyboardInput = false;
    options.format = options.format ?? this.#getDateFormat();
    options.reposition = options.reposition || false;
    // Set the RTL to `false`. Due to the https://github.com/Pikaday/Pikaday/issues/647 bug, the layout direction
    // of the date picker is controlled by juggling the "dir" attribute of the root date picker element.
    // See line @64 of this file.
    options.isRTL = false;
    options.onSelect = (value: Date) => {
      let dateStr: string | Date = value;

      if (!isNaN(dateStr.getTime())) {
        dateStr = moment(dateStr).format(this.#getDateFormat());
      }

      this.setValue(dateStr);

      if (origOnSelect) {
        origOnSelect();
      }

      if (isMobileBrowser()) {
        this.hideDatepicker();
      }
    };
    options.onClose = () => {
      if (!this.parentDestroyed) {
        this.finishEditing(false);
      }
      if (origOnClose) {
        origOnClose();
      }
    };

    return options;
  }

  /**
   * Refreshes datepicker's size and position. The method is called internally by Handsontable.
   *
   * @private
   * @param {boolean} force Indicates if the refreshing editor dimensions should be triggered.
   */
  refreshDimensions(force: boolean): void {
    super.refreshDimensions(force);

    if (this.state !== EDITOR_STATE.EDITING) {
      return;
    }

    this.TD = this.getEditedCell();

    if (!this.TD) {
      this.hideDatepicker();

      return;
    }

    const { rowIndexMapper, columnIndexMapper } = this.hot;
    const { wtOverlays } = this.hot.view._wt;
    const { wtTable } = wtOverlays.getParentOverlay(this.TD) ?? this.hot.view._wt;

    const firstVisibleRow = rowIndexMapper.getVisualFromRenderableIndex(wtTable.getFirstPartiallyVisibleRow());
    const lastVisibleRow = rowIndexMapper.getVisualFromRenderableIndex(wtTable.getLastPartiallyVisibleRow());
    const firstVisibleColumn = columnIndexMapper.getVisualFromRenderableIndex(wtTable.getFirstPartiallyVisibleColumn());
    const lastVisibleColumn = columnIndexMapper.getVisualFromRenderableIndex(wtTable.getLastPartiallyVisibleColumn());

    if (
      this.row! >= firstVisibleRow! && this.row! <= lastVisibleRow! &&
      this.col! >= firstVisibleColumn! && this.col! <= lastVisibleColumn!
    ) {
      const offset = this.TD.getBoundingClientRect();
      const pickerWidth = outerWidth(this.datePicker);
      const pickerHeight = outerHeight(this.datePicker);
      const cellHeight = outerHeight(this.TD);
      const win = this.hot.rootWindow;
      const doc = this.hot.rootDocument.documentElement;
      const viewportTop = win.pageYOffset;
      const viewportBottom = win.pageYOffset + doc.clientHeight;
      const viewportLeft = win.pageXOffset;
      const viewportRight = win.pageXOffset + doc.clientWidth;

      let top = viewportTop + offset.top + cellHeight;

      if (top + pickerHeight > viewportBottom) {
        const aboveCell = viewportTop + offset.top - pickerHeight;

        top = aboveCell >= viewportTop
          ? Math.max(viewportTop, aboveCell - 1)
          : viewportBottom - pickerHeight;
      }

      this.datePickerStyle.top = `${top}px`;

      const cellLeft = viewportLeft + offset.left;
      const cellRight = viewportLeft + offset.right;
      let pickerLeftPosition: number;

      if (this.hot.isRtl()) {
        pickerLeftPosition = cellRight - pickerWidth;

        if (pickerLeftPosition < viewportLeft) {
          pickerLeftPosition = Math.min(cellLeft, viewportRight - pickerWidth);
        }
      } else {
        pickerLeftPosition = cellLeft;

        if (pickerLeftPosition + pickerWidth > viewportRight) {
          pickerLeftPosition = Math.max(cellRight - pickerWidth, viewportLeft);
        }
      }

      pickerLeftPosition = clamp(
        pickerLeftPosition,
        viewportLeft,
        viewportRight - pickerWidth
      );

      this.datePickerStyle.left = `${pickerLeftPosition}px`;

    } else {
      this.hideDatepicker();
    }
  }

  /**
   * Gets the current date format for this cell.
   *
   * @returns {string}
   */
  #getDateFormat(): string {
    return (this.cellProperties.dateFormat ?? DEFAULT_DATE_FORMAT) as string;
  }
}
