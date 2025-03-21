import {
  getStyle,
  getTrimmingContainer,
  isVisible,
} from './../../../../helpers/dom/element';
import Table from '../table';
import calculatedRows from './mixin/calculatedRows';
import calculatedColumns from './mixin/calculatedColumns';
import { mixin } from './../../../../helpers/object';
import { TableDao, FacadeGetter, DomBindings } from '../types';
import Settings from '../settings';

/**
 * Subclass of `Table` that provides the helper methods relevant to the master table (not overlays), implemented through mixins.
 *
 * @mixes calculatedRows
 * @mixes calculatedColumns
 */
class MasterTable extends Table {
  /**
   * Flag indicating if the table is visible in the viewport.
   */
  isTableVisible: boolean;

  /**
   * @param {TableDao} dataAccessObject The data access object.
   * @param {FacadeGetter} facadeGetter Function which return proper facade.
   * @param {DomBindings} domBindings Bindings into DOM.
   * @param {Settings} wtSettings The Walkontable settings.
   */
  constructor(dataAccessObject: TableDao, facadeGetter: FacadeGetter, domBindings: DomBindings, wtSettings: Settings) {
    super(dataAccessObject, domBindings, wtSettings, 'master', facadeGetter);
  }

  alignOverlaysWithTrimmingContainer() {
    const trimmingElement = getTrimmingContainer(this.wtRootElement);
    const { rootWindow } = this.domBindings;

    if (trimmingElement === rootWindow) {
      const preventOverflow = this.wtSettings.getSetting('preventOverflow');

      if (!preventOverflow) {
        this.holder.style.overflow = 'visible';
        this.wtRootElement.style.overflow = 'visible';
      }
    } else {
      const trimmingElementParent = (trimmingElement as HTMLElement).parentElement;
      const trimmingHeight = getStyle(trimmingElement, 'height', rootWindow) || '';
      const trimmingOverflow = getStyle(trimmingElement, 'overflow', rootWindow) || '';
      const holderStyle = this.holder.style;
      const { scrollWidth, scrollHeight } = trimmingElement as HTMLElement;
      let width = (trimmingElement as HTMLElement).offsetWidth;
      let height = (trimmingElement as HTMLElement).offsetHeight;
      const overflow = ['auto', 'hidden', 'scroll'];

      if (trimmingElementParent && overflow.includes(trimmingOverflow)) {
        const cloneNode = (trimmingElement as HTMLElement).cloneNode(false) as HTMLElement;

        // Before calculating the height of the trimming element, set overflow: auto to hide scrollbars.
        // An issue occurred on Firefox, where an empty element with overflow: scroll returns an element height higher than 0px
        // despite an empty content within.
        cloneNode.style.overflow = 'auto';
        // Issue #9545 shows problem with calculating height for HOT on Firefox while placing instance in some
        // flex containers and setting overflow for some `div` section.
        cloneNode.style.position = 'absolute';

        if ((trimmingElement as HTMLElement).nextElementSibling) {
          trimmingElementParent.insertBefore(cloneNode, (trimmingElement as HTMLElement).nextElementSibling);
        } else {
          trimmingElementParent.appendChild(cloneNode);
        }

        const cloneHeight = parseInt(rootWindow.getComputedStyle(cloneNode).height, 10);

        trimmingElementParent.removeChild(cloneNode);

        if (cloneHeight === 0) {
          height = 0;
        }
      }

      height = Math.min(height, scrollHeight);
      holderStyle.height = trimmingHeight === 'auto' ? 'auto' : `${height}px`;

      width = Math.min(width, scrollWidth);
      holderStyle.width = `${width}px`;

      holderStyle.overflow = '';
      this.hasTableHeight = holderStyle.height === 'auto' ? true : height > 0;
      this.hasTableWidth = width > 0;
    }

    this.isTableVisible = isVisible(this.TABLE);
  }

  markOversizedColumnHeaders() {
    const { wtSettings } = this;
    const { wtViewport } = this.dataAccessObject;
    const overlayName = 'master';
    const columnHeaders = wtSettings.getSetting('columnHeaders');
    const columnHeadersCount = columnHeaders.length;

    if (columnHeadersCount && !wtViewport.hasOversizedColumnHeadersMarked[overlayName]) {
      const rowHeaders = wtSettings.getSetting('rowHeaders');
      const rowHeaderCount = rowHeaders.length;
      // The getRenderedColumnsCount method will be added to this class by the calculatedColumns mixin
      const columnCount = (this as any).getRenderedColumnsCount();

      for (let i = 0; i < columnHeadersCount; i++) {
        for (let renderedColumnIndex = (-1) * rowHeaderCount; renderedColumnIndex < columnCount; renderedColumnIndex++) { // eslint-disable-line max-len
          this.markIfOversizedColumnHeader(renderedColumnIndex);
        }
      }
      wtViewport.hasOversizedColumnHeadersMarked[overlayName] = true;
    }
  }
}

// @ts-ignore - Mixin objects with proper MIXIN_NAME are defined but TypeScript can't verify it at compile time
mixin(MasterTable, calculatedRows);
// @ts-ignore - Mixin objects with proper MIXIN_NAME are defined but TypeScript can't verify it at compile time
mixin(MasterTable, calculatedColumns);

export default MasterTable;
