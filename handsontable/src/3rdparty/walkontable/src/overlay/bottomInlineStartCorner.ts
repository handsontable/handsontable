import type { DataAccessObject, DomBindings, WalkontableInstance } from '../types';
import type Settings from '../settings';
import {
  getScrollbarWidth,
  outerHeight,
  outerWidth,
  resetCssTransform
} from '../../../../helpers/dom/element';
import BottomInlineStartCornerOverlayTable from '../table/bottomInlineStartCorner';
import { Overlay } from './_base';
import {
  CLONE_BOTTOM_INLINE_START_CORNER,
} from './constants';

/**
 * @class BottomInlineStartCornerOverlay
 */
export class BottomInlineStartCornerOverlay extends Overlay {
  declare bottomOverlay: Overlay;
  declare inlineStartOverlay: Overlay;

  /**
   * @param {Walkontable} wotInstance The Walkontable instance. @TODO refactoring: check if can be deleted.
   * @param {FacadeGetter} facadeGetter Function which return proper facade.
   * @param {Settings} wtSettings The Walkontable settings.
   * @param {DomBindings} domBindings Dom elements bound to the current instance.
   * @param {BottomOverlay} bottomOverlay The instance of the Top overlay.
   * @param {InlineStartOverlay} inlineStartOverlay The instance of the InlineStart overlay.
   */
  constructor(
    wotInstance: WalkontableInstance, facadeGetter: Function, wtSettings: Settings,
    domBindings: DomBindings, bottomOverlay: Overlay, inlineStartOverlay: Overlay) {
    super(wotInstance, facadeGetter, CLONE_BOTTOM_INLINE_START_CORNER, wtSettings, domBindings);
    this.bottomOverlay = bottomOverlay;
    this.inlineStartOverlay = inlineStartOverlay;
  }

  /**
   * Factory method to create a subclass of `Table` that is relevant to this overlay.
   *
   * @see Table#constructor
   * @param {...*} args Parameters that will be forwarded to the `Table` constructor.
   * @returns {BottomInlineStartCornerOverlayTable}
   */
  createTable(...args: [DataAccessObject, Function, DomBindings, Settings]) {
    return new BottomInlineStartCornerOverlayTable(...args);
  }

  /**
   * Checks if overlay should be fully rendered.
   *
   * @returns {boolean}
   */
  shouldBeRendered(): boolean {
    return (this.wtSettings.getSetting('shouldRenderBottomOverlay') as boolean)
      && (this.wtSettings.getSetting('shouldRenderInlineStartOverlay') as boolean);
  }

  /**
   * Updates the corner overlay position.
   *
   * @returns {boolean}
   */
  resetFixedPosition() {
    const { wot } = this;

    this.updateTrimmingContainer();

    if (!(wot.wtTable.holder.parentNode as HTMLElement)) {
      // removed from DOM
      return false;
    }

    const overlayRoot = this.clone.wtTable.holder.parentNode as HTMLElement;

    overlayRoot.style.top = '';

    if (this.trimmingContainer === this.domBindings.rootWindow) {
      const inlineStartOffset = this.inlineStartOverlay.getOverlayOffset();
      const masterTableRect = this.wot.wtTable.TABLE.getBoundingClientRect();
      const masterHolderRect = this.wot.wtTable.holder.getBoundingClientRect();
      const masterTableOverflow = Math.max(0, masterTableRect.bottom - masterHolderRect.bottom);
      const bottom = this.bottomOverlay.getOverlayOffset() - masterTableOverflow;

      overlayRoot.style[this.isRtl() ? 'right' : 'left'] = `${inlineStartOffset}px`;
      overlayRoot.style.bottom = `${bottom}px`;

    } else {
      resetCssTransform(overlayRoot);
      this.repositionOverlay();
    }

    let tableHeight = outerHeight(this.clone.wtTable.TABLE);
    const tableWidth = outerWidth(this.clone.wtTable.TABLE);

    if (!this.wot.wtTable.hasDefinedSize()) {
      tableHeight = 0;
    }

    overlayRoot.style.height = `${tableHeight}px`;
    overlayRoot.style.width = `${tableWidth}px`;

    return true;
  }

  setScrollPosition(_pos: number) { return false; }
  getScrollPosition() { return 0; }
  getTableParentOffset() { return 0; }
  getOverlayOffset() { return 0; }
  onScroll() {}
  sumCellSizes(_from: number, _to: number) { return 0; }
  adjustElementsSize() { // intentionally empty
  }
  applyToDOM() { // intentionally empty
  }
  scrollTo(_sourceIndex: number, _snapToEdge: boolean) { return false; }

  /**
   * Reposition the overlay.
   */
  repositionOverlay() {
    const { wtTable, wtViewport } = this.wot;
    const { rootDocument } = this.domBindings;
    const cloneRoot = this.clone.wtTable.holder.parentNode as HTMLElement;
    let bottomOffset = 0;

    if (!wtViewport.hasVerticalScroll()) {
      bottomOffset += (wtViewport.getWorkspaceHeight() - wtTable.getTotalHeight());
    }

    if (wtViewport.hasVerticalScroll() && wtViewport.hasHorizontalScroll()) {
      bottomOffset += getScrollbarWidth(rootDocument);
    }

    cloneRoot.style.bottom = `${bottomOffset}px`;
  }
}
