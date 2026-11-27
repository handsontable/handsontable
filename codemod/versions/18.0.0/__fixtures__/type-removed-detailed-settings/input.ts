import type { Settings as ProviderSettings } from 'handsontable/plugins/dataProvider';
import type { DetailedSettings as FormulasSettings } from 'handsontable/plugins/formulas';
import type { DetailedSettings as FillSettings } from 'handsontable/plugins/autofill';
import type { DetailedSettings as HiddenRowsSettings } from 'handsontable/plugins/hiddenRows';
import type { DetailedSettings as CollapsibleSettings } from 'handsontable/plugins/collapsibleColumns';
import type { DetailedSettings as OtherSettings } from 'other-grid/plugins/hiddenColumns';

export const provider: ProviderSettings | undefined = undefined;

export const formulas = { engine: null } as FormulasSettings;

export const fill: FillSettings = {};

export const hiddenRows: HiddenRowsSettings = { rows: [1] };

export const collapsible: CollapsibleSettings = [];

export const other: OtherSettings = {};
