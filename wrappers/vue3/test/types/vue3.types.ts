/**
 * Type contract test for the declarations `@handsontable/vue3` publishes.
 *
 * It deliberately checks the emitted root `index.d.ts` — the file the package's
 * `types` field names — and not `src/`, because the defect this guards against
 * lives in the emit step, not in the source.
 *
 * The failure mode to catch is not "no declarations". It is declarations that
 * exist and check nothing: `src/vue.d.ts` shims `*.vue` as
 * `DefineComponent<{}, {}, any>`, so any emitter that resolves the SFCs through
 * that wildcard (plain `tsc` does) produces an `index.d.ts` which silences
 * TS7016 while typing `HotTable` as `any`. Every assertion below is a real value
 * assignment, so the compiler proves it.
 */
import { h } from 'vue';
import Handsontable from 'handsontable/base';
import HotTableDefault, { HotColumn, HotTable, HotTableProps, VueProps } from '../../index';

/**
 * True only for `any` — `1 & T` collapses to `any`, and `0 extends any` holds,
 * while `0 extends (1 & <anything else>)` does not.
 */
type IsAny<T> = 0 extends (1 & T) ? true : false;

/**
 * True only when the type still admits `null`. Guarding a member with this catches the
 * declaration build losing `strictNullChecks`: without it the checker folds
 * `Handsontable | null` down to `Handsontable`, and the package ships a type that makes
 * `hotTableRef.value.hotInstance.getData()` compile before mount and then throw at runtime.
 * `IsAny` is asserted alongside every use, since `null extends any` also holds.
 */
type IsNullable<T> = null extends T ? true : false;

// The components must carry real component types, not `any`.
const hotTableIsNotAny: IsAny<typeof HotTable> = false;
const hotTableDefaultIsNotAny: IsAny<typeof HotTableDefault> = false;
const hotColumnIsNotAny: IsAny<typeof HotColumn> = false;

// The instance members declared by `HotTable.vue` must survive into the emit.
//
// These are checked structurally, not by nominal identity: `DefineComponent`
// expands the data types through a mapped type, which drops `Handsontable`'s
// `#private` brand, so `hotInstance` is Handsontable-shaped rather than
// assignable to `Handsontable` itself. What matters here is that the members
// exist and are not `any`.
type HotTableInstance = InstanceType<typeof HotTable>;

const instance = null as unknown as HotTableInstance;

// The nullable members must stay nullable in the emit. `hotInstance` returns `null` before
// `hotInit()` and after the grid is destroyed; `columnSettings` is `null` until the first
// `getColumnSettings()`. Both are asserted positively, so a declaration build that widens
// either annotation to a non-null type turns these lines red instead of silently shipping it.
const hotInstanceIsNotAny: IsAny<HotTableInstance['hotInstance']> = false;
const hotInstanceIsNullable: IsNullable<HotTableInstance['hotInstance']> = true;
const hotInstance = instance.hotInstance as NonNullable<HotTableInstance['hotInstance']>;
const getData: (...args: never[]) => unknown = hotInstance.getData;
const updateSettings: (...args: never[]) => unknown = hotInstance.updateSettings;

const columnSettingsIsNotAny: IsAny<HotTableInstance['columnSettings']> = false;
const columnSettingsIsNullable: IsNullable<HotTableInstance['columnSettings']> = true;
const columnSettings = instance.columnSettings as NonNullable<HotTableInstance['columnSettings']>;
const firstColumnLicenseKey: HotTableProps['licenseKey'] = columnSettings[0].licenseKey;

const getColumnSettingsIsNotAny: IsAny<HotTableInstance['getColumnSettings']> = false;
const hotInit: () => void = instance.hotInit;
const refreshColumns: () => void = instance.refreshColumns;

// The public types must be importable from the entry point — before this fix
// `index.d.ts` re-exported values only, so `HotTableProps` was unreachable even
// in the releases that did ship declarations.
const settings: HotTableProps = { data: [[1, 2]], rowHeaders: true, licenseKey: 'non-commercial-and-evaluation' };
const nestedSettings: HotTableProps['settings'] = { colHeaders: true };
const vuePropsIsNotAny: IsAny<VueProps<{ a: 1 }>> = false;
const vueProps: VueProps<{ readOnly: boolean }> = { readOnly: 'anything' };

// Every prop of `HotTable` and `HotColumn` carries its option's type, so `vue-tsc` rejects a wrong value
// in a template. `h()` and `$props` resolve a template's props through the same declaration, so both are
// used here. Before the props were typed, each was `any` and every one of these lines compiled.
type HotTableProps$ = HotTableInstance['$props'];
type HotColumnProps$ = InstanceType<typeof HotColumn>['$props'];

// Each prop is optional: a template names only the ones it sets.
const gridSettingsObject: HotTableProps = { type: 'numeric' };
const noProps: HotTableProps$ = {};
const noColumnProps: HotColumnProps$ = {};
const validProps: HotTableProps$ = {
  id: 'grid',
  data: [[1, 2]],
  rowHeaders: true,
  settings: { colHeaders: true },
  sheetsBar: { sheets: [] },
  afterSheetTabRename: () => undefined,
};
// A column's `data` names the property it shows, where the grid's `data` holds the rows.
// `null` removes the callback an earlier render passed for a hook, so a hook prop takes it.
const nullHook: HotTableProps$ = { afterChange: null };
const classAndCustomKey = h(HotTable, { class: 'grid', customMeta: 1 });
const validColumnProps: HotColumnProps$ = { readOnly: true, title: 'A', data: 'firstName', filters: false };
const validColumnSettingsProp: HotColumnProps$ = { settings: { data: 'firstName' } };
const validVNode = h(HotTable, { rowHeaders: true, sheetsBar: { sheets: [] } });

// @ts-expect-error -- `sheetsBar` takes a boolean or a settings object.
const badSheetsBar: HotTableProps$ = { sheetsBar: 42 };
// @ts-expect-error -- a sheet tab hook takes a function.
const badSheetTabHook: HotTableProps$ = { afterSheetTabRename: 'rename' };
// @ts-expect-error -- `readOnly` takes a boolean.
const badReadOnly: HotTableProps$ = { readOnly: 'yes' };
// @ts-expect-error -- `settings` takes a `GridSettings` object.
const badSettingsProp: HotTableProps$ = { settings: 42 };
// @ts-expect-error -- `HotColumn` checks its props too.
const badColumnReadOnly: HotColumnProps$ = { readOnly: 'yes' };
// @ts-expect-error -- `h()` resolves the props the way a template does.
const badVNode = h(HotTable, { sheetsBar: 42 });
// @ts-expect-error -- `data` takes rows, not `null`.
const badNullData: HotTableProps$ = { data: null };
// @ts-expect-error -- the grid's `data` is an array of rows, not a property name.
const badGridData: HotTableProps$ = { data: 'firstName' };
// @ts-expect-error -- core neither registers nor fires `afterChangesObserved`, so no prop exists for it.
const badDeadHook: HotTableProps$ = { afterChangesObserved: () => undefined };
// `handsontable` is a prop of both components. `getValue` is a prop of `HotTable` only: core reads it from
// the table meta, so a column has no use for it.
const nestedGridColumn: HotColumnProps$ = { handsontable: { colHeaders: true } };
const nestedGridTable: HotTableProps$ = { handsontable: { colHeaders: true }, getValue: () => 'value' };
// @ts-expect-error -- core reads `getValue` from the table meta only, so it is not a `HotColumn` prop.
const badColumnGetValue: HotColumnProps$ = { getValue: () => 'value' };
// @ts-expect-error -- hooks run from the grid-level settings only, so they are not `HotColumn` props.
const badColumnHook: HotColumnProps$ = { afterChange: () => undefined };
// The `settings` prop of a column takes a grid settings object, as it did when every prop was `any`.
const gridSettingsColumn: HotColumnProps$ = { settings: gridSettingsObject };
// `id` names the container of `HotTable`; `HotColumn` has no such prop, so the schema rejects it as an
// excess property. A template that writes it still compiles unless `strictTemplates` is on.
// @ts-expect-error -- `id` is not a `HotColumn` prop.
const badColumnId: HotColumnProps$ = { id: 'column' };

// `HotTableProps` must still extend `GridSettings`, not be a bare property bag.
const gridSettings: Handsontable.GridSettings = settings;

// Negative assertion. `settings` is a `GridSettings` object, so a number is not
// assignable. If `HotTableProps` had collapsed to `any` this line would compile,
// the directive would be unused, and TypeScript would report it — which is
// exactly the signal we want.
// @ts-expect-error -- a number is not a GridSettings object.
const badNestedSettings: HotTableProps['settings'] = 42;

export {
  hotTableIsNotAny,
  hotTableDefaultIsNotAny,
  hotColumnIsNotAny,
  hotInstanceIsNotAny,
  hotInstanceIsNullable,
  hotInstance,
  getData,
  updateSettings,
  columnSettingsIsNotAny,
  columnSettingsIsNullable,
  columnSettings,
  firstColumnLicenseKey,
  getColumnSettingsIsNotAny,
  hotInit,
  refreshColumns,
  settings,
  nestedSettings,
  vuePropsIsNotAny,
  vueProps,
  gridSettings,
  badNestedSettings,
  noProps,
  noColumnProps,
  validProps,
  nullHook,
  classAndCustomKey,
  validColumnProps,
  validColumnSettingsProp,
  badNullData,
  badGridData,
  badDeadHook,
  nestedGridColumn,
  nestedGridTable,
  badColumnGetValue,
  badColumnHook,
  gridSettingsObject,
  gridSettingsColumn,
  validVNode,
  badSheetsBar,
  badSheetTabHook,
  badReadOnly,
  badSettingsProp,
  badColumnReadOnly,
  badVNode,
  badColumnId,
};
