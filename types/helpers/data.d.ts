import { CellValue } from '../common';

export function spreadsheetColumnLabel(index: number): string;
export function spreadsheetColumnIndex(label: string): number;
export function createSpreadsheetData(rows?: number, columns?: number): any[][];
export function createSpreadsheetObjectData(rows?: number, colCount?: number): any[][];
export function createEmptySpreadsheetData(rows: number, columns: number): string[][];
export function translateRowsToColumns(input: any[]): any[];
export function cellMethodLookupFactory(methodName: string, allowUndefined?: boolean): Function;
export function dataRowToChangesArray(dataRow: CellValue[] | object, rowOffset?: number): [number, number | string, CellValue][];
export function countFirstRowKeys(data: CellValue[]): number;
export function isArrayOfArrays(data: any[]): boolean;
export function isArrayOfObjects(data: any[]): boolean;
