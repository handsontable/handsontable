import * as Common from 'handsontable/common';

export type { CellValue } from 'handsontable/common';
export * from 'handsontable/common';

export type Value = Common.CellValue;

export const lazy = () => import('handsontable/common');

export const legacy = require('handsontable/common');
