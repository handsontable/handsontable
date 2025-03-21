import { NodesPool } from '../utils/nodesPool';
import ColumnFilter from '../filter/column';
import RowFilter from '../filter/row';
import ColumnUtils from '../utils/column';
import RowUtils from '../utils/row';

/**
 * Interface for the base renderer class
 */
export interface BaseRendererInterface {
  nodesPool: NodesPool | null;
  nodeType: string;
  rootNode: HTMLElement;
  table: TableRendererInterface | null;
  renderedNodes: number;

  setTable(table: TableRendererInterface): void;
  adjust(): void;
  render(): void;
}

/**
 * Interface for the cell renderer
 */
export interface CellRendererInterface {
  TD?: HTMLTableCellElement;
  row: number;
  column: number;
  value: any;
  prop: number | string;
  cellProperties: any;
}

/**
 * Options for the TableRenderer
 */
export interface TableRendererOptions {
  cellRenderer?: (row: number, column: number, TD: HTMLTableCellElement) => void;
  stylesHandler?: any;
}

/**
 * Interface for the table renderer
 */
export interface TableRendererInterface {
  rootNode: HTMLTableElement;
  rootDocument: Document;
  rowHeaders: any;
  columnHeaders: any;
  colGroup: any;
  rows: any;
  cells: any;
  rowFilter: RowFilter;
  columnFilter: ColumnFilter;
  rowUtils: RowUtils;
  columnUtils: ColumnUtils;
  rowsToRender: number;
  columnsToRender: number;
  rowHeaderFunctions: Array<Function>;
  rowHeadersCount: number;
  columnHeaderFunctions: Array<Function>;
  columnHeadersCount: number;
  cellRenderer: Function;
  activeOverlayName: string;
  stylesHandler: any;

  setActiveOverlayName(overlayName: string): void;
  setAxisUtils(rowUtils: RowUtils, columnUtils: ColumnUtils): void;
  setViewportSize(rowsCount: number, columnsCount: number): void;
  setFilters(rowFilter: RowFilter, columnFilter: ColumnFilter): void;
  setHeaderContentRenderers(rowHeaders: Function[], columnHeaders: Function[]): void;
  setRenderers(options: {
    rowHeaders?: any,
    columnHeaders?: any,
    colGroup?: any,
    rows?: any,
    cells?: any
  }): void;
  renderedRowToSource(rowIndex: number): number;
  renderedColumnToSource(columnIndex: number): number;
  isAriaEnabled(): boolean;
  render(): void;
}

export interface RowHeadersRendererInterface extends BaseRendererInterface {
  sourceRowIndex: number;
  visualRowIndex: number;
  columnHeaderLevelCount: number;
  
  setColumnHeaderLevelCount(count: number): void;
  setRowHeaderContent(contentFactory: (sourceRow: number, TH: HTMLTableCellElement, headerLevel: number) => void): void;
  adjust(): void;
  render(): void;
}

export interface ColumnHeadersRendererInterface extends BaseRendererInterface {
  sourceColumnIndex: number;
  columnCounts: number;
  rowHeaderCount: number;
  
  setRowHeaderCount(count: number): void;
  setColumnHeaderContent(contentFactory: (sourceCol: number, TH: HTMLTableCellElement, headerLevel: number) => void): void;
  adjust(): void;
  render(): void;
}

export interface ColGroupRendererInterface extends BaseRendererInterface {
  adjust(): void;
  render(): void;
}

export interface RowsRendererInterface extends BaseRendererInterface {
  renderedRowToSource(rowIndex: number): number;
  adjust(): void;
  render(): void;
}

export interface CellsRendererInterface extends BaseRendererInterface {
  sourceRowIndex: number;
  visualRowIndex: number;
  sourceColumnIndex: number;
  visualColumnIndex: number;
  rowHeaderCount: number;
  
  setRowHeaderCount(count: number): void;
  adjust(): void;
  render(): void;
} 