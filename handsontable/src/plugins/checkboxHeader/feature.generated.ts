// Generated from `feature.json` by `npm run generate:feature-manifest`. Do not edit it by hand.

import type { PluginLicense } from '../../utils/licenseCapabilities/types';

// The modules the CheckboxHeader plugin needs registered, in the `PLUGIN_DEPS` format (`type:Name`).
export const PLUGIN_DEPS: readonly string[] = [
  'cell-type:checkbox',
];

// The license token of the CheckboxHeader plugin, its display name, where it is checked (`gate`), and the
// tokens it requires (`implies`), which a license key that lists it grants with it.
export const LICENSE: PluginLicense = Object.freeze({
  capability: 'feat:checkbox_header',
  name: 'Checkbox header',
  gate: 'call',
  implies: Object.freeze([
    'cell:checkbox',
  ]),
});
