import { linkifyCell, unlinkifyCell, AUTO_LINK_CLASS_NAME, type LinkifyOptions } from '../linkifyCell';

const BASE = 'https://example.com/dir/page.html';

/**
 * @param {Partial<LinkifyOptions>} [overrides] Option overrides.
 * @returns {LinkifyOptions} The options.
 */
function options(overrides: Partial<LinkifyOptions> = {}): LinkifyOptions {
  return {
    baseUrl: BASE,
    target: '_blank',
    schemes: ['http', 'https', 'mailto', 'tel'],
    inline: true,
    classNames: [],
    ...overrides,
  };
}

/**
 * @param {string} html The cell's inner HTML.
 * @returns {HTMLTableCellElement} The cell.
 */
function cell(html: string): HTMLTableCellElement {
  const td = document.createElement('td');

  td.innerHTML = html;

  return td;
}

/**
 * @param {Element} root The element to read anchors from.
 * @returns {string[]} The `href` of every own anchor, in order.
 */
function hrefs(root: Element): string[] {
  return Array.from(root.querySelectorAll<HTMLAnchorElement>(`a.${AUTO_LINK_CLASS_NAME}`)).map(a => a.href);
}

describe('linkifyCell', () => {
  describe('inline mode', () => {
    it('should leave a cell without a URL untouched', () => {
      const td = cell('plain text');

      linkifyCell(td, options());

      expect(td.innerHTML).toBe('plain text');
    });

    it('should wrap a whole-cell URL', () => {
      const td = cell('https://a.com/x');

      linkifyCell(td, options());

      expect(td.innerHTML).toBe(
        '<a class="ht-link ht-auto-link" href="https://a.com/x" target="_blank" rel="noopener noreferrer" ' +
        'tabindex="-1">https://a.com/x</a>'
      );
    });

    it('should wrap every URL inside prose and keep the rest as text', () => {
      const td = cell('See https://a.com/one and mailto:b@c.com.');

      linkifyCell(td, options());

      expect(hrefs(td)).toEqual(['https://a.com/one', 'mailto:b@c.com']);
      expect(td.textContent).toBe('See https://a.com/one and mailto:b@c.com.');
      expect(td.childNodes.length).toBe(5);
    });

    it('should descend into a renderer\'s own elements', () => {
      const td = cell('<span class="mark">go https://a.com/x</span>');

      linkifyCell(td, options());

      expect(td.querySelector('span.mark a.ht-auto-link')?.getAttribute('href')).toBe('https://a.com/x');
      expect(td.textContent).toBe('go https://a.com/x');
    });

    it('should skip a cell that already holds an anchor', () => {
      const td = cell('<a href="https://user.com">https://a.com/x</a>');

      linkifyCell(td, options());

      expect(hrefs(td)).toEqual([]);
      expect(td.querySelectorAll('a').length).toBe(1);
    });

    it('should skip text inside interactive elements', () => {
      const td = cell('<button>https://a.com/x</button> https://a.com/y');

      linkifyCell(td, options());

      expect(hrefs(td)).toEqual(['https://a.com/y']);
      expect(td.querySelector('button')?.innerHTML).toBe('https://a.com/x');
    });

    it('should be idempotent across passes and rebuild from the current text', () => {
      const td = cell('https://a.com/x');

      linkifyCell(td, options());
      linkifyCell(td, options());

      expect(td.querySelectorAll('a').length).toBe(1);
      expect(td.textContent).toBe('https://a.com/x');

      // A renderer that keeps the DOM but changed the text node.
      td.querySelector('a')!.textContent = 'https://a.com/changed';
      linkifyCell(td, options());

      expect(hrefs(td)).toEqual(['https://a.com/changed']);
    });

    it('should apply target, schemes and class names', () => {
      const td = cell('https://a.com/x tel:+48123');

      linkifyCell(td, options({ target: '_self', schemes: ['https'], classNames: ['brand'] }));

      const anchors = td.querySelectorAll('a');

      expect(anchors.length).toBe(1);
      expect(anchors[0].className).toBe('ht-link ht-auto-link brand');
      expect(anchors[0].getAttribute('target')).toBe('_self');
    });

    it('should never build an anchor for a script URL', () => {
      // eslint-disable-next-line no-script-url
      const td = cell('javascript:alert(1)');

      linkifyCell(td, options());

      expect(td.querySelector('a')).toBe(null);
    });
  });

  describe('whole-cell mode', () => {
    it('should wrap the whole content when the trimmed text is exactly one URL', () => {
      const td = cell('  https://a.com/x ');

      linkifyCell(td, options({ inline: false }));

      expect(td.querySelectorAll('a').length).toBe(1);
      expect(td.querySelector('a')?.getAttribute('href')).toBe('https://a.com/x');
      expect(td.textContent).toBe('  https://a.com/x ');
    });

    it('should wrap a renderer\'s elements together with the text', () => {
      const td = cell('<span class="mark">https://a.com/x</span>');

      linkifyCell(td, options({ inline: false }));

      expect(td.firstElementChild?.tagName).toBe('A');
      expect(td.querySelector('a > span.mark')).not.toBe(null);
    });

    it('should not link text that holds a URL among other words', () => {
      const td = cell('see https://a.com/x now');

      linkifyCell(td, options({ inline: false }));

      expect(td.querySelector('a')).toBe(null);
    });

    it('should not link two URLs', () => {
      const td = cell('https://a.com/x https://a.com/y');

      linkifyCell(td, options({ inline: false }));

      expect(td.querySelector('a')).toBe(null);
    });
  });
});

describe('unlinkifyCell', () => {
  it('should remove own anchors and leave foreign ones', () => {
    const td = cell('https://a.com/x');

    linkifyCell(td, options());

    // A foreign anchor appended after the pass, the way an `html` renderer's content would sit.
    const foreign = document.createElement('a');

    foreign.href = 'https://user.com';
    foreign.textContent = 'u';
    td.append(' ', foreign);

    expect(unlinkifyCell(td)).toBe(1);
    expect(td.querySelectorAll('a').length).toBe(1);
    expect(td.querySelector('a')?.textContent).toBe('u');
    expect(td.textContent).toBe('https://a.com/x u');
  });
});
