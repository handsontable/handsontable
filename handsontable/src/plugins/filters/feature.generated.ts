// Generated from `feature.json` by `npm run generate:feature-manifest`. Do not edit it by hand.

import type { PluginLicense } from '../../utils/licenseCapabilities/types';

// The modules the Filters plugin needs registered, in the `PLUGIN_DEPS` format (`type:Name`).
export const PLUGIN_DEPS: readonly string[] = [
  'plugin:DropdownMenu',
  'plugin:HiddenRows',
  'cell-type:checkbox',
];

// The license token of the Filters plugin, its display name, where it is checked (`gate`), and the
// tokens it requires (`implies`), which a license key that lists it grants with it.
export const LICENSE: PluginLicense = Object.freeze({
  capability: 'feat:filters',
  name: 'Filters',
  gate: 'enable',
  implies: Object.freeze([
    'cell:checkbox',
    'feat:auto_column_size',
    'feat:dropdown_menu',
    'feat:hidden_rows',
  ]),
});
