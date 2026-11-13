/**
 * Theme setup for the dashboard.
 */
import Handsontable, { registerTheme, mainTheme as main, getTheme } from 'handsontable';
import { horizonTheme } from 'handsontable/base';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();

registerTheme('brand', { ...main, name: 'brand' });

export const names = [getTheme('brand'), horizonTheme];

export { Handsontable };
