import { getKeyTiers } from 'handsontable/utils/licenseCapabilities/tiers';

describe('getKeyTiers()', () => {
  it('should return the tiers a key lists, in order', () => {
    expect(getKeyTiers(['core', 'tier:alpha', 'feat:filters', 'tier:beta'])).toEqual(['alpha', 'beta']);
  });

  it('should return null for a key that lists no tier', () => {
    expect(getKeyTiers(['core', 'feat:filters', 'xlsx:all'])).toBe(null);
    expect(getKeyTiers([])).toBe(null);
  });

  it('should return null for a key that carries only the token issued to a key with no tier', () => {
    // `core` on keys issued before tiers, `grid` on keys issued since: both unlock every feature.
    expect(getKeyTiers(['core'])).toBe(null);
    expect(getKeyTiers(['grid'])).toBe(null);
    expect(getKeyTiers(['core', 'grid'])).toBe(null);
  });

  it('should ignore a tier with no name and tokens that only look like one', () => {
    expect(getKeyTiers(['tier:', 'tier', 'feat:tier', 'xtier:alpha'])).toBe(null);
  });
});
