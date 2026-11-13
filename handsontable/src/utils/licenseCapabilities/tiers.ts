/**
 * The prefix of a tier token in a license key: `tier:<name>` names a license tier, and a key that names
 * one unlocks every feature whose tiers list it.
 */
export const TIER_PREFIX = 'tier:';

/**
 * Returns the tiers a key's capability tokens name, in the order they are listed. A token with no name
 * after the prefix names no tier.
 *
 * @param {string[]} capabilities The capability tokens of a key's Handsontable entry.
 * @returns {string[] | null} The tier names, or `null` when the key names no tier.
 */
export function getKeyTiers(capabilities: readonly string[]): string[] | null {
  const tiers: string[] = [];

  capabilities.forEach((token) => {
    if (token.startsWith(TIER_PREFIX) && token.length > TIER_PREFIX.length) {
      tiers.push(token.slice(TIER_PREFIX.length));
    }
  });

  return tiers.length > 0 ? tiers : null;
}
