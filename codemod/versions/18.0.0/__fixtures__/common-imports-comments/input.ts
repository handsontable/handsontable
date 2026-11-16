import Handsontable from 'handsontable';
// eslint-disable-next-line import/no-unresolved
import { CellChange } from 'handsontable/common'; // trailing note
/** Docs for the next import */
import { RowObject } from 'handsontable/common';
export const grid = new Handsontable(document.body, {});
export const rows: RowObject[] = [];
export const change: CellChange | null = null;
