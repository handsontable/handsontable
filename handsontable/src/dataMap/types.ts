import { CellCoords } from './../3rdparty/walkontable/src/cell/coords';

/**
 * This file contains shared interfaces and types for dataMap module
 */

// Basic types for data
export type DataSource = any[] | Record<string, any>;
export type DataSchema = any[] | Record<string, any> | ((index: number) => any);
export type CellValue = any;
export type PropDescriptor = string | number | ((index: number) => any);

// DataMap related interfaces
export interface DataMapSettings {
  data?: DataSource;
  dataSchema?: DataSchema;
  startRows?: number;
  startCols?: number;
  maxCols?: number;
  maxRows?: number;
  columns?: Array<any> | ((index: number) => any);
  ariaTags?: boolean;
  colHeaders?: boolean;
  rowHeaders?: boolean;
  dataDotNotation?: boolean;
  [key: string]: any;
}

// Hook related types
export type SourceType = string | null;

// Source modes
export type InsertRowMode = 'above' | 'below';
export type InsertColMode = 'start' | 'end';

// Data change options
export interface ChangeOptions {
  source?: SourceType;
  mode?: InsertRowMode | InsertColMode;
}

// MetaManager related interfaces
export interface MetaObject {
  [key: string]: any;
}

export interface MetaSettings {
  [key: string]: any;
}

// Options for cell meta
export interface CellMetaOptions {
  visibleRowsOnly?: boolean;
  skipRowHooks?: boolean;
  visualRow?: number;
  visualColumn?: number;
  skipMetaExtension?: boolean;
}

// Return types
export interface CreateRowResult {
  delta: number;
  startPhysicalIndex?: number;
}

export interface CreateColResult {
  delta: number;
  startPhysicalIndex?: number;
}

// ReplaceData related interfaces
export interface ReplaceDataConfig {
  hotInstance: Handsontable;
  dataMap: DataMap | null;
  dataSource: DataSourceObject;
  internalSource: string;
  source: SourceType;
  metaManager: MetaManager;
  firstRun: boolean;
}

// Interface for DataSource class
export interface DataSourceObject {
  hot: Handsontable;
  data: any[];
  dataType: string;
  colToProp(column: number): PropDescriptor;
  propToCol(prop: PropDescriptor): number;
  countCachedColumns(): number;
}

// Forward declarations for circular references
export interface DataMap {
  hot: Handsontable;
  metaManager: MetaManager;
  tableMeta: MetaObject;
  dataSource: DataSource;
  duckSchema: any;
  colToPropCache: PropDescriptor[];
  propToColCache: Map<PropDescriptor, number>;
  destroy(): void;
  getSchema(): any;
  colToProp(column: number): PropDescriptor;
  propToCol(prop: PropDescriptor): number;
  countCachedColumns(): number;
  getLength(): number;
  getAll(): DataSource;
  createRow(index?: number, amount?: number, options?: ChangeOptions): CreateRowResult;
  createCol(index?: number, amount?: number, options?: ChangeOptions): CreateColResult;
  removeRow(index?: number, amount?: number, source?: SourceType): boolean;
  removeCol(index?: number, amount?: number, source?: SourceType): boolean;
  spliceRow(row: number, index: number, amount: number, ...elements: any[]): any[];
  spliceCol(col: number, index: number, amount: number, ...elements: any[]): any[];
  get(row: number, prop: PropDescriptor): CellValue;
  set(row: number, prop: PropDescriptor, value: CellValue): void;
  getCopyable(row: number, prop: PropDescriptor): string;
  getCopyableText(start: CellCoords, end: CellCoords): string;
  getText(start: CellCoords, end: CellCoords): string;
  getRange(start: CellCoords, end: CellCoords, destination: number): CellValue[][];
  createMap(): void;
  refreshDuckSchema(): void;
  recursiveDuckColumns(schema: any, lastCol?: number, parent?: string): number;
  visualRowsToPhysical(index: number, amount: number): number[];
  visualColumnsToPhysical(index: number, amount: number): number[];
  filterData(index: number, amount: number, physicalRows: number[]): void;
  spliceData(index: number, deleteCount: number, elements: any[]): void;
  clear(): void;
}

export interface MetaManager {
  hot: Handsontable;
  globalMeta: any;
  tableMeta: any;
  columnMeta: any;
  cellMeta: any;
  getGlobalMeta(): MetaObject;
  updateGlobalMeta(settings: MetaObject): void;
  getTableMeta(): MetaObject;
  updateTableMeta(settings: MetaObject): void;
  getColumnMeta(physicalColumn: number): MetaObject;
  updateColumnMeta(physicalColumn: number, settings: MetaObject): void;
  getCellMeta(physicalRow: number, physicalColumn: number, options?: CellMetaOptions): MetaObject;
  getCellMetaKeyValue(physicalRow: number, physicalColumn: number, key: string): any;
  setCellMeta(physicalRow: number, physicalColumn: number, key: string, value: any): void;
  updateCellMeta(physicalRow: number, physicalColumn: number, settings: MetaObject): void;
  removeCellMeta(physicalRow: number, physicalColumn: number, key: string): void;
  getCellsMeta(): MetaObject[];
  getCellsMetaAtRow(physicalRow: number): MetaObject[];
  createRow(index: number | null, amount?: number): void;
  removeRow(index: number, amount?: number): void;
  createColumn(index: number | null, amount?: number): void;
  removeColumn(index: number, amount?: number): void;
  clearCellsCache(): void;
  clearCache(): void;
  runLocalHooks(hookName: string, ...args: any[]): void;
  addLocalHook(hookName: string, callback: (...args: any[]) => void): MetaManager;
} 