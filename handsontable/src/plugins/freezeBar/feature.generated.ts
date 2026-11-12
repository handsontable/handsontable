// Generated from `feature.json` by `npm run generate:feature-manifest`. Do not edit it by hand.

import type { PluginLicense } from '../../utils/licenseCapabilities/types';

// The license token of the FreezeBar plugin, its display name, where it is checked (`gate`), and the
// tokens it requires (`implies`), which a license key that lists it grants with it, and the license tiers
// that include it (`tiers`).
export const LICENSE: PluginLicense = Object.freeze({
  capability: 'feat:freeze_bar',
  name: 'Freeze bar',
  gate: 'enable',
  implies: Object.freeze([]),
  tiers: Object.freeze([
    'standard',
    'professional',
  ]),
});
