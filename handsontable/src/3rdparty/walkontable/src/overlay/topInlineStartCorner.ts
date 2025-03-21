import {
  outerHeight,
  outerWidth,
  setOverlayPosition,
  resetCssTransform,
} from '../../../../helpers/dom/element';
import TopInlineStartCornerOverlayTable from '../table/topInlineStartCorner';
import { Overlay } from './_base';
import {
  CLONE_TOP_INLINE_START_CORNER,
} from './constants';
import { DomBindings, FacadeGetter, Settings } from '../types';
import Walkontable from '../core/core';
import { TopInlineStartCornerOverlayInterface } from './interfaces';
import { TopOverlay } from './top';
import { InlineStartOverlay } from './inlineStart';

/**
 * @class TopInlineStartCornerOverlay
 */
export class TopInlineStartCornerOverlay extends Overlay implements TopInlineStartCornerOverlayInterface {
  /**
   * The instance of the Top overlay.
   *
   * @type {TopOverlay}
   */
  topOverlay: TopOverlay;
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
   * @param {TopOverlay} topOverlay The instance of the Top overlay.
   * @param {InlineStartOverlay} inlineStartOverlay The instance of the InlineStart overlay.
   */
  constructor(
    wotInstance: Walkontable, 
    facadeGetter: FacadeGetter, 
    wtSettings: Settings, 
    domBindings: DomBindings, 
    topOverlay: TopOverlay, 
    inlineStartOverlay: InlineStartOverlay
  ) {
    super(wotInstance, facadeGetter, CLONE_TOP_INLINE_START_CORNER, wtSettings, domBindings);
    this.topOverlay = topOverlay;
    this.inlineStartOverlay = inlineStartOverlay;
  }

  /**
   * Factory method to create a subclass of `Table` that is relevant to this overlay.
   *
   * @see Table#constructor
   * @param {...*} args Parameters that will be forwarded to the `Table` constructor.
   * @returns {TopInlineStartCornerOverlayTable}
   */
  createTable(...args: any[]): TopInlineStartCornerOverlayTable {
    return new TopInlineStartCornerOverlayTable(...args);
  }

  /**
   * Checks if overlay should be fully rendered.
   *
   * @returns {boolean}
   */
  shouldBeRendered(): boolean {
    return this.wtSettings.getSetting('shouldRenderTopOverlay')
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

    if (this.trimmingContainer === this.domBindings.rootWindow) {
      const left = this.inlineStartOverlay.getOverlayOffset() * (this.isRtl() ? -1 : 1);
      const top = this.topOverlay.getOverlayOffset();

      setOverlayPosition(overlayRoot, `${left}px`, `${top}px`);
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
