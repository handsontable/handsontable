import { TLD_LIST, isKnownTld } from '../tlds';

const EXCLUDED_TLDS = ['zip', 'mov', 'ico', 'map', 'mobi', 'pub'];

describe('tlds', () => {
  const entries = TLD_LIST.split(' ');

  it('should hold only lowercase entries', () => {
    entries.forEach((tld) => {
      expect(tld).toBe(tld.toLowerCase());
    });
  });

  it('should be sorted', () => {
    const sorted = [...entries].sort();

    expect(entries).toEqual(sorted);
  });

  it('should have no duplicate entries', () => {
    expect(new Set(entries).size).toBe(entries.length);
  });

  it('should not carry any punycode (`xn--`) entry', () => {
    entries.forEach((tld) => {
      expect(tld.startsWith('xn--')).toBe(false);
    });
  });

  it('should not carry any of the excluded generic TLDs', () => {
    EXCLUDED_TLDS.forEach((excluded) => {
      expect(entries).not.toContain(excluded);
    });
  });

  it('should carry the common generic and country-code TLDs', () => {
    ['com', 'org', 'io', 'pl', 'md', 'co'].forEach((tld) => {
      expect(entries).toContain(tld);
    });
  });

  it('should have more than 1000 entries', () => {
    expect(entries.length).toBeGreaterThan(1000);
  });

  describe('isKnownTld', () => {
    it('should treat an already-lowercased known TLD as known', () => {
      expect(isKnownTld('COM'.toLowerCase())).toBe(true);
    });

    it('should treat an unknown TLD as unknown', () => {
      expect(isKnownTld('notatld')).toBe(false);
    });
  });
});
