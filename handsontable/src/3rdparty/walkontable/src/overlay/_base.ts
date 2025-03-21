import {
  getScrollableElement,
  getTrimmingContainer,
  getScrollbarWidth,
  setAttribute,
} from '../../../../helpers/dom/element';
import { defineGetter } from '../../../../helpers/object';
import { warn } from '../../../../helpers/console';
import {
  CLONE_TYPES,
  CLONE_CLASS_NAMES,
  CLONE_TOP,
  CLONE_INLINE_START,
  CLONE_BOTTOM,
  CLONE_TOP_INLINE_START_CORNER,
  CLONE_BOTTOM_INLINE_START_CORNER
} from './constants';
import Clone from '../core/clone';
import { A11Y_PRESENTATION } from '../../../../helpers/a11y';
import { DomBindings, FacadeGetter, Settings, TableDao } from '../types';
import Walkontable from '../core/core';
import Table from '../table';
import { OverlayBase, OverlayOptions } from './interfaces';

/**
 * Creates an overlay over the original Walkontable instance. The overlay renders the clone of the original Walkontable
 * and (optionally) implements behavior needed for native horizontal and vertical scrolling.
 *
 * @abstract
 * @class Overlay
 * @property {Walkontable} wot The Walkontable instance.
 */
export class Overlay implements OverlayBase {
  /**
   *  The Walkontable settings.
   *
   * @private
   * @type {Settings}
   */
  wtSettings: Settings;

  facadeGetter: FacadeGetter;
  wot: Walkontable;
  domBindings: DomBindings;
  instance: Walkontable;
  type: string;
  mainTableScrollableElement: HTMLElement | Window | null;
  TABLE: HTMLTableElement;
  hider: HTMLElement;
  spreader: HTMLElement;
  holder: HTMLElement | null;
  wtRootElement: HTMLElement;
  trimmingContainer: HTMLElement;
  needFullRender: boolean;
  clone: Table;
  needAdjustColumns: boolean = false;
  needAdjustRows: boolean = false;
  rootDocument: Document;
  rootWindow: Window;

  /**
   * @param {Walkontable} wotInstance The Walkontable instance. @TODO refactoring: check if can be deleted.
   * @param {FacadeGetter} facadeGetter Function which return proper facade.
   * @param {CLONE_TYPES_ENUM} type The overlay type name (clone name).
   * @param {Settings} wtSettings The Walkontable settings.
   * @param {DomBindings} domBindings Dom elements bound to the current instance.
   */
  constructor(wotInstance: Walkontable, facadeGetter: FacadeGetter, type: string, wtSettings: Settings, domBindings: DomBindings) {
    defineGetter(this, 'wot', wotInstance, {
      writable: false,
    });
    this.domBindings = domBindings;
    this.facadeGetter = facadeGetter;
    this.wtSettings = wtSettings;
    this.rootDocument = domBindings.rootDocument;
    this.rootWindow = domBindings.rootWindow;

    const {
      TABLE,
      hider,
      spreader,
      holder,
      wtRootElement,
    } = this.wot.wtTable; // todo ioc

    // legacy support, deprecated in the future
    this.instance = this.wot;

    this.type = type;
    this.mainTableScrollableElement = null;
    this.TABLE = TABLE;
    this.hider = hider;
    this.spreader = spreader;
    this.holder = holder;
    this.wtRootElement = wtRootElement;
    this.trimmingContainer = getTrimmingContainer(this.hider.parentNode as HTMLElement);
    this.needFullRender = this.shouldBeRendered();
    this.clone = this.makeClone();
  }

  /**
   * Checks if the overlay rendering state has changed.
   *
   * @returns {boolean}
   */
  hasRenderingStateChanged(): boolean {
    return this.needFullRender !== this.shouldBeRendered();
  }

  /**
   * Updates internal state with an information about the need of full rendering of the overlay in the next draw cycles.
   *
   * If the state is changed to render the overlay, the `needFullRender` property is set to `true` which means that
   * the overlay will be fully rendered in the current draw cycle. If the state is changed to not render the overlay,
   * the `needFullRender` property is set to `false` which means that the overlay will be fully rendered in the
   * current draw cycle but it will not be rendered in the next draw cycles.
   *
   * @param {'before' | 'after'} drawPhase The phase of the rendering process.
   */
  updateStateOfRendering(drawPhase: 'before' | 'after'): void {
    if (drawPhase === 'before' && this.shouldBeRendered()) {
      this.needFullRender = true;

    } else if (drawPhase === 'after' && !this.shouldBeRendered()) {
      this.needFullRender = false;
    }
  }

  /**
   * Checks if overlay should be fully rendered.
   *
   * @returns {boolean}
   */
  shouldBeRendered(): boolean {
    return true;
  }

  /**
   * Update the trimming container.
   */
  updateTrimmingContainer(): void {
    this.trimmingContainer = getTrimmingContainer(this.hider.parentNode as HTMLElement);
  }

  /**
   * Update the main scrollable element.
   */
  updateMainScrollableElement(): void {
    const { wtTable } = this.wot;
    const { rootWindow } = this.domBindings;

    if (rootWindow.getComputedStyle(wtTable.wtRootElement.parentNode as HTMLElement).getPropertyValue('overflow') === 'hidden') {
      this.mainTableScrollableElement = this.wot.wtTable.holder;
    } else {
      this.mainTableScrollableElement = getScrollableElement(wtTable.TABLE);
    }
  }

  /**
   * Calculates coordinates of the provided element, relative to the root Handsontable element.
   * NOTE: The element needs to be a child of the overlay in order for the method to work correctly.
   *
   * @param {HTMLElement} element The cell element to calculate the position for.
   * @param {number} rowIndex Visual row index.
   * @param {number} columnIndex Visual column index.
   * @returns {{top: number, start: number}|undefined}
   */
  getRelativeCellPosition(element: HTMLElement, rowIndex: number, columnIndex: number): { top: number, start: number } | undefined {
    if (this.clone.holder.contains(element) === false) {
      warn(`The provided element is not a child of the ${this.type} overlay`);

      return undefined;
    }
    const windowScroll = this.mainTableScrollableElement === this.domBindings.rootWindow;
    const fixedColumnStart = columnIndex < this.wtSettings.getSetting('fixedColumnsStart');
    const fixedRowTop = rowIndex < this.wtSettings.getSetting('fixedRowsTop');
    const fixedRowBottom =
      rowIndex >= this.wtSettings.getSetting('totalRows') - this.wtSettings.getSetting('fixedRowsBottom');
    const spreader = this.clone.spreader;

    const spreaderOffset = {
      start: this.getRelativeStartPosition(spreader),
      top: spreader.offsetTop
    };
    const elementOffset = {
      start: this.getRelativeStartPosition(element),
      top: element.offsetTop
    };
    let offsetObject: { start: number, top: number } | undefined;

    if (windowScroll) {
      offsetObject = this.getRelativeCellPositionWithinWindow(
        fixedRowTop, fixedColumnStart, elementOffset, spreaderOffset
      );

    } else {
      offsetObject = this.getRelativeCellPositionWithinHolder(
        fixedRowTop, fixedRowBottom, fixedColumnStart, elementOffset, spreaderOffset
      );
    }

    return offsetObject;
  }

  /**
   * Get inline start value depending of direction.
   *
   * @param {HTMLElement} el Element.
   * @returns {number}
   */
  getRelativeStartPosition(el: HTMLElement): number {
    const offsetParent = el.offsetParent as HTMLElement;
    
    if (!offsetParent) {
      return el.offsetLeft;
    }
    
    return this.isRtl()
      ? offsetParent.offsetWidth - el.offsetLeft - el.offsetWidth
      : el.offsetLeft;
  }

  /**
   * Calculates coordinates of the provided element, relative to the root Handsontable element within a table with window
   * as a scrollable element.
   *
   * @private
   * @param {boolean} onFixedRowTop `true` if the coordinates point to a place within the top fixed rows.
   * @param {boolean} onFixedColumn `true` if the coordinates point to a place within the fixed columns.
   * @param {number} elementOffset Offset position of the cell element.
   * @param {number} spreaderOffset Offset position of the spreader element.
   * @returns {{top: number, left: number}}
   */
  getRelativeCellPositionWithinWindow(
    onFixedRowTop: boolean, 
    onFixedColumn: boolean, 
    elementOffset: { start: number, top: number }, 
    spreaderOffset: { start: number, top: number }
  ): { start: number, top: number } {
    const absoluteRootElementPosition = this.wot.wtTable.wtRootElement.getBoundingClientRect(); // todo refactoring: DEMETER
    let horizontalOffset = 0;
    let verticalOffset = 0;

    if (!onFixedColumn) {
      horizontalOffset = spreaderOffset.start;

    } else {
      let absoluteRootElementStartPosition = absoluteRootElementPosition.left;

      if (this.isRtl()) {
        absoluteRootElementStartPosition = this.domBindings.rootWindow.innerWidth -
          (absoluteRootElementPosition.left + absoluteRootElementPosition.width + getScrollbarWidth());
      }

      horizontalOffset = absoluteRootElementStartPosition <= 0 ? (-1) * absoluteRootElementStartPosition : 0;
    }

    if (onFixedRowTop) {
      const absoluteOverlayPosition = this.clone.TABLE.getBoundingClientRect();

      verticalOffset = absoluteOverlayPosition.top - absoluteRootElementPosition.top;

    } else {
      verticalOffset = spreaderOffset.top;
    }

    return {
      start: elementOffset.start + horizontalOffset,
      top: elementOffset.top + verticalOffset
    };
  }

  /**
   * Calculates coordinates of the provided element, relative to the root Handsontable element within a table with window
   * as a scrollable element.
   *
   * @private
   * @param {boolean} onFixedRowTop `true` if the coordinates point to a place within the top fixed rows.
   * @param {boolean} onFixedRowBottom `true` if the coordinates point to a place within the bottom fixed rows.
   * @param {boolean} onFixedColumn `true` if the coordinates point to a place within the fixed columns.
   * @param {number} elementOffset Offset position of the cell element.
   * @param {number} spreaderOffset Offset position of the spreader element.
   * @returns {{top: number, left: number}}
   */
  getRelativeCellPositionWithinHolder(
    onFixedRowTop: boolean, 
    onFixedRowBottom: boolean, 
    onFixedColumn: boolean, 
    elementOffset: { start: number, top: number }, 
    spreaderOffset: { start: number, top: number }
  ): { start: number, top: number } {
    const tableScrollPosition = {
      horizontal: this.wot.wtOverlays.inlineStartOverlay.getScrollPosition(),
      vertical: this.wot.wtOverlays.topOverlay.getScrollPosition()
    };
    const tableOffset = {
      start: this.wot.wtTable.holder.offsetLeft - (this.isRtl() ? getScrollbarWidth() : 0),
      top: this.wot.wtTable.holder.offsetTop
    };
    let horizontalOffset = 0;
    let verticalOffset = 0;

    if (!onFixedColumn) {
      horizontalOffset = tableOffset.start < 0 ? (-1) * tableOffset.start + spreaderOffset.start : spreaderOffset.start;

      horizontalOffset -= tableScrollPosition.horizontal;

    } else {
      horizontalOffset = this.wot.wtTable.holder.clientLeft + this.wot.wtTable.holder.clientWidth
        - this.wot.wtTable.holder.offsetWidth;

      if (this.isRtl()) {
        horizontalOffset += getScrollbarWidth();
      }
    }

    if (onFixedRowTop) {
      verticalOffset = spreaderOffset.top;

    } else if (onFixedRowBottom) {
      const holderHeight = this.wot.wtTable.holder.offsetHeight;
      const absoluteTableOffsetTop = this.wot.wtTable.TABLE.offsetTop;
      const overlayRootHeight = this.clone.TABLE.offsetHeight;
      const fixedRowsBottom = this.wtSettings.getSetting('fixedRowsBottom');
      const fixedRowsBottomOffset = this.wot.wtSettings.getSetting('totalRows') - fixedRowsBottom;
      const fixedRowBottomSpreadOffset = this.wot.wtTable.getRowHeight(fixedRowsBottomOffset) * fixedRowsBottom -
       (this.wot.wtViewport.getRowsVisibleCalculator().sum - this.wot.wtTable.getRowHeight(fixedRowsBottomOffset));

      verticalOffset = holderHeight - absoluteTableOffsetTop - fixedRowBottomSpreadOffset - overlayRootHeight;

    } else {
      verticalOffset = tableOffset.top;
      verticalOffset -= tableScrollPosition.vertical;
    }

    return {
      start: elementOffset.start + horizontalOffset,
      top: elementOffset.top + verticalOffset
    };
  }

  /**
   * Make a clone of table for overlay.
   *
   * @returns {Table}
   */
  makeClone(): Table {
    const { rootDocument } = this.domBindings;
    let clone = rootDocument.createElement('div');
    let clonedTable = rootDocument.createElement('table');
    let tableParent = null;

    const sourceBase = this.wtSettings.getSettings();
    let cloneBase = sourceBase;
    let cloneName = '';
    
    if (this.type === CLONE_INLINE_START) {
      cloneName = CLONE_CLASS_NAMES.get(CLONE_INLINE_START) || '';
    } else if (this.type === CLONE_TOP) {
      cloneName = CLONE_CLASS_NAMES.get(CLONE_TOP) || '';
    } else if (this.type === CLONE_BOTTOM) {
      cloneName = CLONE_CLASS_NAMES.get(CLONE_BOTTOM) || '';
    } else if (this.type === CLONE_TOP_INLINE_START_CORNER) {
      cloneName = CLONE_CLASS_NAMES.get(CLONE_TOP_INLINE_START_CORNER) || '';
    } else if (this.type === CLONE_BOTTOM_INLINE_START_CORNER) {
      cloneName = CLONE_CLASS_NAMES.get(CLONE_BOTTOM_INLINE_START_CORNER) || '';
    }

    if (cloneName) {
      clone.className = cloneName;
    }

    tableParent = this.wot.wtTable.wtRootElement.parentNode;
    clone.appendChild(clonedTable);

    if (this.type === CLONE_INLINE_START || this.type === CLONE_TOP_INLINE_START_CORNER ||
      this.type === CLONE_BOTTOM_INLINE_START_CORNER) {
      clone.style.insetInlineStart = '0';
    }

    if (this.type === CLONE_TOP || this.type === CLONE_TOP_INLINE_START_CORNER) {
      clone.style.top = '0';
    }

    if (this.type === CLONE_BOTTOM || this.type === CLONE_BOTTOM_INLINE_START_CORNER) {
      clone.style.bottom = '0';
    }

    this.wtRootElement.appendChild(clone);

    const preventOverflow = this.wtSettings.getSetting('preventOverflow');

    if (preventOverflow === true ||
      (preventOverflow === 'horizontal' && this.type === CLONE_INLINE_START) ||
      (preventOverflow === 'vertical' && this.type === CLONE_TOP)) {
      clone.style.overflow = 'hidden';
    }

    setAttribute(clonedTable, 'role', A11Y_PRESENTATION);

    return this.createTable(sourceBase, cloneBase, clonedTable);
  }

  /**
   * Create table for overlay.
   *
   * @param {object} sourceBase The base of the source table.
   * @param {object} cloneBase The base of the cloned table.
   * @param {HTMLTableElement} clonedTable The cloned table.
   * @returns {Table}
   */
  createTable(sourceBase: object, cloneBase: object, clonedTable: HTMLTableElement): Table {
    const tableOptions = {
      TABLE: clonedTable,
      wtRootElement: this.wtRootElement,
      wtSpreader: this.wot.wtTable.spreader,
    } as TableDao;

    let cloneTable = new Table(
      tableOptions,
      this.facadeGetter,
      this.domBindings,
      cloneBase,
      this.type,
    );

    if ((sourceBase as any).debug) {
      (cloneBase as any).debug = (sourceBase as any).debug;
    }

    return cloneTable;
  }

  /**
   * Refresh/Redraw overlay.
   *
   * @param {boolean} [fastDraw=false] When `true`, try to refresh only the positions of borders without rerendering
   *                                   the data. It will only work if Table.draw() does not force
   *                                   rendering anyway.
   */
  refresh(fastDraw: boolean = false): void {
    // When hot settings are changed we allow to refresh overlay once before blocking
    const nextCycleRenderFlag = this.shouldBeRendered();

    if (this.clone && (this.needFullRender || nextCycleRenderFlag)) {
      this.clone.draw(fastDraw);
    }
    this.needFullRender = nextCycleRenderFlag;
  }

  /**
   * Reset overlay styles to initial values.
   */
  reset(): void {
    if (!this.clone) {
      return;
    }

    const holder = this.clone.holder;
    const hider = this.clone.hider;
    
    if (!holder || !hider) {
      return;
    }
    
    const holderStyle = holder.style;
    const hiderStyle = hider.style;
    const rootStyle = holder.parentNode ? (holder.parentNode as HTMLElement).style : null;

    if (!rootStyle) {
      return;
    }

    holderStyle.overflowY = '';
    holderStyle.overflowX = '';
    rootStyle.position = '';
    rootStyle.insetInlineStart = '';
    rootStyle.top = '';
    rootStyle.width = '';
    rootStyle.height = '';
    rootStyle.overflow = '';
    hiderStyle.position = '';
    hiderStyle.insetInlineStart = '';
    hiderStyle.top = '';
    hiderStyle.insetInlineEnd = '';
    hiderStyle.bottom = '';
  }

  /**
   * Determines if the Walkontable is positioned within the RTL context.
   *
   * @returns {boolean}
   */
  isRtl(): boolean {
    return this.wtSettings.getSetting('rtlMode');
  }

  /**
   * Destroy overlay instance.
   */
  destroy(): void {
    if (this.clone) {
      if (this.clone.holder && this.clone.holder.parentNode) {
        this.clone.holder.parentNode.removeChild(this.clone.holder);
      }
      // Assuming destroy method exists on clone
      if (typeof (this.clone as any).destroy === 'function') {
        (this.clone as any).destroy();
      }
    }
  }

  /**
   * Set need adjust.
   *
   * @param {string} [type='all'] Adjust type.
   */
  setNeedAdjust(type: string = 'all'): void {
    if (type === 'all') {
      this.needAdjustColumns = true;
      this.needAdjustRows = true;
    } else if (type === 'rows') {
      this.needAdjustRows = true;
    } else if (type === 'columns') {
      this.needAdjustColumns = true;
    }
  }

  /**
   * Check if adjust is needed.
   *
   * @param {string} [type='all'] Adjust type.
   * @returns {boolean}
   */
  isNeedAdjust(type: string = 'all'): boolean {
    if (type === 'all') {
      return this.needAdjustColumns || this.needAdjustRows;
    } else if (type === 'rows') {
      return this.needAdjustRows;
    } else if (type === 'columns') {
      return this.needAdjustColumns;
    }

    return false;
  }

  /**
   * Adjusted overlay.
   *
   * @param {string} [type='all'] Adjust type.
   */
  clearNeedAdjust(type: string = 'all'): void {
    if (type === 'all') {
      this.needAdjustColumns = false;
      this.needAdjustRows = false;
    } else if (type === 'rows') {
      this.needAdjustRows = false;
    } else if (type === 'columns') {
      this.needAdjustColumns = false;
    }
  }

  /**
   * Get adjusted height.
   *
   * @returns {number}
   */
  getAdjustedElementHeight(): number {
    return this.adjustElementsSize() ? this.getHeight() : 0;
  }

  /**
   * Get adjusted width.
   *
   * @returns {number}
   */
  getAdjustedElementWidth(): number {
    return this.adjustElementsSize() ? this.getWidth() : 0;
  }

  /**
   * Adjust elements size.
   *
   * @returns {boolean}
   */
  adjustElementsSize(): boolean {
    return false;
  }

  /**
   * Get height.
   *
   * @returns {number}
   */
  getHeight(): number {
    return 0;
  }

  /**
   * Get width.
   *
   * @returns {number}
   */
  getWidth(): number {
    return 0;
  }

  /**
   * Check if overlay should be fully rendered.
   *
   * @returns {boolean}
   */
  isVisible(): boolean {
    return true;
  }

  /**
   * Gets the parent overlay of the provided overlay.
   * If the overlay has no parent the method returns null.
   *
   * @returns {Overlay|null}
   */
  getParentOverlay(): Overlay | null {
    let parent = null;

    if (this.type === CLONE_TYPES.TOP_INLINE_START_CORNER
        || this.type === CLONE_TYPES.BOTTOM_INLINE_START_CORNER) {
      if (this.type === CLONE_TYPES.TOP_INLINE_START_CORNER) {
        parent = CLONE_TYPES.TOP;
      } else if (this.type === CLONE_TYPES.BOTTOM_INLINE_START_CORNER) {
        parent = CLONE_TYPES.BOTTOM;
      }

      parent = this.wot.wtOverlays.getOverlay(parent);
    }

    return parent;
  }

  /**
   * Resets the overlay styles to the initial values.
   */
  resetFixedPosition(): void {}

  /**
   * Update the trimming container.
   */
  getScrollPosition(): number {
    return 0;
  }

  /**
   * Update the trimming container.
   */
  getTableParentOffset(): number {
    return 0;
  }

  /**
   * Adjust header/row heights accordingly to the table state.
   */
  adjustHeaderHeights(): void {}

  /**
   * Get the main scrollable element.
   *
   * @returns {HTMLElement} The scrollable element.
   */
  getScrollableElement(): HTMLElement {
    return this.clone.holder as HTMLElement;
  }

  /**
   * Scrolls to the provided coordinates.
   */
  scrollTo(): void {}

  /**
   * Trigger onScroll hook callback.
   */
  onScroll(): void {}

  /**
   * Apply temporary unique class name for not duplicating the overlay's DOM elements
   * while the Walkontable re-initialization process is performed (different renderers
   * would generate different clones/overlays).
   *
   * @param {number} rendererIndex The renderer index.
   */
  applyTemporaryIdClass(rendererIndex: number): void {
    this.clone.holder.parentNode.classList.add(`${this.type}-temp-${rendererIndex}`);
  }

  /**
   * Remove the temporary unique class name from the clone.
   *
   * @param {number} rendererIndex The renderer index.
   */
  removeTemporaryIdClass(rendererIndex: number): void {
    this.clone.holder.parentNode.classList.remove(`${this.type}-temp-${rendererIndex}`);
  }
}
