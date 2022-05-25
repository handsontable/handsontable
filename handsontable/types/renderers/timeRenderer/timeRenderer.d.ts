import Core from '../../core';
import { CellProperties } from '../../settings';

export const RENDERER_TYPE: 'time';
export function timeRenderer(instance: Core, TD: HTMLTableCellElement, row: number, col: number, prop: string | number, value: any, cellProperties: CellProperties): void;
