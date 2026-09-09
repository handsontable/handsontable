/* eslint-disable no-script-url -- the script URLs below are the subject of these tests. */
import { findLinkTokens } from '../findLinkTokens';

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
    expect(findLinkTokens('quote "https://a.com/x"', BASE)).toEqual([
      { start: 7, end: 22, href: 'https://a.com/x' },
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
});
