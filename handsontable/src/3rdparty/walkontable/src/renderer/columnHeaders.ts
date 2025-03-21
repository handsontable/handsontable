import {
  empty,
  setAttribute,
  removeAttribute,
} from '../../../../helpers/dom/element';
import { BaseRenderer } from './_base';
import {
  A11Y_COLINDEX,
  A11Y_COLUMNHEADER,
  A11Y_ROW,
  A11Y_ROWGROUP,
  A11Y_ROWINDEX,
  A11Y_SCOPE_COL,
  A11Y_TABINDEX,
} from '../../../../helpers/a11y';
import { ColumnHeadersRendererInterface, TableRendererInterface } from './interfaces';

/**
 * Column headers renderer responsible for managing (inserting, tracking, rendering) TR and TH elements.
 *
 *   <thead> (root node)
 *     ├ <tr>   \
 *     ├ <tr>    \
 *     ├ <tr>     - ColumnHeadersRenderer
 *     ├ <tr>    /
 *     └ <tr>   /.
 *
 * @class {ColumnHeadersRenderer}
 */
export class ColumnHeadersRenderer extends BaseRenderer implements ColumnHeadersRendererInterface {
  declare table: TableRendererInterface;
  sourceColumnIndex: number = 0;
  columnCounts: number = 0;
  rowHeaderCount: number = 0;

  constructor(rootNode: HTMLTableSectionElement) {
    super('TR', rootNode); // Using 'TR' instead of null as nodeType
    
    // NodePool is not implemented for this renderer yet
    this.nodesPool = null;
  }

  /**
   * Sets the number of row headers.
   *
   * @param {number} count Number of row headers.
   */
  setRowHeaderCount(count: number): void {
    this.rowHeaderCount = count;
  }

  /**
   * Sets the column header renderer function.
   *
   * @param {Function} contentFactory Function which renders the column header content.
   */
  setColumnHeaderContent(contentFactory: (sourceCol: number, TH: HTMLTableCellElement, headerLevel: number) => void): void {
    if (this.table) {
      this.table.columnHeaderFunctions = [contentFactory];
    }
  }

  /**
   * Adjusts the number of the rendered elements.
   */
  adjust(): void {
    if (!this.table) {
      return;
    }

    const { columnHeadersCount, rowHeadersCount } = this.table;
    let TR = this.rootNode.firstChild as HTMLTableRowElement;

    if (columnHeadersCount) {
      const { columnsToRender } = this.table;
      const allColumnsToRender = columnsToRender + rowHeadersCount;

      for (let i = 0, len = columnHeadersCount; i < len; i++) {
        TR = this.rootNode.childNodes[i] as HTMLTableRowElement;

        if (!TR) {
          TR = this.table.rootDocument.createElement('tr');
          this.rootNode.appendChild(TR);
        }
        this.renderedNodes = TR.childNodes.length;

        while (this.renderedNodes < allColumnsToRender) {
          TR.appendChild(this.table.rootDocument.createElement('th'));
          this.renderedNodes += 1;
        }
        while (this.renderedNodes > allColumnsToRender) {
          if (TR.lastChild) {
            TR.removeChild(TR.lastChild);
            this.renderedNodes -= 1;
          }
        }
      }
      const theadChildrenLength = this.rootNode.childNodes.length;

      if (theadChildrenLength > columnHeadersCount) {
        for (let i = columnHeadersCount; i < theadChildrenLength; i++) {
          if (this.rootNode.lastChild) {
            this.rootNode.removeChild(this.rootNode.lastChild);
          }
        }
      }
    } else if (TR) {
      empty(TR);
    }
  }

  /**
   * Renders the TH elements.
   */
  render(): void {
    if (!this.table) {
      return;
    }

    const { columnHeadersCount } = this.table;

    if (this.table.isAriaEnabled()) {
      setAttribute(this.rootNode, [
        A11Y_ROWGROUP()
      ]);
    }

    for (let rowHeaderIndex = 0; rowHeaderIndex < columnHeadersCount; rowHeaderIndex += 1) {
      const { columnHeaderFunctions, columnsToRender, rowHeadersCount } = this.table;
      const TR = this.rootNode.childNodes[rowHeaderIndex] as HTMLTableRowElement;

      if (!TR) {
        continue;
      }

      if (this.table.isAriaEnabled()) {
        setAttribute(TR, [
          A11Y_ROW(),
          A11Y_ROWINDEX(rowHeaderIndex + 1),
        ]);
      }

      for (let renderedColumnIndex = (-1) * rowHeadersCount; renderedColumnIndex < columnsToRender; renderedColumnIndex += 1) { // eslint-disable-line max-len
        const sourceColumnIndex = this.table.renderedColumnToSource(renderedColumnIndex);
        const TH = TR.childNodes[renderedColumnIndex + rowHeadersCount] as HTMLTableCellElement;

        if (!TH) {
          continue;
        }

        TH.className = '';
        TH.removeAttribute('style');

        // Remove all accessibility-related attributes for the header to start fresh.
        removeAttribute(TH, [
          new RegExp('aria-(.*)'),
          new RegExp('role')
        ]);

        if (this.table.isAriaEnabled()) {
          setAttribute(TH, [
            A11Y_COLINDEX(renderedColumnIndex + 1 + this.table.rowHeadersCount),
            A11Y_TABINDEX(-1),
            A11Y_COLUMNHEADER(),
            ...(renderedColumnIndex >= 0 ? [
              A11Y_SCOPE_COL(),
            ] : [
              // Adding `role=row` to the corner headers to prevent
              // https://github.com/handsontable/dev-handsontable/issues/1574
              A11Y_ROW()
            ]),
          ]);
        }

        columnHeaderFunctions[rowHeaderIndex](sourceColumnIndex, TH, rowHeaderIndex);
      }
    }
  }
}
