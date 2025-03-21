import { BaseRenderer } from './_base';
import { warn } from '../../../../helpers/console';
import { toSingleLine } from '../../../../helpers/templateLiteralTag';
import { addClass } from '../../../../helpers/dom/element';
import { ColGroupRendererInterface, TableRendererInterface } from './interfaces';

let performanceWarningAppeared = false;

/**
 * Colgroup renderer responsible for managing (inserting, tracking, rendering) COL elements.
 *
 *   <colgroup> (root node)
 *     ├ <col>   \
 *     ├ <col>    \
 *     ├ <col>     - ColGroupRenderer
 *     ├ <col>    /
 *     └ <col>   /.
 *
 * @class {ColGroupRenderer}
 */
export class ColGroupRenderer extends BaseRenderer implements ColGroupRendererInterface {
  declare table: TableRendererInterface;

  constructor(rootNode: HTMLTableColElement) {
    super('COL', rootNode); // Use 'COL' as nodeType instead of null
    
    // NodePool is not implemented for this renderer yet
    this.nodesPool = null;
  }

  /**
   * Adjusts the number of the rendered elements.
   */
  adjust(): void {
    if (!this.table) {
      return;
    }

    const { columnsToRender, rowHeadersCount } = this.table;
    const allColumnsToRender = columnsToRender + rowHeadersCount;

    while (this.renderedNodes < allColumnsToRender) {
      this.rootNode.appendChild(this.table.rootDocument.createElement('col'));
      this.renderedNodes += 1;
    }
    while (this.renderedNodes > allColumnsToRender) {
      if (this.rootNode.lastChild) {
        this.rootNode.removeChild(this.rootNode.lastChild);
        this.renderedNodes -= 1;
      }
    }
  }

  /**
   * Renders the col group elements.
   */
  render(): void {
    if (!this.table) {
      return;
    }

    this.adjust();

    const { columnsToRender, rowHeadersCount } = this.table;

    if (!performanceWarningAppeared && columnsToRender > 1000) {
      performanceWarningAppeared = true;
      warn(toSingleLine`Performance tip: Handsontable rendered more than 1000 visible columns.\x20
        Consider limiting the number of rendered columns by specifying the table width and/or\x20
        turning off the "renderAllColumns" option.`);
    }

    // Render column nodes for row headers
    for (let visibleColumnIndex = 0; visibleColumnIndex < rowHeadersCount; visibleColumnIndex++) {
      const sourceColumnIndex = this.table.renderedColumnToSource(visibleColumnIndex);
      const width = this.table.columnUtils.getHeaderWidth(sourceColumnIndex);

      const colNode = this.rootNode.childNodes[visibleColumnIndex] as HTMLElement;
      if (colNode) {
        colNode.style.width = `${width}px`;
      }
    }

    // Render column nodes for cells
    for (let visibleColumnIndex = 0; visibleColumnIndex < columnsToRender; visibleColumnIndex++) {
      const sourceColumnIndex = this.table.renderedColumnToSource(visibleColumnIndex);
      const width = this.table.columnUtils.getWidth(sourceColumnIndex);

      const colNode = this.rootNode.childNodes[visibleColumnIndex + rowHeadersCount] as HTMLElement;
      if (colNode) {
        colNode.style.width = `${width}px`;
      }
    }

    const firstChild = this.rootNode.firstChild as HTMLElement;

    if (firstChild) {
      addClass(firstChild, 'rowHeader');
    }
  }
}
