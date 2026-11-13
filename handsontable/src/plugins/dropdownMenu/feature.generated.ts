// Generated from `feature.json` by `npm run generate:feature-manifest`. Do not edit it by hand.

import type { PluginLicense } from '../../utils/licenseCapabilities/types';

// The modules the DropdownMenu plugin needs registered, in the `PLUGIN_DEPS` format (`type:Name`).
export const PLUGIN_DEPS: readonly string[] = [
  'plugin:AutoColumnSize',
];

// The license token of the DropdownMenu plugin, its display name, where it is checked (`gate`), and the
// license tiers that include it (`tiers`).
export const LICENSE: PluginLicense = Object.freeze({
  capability: 'feat:dropdown_menu',
  name: 'Column menu',
  gate: 'enable',
  tiers: Object.freeze([
    'standard',
    'professional',
  ]),
});
