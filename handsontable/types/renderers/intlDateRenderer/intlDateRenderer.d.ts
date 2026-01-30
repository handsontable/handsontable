import Core from '../../core';
import { CellProperties } from '../../settings';

export const RENDERER_TYPE: 'intlDate';
export const valueFormatter: (value: any, cellProperties: CellProperties) => string;
export function intlDateRenderer(instance: Core, TD: HTMLTableCellElement, row: number, column: number, prop: string | number, value: any, cellProperties: CellProperties): void;
