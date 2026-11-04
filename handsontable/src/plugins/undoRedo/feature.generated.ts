// Generated from `feature.json` by `npm run generate:feature-manifest`. Do not edit it by hand.

import type { PluginLicense } from '../../utils/licenseCapabilities/types';

// The license token of the UndoRedo plugin, its display name, where it is checked (`gate`), and the
// tokens it requires (`implies`), which a license key that lists it grants with it.
export const LICENSE: PluginLicense = Object.freeze({
  capability: 'feat:undo_redo',
  name: 'Undo and redo',
  gate: 'enable',
  implies: Object.freeze([]),
});
