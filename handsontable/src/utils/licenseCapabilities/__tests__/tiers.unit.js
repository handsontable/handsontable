import { getKeyTiers } from 'handsontable/utils/licenseCapabilities/tiers';

describe('getKeyTiers()', () => {
  it('should return the tiers a key lists, in order', () => {
    expect(getKeyTiers(['core', 'tier:alpha', 'feat:filters', 'tier:beta'])).toEqual(['alpha', 'beta']);
  });

  it('should return null for a key that lists no tier', () => {
    expect(getKeyTiers(['core', 'feat:filters', 'xlsx:all'])).toBe(null);
    expect(getKeyTiers([])).toBe(null);
  });

  it('should ignore a tier with no name and tokens that only look like one', () => {
    expect(getKeyTiers(['tier:', 'tier', 'feat:tier', 'xtier:alpha'])).toBe(null);
  });
});
