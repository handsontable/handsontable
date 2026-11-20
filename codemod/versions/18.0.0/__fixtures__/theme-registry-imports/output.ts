/**
 * Theme setup for the dashboard.
 */
import Handsontable from 'handsontable';
import { registerTheme, mainTheme as main, getTheme, horizonTheme } from 'handsontable/themes';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();

registerTheme('brand', { ...main, name: 'brand' });

export const names = [getTheme('brand'), horizonTheme];

export { Handsontable };
