import {
  addClass,
  closest,
  eventTargetEl,
  getScrollbarWidth,
  hasClass,
  hasVerticalScrollbar,
  hasHorizontalScrollbar,
  isChildOf,
  outerHeight,
} from '../../helpers/dom/element';
import { stopImmediatePropagation } from '../../helpers/dom/event';
import { deepClone, deepExtend } from '../../helpers/object';
import { CellRange } from '../../3rdparty/walkontable/src';
import { BasePlugin } from '../base';
import { throwWithCause } from '../../helpers/errors';
import CommentEditor from './commentEditor';
import DisplaySwitch from './displaySwitch';
import { getEditorAnchorWidth } from './utils';
import { SEPARATOR } from '../contextMenu/predefinedItems';
import type { PredefinedMenuItemKey, MenuItemConfig } from '../contextMenu/contextMenu';
import addEditCommentItem from './contextMenuItem/addEditComment';
import removeCommentItem from './contextMenuItem/removeComment';
import readOnlyCommentItem from './contextMenuItem/readOnlyComment';
import type { default as CellCoords } from '../../3rdparty/walkontable/src/cell/coords';

export const PLUGIN_KEY = 'comments';
export const PLUGIN_PRIORITY = 60;
export const META_COMMENT = 'comment';
export const META_COMMENT_VALUE = 'value';
export const META_STYLE = 'style';
export const META_READONLY = 'readOnly';

/**
 * Represents a comment's metadata stored in cell meta.
 */
interface CommentMeta {
  [META_COMMENT_VALUE]?: string;
  [META_STYLE]?: { width: number; height: number };
  [META_READONLY]?: boolean;
}

export interface CommentObject extends CommentMeta { }

/**
 * Checks if a value is a CommentMeta object.
 *
 * @param {unknown} value The value to check.
 * @returns {boolean}
 */
function isCommentMeta(value: unknown): value is CommentMeta {
  return value !== null && typeof value === 'object';
}

/**
 * Represents the range object used by the Comments plugin.
 */
interface CommentRange {
  from?: CellCoords;
  to?: CellCoords;
}
const SHORTCUTS_GROUP = PLUGIN_KEY;
const SHORTCUTS_CONTEXT_NAME = `plugin:${PLUGIN_KEY}`;

/* eslint-disable jsdoc/require-description-complete-sentence */
/**
 * @plugin Comments
 * @class Comments
 *
 * @description
 * This plugin allows setting and managing cell comments by either an option in the context menu or with the use of
 * the API.
 *
 * To enable the plugin, you'll need to set the comments property of the config object to `true`:
 * ```js
 * comments: true
 * ```
 *
 * or an object with extra predefined plugin config:
 *
 * ```js
 * comments: {
 *   displayDelay: 1000,
 *   readOnly: true,
 *   style: {
 *     width: 300,
 *     height: 100
 *   }
 * }
 * ```
 *
 * To add comments at the table initialization, define the `comment` property in the `cell` config array as in an example below.
 *
 * @example
 * ::: only-for javascript
 * ```js
 * const hot = new Handsontable(document.getElementById('example'), {
 *   data: getData(),
 *   comments: true,
 *   cell: [
 *     {row: 1, col: 1, comment: {value: 'Foo'}},
 *     {row: 2, col: 2, comment: {value: 'Bar'}}
 *   ]
 * });
 *
 * // Access to the Comments plugin instance:
 * const commentsPlugin = hot.getPlugin('comments');
 *
 * // Manage comments programmatically:
 * commentsPlugin.setCommentAtCell(1, 6, 'Comment contents');
 * commentsPlugin.showAtCell(1, 6);
 * commentsPlugin.removeCommentAtCell(1, 6);
 *
 * // You can also set range once and use proper methods:
 * commentsPlugin.setRange({from: {row: 1, col: 6}});
 * commentsPlugin.setComment('Comment contents');
 * commentsPlugin.show();
 * commentsPlugin.removeComment();
 * ```
 * :::
 *
 * ::: only-for react
 * ```jsx
 * const hotRef = useRef(null);
 *
 * ...
 *
 * <HotTable
 *   ref={hotRef}
 *   data={getData()}
 *   comments={true}
 *   cell={[
 *     {row: 1, col: 1, comment: {value: 'Foo'}},
 *     {row: 2, col: 2, comment: {value: 'Bar'}}
 *   ]}
 * />
 *
 * // Access to the Comments plugin instance:
 * const hot = hotRef.current.hotInstance;
 * const commentsPlugin = hot.getPlugin('comments');
 *
 * // Manage comments programmatically:
 * commentsPlugin.setCommentAtCell(1, 6, 'Comment contents');
 * commentsPlugin.showAtCell(1, 6);
 * commentsPlugin.removeCommentAtCell(1, 6);
 *
 * // You can also set range once and use proper methods:
 * commentsPlugin.setRange({from: {row: 1, col: 6}});
 * commentsPlugin.setComment('Comment contents');
 * commentsPlugin.show();
 * commentsPlugin.removeComment();
 * ```
 * :::
 *
 * ::: only-for angular
 * ```ts
 * import { AfterViewInit, Component, ViewChild } from "@angular/core";
 * import {
 *   GridSettings,
 *   HotTableModule,
 *   HotTableComponent,
 * } from "@handsontable/angular-wrapper";
 *
 * `@Component`({
 *   selector: "app-example",
 *   standalone: true,
 *   imports: [HotTableModule],
 *   template: ` <div>
 *     <hot-table [settings]="gridSettings" />
 *   </div>`,
 * })
 * export class ExampleComponent implements AfterViewInit {
 *   `@ViewChild`(HotTableComponent, { static: false })
 *   readonly hotTable!: HotTableComponent;
 *
 *   readonly gridSettings = <GridSettings>{
 *     data: this.getData(),
 *     comments: true,
 *     cell: [
 *       { row: 1, col: 1, comment: { value: "Foo" } },
 *       { row: 2, col: 2, comment: { value: "Bar" } },
 *     ],
 *   };
 *
 *   ngAfterViewInit(): void {
 *     // Access to plugin instance:
 *     const hot = this.hotTable.hotInstance;
 *     const commentsPlugin = hot.getPlugin("comments");
 *
 *     // Manage comments programmatically:
 *     commentsPlugin.setCommentAtCell(1, 6, "Comment contents");
 *     commentsPlugin.showAtCell(1, 6);
 *     commentsPlugin.removeCommentAtCell(1, 6);
 *
 *     // You can also set range once and use proper methods:
 *     commentsPlugin.setRange({ from: { row: 1, col: 6 } });
 *     commentsPlugin.setComment("Comment contents");
 *     commentsPlugin.show();
 *   }
 *
 *   private getData(): any[] {
 *     // get some data
 *   }
 * }
 * ```
 * :::
 */
export class Comments extends BasePlugin {
  static get PLUGIN_KEY() {
    return PLUGIN_KEY;
  }

  static get PLUGIN_PRIORITY() {
    return PLUGIN_PRIORITY;
  }

  static get DEFAULT_SETTINGS() {
    return {
      displayDelay: 250,
    };
  }

  /**
   * Current cell range, an object with `from` property, with `row` and `col` properties (e.q. `{from: {row: 1, col: 6}}`).
   *
   * @type {object}
   */
  range: CommentRange = {};
  /**
   * Instance of {@link CommentEditor}.
   *
   * @type {CommentEditor}
   */
  #editor: CommentEditor | null = null;
  /**
   * Instance of {@link DisplaySwitch}.
   *
   * @type {DisplaySwitch}
   */
  #displaySwitch: DisplaySwitch | null = null;
  /**
   * Prevents showing/hiding editor that reacts on the logic triggered by the "mouseover" events.
   *
   * @type {boolean}
   */
  #preventEditorAutoSwitch = false;
  /**
   * Prevents hiding editor when the table viewport is scrolled and that scroll is triggered by the
   * keyboard shortcut that insert or edits the comment.
   *
   * @type {boolean}
   */
  #preventEditorHiding = false;
  /**
   * Prevents saving the comment value when the editor is blurred.
   *
   * @type {boolean}
   */
  #preventEditorSaveOnBlur = false;
  /**
   * The flag that allows processing mousedown event correctly when comments editor is triggered.
   *
   * @type {boolean}
   */
  #cellBelowCursor: Element | null = null;
  /**
   * Holds the comment value before it's actually saved to the cell meta.
   *
   * @type {string}
   */
  #commentValueBeforeSave = '';

  /**
   * Checks if the plugin is enabled in the handsontable settings. This method is executed in {@link Hooks#beforeInit}
   * hook and if it returns `true` then the {@link Comments#enablePlugin} method is called.
   *
   * @returns {boolean}
   */
  isEnabled(): boolean {
    return !!this.hot.getSettings()[PLUGIN_KEY];
  }

  /**
   * Enables the plugin functionality for this Handsontable instance.
   */
  enablePlugin(): void {
    if (this.enabled) {
      return;
    }

    if (!this.#editor) {
      this.#editor = new CommentEditor(this.hot.rootDocument, this.hot.isRtl(), this.hot.rootPortalElement);
      this.#editor.addLocalHook('resize',
        (width: number, height: number) => this.#onEditorResize(width, height));
      this.hot.addHook('afterSetTheme', (themeName: string, firstRun: boolean) => {
        if (!firstRun) {
          this.hide();
        }
      });
    }

    if (!this.#displaySwitch) {
      this.#displaySwitch = new DisplaySwitch(this.getSetting<number>('displayDelay'));
    }

    this.addHook('afterContextMenuDefaultOptions',
      (options: Record<string, unknown>) => this.addToContextMenu(options));
    this.addHook('afterRenderer',
      (TD: HTMLTableCellElement, row: number, col: number, prop: string | number,
       value: unknown, cellProperties: Record<string, unknown>) =>
        this.#onAfterRenderer(TD, cellProperties));
    this.addHook('afterScroll', this.#onAfterScroll);
    this.addHook('afterBeginEditing', () => this.hide());
    this.addHook('afterDocumentKeyDown', this.#onAfterDocumentKeyDown);
    this.addHook('beforeCompositionStart', this.#onAfterDocumentKeyDown);

    this.#displaySwitch.addLocalHook('hide', () => this.hide());
    this.#displaySwitch.addLocalHook('show', (row: number, col: number) => this.showAtCell(row, col));

    this.registerShortcuts();
    this.registerListeners();
    super.enablePlugin();
  }

  /**
   * Updates the plugin's state.
   *
   * This method is executed when [`updateSettings()`](@/api/core.md#updatesettings) is invoked with any of the following configuration options:
   *   - [`comments`](@/api/options.md#comments)
   */
  updatePlugin(): void {
    this.#displaySwitch.updateDelay(this.getSetting<number>('displayDelay'));
    super.updatePlugin();
  }

  /**
   * Disables the plugin functionality for this Handsontable instance.
   */
  disablePlugin(): void {
    this.unregisterShortcuts();
    super.disablePlugin();
  }

  /**
   * Register shortcuts responsible for toggling context menu.
   *
   * @private
   */
  registerShortcuts() {
    const manager = this.hot.getShortcutManager();
    const gridContext = manager.getContext('grid');
    const pluginContext = manager.addContext(SHORTCUTS_CONTEXT_NAME);

    gridContext.addShortcut({
      keys: [['Control', 'Alt', 'M']],
      callback: () => {
        const range = this.hot.getSelectedRangeActive();

        this.#preventEditorHiding = true;
        this.hot.scrollToFocusedCell(() => {
          this.setRange(range);
          this.show();
          this.focusEditor();
          manager.setActiveContextName(SHORTCUTS_CONTEXT_NAME);

          this.hot._registerTimeout(() => {
            this.#preventEditorHiding = false;
          });
        });
      },
      stopPropagation: true,
      runOnlyIf: () => this.hot.getSelectedRangeActive()?.highlight.isCell(),
      group: SHORTCUTS_GROUP,
    });

    pluginContext.addShortcut({
      keys: [['Escape']],
      callback: () => {
        this.#editor.setValue(this.#commentValueBeforeSave);
        this.hide();
        manager.setActiveContextName('grid');
      },
      runOnlyIf: () => this.#editor.isVisible() && this.#editor.isFocused(),
      group: SHORTCUTS_GROUP,
    });

    pluginContext.addShortcut({
      keys: [['Control/Meta', 'Enter']],
      callback: () => {
        this.hide();
        manager.setActiveContextName('grid');
      },
      runOnlyIf: () => this.#editor.isVisible() && this.#editor.isFocused(),
      group: SHORTCUTS_GROUP,
    });

    pluginContext.addShortcut({
      keys: [['Shift', 'Tab'], ['Tab']],
      forwardToContext: manager.getContext('grid'),
      callback: () => {
        this.#preventEditorSaveOnBlur = true;
        this.#editor.setValue(this.#editor.getValue());
        this.setComment();
        this.hide();
        manager.setActiveContextName('grid');
      },
      group: SHORTCUTS_GROUP,
    });
  }

  /**
   * Unregister shortcuts responsible for toggling context menu.
   *
   * @private
   */
  unregisterShortcuts() {
    this.hot.getShortcutManager()
      .getContext('grid')
      .removeShortcutsByGroup(SHORTCUTS_GROUP);
  }

  /**
   * Registers all necessary DOM listeners.
   *
   * @private
   */
  registerListeners() {
    const { rootDocument } = this.hot;
    const editorElement = this.getEditorInputElement();

    this.eventManager.addEventListener(rootDocument, 'mouseover', this.#onMouseOver);
    this.eventManager.addEventListener(rootDocument, 'mousedown', this.#onMouseDown);
    this.eventManager.addEventListener(rootDocument, 'mouseup', () => this.#onMouseUp());
    this.eventManager.addEventListener(editorElement, 'focus', () => this.#onEditorFocus());
    this.eventManager.addEventListener(editorElement, 'blur', () => this.#onEditorBlur());
    this.eventManager.addEventListener(editorElement, 'keydown', this.#onEditorKeyDown);

    this.eventManager.addEventListener(
      this.getEditorInputElement(),
      'mousedown',
      this.#onInputElementMouseDown
    );
  }

  /**
   * Sets the current cell range to be able to use general methods like {@link Comments#setComment}, {@link Comments#removeComment}, {@link Comments#show}.
   *
   * @param {object} range Object with `from` property, each with `row` and `col` properties.
   */
  setRange(range: CommentRange): void {
    this.range = range;
  }

  /**
   * Clears the currently selected cell.
   */
  clearRange(): void {
    this.range = {};
  }

  /**
   * Checks if the event target is a cell containing a comment.
   *
   * @private
   * @param {Event} event DOM event.
   * @returns {boolean}
   */
  targetIsCellWithComment(event: Event) {
    const closestCell = closest(eventTargetEl(event)!, ['TD']);

    return !!(closestCell && hasClass(closestCell, 'htCommentCell') &&
      closest(closestCell, [this.hot.rootElement]));
  }

  /**
   * Checks if the event target is a comment textarea.
   *
   * @private
   * @param {Event} event DOM event.
   * @returns {boolean}
   */
  targetIsCommentTextArea(event: Event) {
    return this.getEditorInputElement() === event.target;
  }

  /**
   * Sets a comment for a cell according to the previously set range (see {@link Comments#setRange}).
   *
   * @param {string} value Comment contents.
   */
  setComment(value?: string): void {
    if (!this.range.from) {
      throwWithCause('Before using this method, first set cell range (hot.getPlugin("comment").setRange())');
    }
    const editorValue = this.#editor.getValue();
    let comment = '';

    if (value !== null && value !== undefined) {
      comment = value;
    } else if (editorValue !== null && editorValue !== undefined) {
      comment = editorValue;
    }

    const { row, col } = this.#getRangeCoords();

    this.updateCommentMeta(row, col, { [META_COMMENT_VALUE]: comment });
    this.hot.render();
  }

  /**
   * Sets a comment for a specified cell.
   *
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   * @param {string} value Comment contents.
   */
  setCommentAtCell(row: number, column: number, value: string): void {
    this.setRange({
      from: this.hot._createCellCoords(row, column)
    });
    this.setComment(value);
  }

  /**
   * Removes a comment from a cell according to previously set range (see {@link Comments#setRange}).
   *
   * @param {boolean} [forceRender=true] If set to `true`, the table will be re-rendered at the end of the operation.
   */
  removeComment(forceRender: boolean = true): void {
    if (!this.range.from) {
      throwWithCause('Before using this method, first set cell range (hot.getPlugin("comment").setRange())');
    }

    const { row, col } = this.#getRangeCoords();

    this.hot.setCellMeta(row, col, META_COMMENT, undefined);

    if (forceRender) {
      this.hot.render();
    }

    this.hide();
  }

  /**
   * Removes a comment from a specified cell.
   *
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   * @param {boolean} [forceRender=true] If `true`, the table will be re-rendered at the end of the operation.
   */
  removeCommentAtCell(row: number, column: number, forceRender: boolean = true): void {
    this.setRange({
      from: this.hot._createCellCoords(row, column)
    });
    this.removeComment(forceRender);
  }

  /**
   * Gets comment from a cell according to previously set range (see {@link Comments#setRange}).
   *
   * @returns {string|undefined} Returns a content of the comment.
   */
  getComment(): string | undefined {
    const { row, col } = this.#getRangeCoords();

    return this.getCommentMeta(row, col, META_COMMENT_VALUE);
  }

  /**
   * Gets comment from a cell at the provided coordinates.
   *
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   * @returns {string|undefined} Returns a content of the comment.
   */
  getCommentAtCell(row: number, column: number): string | undefined {
    return this.getCommentMeta(row, column, META_COMMENT_VALUE);
  }

  /**
   * Shows the comment editor accordingly to the previously set range (see {@link Comments#setRange}).
   *
   * @returns {boolean} Returns `true` if comment editor was shown.
   */
  show(): boolean {
    if (!this.range.from) {
      throwWithCause('Before using this method, first set cell range (hot.getPlugin("comment").setRange())');
    }

    const { row, col } = this.#getRangeCoords();

    if (row < 0 || row > this.hot.countSourceRows() - 1 || col < 0 || col > this.hot.countSourceCols() - 1) {
      return false;
    }

    const meta = this.hot.getCellMeta<{ [META_COMMENT]?: CommentMeta }>(row, col);

    this.#displaySwitch.cancelHiding();
    const commentMeta = meta[META_COMMENT];

    this.#editor.setValue((commentMeta ? commentMeta[META_COMMENT_VALUE] : null) ?? '');
    this.#editor.show();
    this.refreshEditor(true);

    return true;
  }

  /**
   * Shows comment editor according to cell coordinates.
   *
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   * @returns {boolean} Returns `true` if comment editor was shown.
   */
  showAtCell(row: number, column: number): boolean {
    this.setRange({
      from: this.hot._createCellCoords(row, column)
    });

    return this.show();
  }

  /**
   * Hides the comment editor.
   */
  hide(): void {
    this.#editor.hide();
  }

  /**
   * Refreshes comment editor position and styling.
   *
   * @param {boolean} [force=false] If `true` then recalculation will be forced.
   */
  refreshEditor(force: boolean = false): void {
    if (!force && (!this.range.from || !this.#editor.isVisible())) {
      return;
    }

    const { rowIndexMapper, columnIndexMapper } = this.hot;
    const { row: visualRow, col: visualColumn } = this.#getRangeCoords();

    let renderableRow = rowIndexMapper.getRenderableFromVisualIndex(visualRow);
    let renderableColumn = columnIndexMapper.getRenderableFromVisualIndex(visualColumn);
    // Used when the requested row is hidden, and the editor needs to be positioned on the previous row's coords.
    const targetingPreviousRow = renderableRow === null;

    // Reset the editor position to (0, 0) so the opening direction calculation wouldn't be influenced by its
    // previous position
    this.#editor.setPosition(0, 0);

    if (renderableRow === null) {
      renderableRow = rowIndexMapper
        .getRenderableFromVisualIndex(rowIndexMapper.getNearestNotHiddenIndex(visualRow, -1));
    }

    if (renderableColumn === null) {
      renderableColumn = columnIndexMapper
        .getRenderableFromVisualIndex(columnIndexMapper.getNearestNotHiddenIndex(visualColumn, -1));
    }

    const isBeforeRenderedRows = renderableRow === null;
    const isBeforeRenderedColumns = renderableColumn === null;

    renderableRow = renderableRow ?? 0;
    renderableColumn = renderableColumn ?? 0;

    const { rootWindow, view: { _wt: wt } } = this.hot;
    const { wtTable } = wt;
    // TODO: Probably using `hot.getCell` would be the best. However, case for showing comment editor for hidden cell
    // potentially should be removed with that change (currently a test for it is passing).
    const TD = wt.getCell({ row: renderableRow, col: renderableColumn }, true) as HTMLTableCellElement;
    const cellMeta = this.hot.getCellMeta<{ colspan?: number; [META_COMMENT]?: CommentMeta }>(visualRow, visualColumn);
    const metaColspan = cellMeta.colspan ?? 1;
    const commentStyle = this.getCommentMeta(visualRow, visualColumn, META_STYLE);

    if (commentStyle) {
      this.#editor.setSize(commentStyle.width, commentStyle.height);

    } else {
      this.#editor.resetSize();
    }

    const lastColWidth = isBeforeRenderedColumns ? 0 :
      getEditorAnchorWidth(metaColspan, TD, wtTable.getColumnWidth(renderableColumn));
    const lastRowHeight = targetingPreviousRow && !isBeforeRenderedRows ? outerHeight(TD) : 0;

    const {
      left,
      top,
      width: cellWidth,
      height: cellHeight,
    } = TD.getBoundingClientRect();
    const {
      width: editorWidth,
      height: editorHeight,
    } = this.#editor.getSize();

    const { innerWidth, innerHeight } = this.hot.rootWindow;
    const documentElement = this.hot.rootDocument.documentElement;
    const scrollbarWidth = getScrollbarWidth(this.hot.rootDocument);
    const verticalScrollbarWidth = hasVerticalScrollbar(this.hot.rootWindow) ? scrollbarWidth : 0;
    const horizontalScrollbarWidth = hasHorizontalScrollbar(this.hot.rootWindow) ? scrollbarWidth : 0;
    const mergedBorderCompensation = metaColspan > 1 ? 1 : 0;
    let x = left + rootWindow.scrollX + lastColWidth - mergedBorderCompensation;
    let y = top + rootWindow.scrollY + lastRowHeight;

    if (this.hot.isRtl()) {
      x -= (editorWidth + lastColWidth);
    }

    // flip to the right or left the comments editor position when it goes out of browser viewport
    if (this.hot.isLtr() && left + cellWidth + editorWidth > innerWidth - verticalScrollbarWidth) {
      x = left + rootWindow.scrollX - editorWidth - 1;

    } else if (this.hot.isRtl() && x < -(documentElement.scrollWidth - documentElement.clientWidth)) {
      x = left + rootWindow.scrollX + lastColWidth + 1;
    }

    if (top + editorHeight > innerHeight - horizontalScrollbarWidth) {
      y -= (editorHeight - cellHeight + 1);
    }

    this.#editor.setPosition(x, y);
    this.#editor.setReadOnlyState(!!this.getCommentMeta(visualRow, visualColumn, META_READONLY));
    this.#editor.observeSize();
  }

  /**
   * Focuses the comments editor element.
   */
  focusEditor(): void {
    this.#editor.focus();
  }

  /**
   * Sets or update the comment-related cell meta.
   *
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   * @param {object} metaObject Object defining all the comment-related meta information.
   */
  updateCommentMeta(row: number, column: number, metaObject: Record<string, unknown>): void {
    const oldComment = this.hot.getCellMeta<{ [META_COMMENT]?: Record<string, unknown> }>(row, column)[META_COMMENT];
    let newComment;

    if (oldComment) {
      newComment = deepClone(oldComment);
      deepExtend(newComment, metaObject);
    } else {
      newComment = metaObject;
    }

    this.hot.setCellMeta(row, column, META_COMMENT, newComment);
  }

  /**
   * Gets the comment related meta information.
   *
   * @param {number} row Visual row index.
   * @param {number} column Visual column index.
   * @param {string} property Cell meta property.
   * @returns {Mixed}
   */
  getCommentMeta(row: number, column: number, property: typeof META_COMMENT_VALUE): string | undefined;
  getCommentMeta(row: number, column: number, property: typeof META_READONLY): boolean | undefined;
  getCommentMeta(
    row: number, column: number, property: typeof META_STYLE
  ): { width: number; height: number } | undefined;
  getCommentMeta(row: number, column: number, property: string): unknown;
  getCommentMeta(row: number, column: number, property: string): unknown {
    const cellMeta = this.hot.getCellMeta<{ [META_COMMENT]?: CommentMeta }>(row, column);
    const comment = cellMeta[META_COMMENT];

    if (!comment) {
      return undefined;
    }

    return comment[property as keyof CommentMeta];
  }

  /**
   * `mousedown` event callback.
   *
   * @param {Event} event The `mousedown` event.
   */
  #onMouseDown = (event: Event) => {
    if (!this.hot.view || !this.hot.view._wt) {
      return;
    }

    if (!this.#preventEditorAutoSwitch && !this.targetIsCommentTextArea(event)) {
      const eventCell = closest(eventTargetEl(event)!, ['TD']);
      let coordinates = null;

      if (eventCell) {
        coordinates = this.hot.getCoords(eventCell);
      }

      if (!eventCell || ((this.range.from && coordinates) &&
          (this.range.from.row !== coordinates.row || this.range.from.col !== coordinates.col))) {
        this.hide();
      }
    }
  };

  /**
   * Prevent recognizing clicking on the comment editor as clicking outside of table.
   *
   * @param {Event} event The `mousedown` event.
   */
  #onInputElementMouseDown = (event: Event) => {
    event.stopPropagation();
  };

  /**
   * `mouseover` event callback.
   *
   * @param {Event} event The `mouseover` event.
   */
  #onMouseOver = (event: Event) => {
    const { rootDocument } = this.hot;

    const target = eventTargetEl(event)!;

    if (this.#preventEditorAutoSwitch || this.#editor.isFocused() || hasClass(target, 'wtBorder')
        || this.#cellBelowCursor === target || !this.#editor) {
      return;
    }

    this.#cellBelowCursor = rootDocument.elementFromPoint(
      (event as MouseEvent).clientX, (event as MouseEvent).clientY);

    if (this.targetIsCellWithComment(event)) {
      const range = this.hot._createCellRange(this.hot.getCoords(target));

      this.#displaySwitch.show(range);

    } else if (isChildOf(target, rootDocument) && !this.targetIsCommentTextArea(event)) {
      this.#displaySwitch.hide();
    }
  };

  /**
   * `mouseup` event callback.
   */
  #onMouseUp() {
    this.#preventEditorAutoSwitch = false;
  }

  /**
   * The `afterRenderer` hook callback.
   *
   * @param {HTMLTableCellElement} TD The rendered `TD` element.
   * @param {object} cellProperties The rendered cell's property object.
   */
  #onAfterRenderer(TD: HTMLTableCellElement, cellProperties: Record<string, unknown>) {
    const rawComment = cellProperties[META_COMMENT];

    if (isCommentMeta(rawComment) && rawComment[META_COMMENT_VALUE]) {
      const className = cellProperties.commentedCellClassName;

      if (typeof className === 'string') {
        addClass(TD, className);
      }
    }
  }

  /**
   * Hook observer the "blur" event from the comments editor element. The hook clears the
   * editor content and gives back the keyboard shortcuts control by switching to the "grid" context.
   */
  #onEditorBlur() {
    if (this.#preventEditorSaveOnBlur) {
      this.#preventEditorSaveOnBlur = false;

      return;
    }

    this.#commentValueBeforeSave = '';
    this.hot.getShortcutManager().setActiveContextName('grid');
    this.setComment();
  }

  /**
   * Hook observer the "focus" event from the comments editor element. The hook takes the control of
   * the keyboard shortcuts by switching the context to plugins one.
   */
  #onEditorFocus() {
    this.#commentValueBeforeSave = this.getComment();
    this.hot.listen();
    this.hot.getShortcutManager().setActiveContextName(SHORTCUTS_CONTEXT_NAME);
  }

  /**
   * Stops keyboard events from propagating to the grid's shortcut system while the comment
   * textarea is visible. Without this, keys like Ctrl+A trigger grid-level actions (e.g.
   * "select all cells") instead of native textarea behavior. Events matching shortcuts
   * registered in the `plugin:comments` context are allowed through.
   *
   * @param {Event} event The keydown event from the comment textarea.
   */
  #onEditorKeyDown = (event: Event) => {
    if (!this.#editor.isVisible()) {
      return;
    }

    if (!this.hot.getShortcutManager().hasEventShortcut(SHORTCUTS_CONTEXT_NAME, event as KeyboardEvent)) {
      event.stopPropagation();
    }
  };

  /**
   * Saves the comments editor size to the cell meta.
   *
   * @param {number} width The new width of the editor.
   * @param {number} height The new height of the editor.
   */
  #onEditorResize(width: number, height: number) {
    const { row, col } = this.#getRangeCoords();

    this.updateCommentMeta(row, col, {
      [META_STYLE]: { width, height }
    });
  }

  /**
   * Observes the pressed keys and if there is already opened the comment editor prevents open
   * the table editor into the fast edit mode.
   *
   * @param {Event} event The keydown event.
   */
  #onAfterDocumentKeyDown = (event: Event) => {
    if (this.#editor.isFocused()) {
      stopImmediatePropagation(event);
    }
  };

  /**
   * Observes the changes in the scroll position if triggered it hides the comment editor.
   */
  #onAfterScroll = () => {
    if (!this.#preventEditorHiding) {
      this.hide();
    }
  };

  /**
   * Add Comments plugin options to the Context Menu.
   *
   * @private
   * @param {object} options The menu options.
   */
  addToContextMenu(options: Record<string, unknown>) {
    (options.items as Array<PredefinedMenuItemKey | MenuItemConfig>).push(
      { name: SEPARATOR },
      addEditCommentItem(this),
      removeCommentItem(this),
      readOnlyCommentItem(this),
    );
  }

  /**
   * Gets the editors input element.
   *
   * @private
   * @returns {HTMLTextAreaElement}
   */
  getEditorInputElement() {
    return this.#editor.getInputElement();
  }

  /**
   * Gets the coords object from the range object.
   *
   * @returns {CellCoords} The coords object.
   */
  #getRangeCoords() {
    if (this.range instanceof CellRange) {
      return this.range.highlight;
    }

    return this.hot._createCellCoords(this.range.from!.row, this.range.from!.col);
  }

  /**
   * Destroys the plugin instance.
   */
  destroy(): void {
    this.#editor?.destroy();
    this.#displaySwitch?.destroy();

    super.destroy();
  }
}
