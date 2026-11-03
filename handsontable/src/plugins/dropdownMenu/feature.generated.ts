// Generated from `feature.json` by `npm run generate:feature-manifest`. Do not edit it by hand.

import type { PluginLicense } from '../../utils/licenseCapabilities/types';

// The modules the DropdownMenu plugin needs registered, in the `PLUGIN_DEPS` format (`type:Name`).
export const PLUGIN_DEPS: readonly string[] = [
  'plugin:AutoColumnSize',
];

// The license token of the DropdownMenu plugin, its display name, where it is checked (`gate`), and the
// tokens it requires (`implies`), which a license key that lists it grants with it.
export const LICENSE: PluginLicense = Object.freeze({
  capability: 'feat:dropdown_menu',
  name: 'Column menu',
  gate: 'enable',
  implies: Object.freeze([
    'feat:auto_column_size',
  ]),
});
