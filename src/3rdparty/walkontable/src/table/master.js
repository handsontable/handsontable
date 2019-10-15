import {
  getStyle,
  getComputedStyle,
  getTrimmingContainer,
  isVisible,
} from './../../../../helpers/dom/element';
import Table from '../table';
import calculatedRows from './mixin/calculatedRows';
import calculatedColumns from './mixin/calculatedColumns';
import { mixin } from './../../../../helpers/object';

/**
 * Subclass of `Table` that provides the helper methods relevant to the master table (not overlays), implemented through mixins.
 */
class MasterTable extends Table {
  alignOverlaysWithTrimmingContainer() {
    const trimmingElement = getTrimmingContainer(this.wtRootElement);
    const { rootWindow } = this.wot;

    if (trimmingElement === rootWindow) {
      const preventOverflow = this.wot.getSetting('preventOverflow');

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
      let { width, height } = trimmingElement.getBoundingClientRect();
      const overflow = ['auto', 'hidden', 'scroll'];

      if (trimmingElementParent && overflow.includes(trimmingOverflow)) {
        const cloneNode = trimmingElement.cloneNode(false);

        trimmingElementParent.insertBefore(cloneNode, trimmingElement);

        const cloneHeight = getComputedStyle(cloneNode, rootWindow).height;

        trimmingElementParent.removeChild(cloneNode);

        if (parseInt(cloneHeight, 10) === 0) {
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
    const { wot } = this;
    const overlayName = wot.getOverlayName();
    const columnHeaders = wot.getSetting('columnHeaders');
    const columnHeadersCount = columnHeaders.length;

    if (columnHeadersCount && !wot.wtViewport.hasOversizedColumnHeadersMarked[overlayName]) {
      const rowHeaders = wot.getSetting('rowHeaders');
      const rowHeaderCount = rowHeaders.length;
      const columnCount = this.getRenderedColumnsCount();

      for (let i = 0; i < columnHeadersCount; i++) {
        for (let renderedColumnIndex = (-1) * rowHeaderCount; renderedColumnIndex < columnCount; renderedColumnIndex++) {
          this.markIfOversizedColumnHeader(renderedColumnIndex);
        }
      }
      wot.wtViewport.hasOversizedColumnHeadersMarked[overlayName] = true;
    }
  }
}

mixin(MasterTable, calculatedRows);
mixin(MasterTable, calculatedColumns);

export default MasterTable;
