/* eslint-disable no-script-url -- the script URLs below are the subject of these tests: the guard
   must be exercised with the literal payloads it is meant to refuse. */
import { resolveLinkUrl, normalizeSchemes, normalizeSchemesWithFallback, type LinkScheme } from '../resolveLinkUrl';

const BASE = 'https://example.com/dir/page.html';

describe('resolveLinkUrl', () => {
  describe('allowed protocols', () => {
    it('should accept an `http` URL', () => {
      expect(resolveLinkUrl('http://a.com/x', BASE)).toBe('http://a.com/x');
    });

    it('should accept an `https` URL', () => {
      expect(resolveLinkUrl('https://a.com/x?q=1#f', BASE)).toBe('https://a.com/x?q=1#f');
    });

    it('should accept a `mailto` URL', () => {
      expect(resolveLinkUrl('mailto:someone@example.com', BASE)).toBe('mailto:someone@example.com');
    });

    it('should accept a `tel` URL', () => {
      expect(resolveLinkUrl('tel:+48123456789', BASE)).toBe('tel:+48123456789');
    });
  });

  describe('rejected protocols', () => {
    it('should reject a `javascript` URL', () => {
      expect(resolveLinkUrl('javascript:alert(1)', BASE)).toBe(null);
    });

    it('should reject a `javascript` URL written in mixed case', () => {
      expect(resolveLinkUrl('JaVaScRiPt:alert(1)', BASE)).toBe(null);
    });

    it('should reject a `javascript` URL obfuscated with a tab', () => {
      expect(resolveLinkUrl('java\tscript:alert(1)', BASE)).toBe(null);
    });

    it('should reject a `javascript` URL obfuscated with a newline', () => {
      expect(resolveLinkUrl('java\nscript:alert(1)', BASE)).toBe(null);
    });

    it('should reject a `javascript` URL padded with leading whitespace', () => {
      expect(resolveLinkUrl('   javascript:alert(1)', BASE)).toBe(null);
    });

    it('should reject a `data` URL', () => {
      expect(resolveLinkUrl('data:text/html,<script>alert(1)</script>', BASE)).toBe(null);
    });

    it('should reject a `vbscript` URL', () => {
      expect(resolveLinkUrl('vbscript:msgbox(1)', BASE)).toBe(null);
    });

    it('should reject a `file` URL', () => {
      expect(resolveLinkUrl('file:///etc/passwd', BASE)).toBe(null);
    });
  });

  describe('resolution against the base URL', () => {
    it('should resolve a root-relative URL', () => {
      expect(resolveLinkUrl('/a/b', BASE)).toBe('https://example.com/a/b');
    });

    it('should resolve a path-relative URL', () => {
      expect(resolveLinkUrl('sub/page', BASE)).toBe('https://example.com/dir/sub/page');
    });

    it('should resolve a protocol-relative URL', () => {
      expect(resolveLinkUrl('//example.org/p', BASE)).toBe('https://example.org/p');
    });

    it('should reject a protocol-relative URL when the base itself is not allowlisted', () => {
      expect(resolveLinkUrl('//example.org/p', 'file:///tmp/page.html')).toBe(null);
    });
  });

  describe('unusable input', () => {
    it('should reject an empty string', () => {
      expect(resolveLinkUrl('', BASE)).toBe(null);
    });

    it('should reject a whitespace-only string', () => {
      expect(resolveLinkUrl('   \t ', BASE)).toBe(null);
    });

    it('should reject an unparseable URL', () => {
      expect(resolveLinkUrl('http://', BASE)).toBe(null);
    });

    it('should reject a non-string value', () => {
      expect(resolveLinkUrl(undefined as unknown as string, BASE)).toBe(null);
      expect(resolveLinkUrl(null as unknown as string, BASE)).toBe(null);
      expect(resolveLinkUrl(42 as unknown as string, BASE)).toBe(null);
    });

    it('should reject any URL when the base URL is unusable', () => {
      expect(resolveLinkUrl('https://a.com', '')).toBe(null);
    });
  });

  describe('`schemes` narrowing', () => {
    it('should refuse a scheme left out of the `schemes` list', () => {
      expect(resolveLinkUrl('mailto:someone@example.com', BASE, ['http', 'https'])).toBe(null);
      expect(resolveLinkUrl('tel:+48123456789', BASE, ['http', 'https'])).toBe(null);
    });

    it('should accept a scheme kept in the `schemes` list', () => {
      expect(resolveLinkUrl('https://a.com/x', BASE, ['https'])).toBe('https://a.com/x');
    });

    it('should never widen the allowlist through `schemes`', () => {
      // A JavaScript caller can pass anything; the fixed allowlist still wins.
      expect(resolveLinkUrl('javascript:alert(1)', BASE, ['javascript'] as unknown as LinkScheme[])).toBe(null);
    });
  });

  describe('normalizeSchemes', () => {
    it('should return the full allowlist for a non-array', () => {
      expect(normalizeSchemes(undefined)).toEqual(['http', 'https', 'mailto', 'tel']);
      expect(normalizeSchemes('https')).toEqual(['http', 'https', 'mailto', 'tel']);
    });

    it('should drop unknown entries and duplicates', () => {
      expect(normalizeSchemes(['https', 'javascript', 'https', 'tel'])).toEqual(['https', 'tel']);
    });

    it('should return an empty list when nothing is allowed', () => {
      expect(normalizeSchemes([])).toEqual([]);
    });
  });

  describe('normalizeSchemesWithFallback', () => {
    const FALLBACK: LinkScheme[] = ['https', 'tel'];

    it('should return the fallback for a non-array value', () => {
      expect(normalizeSchemesWithFallback(undefined, FALLBACK)).toEqual(FALLBACK);
      expect(normalizeSchemesWithFallback('https', FALLBACK)).toEqual(FALLBACK);
    });

    it('should keep an explicit empty array empty, not fall back', () => {
      expect(normalizeSchemesWithFallback([], FALLBACK)).toEqual([]);
    });

    it('should fall back when every entry is unknown', () => {
      expect(normalizeSchemesWithFallback(['htps', 'javascript'], FALLBACK)).toEqual(FALLBACK);
    });

    it('should narrow to only the recognized entries of a partially valid array', () => {
      expect(normalizeSchemesWithFallback(['https', 'htps'], FALLBACK)).toEqual(['https']);
    });

    it('should keep a fully valid array as-is, in allowlist order', () => {
      expect(normalizeSchemesWithFallback(['tel', 'http'], FALLBACK)).toEqual(['http', 'tel']);
    });
  });
});
