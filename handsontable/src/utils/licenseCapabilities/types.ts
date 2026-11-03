/**
 * Where a plugin checks its license token. `enable` keeps the plugin off when the key does not list the token.
 * `call` is for a plugin that is on in every grid: its public methods check the token when they are called.
 */
export type PluginLicenseGate = 'enable' | 'call';

/**
 * What a plugin a license key can name declares about itself, generated from its `feature.json` into its
 * `feature.generated.ts` and exposed as the plugin's static `LICENSE`.
 */
export interface PluginLicense {
  /**
   * The token a license key lists to unlock the plugin, for example `'feat:filters'`.
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
   * Every token the plugin requires, directly or through other features. A key that lists the plugin's token
   * grants these too, so a key keeps working when a later release adds a requirement.
   */
  readonly implies: readonly string[];
}
