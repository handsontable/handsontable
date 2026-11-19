import type Handsontable from 'handsontable';
import type { GridSettings, ColumnSettings, CellMeta, RemoveIndexSignature } from 'handsontable';
import { horizonTheme } from 'handsontable/themes';

/**
 * Options that `metaSchema.ts` documents and `GridSettings` once left to its `[key: string]: any`
 * index signature. Each is declared with its real type now. The `@ts-expect-error` lines are what
 * fail while an option is still `any`: an unused directive is an error.
 */

declare const hot: Handsontable;
declare const themeBuilder: Handsontable.ThemeBuilder;

type Declared = RemoveIndexSignature<GridSettings>;

/**
 * An option left to the index signature does not appear among the keys that `RemoveIndexSignature`
 * keeps, so this fails to compile for any of the ten that is not declared.
 */
const declared: Record<
  | 'enterCommits' | 'filterSelectedItems' | 'notification' | 'maxSelections' | 'valueParser'
  | 'searchInput' | 'sourceSortFunction' | 'theme' | 'injectCoreCss' | 'parsePastedValue',
  keyof Declared
> = {
  enterCommits: 'enterCommits',
  filterSelectedItems: 'filterSelectedItems',
  notification: 'notification',
  maxSelections: 'maxSelections',
  valueParser: 'valueParser',
  searchInput: 'searchInput',
  sourceSortFunction: 'sourceSortFunction',
  theme: 'theme',
  injectCoreCss: 'injectCoreCss',
  parsePastedValue: 'parsePastedValue',
};

// The documented values.
const documented: GridSettings = {
  enterCommits: false,
  filterSelectedItems: false,
  searchInput: false,
  injectCoreCss: false,
  parsePastedValue: true,
  maxSelections: 3,
  theme: 'ht-theme-horizon',
  notification: true,
};

const notificationConfig: GridSettings = { notification: { stackLimit: 3, animation: false } };
const themeObject: GridSettings = { theme: themeBuilder };
// A plain theme config object, as the `theme` option's table documents (`horizonTheme`).
const themeConfig: GridSettings = { theme: horizonTheme };

// The same options at the column and cell level, where the cascade reaches them.
const column: ColumnSettings = {
  enterCommits: false,
  filterSelectedItems: false,
  searchInput: false,
  parsePastedValue: true,
  maxSelections: 3,
};
const cell: CellMeta = { maxSelections: 3, searchInput: false };

// A wrong value is rejected.
// @ts-expect-error `enterCommits` takes a boolean.
const wrongEnterCommits: GridSettings = { enterCommits: 'yes' };
// @ts-expect-error `filterSelectedItems` takes a boolean.
const wrongFilterSelectedItems: GridSettings = { filterSelectedItems: 1 };
// @ts-expect-error `searchInput` takes a boolean.
const wrongSearchInput: GridSettings = { searchInput: 'no' };
// @ts-expect-error `injectCoreCss` takes a boolean.
const wrongInjectCoreCss: GridSettings = { injectCoreCss: 0 };
// @ts-expect-error `parsePastedValue` takes a boolean.
const wrongParsePastedValue: GridSettings = { parsePastedValue: 'true' };
// @ts-expect-error `maxSelections` takes a number.
const wrongMaxSelections: GridSettings = { maxSelections: 'three' };
// @ts-expect-error `theme` takes a theme builder or a theme class name.
const wrongTheme: GridSettings = { theme: 5 };
// @ts-expect-error `notification` takes a boolean or its two documented settings.
const wrongNotification: GridSettings = { notification: { stackLimit: 'ten' } };
// @ts-expect-error `valueParser` returns a value, and takes the editor's value and the cell properties.
const wrongValueParser: GridSettings = { valueParser: 5 };
// @ts-expect-error `sourceSortFunction` takes a function.
const wrongSourceSortFunction: GridSettings = { sourceSortFunction: 'asc' };

/**
 * The two callbacks were `any` and stay assignable from a narrowly annotated function: they are
 * declared with method syntax, which `strictFunctionTypes` checks bivariantly. A property typed as a
 * function would reject the first one (TS2322).
 */
const narrowValueParser: GridSettings = {
  valueParser: (value: string) => value.trim(),
};

const narrowSourceSortFunction: GridSettings = {
  sourceSortFunction: (entries: string[]) => entries.slice().sort(),
};

const parserWithBothArguments: GridSettings = {
  valueParser: (value, cellProperties) => (cellProperties.type === 'numeric' ? Number(value) : value),
};

const sorterWithInferredArgument: GridSettings = {
  sourceSortFunction: entries => entries.slice().reverse(),
};

/**
 * A callback whose parameters are inferred keeps compiling when it uses them as the documented values,
 * which the option's own JSDoc examples do. An `unknown` or union parameter would reject all of these.
 */
const inferredValueParser: GridSettings = {
  valueParser: value => value.trim(),
};

const inferredSourceSortFunction: GridSettings = {
  sourceSortFunction: entries => entries.sort((a, b) => b.localeCompare(a)),
};

const columnCallbacks: GridSettings = {
  columns: [{
    valueParser: value => (value ? new Date(value).toISOString().slice(0, 10) : null),
    sourceSortFunction: entries => entries.slice().reverse(),
    maxSelections: 2,
  }],
};

// Reading an option back: it is optional, so a call goes through a guard, and a column or cell reads its
// own type.
const read = hot.getSettings();
const parsed: unknown = read.valueParser?.('1', {} as Handsontable.CellProperties);
const maxSelections: number | undefined = hot.getCellMeta(0, 0).maxSelections;

hot.updateSettings({ maxSelections: 2, notification: { stackLimit: 5 } });

// A theme config with a token of your own compiled while `theme` was `any`, and still does.
const themeWithCustomToken: GridSettings = { theme: { name: 'x', tokens: { someCustomToken: '1px' } } };
