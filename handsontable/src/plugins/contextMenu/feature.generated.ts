// Generated from `feature.json` by `npm run generate:feature-manifest`. Do not edit it by hand.

import type { PluginLicense } from '../../utils/licenseCapabilities/types';

// The modules the ContextMenu plugin needs registered, in the `PLUGIN_DEPS` format (`type:Name`).
export const PLUGIN_DEPS: readonly string[] = [
  'plugin:AutoColumnSize',
];

// The license token of the ContextMenu plugin, its display name, where it is checked (`gate`), and the
// license tiers that include it (`tiers`).
export const LICENSE: PluginLicense = Object.freeze({
  capability: 'feat:context_menu',
  name: 'Context menu',
  gate: 'enable',
  tiers: Object.freeze([
    'standard',
    'professional',
  ]),
});
