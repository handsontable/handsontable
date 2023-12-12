import Core from '../../core';
import { CellProperties } from '../../settings';

export const RENDERER_TYPE: 'date';
export function dateRenderer(instance: Core, TD: HTMLTableCellElement, row: number, col: number, prop: string | number, value: any, cellProperties: CellProperties): void;
