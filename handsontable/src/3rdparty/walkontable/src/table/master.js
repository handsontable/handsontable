import {
  getStyle,
  getTrimmingContainer,
  isVisible,
} from './../../../../helpers/dom/element';
import Table from '../table';
import calculatedRows from './mixin/calculatedRows';
import calculatedColumns from './mixin/calculatedColumns';
import { mixin } from './../../../../helpers/object';

/**
 * Subclass of `Table` that provides the helper methods relevant to the master table (not overlays), implemented through mixins.
 *
 * @mixes calculatedRows
 * @mixes calculatedColumns
 */
class MasterTable extends Table {
  /**
   * @param {TableDao} dataAccessObject The data access object.
   * @param {FacadeGetter} facadeGetter Function which return proper facade.
   * @param {DomBindings} domBindings Bindings into DOM.
   * @param {Settings} wtSettings The Walkontable settings.
   */
  constructor(dataAccessObject, facadeGetter, domBindings, wtSettings) {
    super(dataAccessObject, facadeGetter, domBindings, wtSettings, 'master');
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
      const trimmingElementParent = trimmingElement.parentElement;
      const trimmingHeight = getStyle(trimmingElement, 'height', rootWindow);
      const trimmingOverflow = getStyle(trimmingElement, 'overflow', rootWindow);
      const holderStyle = this.holder.style;
      const { scrollWidth, scrollHeight } = trimmingElement;
      let width = trimmingElement.offsetWidth;
      let height = trimmingElement.offsetHeight;
      const overflow = ['auto', 'hidden', 'scroll'];

      if (trimmingElementParent && overflow.includes(trimmingOverflow)) {
        const cloneNode = trimmingElement.cloneNode(false);

        // Before calculating the height of the trimming element, set overflow: auto to hide scrollbars.
        // An issue occurred on Firefox, where an empty element with overflow: scroll returns an element height higher than 0px
        // despite an empty content within.
        cloneNode.style.overflow = 'auto';
        // Issue #9545 shows problem with calculating height for HOT on Firefox while placing instance in some
        // flex containers and setting overflow for some `div` section.
        cloneNode.style.position = 'absolute';

        if (trimmingElement.nextElementSibling) {
          trimmingElementParent.insertBefore(cloneNode, trimmingElement.nextElementSibling);
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
      const columnCount = this.getRenderedColumnsCount();

      for (let i = 0; i < columnHeadersCount; i++) {
        for (let renderedColumnIndex = (-1) * rowHeaderCount; renderedColumnIndex < columnCount; renderedColumnIndex++) { // eslint-disable-line max-len
          this.markIfOversizedColumnHeader(renderedColumnIndex);
        }
      }
      wtViewport.hasOversizedColumnHeadersMarked[overlayName] = true;
    }
  }
}

mixin(MasterTable, calculatedRows);
mixin(MasterTable, calculatedColumns);

export default MasterTable;
