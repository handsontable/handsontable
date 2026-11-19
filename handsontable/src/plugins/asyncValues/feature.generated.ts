// Generated from `feature.json` by `npm run generate:feature-manifest`. Do not edit it by hand.

import type { PluginLicense } from '../../utils/licenseCapabilities/types';

// The license token of the AsyncValues plugin, its display name, where it is checked (`gate`), and the
// license tiers that include it (`tiers`).
export const LICENSE: PluginLicense = Object.freeze({
  capability: 'feat:async_values',
  name: 'Async values',
  gate: 'enable',
  tiers: Object.freeze([
    'standard',
    'professional',
  ]),
});
