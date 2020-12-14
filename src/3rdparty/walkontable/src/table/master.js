import {
  getStyle,
  getComputedStyle,
  getTrimmingContainer,
  offset,
  outerWidth,
  getBoundingClientRect,
  scrollWidth,
  scrollHeight,
} from './../../../../helpers/dom/element';
import Table from '../table';
import calculatedRows from './mixin/calculatedRows';
import calculatedColumns from './mixin/calculatedColumns';
import { mixin } from './../../../../helpers/object';
import ColumnFilter from './../filter/column';
import RowFilter from './../filter/row';

/**
 * Subclass of `Table` that provides the helper methods relevant to the master table (not overlays), implemented through mixins.
 */
class MasterTable extends Table {
  /**
   * @param {Walkontable} wotInstance The Walkontable instance.
   * @param {HTMLTableElement} table An element to the Walkontable generated table is injected.
   */
  constructor(wotInstance, table) {
    super(wotInstance, table);
    this.holderOffset = 0;
    this.wtRootElement.className += 'ht_master handsontable';
    /**
     * Set the DOM element responsible for trimming the overlay's root element. It will be some parent element or the window. Only applicable to the master overlay.
     *
     * @type {HTMLElement|Window}
     */
    this.trimmingContainer = null;
    this.alignOverlaysWithTrimmingContainer(); // TODO this better be removed
  }

  alignOverlaysWithTrimmingContainer() {
    this.trimmingContainer = getTrimmingContainer(this.wtRootElement);

    const trimmingElement = this.trimmingContainer;
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
      let { width, height } = getBoundingClientRect(trimmingElement);
      const overflow = ['auto', 'hidden', 'scroll'];

      if (false && trimmingElementParent && overflow.includes(trimmingOverflow)) {
        const cloneNode = trimmingElement.cloneNode(false);

        // Before calculating the height of the trimming element, set overflow: auto to hide scrollbars.
        // An issue occurred on Firefox, where an empty element with overflow: scroll returns an element height higher than 0px
        // despite an empty content within.
        cloneNode.style.overflow = 'auto';

        if (trimmingElement.nextElementSibling) {
          trimmingElementParent.insertBefore(cloneNode, trimmingElement.nextElementSibling);
        } else {
          trimmingElementParent.appendChild(cloneNode);
        }

        const cloneHeight = parseInt(getComputedStyle(cloneNode, rootWindow).height, 10);

        trimmingElementParent.removeChild(cloneNode);

        if (cloneHeight === 0) {
          height = 0;
        }
      }

      height = Math.min(height, scrollHeight(trimmingElement));
      holderStyle.height = trimmingHeight === 'auto' ? 'auto' : `${height}px`;

      width = Math.min(width, scrollWidth(trimmingElement));
      holderStyle.width = `${width}px`;

      holderStyle.overflow = '';
      this.hasTableHeight = holderStyle.height === 'auto' ? true : height > 0;
      this.hasTableWidth = width > 0;
    }
  }

  markOversizedColumnHeaders() {
    const { wot } = this;
    const columnHeaders = wot.getSetting('columnHeaders');
    const columnHeadersCount = columnHeaders.length;

    if (columnHeadersCount && !wot.wtViewport.hasOversizedColumnHeadersMarked) {
      const rowHeaders = wot.getSetting('rowHeaders');
      const rowHeaderCount = rowHeaders.length;
      const columnCount = this.getRenderedColumnsCount();

      for (let i = 0; i < columnHeadersCount; i++) {
        for (let renderedColumnIndex = (-1) * rowHeaderCount; renderedColumnIndex < columnCount; renderedColumnIndex++) {
          this.markIfOversizedColumnHeader(renderedColumnIndex);
        }
      }
      wot.wtViewport.hasOversizedColumnHeadersMarked = true;
    }
  }

  /**
   * Redraws the table.
   *
   * @param {boolean} [fastDraw=false] If TRUE, will try to avoid full redraw and only update the border positions.
   *                                   If FALSE or UNDEFINED, will perform a full redraw.
   */
  draw(fastDraw = false) {
    const { wot } = this;
    const { wtOverlays, wtViewport } = wot;
    const totalRows = wot.getSetting('totalRows');
    const totalColumns = wot.getSetting('totalColumns');
    const rowHeaders = wot.getSetting('rowHeaders');
    const rowHeadersCount = rowHeaders.length;
    const columnHeaders = wot.getSetting('columnHeaders');
    const columnHeadersCount = columnHeaders.length;
    let runFastDraw = fastDraw;

    this.holderOffset = offset(this.holder);
    runFastDraw = wtViewport.createRenderCalculators(runFastDraw);

    if (runFastDraw) {
      // in case we only scrolled without redraw, update visible rows information in oldRowsCalculator
      wtViewport.createVisibleCalculators();
      wtOverlays.refreshClones(true);
      this.refreshSelections(true);

    } else {

      const startRow = totalRows > 0 ? this.getFirstRenderedRow() : 0;
      const startColumn = totalColumns > 0 ? this.getFirstRenderedColumn() : 0;

      this.rowFilter = new RowFilter(startRow, totalRows, columnHeadersCount);
      this.columnFilter = new ColumnFilter(startColumn, totalColumns, rowHeadersCount);

      // Only master table rendering can be skipped
      this.alignOverlaysWithTrimmingContainer();

      const skipRender = {};

      this.wot.getSetting('beforeDraw', true, skipRender);

      const performRedraw = skipRender.skipRender !== true;

      if (performRedraw) {
        this.tableRenderer.setHeaderContentRenderers(rowHeaders, columnHeaders);

        this.resetOversizedRows();

        this.tableRenderer
          .setViewportSize(this.getRenderedRowsCount(), this.getRenderedColumnsCount())
          .setFilters(this.rowFilter, this.columnFilter)
          .render();

        const workspaceWidth = wtViewport.getWorkspaceWidth();

        wtViewport.containerWidth = null;
        this.markOversizedColumnHeaders();

        this.adjustColumnHeaderHeights();

        this.markOversizedRows();

        wtViewport.createVisibleCalculators();

        // const hiderWidth = outerWidth(this.hider);
        // const tableWidth = outerWidth(this.TABLE);

        // if (hiderWidth !== 0 && (tableWidth !== hiderWidth)) {
        //   // Recalculate the column widths, if width changes made in the overlays removed the scrollbar, thus changing the viewport width.
        //   this.wot.columnUtils.calculateWidths();
        //   this.tableRenderer.renderer.colGroup.render();
        // }

        // if (workspaceWidth !== wtViewport.getWorkspaceWidth()) {
        //   // workspace width changed though to shown/hidden vertical scrollbar. Let's reapply stretching
        //   wtViewport.containerWidth = null;
        //   this.wot.columnUtils.calculateWidths();
        //   this.tableRenderer.renderer.colGroup.render();
        // }

        wtOverlays.refreshClones(false);
        this.refreshSelections(false);

        this.wot.getSetting('onDraw', true);
      }
    }
  }
}

mixin(MasterTable, calculatedRows);
mixin(MasterTable, calculatedColumns);

export default MasterTable;
