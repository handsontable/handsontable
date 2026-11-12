// Generated from `feature.json` by `npm run generate:feature-manifest`. Do not edit it by hand.

import type { PluginLicense } from '../../utils/licenseCapabilities/types';

// The license token of the ManualRowMove plugin, its display name, where it is checked (`gate`), and the
// tokens it requires (`implies`), which a license key that lists it grants with it, and the license tiers
// that include it (`tiers`).
export const LICENSE: PluginLicense = Object.freeze({
  capability: 'feat:manual_row_move',
  name: 'Row moving',
  gate: 'enable',
  implies: Object.freeze([]),
  tiers: Object.freeze([
    'standard',
    'professional',
  ]),
});
