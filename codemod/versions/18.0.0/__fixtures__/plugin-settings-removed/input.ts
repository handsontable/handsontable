import type { Settings as AutofillSettings } from 'handsontable/plugins/autofill';
import type { Settings } from 'handsontable/plugins/touchScroll';
import type { DetailedSettings, MenuItemConfig, Settings as MenuSettings } from 'handsontable/plugins/contextMenu';
import type { Settings as NestedSettings } from 'handsontable/plugins/nestedHeaders';
import type { Settings as StretchSettings } from 'handsontable/plugins/stretchColumns';
import type { SortOrderType } from 'handsontable/plugins/columnSorting';

export type { Settings as FiltersSettings } from 'handsontable/plugins/filters';

export const fill: AutofillSettings = true;

export const touch: Settings = true;

export const menu: DetailedSettings & MenuSettings = {};

export const item: MenuItemConfig = { name: 'Copy' };

export const nested: NestedSettings = [];

export const stretch: StretchSettings = true;

export const order: SortOrderType = 'asc';
