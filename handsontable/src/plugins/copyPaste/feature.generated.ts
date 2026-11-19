// Generated from `feature.json` by `npm run generate:feature-manifest`. Do not edit it by hand.

import type { PluginLicense } from '../../utils/licenseCapabilities/types';

// The license token of the CopyPaste plugin, its display name, where it is checked (`gate`), and the
// license tiers that include it (`tiers`).
export const LICENSE: PluginLicense = Object.freeze({
  capability: 'feat:copy_paste',
  name: 'Copy and paste',
  gate: 'enable',
  tiers: Object.freeze([
    'standard',
    'professional',
  ]),
});
