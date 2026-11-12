// TODO(handsontable-codemod 18.0.0/common-imports): Replace "handsontable/common" here by hand. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-handsontablecommon-imports
import * as Common from 'handsontable/common';

// TODO(handsontable-codemod 18.0.0/common-imports): Replace "handsontable/common" here by hand. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-handsontablecommon-imports
export type { CellValue } from 'handsontable/common';
// TODO(handsontable-codemod 18.0.0/common-imports): Replace "handsontable/common" here by hand. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-handsontablecommon-imports
export * from 'handsontable/common';

export type Value = Common.CellValue;

// TODO(handsontable-codemod 18.0.0/common-imports): Remove this import: handsontable/common had no runtime code and is removed in 18.0. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-handsontablecommon-imports
export const lazy = () => import('handsontable/common');

// TODO(handsontable-codemod 18.0.0/common-imports): Remove this import: handsontable/common had no runtime code and is removed in 18.0. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-handsontablecommon-imports
export const legacy = require('handsontable/common');
