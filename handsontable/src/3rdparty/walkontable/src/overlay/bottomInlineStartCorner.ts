import {
  getScrollbarWidth,
  outerHeight,
  outerWidth,
  resetCssTransform,
  setOverlayPosition
} from '../../../../helpers/dom/element';
import BottomInlineStartCornerOverlayTable from '../table/bottomInlineStartCorner';
import { Overlay } from './_base';
import {
  CLONE_BOTTOM_INLINE_START_CORNER,
} from './constants';
import { DomBindings, FacadeGetter, Settings, TableDao } from '../types';
import Walkontable from '../core/core';
import { BottomInlineStartCornerOverlayInterface } from './interfaces';
import { BottomOverlay } from './bottom';
import { InlineStartOverlay } from './inlineStart';
import Table from '../table';

/**
 * @class BottomInlineStartCornerOverlay
 */
export class BottomInlineStartCornerOverlay extends Overlay implements BottomInlineStartCornerOverlayInterface {
  /**
   * The instance of the Bottom overlay.
   *
   * @type {BottomOverlay}
   */
  bottomOverlay: BottomOverlay;
  /**
   * The instance of the InlineStart overlay.
   *
   * @type {InlineStartOverlay}
   */
  inlineStartOverlay: InlineStartOverlay;

  /**
   * @param {Walkontable} wotInstance The Walkontable instance. @TODO refactoring: check if can be deleted.
   * @param {FacadeGetter} facadeGetter Function which return proper facade.
   * @param {Settings} wtSettings The Walkontable settings.
   * @param {DomBindings} domBindings Dom elements bound to the current instance.
   * @param {BottomOverlay} bottomOverlay The instance of the Bottom overlay.
   * @param {InlineStartOverlay} inlineStartOverlay The instance of the InlineStart overlay.
   */
  constructor(
    wotInstance: Walkontable, 
    facadeGetter: FacadeGetter, 
    wtSettings: Settings, 
    domBindings: DomBindings, 
    bottomOverlay: BottomOverlay, 
    inlineStartOverlay: InlineStartOverlay
  ) {
    super(wotInstance, facadeGetter, CLONE_BOTTOM_INLINE_START_CORNER, wtSettings, domBindings);
    this.bottomOverlay = bottomOverlay;
    this.inlineStartOverlay = inlineStartOverlay;
  }

  /**
   * Factory method to create a subclass of `Table` that is relevant to this overlay.
   *
   * @see Table#constructor
   * @param {object} sourceBase The base of the source table.
   * @param {object} cloneBase The base of the cloned table.
   * @param {HTMLTableElement} clonedTable The cloned table.
   * @returns {BottomInlineStartCornerOverlayTable}
   */
  createTable(sourceBase: object, cloneBase: object, clonedTable: HTMLTableElement): BottomInlineStartCornerOverlayTable {
    const tableOptions = {
      TABLE: clonedTable,
      wtRootElement: this.wtRootElement,
      wtSpreader: this.wot.wtTable.spreader,
    } as TableDao;

    return new BottomInlineStartCornerOverlayTable(
      tableOptions,
      this.facadeGetter,
      this.domBindings,
      cloneBase,
      this.type
    );
  }

  /**
   * Checks if overlay should be fully rendered.
   *
   * @returns {boolean}
   */
  shouldBeRendered(): boolean {
    return this.wtSettings.getSetting('shouldRenderBottomOverlay')
      && this.wtSettings.getSetting('shouldRenderInlineStartOverlay');
  }

  /**
   * Updates the corner overlay position.
   *
   * @returns {boolean}
   */
  resetFixedPosition(): boolean {
    this.updateTrimmingContainer();

    if (!this.wot.wtTable.holder.parentNode) {
      // removed from DOM
      return false;
    }

    const overlayRoot = this.clone.holder.parentNode as HTMLElement;

    if (this.trimmingContainer === (this.domBindings.rootWindow as unknown as HTMLElement)) {
      const left = this.inlineStartOverlay.getOverlayOffset() * (this.isRtl() ? -1 : 1);
      const bottom = this.bottomOverlay.getOverlayOffset();

      if (this.isRtl()) {
        overlayRoot.style.right = `${left}px`;
      } else {
        overlayRoot.style.left = `${left}px`;
      }
      overlayRoot.style.bottom = `${bottom}px`;
    } else {
      resetCssTransform(overlayRoot);
    }

    let tableHeight = outerHeight(this.clone.TABLE);
    const tableWidth = outerWidth(this.clone.TABLE);

    if (!this.wot.wtTable.hasDefinedSize()) {
      tableHeight = 0;
    }

    overlayRoot.style.height = `${tableHeight}px`;
    overlayRoot.style.width = `${tableWidth}px`;

    return false;
  }

  /**
   * Reposition the overlay.
   */
  repositionOverlay() {
    const { wtTable, wtViewport } = this.wot;
    const { rootDocument } = this.domBindings;
    const cloneRoot = this.clone.wtTable.holder.parentNode;
    let bottomOffset = 0;

    if (!wtViewport.hasVerticalScroll()) {
      bottomOffset += (wtViewport.getWorkspaceHeight() - wtTable.getTotalHeight());
    }

    if (wtViewport.hasVerticalScroll() && wtViewport.hasHorizontalScroll()) {
      bottomOffset += getScrollbarWidth(rootDocument);
    }

    cloneRoot.style.bottom = `${bottomOffset}px`;
  }

  /**
   * Adjust the overlay dimensions and position.
   */
  adjustElementsSize(): boolean {
    this.updateTrimmingContainer();

    if (this.needFullRender) {
      let tableWidth = outerWidth(this.clone.TABLE);
      let tableHeight = outerHeight(this.clone.TABLE);

      if (!this.wot.wtTable.hasDefinedSize()) {
        tableHeight = 0;
      }

      const overlayRoot = this.clone.holder.parentNode as HTMLElement;

      overlayRoot.style.width = `${tableWidth}px`;
      overlayRoot.style.height = `${tableHeight}px`;
      
      return true;
    }
    
    return false;
  }
}
