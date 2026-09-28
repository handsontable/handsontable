import { TLD_LIST, isKnownTld } from '../tlds';

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

  it('should carry a generic TLD that also reads as a common file extension: no exclusion list', () => {
    // The full IANA list is used, punycode aside - a bare domain ending in one of these is still
    // linkable under `strict: false`. `strict: true` (the default) or `autoLink: false` is how a
    // filename column stays plain text; see the `strict` option's docs.
    ['zip', 'mov'].forEach((tld) => {
      expect(entries).toContain(tld);
    });
  });

  it('should carry the common generic and country-code TLDs', () => {
    ['com', 'org', 'io', 'pl', 'md', 'py', 'co'].forEach((tld) => {
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
