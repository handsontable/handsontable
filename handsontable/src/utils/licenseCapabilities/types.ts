/**
 * Where a plugin checks its license token. `enable` keeps the plugin off when the key's tiers do not include it.
 * `call` is for a plugin that is on in every grid: its public methods check the token when they are called.
 */
export type PluginLicenseGate = 'enable' | 'call';

/**
 * What a plugin a license key can name declares about itself, generated from its `feature.json` into its
 * `feature.generated.ts` and exposed as the plugin's static `LICENSE`.
 */
export interface PluginLicense {
  /**
   * The plugin's feature id, for example `'feat:filters'`, as the license message and the manifest name it.
   */
  readonly capability: string;
  /**
   * The display name the license message prints, for example `'Filters'`.
   */
  readonly name: string;
  /**
   * Where the plugin checks the token.
   */
  readonly gate: PluginLicenseGate;
  /**
   * The license tiers that include the plugin. A key that names one of them unlocks it.
   */
  readonly tiers: readonly string[];
}
