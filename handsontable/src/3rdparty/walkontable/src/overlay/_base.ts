import type { DomBindings, WalkontableInstance } from '../types';
import type Settings from '../settings';
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
} from './constants';
import Clone from '../core/clone';
import { A11Y_PRESENTATION } from '../../../../helpers/a11y';
import { throwWithCause } from '../../../../helpers/errors';

/**
 * Creates an overlay over the original Walkontable instance. The overlay renders the clone of the original Walkontable
 * and (optionally) implements behavior needed for native horizontal and vertical scrolling.
 *
 * @abstract
 * @class Overlay
 * @property {Walkontable} wot The Walkontable instance.
 */
export abstract class Overlay {
  /**
   *  The Walkontable settings.
   *
   * @private
   * @type {Settings}
   */
  wtSettings!: Settings;

  declare wot: WalkontableInstance;
  declare domBindings: DomBindings;
  declare facadeGetter: Function;
  declare instance: WalkontableInstance;
  declare type: string;
  declare mainTableScrollableElement: HTMLElement | Window; // assigned in makeClone() called from constructor
  declare TABLE: HTMLTableElement;
  declare hider: HTMLElement;
  declare spreader: HTMLElement;
  declare holder: HTMLElement | Window;
  declare wtRootElement: HTMLElement;
  declare trimmingContainer: HTMLElement | Window;
  declare needFullRender: boolean;
  declare clone: WalkontableInstance | null;

  /**
   * @param {Walkontable} wotInstance The Walkontable instance. @TODO refactoring: check if can be deleted.
   * @param {FacadeGetter} facadeGetter Function which return proper facade.
   * @param {CLONE_TYPES_ENUM} type The overlay type name (clone name).
   * @param {Settings} wtSettings The Walkontable settings.
   * @param {DomBindings} domBindings Dom elements bound to the current instance.
   */
  constructor(
    wotInstance: WalkontableInstance, facadeGetter: Function, type: string,
    wtSettings: Settings, domBindings: DomBindings) {
    defineGetter(this, 'wot', wotInstance, {
      writable: false,
    });
    this.domBindings = domBindings;
    this.facadeGetter = facadeGetter;
    this.wtSettings = wtSettings;

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
    this.TABLE = TABLE;
    this.hider = hider;
    this.spreader = spreader;
    this.holder = holder;
    this.wtRootElement = wtRootElement;
    this.trimmingContainer = getTrimmingContainer((this.hider.parentNode?.parentNode ?? this.hider) as HTMLElement);
    this.needFullRender = this.shouldBeRendered();
    this.clone = this.makeClone();
  }

  abstract resetFixedPosition(): boolean;
  abstract createTable(...args: unknown[]): unknown;
  abstract setScrollPosition(pos: number): boolean;
  abstract getScrollPosition(): number;
  abstract getTableParentOffset(): number;
  abstract getOverlayOffset(): number;
  abstract onScroll(): void;
  abstract sumCellSizes(from: number, to: number): number;
  abstract adjustElementsSize(): void;
  abstract applyToDOM(): void;
  abstract scrollTo(sourceIndex: number, snapToEdge: boolean): boolean;

  /**
   * Checks if the overlay rendering state has changed.
   *
   * @returns {boolean}
   */
  hasRenderingStateChanged() {
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
  updateStateOfRendering(drawPhase: 'before' | 'after') {
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
  updateTrimmingContainer() {
    this.trimmingContainer = getTrimmingContainer((this.hider.parentNode?.parentNode ?? this.hider) as HTMLElement);
  }

  /**
   * Update the main scrollable element.
   */
  updateMainScrollableElement() {
    const { wtTable } = this.wot;
    const { rootWindow } = this.domBindings;
    const computedOverflow = rootWindow.getComputedStyle(wtTable.wtRootElement.parentNode as Element)
      .getPropertyValue('overflow');

    const preventOverflow = this.wtSettings.getSetting('preventOverflow');

    if (computedOverflow === 'hidden' || computedOverflow === 'clip') {
      this.mainTableScrollableElement = this.wot.wtTable.holder;

    } else if (
      preventOverflow === 'horizontal' && this.type === CLONE_TOP ||
      preventOverflow === 'vertical' && this.type === CLONE_INLINE_START
    ) {
      this.mainTableScrollableElement = rootWindow;

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
  getRelativeCellPosition(element: HTMLElement, rowIndex: number, columnIndex: number) {
    if (!this.clone || this.clone.wtTable.holder.contains(element) === false) {
      warn(`The provided element is not a child of the ${this.type} overlay`);

      return;
    }
    const windowScroll = this.mainTableScrollableElement === this.domBindings.rootWindow;
    const fixedColumnStart = columnIndex < this.wtSettings.getSetting<number>('fixedColumnsStart');
    const fixedRowTop = rowIndex < this.wtSettings.getSetting<number>('fixedRowsTop');
    const fixedRowBottom = rowIndex >=
      this.wtSettings.getSetting<number>('totalRows') - this.wtSettings.getSetting<number>('fixedRowsBottom');
    const spreader = this.clone.wtTable.spreader;

    const spreaderOffset = {
      start: this.getRelativeStartPosition(spreader),
      top: spreader.offsetTop
    };
    const elementOffset = {
      start: this.getRelativeStartPosition(element),
      top: element.offsetTop
    };
    let offsetObject = null;

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
  getRelativeStartPosition(el: HTMLElement) {
    return this.isRtl()
      ? (el.offsetParent as HTMLElement).offsetWidth - el.offsetLeft - el.offsetWidth
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
    onFixedRowTop: boolean, onFixedColumn: boolean,
    elementOffset: { start: number; top: number }, spreaderOffset: { start: number; top: number }) {
    const absoluteRootElementPosition = this.wot.wtTable.wtRootElement.getBoundingClientRect(); // todo refactoring: DEMETER
    // `preventOverflow` can force this overlay onto the window (see `makeClone()`) while the
    // master still scrolls its holder. `wtRootElement` does not move with that scroll, so
    // subtract the master scroll from spreader-based offsets to align with the visible cell (#10403).
    const masterScrollsHolder = this.wot.wtOverlays.scrollableElement !== this.domBindings.rootWindow;
    const tableScrollPosition = {
      horizontal: masterScrollsHolder ? this.wot.wtOverlays.inlineStartOverlay.getScrollPosition() : 0,
      vertical: masterScrollsHolder ? this.wot.wtOverlays.topOverlay.getScrollPosition() : 0,
    };
    let horizontalOffset = 0;
    let verticalOffset = 0;

    if (!onFixedColumn) {
      horizontalOffset = spreaderOffset.start - tableScrollPosition.horizontal;

    } else {
      let absoluteRootElementStartPosition = absoluteRootElementPosition.left;

      if (this.isRtl()) {
        absoluteRootElementStartPosition = this.domBindings.rootWindow.innerWidth -
          (absoluteRootElementPosition.left + absoluteRootElementPosition.width + getScrollbarWidth());
      }

      horizontalOffset = absoluteRootElementStartPosition <= 0 ? (-1) * absoluteRootElementStartPosition : 0;
    }

    if (onFixedRowTop && this.clone) {
      const absoluteOverlayPosition = this.clone.wtTable.TABLE.getBoundingClientRect();

      verticalOffset = absoluteOverlayPosition.top - absoluteRootElementPosition.top;

    } else {
      verticalOffset = spreaderOffset.top - tableScrollPosition.vertical;
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
    onFixedRowTop: boolean, onFixedRowBottom: boolean, onFixedColumn: boolean,
    elementOffset: { start: number; top: number }, spreaderOffset: { start: number; top: number }) {
    const tableScrollPosition = {
      horizontal: this.wot.wtOverlays.inlineStartOverlay.getScrollPosition(),
      vertical: this.wot.wtOverlays.topOverlay.getScrollPosition()
    };
    let horizontalOffset = 0;
    let verticalOffset = 0;

    if (!onFixedColumn) {
      horizontalOffset = tableScrollPosition.horizontal - spreaderOffset.start;
    }

    if (onFixedRowBottom && this.clone) {
      const absoluteRootElementPosition = this.wot.wtTable.wtRootElement.getBoundingClientRect();// todo refactoring: DEMETER
      const absoluteOverlayPosition = this.clone.wtTable.TABLE.getBoundingClientRect();// todo refactoring: DEMETER

      verticalOffset = (absoluteOverlayPosition.top * (-1)) + absoluteRootElementPosition.top;

    } else if (!onFixedRowTop) {
      verticalOffset = tableScrollPosition.vertical - spreaderOffset.top;
    }

    return {
      start: elementOffset.start - horizontalOffset,
      top: elementOffset.top - verticalOffset,
    };
  }

  /**
   * Make a clone of table for overlay.
   *
   * @returns {Clone}
   */
  makeClone() {
    if (CLONE_TYPES.indexOf(this.type) === -1) {
      throwWithCause(`Clone type "${this.type}" is not supported.`);
    }
    const {
      wtTable,
      wtSettings
    } = this.wot;
    const { rootDocument, rootWindow } = this.domBindings;
    const clone = rootDocument.createElement('div');
    const clonedTable = rootDocument.createElement('table');
    const tableParent = wtTable.wtRootElement.parentNode;

    if (!tableParent) {
      throwWithCause('The Walkontable root element has no parent node.');
    }

    clone.className = `${CLONE_CLASS_NAMES.get(this.type)} handsontable`;
    clone.setAttribute('dir', this.isRtl() ? 'rtl' : 'ltr');
    clone.style.position = 'absolute';
    clone.style.top = '0';
    clone.style.overflow = 'visible';

    if (this.isRtl()) {
      clone.style.right = '0';
    } else {
      clone.style.left = '0';
    }

    if (wtSettings.getSetting('ariaTags')) {
      setAttribute(clone, [
        A11Y_PRESENTATION()
      ]);
    }

    clonedTable.className = wtTable.TABLE.className;

    // Clone the main table's `role` attribute to the cloned table.
    const mainTableRole = wtTable.TABLE.getAttribute('role');

    if (mainTableRole) {
      clonedTable.setAttribute('role', mainTableRole);
    }

    clone.appendChild(clonedTable);

    tableParent.appendChild(clone);

    const preventOverflow = this.wtSettings.getSetting('preventOverflow');
    const computedOverflow = rootWindow.getComputedStyle(tableParent as Element)
      .getPropertyValue('overflow');

    if (computedOverflow === 'hidden' || computedOverflow === 'clip') {
      this.mainTableScrollableElement = wtTable.holder;

    } else if (
      preventOverflow === 'horizontal' && this.type === CLONE_TOP ||
      preventOverflow === 'vertical' && this.type === CLONE_INLINE_START
    ) {
      this.mainTableScrollableElement = rootWindow;

    } else {
      this.mainTableScrollableElement = getScrollableElement(wtTable.TABLE);
    }

    // Create a new instance of the Walkontable class
    return new Clone(clonedTable, this.wtSettings, { // todo ioc factory
      source: this.wot,
      overlay: this,
      viewport: this.wot.wtViewport, // todo ioc , or factor func if used only here
      event: this.wot.wtEvent, // todo ioc , or factory func if used only here
      selectionManager: this.wot.selectionManager, // todo ioc , or factory func if used only here
    }) as unknown as WalkontableInstance;
  }

  /**
   * Refresh/Redraw overlay.
   *
   * @param {boolean} [fastDraw=false] When `true`, try to refresh only the positions of borders without rerendering
   *                                   the data. It will only work if Table.draw() does not force
   *                                   rendering anyway.
   */
  refresh(fastDraw = false) {
    if (this.needFullRender && this.clone) {
      const cloneSource = this.clone.cloneSource;

      cloneSource.activeOverlayName = this.clone.wtTable.name;
      this.clone.draw(fastDraw);
      cloneSource.activeOverlayName = 'master';
    }
  }

  /**
   * Reset overlay styles to initial values.
   */
  reset() {
    if (!this.clone) {
      return;
    }

    const holder = this.clone.wtTable.holder; // todo refactoring: DEMETER
    const hider = this.clone.wtTable.hider; // todo refactoring: DEMETER
    const holderStyle = holder.style;
    const hiderStyle = hider.style;
    const rootStyle = (holder.parentNode as HTMLElement).style;

    [holderStyle, hiderStyle, rootStyle].forEach((style) => {
      style.width = '';
      style.height = '';
    });
  }

  /**
   * Determine if Walkontable is running in RTL mode.
   *
   * @returns {boolean}
   */
  isRtl() {
    return this.wtSettings.getSetting<boolean>('rtlMode');
  }

  /**
   * Destroy overlay instance.
   */
  destroy() {
    this.clone?.eventManager.destroy(); // todo check if it is good place for that operation
  }
}
