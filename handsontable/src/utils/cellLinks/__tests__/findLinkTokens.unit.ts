/* eslint-disable no-script-url -- the script URLs below are the subject of these tests. */
import { findLinkTokens } from '../findLinkTokens';
import { LINK_SCHEMES } from '../resolveLinkUrl';

const BASE = 'https://example.com/dir/page.html';

describe('findLinkTokens', () => {
  it('should return no tokens for text without a URL', () => {
    expect(findLinkTokens('plain text', BASE)).toEqual([]);
    expect(findLinkTokens('', BASE)).toEqual([]);
    expect(findLinkTokens('ratio 3:4', BASE)).toEqual([]);
  });

  it('should tokenize a whole-string URL', () => {
    expect(findLinkTokens('https://a.com/x', BASE)).toEqual([
      { start: 0, end: 15, href: 'https://a.com/x' },
    ]);
  });

  it('should tokenize URLs embedded in prose, in order', () => {
    const text = 'See https://a.com/one and http://b.com/two today';

    expect(findLinkTokens(text, BASE)).toEqual([
      { start: 4, end: 21, href: 'https://a.com/one' },
      { start: 26, end: 42, href: 'http://b.com/two' },
    ]);
  });

  it('should tokenize `mailto:` and `tel:` URLs', () => {
    expect(findLinkTokens('mail mailto:a@b.com or call tel:+48123456789', BASE)).toEqual([
      { start: 5, end: 19, href: 'mailto:a@b.com' },
      { start: 28, end: 44, href: 'tel:+48123456789' },
    ]);
  });

  it('should match the scheme case-insensitively', () => {
    expect(findLinkTokens('HTTPS://A.com/X', BASE)).toEqual([
      { start: 0, end: 15, href: 'https://a.com/X' },
    ]);
  });

  it('should trim trailing punctuation', () => {
    expect(findLinkTokens('go to https://a.com/x.', BASE)).toEqual([
      { start: 6, end: 21, href: 'https://a.com/x' },
    ]);
    expect(findLinkTokens('really? https://a.com/x!?', BASE)).toEqual([
      { start: 8, end: 23, href: 'https://a.com/x' },
    ]);
  });

  it('should drop an unbalanced closing bracket but keep a balanced one', () => {
    expect(findLinkTokens('(see https://a.com/x)', BASE)).toEqual([
      { start: 5, end: 20, href: 'https://a.com/x' },
    ]);
    expect(findLinkTokens('(see https://a.com/x).', BASE)).toEqual([
      { start: 5, end: 20, href: 'https://a.com/x' },
    ]);
    expect(findLinkTokens('https://en.wikipedia.org/wiki/Foo_(bar)', BASE)).toEqual([
      { start: 0, end: 39, href: 'https://en.wikipedia.org/wiki/Foo_(bar)' },
    ]);
    expect(findLinkTokens('[https://a.com/x]', BASE)).toEqual([
      { start: 1, end: 16, href: 'https://a.com/x' },
    ]);
  });

  it('should stop a URL at whitespace and at angle brackets', () => {
    expect(findLinkTokens('a <https://a.com/x> b', BASE)).toEqual([
      { start: 3, end: 18, href: 'https://a.com/x' },
    ]);
  });

  it('should stop a URL at a quote', () => {
    expect(findLinkTokens('quote "https://a.com/x"', BASE)).toEqual([
      { start: 7, end: 22, href: 'https://a.com/x' },
    ]);
  });

  it('should never tokenize a `javascript:` or `data:` URL', () => {
    expect(findLinkTokens('javascript:alert(1)', BASE)).toEqual([]);
    expect(findLinkTokens('JAVASCRIPT:alert(1)', BASE)).toEqual([]);
    expect(findLinkTokens('data:text/html,<script>alert(1)</script>', BASE)).toEqual([]);
  });

  it('should skip a token that does not parse as a URL', () => {
    expect(findLinkTokens('broken https:// here', BASE)).toEqual([]);
  });

  it('should honour the `schemes` narrowing', () => {
    expect(findLinkTokens('mailto:a@b.com https://a.com/x', BASE, ['https'])).toEqual([
      { start: 15, end: 30, href: 'https://a.com/x' },
    ]);
    expect(findLinkTokens('https://a.com/x', BASE, [])).toEqual([]);
  });

  it('should keep offsets into the original text after trimming', () => {
    const text = 'x https://a.com/x)). y';
    const [token] = findLinkTokens(text, BASE);

    expect(text.slice(token.start, token.end)).toBe('https://a.com/x');
  });

  it('should drop a candidate that erodes through its own scheme colon', () => {
    expect(findLinkTokens('x tel:: y', BASE)).toEqual([]);
    expect(findLinkTokens('contact mailto:.', BASE)).toEqual([]);
    expect(findLinkTokens('bare tel: now', BASE)).toEqual([]);
  });

  it('should split two URLs joined by a comma into separate tokens', () => {
    expect(findLinkTokens('See https://a.com,https://b.com end', BASE)).toEqual([
      { start: 4, end: 17, href: 'https://a.com/' },
      { start: 18, end: 31, href: 'https://b.com/' },
    ]);
  });

  it('should not split a URL whose path merely contains a scheme word', () => {
    expect(findLinkTokens('https://example.com/hotel:deals', BASE)).toEqual([
      { start: 0, end: 31, href: 'https://example.com/hotel:deals' },
    ]);
    expect(findLinkTokens('https://a.com/x-mailto:y', BASE)).toEqual([
      { start: 0, end: 24, href: 'https://a.com/x-mailto:y' },
    ]);
  });

  it('should trim a long run of trailing unbalanced brackets without quadratic blowup', () => {
    const text = `https://a.com/x${')'.repeat(20000)}`;

    expect(findLinkTokens(text, BASE)).toEqual([
      { start: 0, end: 15, href: 'https://a.com/x' },
    ]);
  });

  it('should split two URLs glued together with no delimiter at an embedded `https?://`', () => {
    const text = 'https://a.com/xhttps://b.com/y';

    expect(findLinkTokens(text, BASE)).toEqual([
      { start: 0, end: 15, href: 'https://a.com/x' },
      { start: 15, end: 30, href: 'https://b.com/y' },
    ]);
  });

  it('should split a `mailto:` URL glued to a following `https://` URL', () => {
    const text = 'mailto:a@b.comhttps://c.com';

    expect(findLinkTokens(text, BASE)).toEqual([
      { start: 0, end: 14, href: 'mailto:a@b.com' },
      { start: 14, end: 27, href: 'https://c.com/' },
    ]);
  });

  it('should still split two URLs joined only by a comma', () => {
    expect(findLinkTokens('See https://a.com,https://b.com end', BASE)).toEqual([
      { start: 4, end: 17, href: 'https://a.com/' },
      { start: 18, end: 31, href: 'https://b.com/' },
    ]);
  });

  it('should split a `mailto:` URL joined to a preceding `https://` URL only by a comma', () => {
    // Regression: the `EMBEDDED_SCHEME_PATTERN` exclusion class used to read `+-/` as a RANGE
    // (`+` through `/`), which also swallowed `,` - so the comma no longer separated the two URLs
    // and this stayed one garbled token.
    expect(findLinkTokens('https://a.com,mailto:b@c.com', BASE)).toEqual([
      { start: 0, end: 13, href: 'https://a.com/' },
      { start: 14, end: 28, href: 'mailto:b@c.com' },
    ]);
  });

  it('should split a `tel:` URL joined to a preceding `https://` URL only by a comma', () => {
    expect(findLinkTokens('https://a.com,tel:+48123', BASE)).toEqual([
      { start: 0, end: 13, href: 'https://a.com/' },
      { start: 14, end: 24, href: 'tel:+48123' },
    ]);
  });

  it('should not split an embedded `tel:` that is a hyphenated URL word', () => {
    // The hyphen is a legal URL word character, so "x-tel:1" reads as one path segment, not two
    // joined URLs - unlike the comma cases above.
    expect(findLinkTokens('https://a.com/x-tel:1', BASE)).toEqual([
      { start: 0, end: 21, href: 'https://a.com/x-tel:1' },
    ]);
  });

  it('should not read a bare `tel:`/`mailto:` word glued to a preceding word as a scheme', () => {
    expect(findLinkTokens('Grand Hotel:Warsaw', BASE)).toEqual([]);
    expect(findLinkTokens('motel:12 rooms', BASE)).toEqual([]);
    expect(findLinkTokens('see xmailto:a@b.com', BASE)).toEqual([]);
  });

  it('should still tokenize a `mailto:`/`tel:` scheme that starts a new word', () => {
    expect(findLinkTokens('mail mailto:a@b.com', BASE)).toEqual([
      { start: 5, end: 19, href: 'mailto:a@b.com' },
    ]);
    expect(findLinkTokens('(tel:+48123)', BASE)).toEqual([
      { start: 1, end: 11, href: 'tel:+48123' },
    ]);
  });

  it('should not split an embedded `https://` immediately preceded by a `/`', () => {
    expect(findLinkTokens('https://web.archive.org/web/2020/https://example.com', BASE)).toEqual([
      { start: 0, end: 52, href: 'https://web.archive.org/web/2020/https://example.com' },
    ]);
  });

  it('should not split an embedded `tel:` that is a path segment, wiki-style', () => {
    expect(findLinkTokens('https://en.wikipedia.org/wiki/Tel:Aviv', BASE)).toEqual([
      { start: 0, end: 38, href: 'https://en.wikipedia.org/wiki/Tel:Aviv' },
    ]);
  });

  it('should still split a redirect-style URL at the `=` (documented design choice)', () => {
    expect(findLinkTokens('http://a.com/r?url=https://b.com', BASE)).toEqual([
      { start: 0, end: 19, href: 'http://a.com/r?url=' },
      { start: 19, end: 32, href: 'https://b.com/' },
    ]);
  });
});

describe('strict: false', () => {
  it('should link a whole-string bare domain as `https`', () => {
    expect(findLinkTokens('google.com', BASE, LINK_SCHEMES, false)).toEqual([
      { start: 0, end: 10, href: 'https://google.com/' },
    ]);
  });

  it('should link a bare domain with a `www` label, a path and a query inside prose', () => {
    expect(findLinkTokens('see www.google.com/path?q=1 now', BASE, LINK_SCHEMES, false)).toEqual([
      { start: 4, end: 27, href: 'https://www.google.com/path?q=1' },
    ]);
  });

  it('should link a bare domain with a subdomain, a multi-label TLD, a port and a path', () => {
    expect(findLinkTokens('sub.example.co.uk:8080/x', BASE, LINK_SCHEMES, false)).toEqual([
      { start: 0, end: 24, href: 'https://sub.example.co.uk:8080/x' },
    ]);
  });

  it('should lowercase the host of a mixed-case bare domain', () => {
    expect(findLinkTokens('Example.COM', BASE, LINK_SCHEMES, false)).toEqual([
      { start: 0, end: 11, href: 'https://example.com/' },
    ]);
  });

  it('should trim a bare domain wrapped in a parenthetical and a trailing period', () => {
    expect(findLinkTokens('(example.com).', BASE, LINK_SCHEMES, false)).toEqual([
      { start: 1, end: 12, href: 'https://example.com/' },
    ]);
  });

  it('should link a bare email address as `mailto`', () => {
    expect(findLinkTokens('jane@example.com', BASE, LINK_SCHEMES, false)).toEqual([
      { start: 0, end: 16, href: 'mailto:jane@example.com' },
    ]);
  });

  it('should link a bare email and a bare domain in the same text as two tokens, never the ' +
    'email\'s domain alone', () => {
    expect(findLinkTokens('mail jane@example.com or example.org', BASE, LINK_SCHEMES, false)).toEqual([
      { start: 5, end: 21, href: 'mailto:jane@example.com' },
      { start: 25, end: 36, href: 'https://example.org/' },
    ]);
  });

  it('should link a scheme URL and a bare domain in the same text, the scheme token first', () => {
    expect(findLinkTokens('https://a.com and b.com', BASE, LINK_SCHEMES, false)).toEqual([
      { start: 0, end: 13, href: 'https://a.com/' },
      { start: 18, end: 23, href: 'https://b.com/' },
    ]);
  });

  it('should not link a bare domain whose TLD is not a known top-level domain', () => {
    expect(findLinkTokens('node.js', BASE, LINK_SCHEMES, false)).toEqual([]);
    expect(findLinkTokens('file.txt', BASE, LINK_SCHEMES, false)).toEqual([]);
    expect(findLinkTokens('example.notatld', BASE, LINK_SCHEMES, false)).toEqual([]);
  });

  it('should link a bare domain whose TLD is also a common file extension: no exclusion list, ' +
    'the full IANA list is used (documented trade-off)', () => {
    expect(findLinkTokens('report.zip', BASE, LINK_SCHEMES, false)).toEqual([
      { start: 0, end: 10, href: 'https://report.zip/' },
    ]);
    expect(findLinkTokens('video.mov', BASE, LINK_SCHEMES, false)).toEqual([
      { start: 0, end: 9, href: 'https://video.mov/' },
    ]);
  });

  it('should never mistake an IP address or a version-like string for a bare domain', () => {
    expect(findLinkTokens('1.2.3', BASE, LINK_SCHEMES, false)).toEqual([]);
    expect(findLinkTokens('192.168.0.1', BASE, LINK_SCHEMES, false)).toEqual([]);
    expect(findLinkTokens('v1.2.3-rc.1', BASE, LINK_SCHEMES, false)).toEqual([]);
  });

  it('should not link a two-character label as a bare domain: the TLD group requires 2 letters', () => {
    expect(findLinkTokens('a.b', BASE, LINK_SCHEMES, false)).toEqual([]);
  });

  it('should link only the whole URL, never its bare-domain suffix a second time', () => {
    expect(findLinkTokens('https://foo.example.com', BASE, LINK_SCHEMES, false)).toEqual([
      { start: 0, end: 23, href: 'https://foo.example.com/' },
    ]);
  });

  it('should link a bare domain whose TLD is a country code, even where it reads as a file ' +
    'extension or an English word (documented trade-off)', () => {
    expect(findLinkTokens('README.md', BASE, LINK_SCHEMES, false)).toEqual([
      { start: 0, end: 9, href: 'https://readme.md/' },
    ]);
    expect(findLinkTokens('deploy.sh', BASE, LINK_SCHEMES, false)).toEqual([
      { start: 0, end: 9, href: 'https://deploy.sh/' },
    ]);
  });

  it('should yield only the scheme tokens in strict mode for every bare-domain and bare-email ' +
    'case above', () => {
    const strictInputs = [
      'google.com',
      'see www.google.com/path?q=1 now',
      'sub.example.co.uk:8080/x',
      'Example.COM',
      '(example.com).',
      'jane@example.com',
      'mail jane@example.com or example.org',
      'node.js',
      'file.txt',
      'report.zip',
      'video.mov',
      '1.2.3',
      '192.168.0.1',
      'v1.2.3-rc.1',
      'a.b',
      'example.notatld',
      'README.md',
      'deploy.sh',
    ];

    strictInputs.forEach((input) => {
      expect(findLinkTokens(input, BASE)).toEqual([]);
    });

    expect(findLinkTokens('https://a.com and b.com', BASE)).toEqual([
      { start: 0, end: 13, href: 'https://a.com/' },
    ]);
    expect(findLinkTokens('https://foo.example.com', BASE)).toEqual([
      { start: 0, end: 23, href: 'https://foo.example.com/' },
    ]);
  });
});
