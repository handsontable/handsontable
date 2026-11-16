// eslint-disable-next-line import/no-unresolved
// trailing note
/** Docs for the next import */
import Handsontable, { CellChange, RowObject } from 'handsontable';
export const grid = new Handsontable(document.body, {});
export const rows: RowObject[] = [];
export const change: CellChange | null = null;
