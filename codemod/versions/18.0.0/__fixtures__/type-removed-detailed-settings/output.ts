// TODO(handsontable-codemod 18.0.0/type-dataprovider-settings): Settings: Use `DataProviderConfig | undefined` (import type { DataProviderConfig } from... See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-settings
import type { Settings as ProviderSettings } from 'handsontable/plugins/dataProvider';
// TODO(handsontable-codemod 18.0.0/type-formulas-detailedsettings): DetailedSettings: Remove the type and the `as DetailedSettings` cast. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-detailedsettings
import type { DetailedSettings as FormulasSettings } from 'handsontable/plugins/formulas';
// TODO(handsontable-codemod 18.0.0/type-plugin-detailedsettings): DetailedSettings: Use `Exclude<NonNullable<GridSettings['fillHandle']>, boolean>`. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-detailedsettings
import type { DetailedSettings as FillSettings } from 'handsontable/plugins/autofill';
// TODO(handsontable-codemod 18.0.0/type-plugin-detailedsettings): DetailedSettings: Use `Exclude<NonNullable<GridSettings['hiddenRows']>, boolean>`. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-detailedsettings
import type { DetailedSettings as HiddenRowsSettings } from 'handsontable/plugins/hiddenRows';
// TODO(handsontable-codemod 18.0.0/type-plugin-detailedsettings): DetailedSettings: Use `Exclude<NonNullable<GridSettings['collapsibleColumns']>, boolean>`. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-detailedsettings
import type { DetailedSettings as CollapsibleSettings } from 'handsontable/plugins/collapsibleColumns';
import type { DetailedSettings as OtherSettings } from 'other-grid/plugins/hiddenColumns';

export const provider: ProviderSettings | undefined = undefined;

export const formulas = { engine: null } as FormulasSettings;

export const fill: FillSettings = {};

export const hiddenRows: HiddenRowsSettings = { rows: [1] };

export const collapsible: CollapsibleSettings = [];

export const other: OtherSettings = {};
