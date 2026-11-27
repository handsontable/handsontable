// A barrel passes on every name of a module, so the names a rule changes reach the files that import from it.
export * from 'handsontable/plugins/columnSorting';
export * as nested from 'handsontable/plugins/nestedHeaders';
export type * from 'handsontable/plugins/filters';
export * from 'handsontable/editors';
export * from 'handsontable';

// Another module, and a file of the project: nothing to say.
export * from 'other-grid/plugins/columnSorting';
export * from './grid-types';
