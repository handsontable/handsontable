// Generated from `feature.json` by `npm run generate:feature-manifest`. Do not edit it by hand.

import type { PluginLicense } from '../../utils/licenseCapabilities/types';

// The license token of the MultiColumnSorting plugin, its display name, where it is checked (`gate`), and the
// license tiers that include it (`tiers`).
export const LICENSE: PluginLicense = Object.freeze({
  capability: 'feat:multi_column_sorting',
  name: 'Multi-column sorting',
  gate: 'enable',
  tiers: Object.freeze([
    'standard',
    'professional',
  ]),
});
