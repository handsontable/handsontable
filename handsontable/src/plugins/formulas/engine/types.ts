/**
 * A single cell address in HyperFormula's own index space.
 * Structurally matches HyperFormula's `SimpleCellAddress`.
 *
 * `sheet` is a required `number` here, unlike the internal `sheet: number | null` addresses below: this
 * is a public API and the caller states the target sheet explicitly, mirroring HyperFormula's own
 * `SimpleCellAddress`.
 */
export interface FormulasCellAddress {
  col: number;
  row: number;
  sheet: number;
}

/**
 * A rectangular cell range in HyperFormula's own index space.
 * Structurally matches HyperFormula's `SimpleCellRange`.
 */
export interface FormulasCellRange {
  start: FormulasCellAddress;
  end: FormulasCellAddress;
}

/**
 * Minimal duck-type interface for a HyperFormula engine **instance**.
 * Describes only the methods and properties accessed by Handsontable internals.
 */
export interface HyperFormulaEngine {
  doesSheetExist(sheetName: string): boolean;
  getSheetId(sheetName: string): number;
  getSheetName(sheetId: number): string | undefined;
  addSheet(sheetName?: string): string;
  setSheetContent(sheetId: number | null, data: unknown[][]): unknown[];
  getSheetSerialized(sheetId: number | null): unknown[][];
  getSheetFormulas(sheetId: number | null): (string | undefined)[][];
  normalizeFormula(formula: string): string;
  getSheetDimensions(sheetId: number): { width: number; height: number };
  getCellType(address: { sheet: number | null; row: number; col: number }): unknown;
  doesCellHaveFormula(address: { sheet: number | null; row: number; col: number }): boolean;
  getCellValue(address: { sheet: number | null; row: number; col: number }): unknown;
  getCellHyperlink(address: { sheet: number | null; row: number; col: number }): string | undefined;
  getCellSerialized(address: { sheet: number | null; row: number; col: number }): unknown;
  getCellDependents(address: FormulasCellAddress | FormulasCellRange): (FormulasCellAddress | FormulasCellRange)[];
  getCellPrecedents(address: FormulasCellAddress | FormulasCellRange): (FormulasCellAddress | FormulasCellRange)[];
  isItPossibleToSetCellContents(address: object): boolean;
  setCellContents(address: { sheet: number | null; row: number; col: number }, value: unknown): unknown[];
  isItPossibleToReplaceSheetContent(sheetId: number | null, data: unknown[][]): boolean;
  isItPossibleToAddRows(sheetId: number | null, spec: [number, number]): boolean;
  isItPossibleToAddColumns(sheetId: number | null, spec: [number, number]): boolean;
  isItPossibleToRemoveRows(sheetId: number | null, spec: [number, number]): boolean;
  isItPossibleToRemoveColumns(sheetId: number | null, spec: [number, number]): boolean;
  addRows(sheetId: number | null, spec: [number, number]): unknown[];
  addColumns(sheetId: number | null, spec: [number, number]): unknown[];
  removeRows(sheetId: number | null, ...indexes: [number, number][]): void;
  removeColumns(sheetId: number | null, ...indexes: [number, number][]): void;
  getFillRangeData(sourceRange: object, targetRange: object): unknown[][];
  isItPossibleToMoveCells(source: object, destinationLeftCorner: object): boolean;
  moveCells(source: object, destinationLeftCorner: object): unknown[];
  copy(source: object): unknown[][];
  paste(targetLeftCorner: object): unknown[];
  batch(callback: () => void): unknown[];
  getConfig(): Record<string, unknown>;
  updateConfig(config: Record<string, unknown>): void;
  on(eventName: string, listener: Function): void;
  off(eventName: string, listener: Function): void;
  suspendEvaluation(): void;
  resumeEvaluation(): void;
  addNamedExpression(name: unknown, expression: unknown, scope: unknown, options: unknown): void;
  undo(): void;
  redo(): void;
  destroy(): void;
  rebuildAndRecalculate(): void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

/**
 * Minimal duck-type interface for a HyperFormula engine **class** (constructor / static API).
 * Describes only the static methods used during engine registration.
 */
export interface HyperFormulaClass {
  buildEmpty(settings: Record<string, unknown>): HyperFormulaEngine;
  registerFunction(name: unknown, plugin: unknown, translations: unknown): void;
  registerLanguage(langCode: unknown, language: unknown): void;
}
