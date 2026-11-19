// Generated from `feature.json` by `npm run generate:feature-manifest`. Do not edit it by hand.

import type { PluginLicense } from '../../utils/licenseCapabilities/types';

// The modules the FormulaBuilder plugin needs registered, in the `PLUGIN_DEPS` format (`type:Name`).
export const PLUGIN_DEPS: readonly string[] = [
  'plugin:Formulas',
];

// The license token of the FormulaBuilder plugin, its display name, where it is checked (`gate`), and the
// license tiers that include it (`tiers`).
export const LICENSE: PluginLicense = Object.freeze({
  capability: 'feat:formula_builder',
  name: 'Formula builder',
  gate: 'enable',
  tiers: Object.freeze([
    'standard',
    'professional',
  ]),
});
