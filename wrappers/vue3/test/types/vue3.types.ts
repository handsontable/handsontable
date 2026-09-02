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
import Handsontable from 'handsontable/base';
import HotTableDefault, { HotColumn, HotTable, HotTableProps, VueProps } from '../../index';

/**
 * True only for `any` — `1 & T` collapses to `any`, and `0 extends any` holds,
 * while `0 extends (1 & <anything else>)` does not.
 */
type IsAny<T> = 0 extends (1 & T) ? true : false;

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

const hotInstanceIsNotAny: IsAny<HotTableInstance['hotInstance']> = false;
const getData: (...args: never[]) => unknown = instance.hotInstance.getData;
const updateSettings: (...args: never[]) => unknown = instance.hotInstance.updateSettings;

const columnSettingsIsNotAny: IsAny<HotTableInstance['columnSettings']> = false;
const firstColumnLicenseKey: HotTableProps['licenseKey'] = instance.columnSettings[0].licenseKey;

const getColumnSettingsIsNotAny: IsAny<HotTableInstance['getColumnSettings']> = false;
const hotInit: () => void = instance.hotInit;
const refreshColumns: () => void = instance.refreshColumns;

// The public types must be importable from the entry point — before this fix
// `index.d.ts` re-exported values only, so `HotTableProps` was unreachable even
// in the releases that did ship declarations.
const settings: HotTableProps = { data: [[1, 2]], rowHeaders: true, licenseKey: 'non-commercial-and-evaluation' };
const nestedSettings: HotTableProps['settings'] = { colHeaders: true };
const vueProps: VueProps<{ readOnly: boolean }> = { readOnly: 'anything' };

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
  getData,
  updateSettings,
  columnSettingsIsNotAny,
  firstColumnLicenseKey,
  getColumnSettingsIsNotAny,
  hotInit,
  refreshColumns,
  settings,
  nestedSettings,
  vueProps,
  gridSettings,
  badNestedSettings,
};
