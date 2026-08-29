/* eslint-disable no-script-url -- the script URLs below are the subject of these tests: the guard
   must be exercised with the literal payloads it is meant to refuse. */
import { resolveHyperlinkUrl } from '../hyperlinkUrl';

const BASE = 'https://example.com/dir/page.html';

describe('resolveHyperlinkUrl', () => {
  describe('allowed protocols', () => {
    it('should accept an `http` URL', () => {
      expect(resolveHyperlinkUrl('http://a.com/x', BASE)).toBe('http://a.com/x');
    });

    it('should accept an `https` URL', () => {
      expect(resolveHyperlinkUrl('https://a.com/x?q=1#f', BASE)).toBe('https://a.com/x?q=1#f');
    });

    it('should accept a `mailto` URL', () => {
      expect(resolveHyperlinkUrl('mailto:someone@example.com', BASE)).toBe('mailto:someone@example.com');
    });

    it('should accept a `tel` URL', () => {
      expect(resolveHyperlinkUrl('tel:+48123456789', BASE)).toBe('tel:+48123456789');
    });
  });

  describe('rejected protocols', () => {
    it('should reject a `javascript` URL', () => {
      expect(resolveHyperlinkUrl('javascript:alert(1)', BASE)).toBe(null);
    });

    it('should reject a `javascript` URL written in mixed case', () => {
      expect(resolveHyperlinkUrl('JaVaScRiPt:alert(1)', BASE)).toBe(null);
    });

    it('should reject a `javascript` URL obfuscated with a tab', () => {
      expect(resolveHyperlinkUrl('java\tscript:alert(1)', BASE)).toBe(null);
    });

    it('should reject a `javascript` URL obfuscated with a newline', () => {
      expect(resolveHyperlinkUrl('java\nscript:alert(1)', BASE)).toBe(null);
    });

    it('should reject a `javascript` URL padded with leading whitespace', () => {
      expect(resolveHyperlinkUrl('   javascript:alert(1)', BASE)).toBe(null);
    });

    it('should reject a `data` URL', () => {
      expect(resolveHyperlinkUrl('data:text/html,<script>alert(1)</script>', BASE)).toBe(null);
    });

    it('should reject a `vbscript` URL', () => {
      expect(resolveHyperlinkUrl('vbscript:msgbox(1)', BASE)).toBe(null);
    });

    it('should reject a `file` URL', () => {
      expect(resolveHyperlinkUrl('file:///etc/passwd', BASE)).toBe(null);
    });
  });

  describe('resolution against the base URL', () => {
    it('should resolve a root-relative URL', () => {
      expect(resolveHyperlinkUrl('/a/b', BASE)).toBe('https://example.com/a/b');
    });

    it('should resolve a path-relative URL', () => {
      expect(resolveHyperlinkUrl('sub/page', BASE)).toBe('https://example.com/dir/sub/page');
    });

    it('should resolve a protocol-relative URL', () => {
      expect(resolveHyperlinkUrl('//example.org/p', BASE)).toBe('https://example.org/p');
    });

    it('should reject a protocol-relative URL when the base itself is not allowlisted', () => {
      expect(resolveHyperlinkUrl('//example.org/p', 'file:///tmp/page.html')).toBe(null);
    });
  });

  describe('unusable input', () => {
    it('should reject an empty string', () => {
      expect(resolveHyperlinkUrl('', BASE)).toBe(null);
    });

    it('should reject a whitespace-only string', () => {
      expect(resolveHyperlinkUrl('   \t ', BASE)).toBe(null);
    });

    it('should reject an unparseable URL', () => {
      expect(resolveHyperlinkUrl('http://', BASE)).toBe(null);
    });

    it('should reject a non-string value', () => {
      expect(resolveHyperlinkUrl(undefined as unknown as string, BASE)).toBe(null);
      expect(resolveHyperlinkUrl(null as unknown as string, BASE)).toBe(null);
      expect(resolveHyperlinkUrl(42 as unknown as string, BASE)).toBe(null);
    });

    it('should reject any URL when the base URL is unusable', () => {
      expect(resolveHyperlinkUrl('https://a.com', '')).toBe(null);
    });
  });
});
