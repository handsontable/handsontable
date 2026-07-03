import type { WalkontableInstance } from '../types';
import type { EngineContext } from '../wire';
import type Settings from '../settings';
import {
  getScrollableElement,
  getTrimmingContainer,
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
 * Assembles the dependency set shared by every overlay (and its corner subclasses) from the engine
 * composition context. Overlays still hold `wot` (the master instance) — the clone they build is a
 * second Walkontable instance that also reaches back to the master, so `wot` is a structural handle,
 * not a reach-through to be thunked away in this pass. The DOM roots are folded in flat.
 *
 * @param {EngineContext} ctx The engine composition context.
 * @returns {object} The overlay dependency set.
 */
export function createOverlayDeps(ctx: EngineContext) {
  return {
    wot: ctx.wot,
    facadeGetter: ctx.getFacade(),
    wtSettings: ctx.wtSettings,
    rootDocument: ctx.rootDocument,
    rootWindow: ctx.rootWindow,
    geometryReader: ctx.geometryReader,
    // The master table (its DOM elements are mirrored onto the overlay at construction).
    getWtTable: ctx.getWtTable,
    // Resolved when the overlay builds its clone (see `createCloneDeps`). The clone shares the
    // master's viewport and selection manager, and takes the master's event as its Event parent.
    getWtViewport: ctx.getWtViewport,
    getWtEvent: ctx.getWtEvent,
    getSelectionManager: ctx.getSelectionManager,
  };
}

/**
 * The overlay dependencies, inferred from `createOverlayDeps`.
 */
export type OverlayDeps = ReturnType<typeof createOverlayDeps>;

/**
 * Assembles the dependency set for the clone (a second Walkontable instance the overlay renders).
 * Replaces the former inline `this.wot.wtViewport` / `this.wot.wtEvent` / `this.wot.selectionManager`
 * reach-throughs: the shared master collaborators now come through the overlay's declared deps, and
 * the clone's back-reference to the master (`source`) and its owning `overlay` are passed explicitly.
 *
 * @param {OverlayDeps} deps The owning overlay's dependency set.
 * @param {Overlay} overlay The overlay that renders the clone.
 * @returns {object} The clone dependency set.
 */
export function createCloneDeps(deps: OverlayDeps, overlay: Overlay) {
  return {
    source: deps.wot,
    overlay,
    viewport: deps.getWtViewport(),
    event: deps.getWtEvent(),
    selectionManager: deps.getSelectionManager(),
  };
}

/**
 * The clone dependencies, inferred from `createCloneDeps`.
 */
export type CloneDeps = ReturnType<typeof createCloneDeps>;

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

  /**
   * The Walkontable instance.
   *
   * @type {WalkontableInstance}
   */
  declare wot: WalkontableInstance;
  /**
   * The overlay module dependencies (holds the DOM roots and the master instance handle).
   *
   * @type {OverlayDeps}
   */
  #deps: OverlayDeps;

  /**
   * Read-only access to the dependencies, for the overlay subclasses (top/bottom/inline-start and
   * the corner overlays), which are defined outside this class and so cannot reach the private
   * `#deps`.
   *
   * @returns {OverlayDeps}
   */
  get deps(): OverlayDeps {
    return this.#deps;
  }
  /**
   * Function that returns the proper facade.
   *
   * @type {Function}
   */
  declare facadeGetter: Function;
  /**
   * The overlay type name.
   *
   * @type {string}
   */
  declare type: string;
  /**
   * The main table scrollable element.
   *
   * @type {HTMLElement | Window}
   */
  declare mainTableScrollableElement: HTMLElement | Window; // assigned in makeClone() called from constructor
  /**
   * The table element.
   *
   * @type {HTMLTableElement}
   */
  declare TABLE: HTMLTableElement;
  /**
   * The hider element.
   *
   * @type {HTMLElement}
   */
  declare hider: HTMLElement;
  /**
   * The spreader element.
   *
   * @type {HTMLElement}
   */
  declare spreader: HTMLElement;
  /**
   * The holder element.
   *
   * @type {HTMLElement | Window}
   */
  declare holder: HTMLElement | Window;
  /**
   * The Walkontable root element.
   *
   * @type {HTMLElement}
   */
  declare wtRootElement: HTMLElement;
  /**
   * The trimming container.
   *
   * @type {HTMLElement | Window}
   */
  declare trimmingContainer: HTMLElement | Window;
  /**
   * Flag indicating if full render is needed.
   *
   * @type {boolean}
   */
  declare needFullRender: boolean;
  /**
   * The cloned Walkontable instance.
   *
   * @type {WalkontableInstance | null}
   */
  declare clone: WalkontableInstance | null;

  /**
   * @param {OverlayDeps} deps The overlay module dependencies.
   * @param {CLONE_TYPES_ENUM} type The overlay type name (clone name).
   */
  constructor(deps: OverlayDeps, type: string) {
    defineGetter(this, 'wot', deps.wot, {
      writable: false,
    });
    this.#deps = deps;
    this.facadeGetter = deps.facadeGetter;
    this.wtSettings = deps.wtSettings;

    const {
      TABLE,
      hider,
      spreader,
      holder,
      wtRootElement,
    } = deps.getWtTable();

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
    const { rootWindow } = this.#deps;
    const computedOverflow = this.#deps.geometryReader
      .getComputedStyle(wtTable.wtRootElement.parentNode as Element)
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
    const windowScroll = this.mainTableScrollableElement === this.#deps.rootWindow;
    const fixedColumnStart = columnIndex < this.wtSettings.getSetting<number>('fixedColumnsStart');
    const fixedRowTop = rowIndex < this.wtSettings.getSetting<number>('fixedRowsTop');
    const fixedRowBottom = rowIndex >=
      this.wtSettings.getSetting<number>('totalRows') - this.wtSettings.getSetting<number>('fixedRowsBottom');
    const spreader = this.clone.wtTable.spreader;

    const { geometryReader } = this.#deps;
    const spreaderOffset = {
      start: this.getRelativeStartPosition(spreader),
      top: geometryReader.offsetTop(spreader)
    };
    const elementOffset = {
      start: this.getRelativeStartPosition(element),
      top: geometryReader.offsetTop(element)
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
    const { geometryReader } = this.#deps;

    if (!this.isRtl()) {
      return geometryReader.offsetLeft(el);
    }

    const offsetParentWidth = geometryReader.offsetWidth(geometryReader.offsetParent(el) as HTMLElement);

    return offsetParentWidth - geometryReader.offsetLeft(el) - geometryReader.offsetWidth(el);
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
    const { geometryReader } = this.#deps;
    const absoluteRootElementPosition =
      geometryReader.getBoundingClientRect(this.wot.wtTable.wtRootElement); // todo refactoring: DEMETER
    // `preventOverflow` can force this overlay onto the window (see `makeClone()`) while the
    // master still scrolls its holder. `wtRootElement` does not move with that scroll, so
    // subtract the master scroll from spreader-based offsets to align with the visible cell (#10403).
    const masterScrollsHolder = this.wot.wtOverlays.scrollableElement !== this.#deps.rootWindow;
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
        absoluteRootElementStartPosition = this.#deps.rootWindow.innerWidth -
          (absoluteRootElementPosition.left + absoluteRootElementPosition.width + geometryReader.getScrollbarWidth());
      }

      horizontalOffset = absoluteRootElementStartPosition <= 0 ? (-1) * absoluteRootElementStartPosition : 0;
    }

    if (onFixedRowTop && this.clone) {
      const absoluteOverlayPosition = geometryReader.getBoundingClientRect(this.clone.wtTable.TABLE);

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
      const { geometryReader } = this.#deps;
      const absoluteRootElementPosition =
        geometryReader.getBoundingClientRect(this.wot.wtTable.wtRootElement); // todo refactoring: DEMETER
      const absoluteOverlayPosition =
        geometryReader.getBoundingClientRect(this.clone.wtTable.TABLE); // todo refactoring: DEMETER

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
    const { rootDocument, rootWindow } = this.#deps;
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
    const computedOverflow = this.#deps.geometryReader.getComputedStyle(tableParent as Element)
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
    return new Clone(clonedTable, this.wtSettings, createCloneDeps(this.#deps, this)) as WalkontableInstance;
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
