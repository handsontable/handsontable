import {
  createLinkElement, hideSchemePrefix, unwrapLinks, wrapCellContent,
  LINK_CLASS_NAME, LINK_SCHEME_CLASS_NAME,
} from '../linkElement';
import { CELL_CLIP_CLASS } from '../../../helpers/dom/element';

describe('createLinkElement', () => {
  it('should build an anchor with the shared class, href, target, rel and tabindex', () => {
    const link = createLinkElement(document, { href: 'https://a.com/x', target: '_blank' });

    expect(link.tagName).toBe('A');
    expect(link.className).toBe(LINK_CLASS_NAME);
    expect(link.getAttribute('href')).toBe('https://a.com/x');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    expect(link.tabIndex).toBe(-1);
    expect(link.childNodes.length).toBe(0);
  });

  it('should append the extra class names after the shared one', () => {
    const link = createLinkElement(document, {
      href: 'https://a.com/x', target: '_self', classNames: ['ht-auto-link', 'brand'],
    });

    expect(link.className).toBe('ht-link ht-auto-link brand');
    expect(link.getAttribute('target')).toBe('_self');
  });

  it('should ignore empty class names', () => {
    const link = createLinkElement(document, { href: 'https://a.com/x', target: '_blank', classNames: ['', ' '] });

    expect(link.className).toBe('ht-link');
  });
});

describe('unwrapLinks', () => {
  it('should do nothing on an element without element children', () => {
    const td = document.createElement('td');

    td.textContent = 'plain';

    expect(unwrapLinks(td, 'a.ht-link')).toBe(0);
    expect(td.innerHTML).toBe('plain');
  });

  it('should move the anchor content up and merge the surrounding text nodes', () => {
    const td = document.createElement('td');
    const link = createLinkElement(document, { href: 'https://a.com/x', target: '_blank' });

    td.append('see ');
    link.append('https://a.com/x');
    td.append(link, ' now');

    expect(unwrapLinks(td, 'a.ht-link')).toBe(1);
    expect(td.querySelector('a')).toBe(null);
    expect(td.childNodes.length).toBe(1);
    expect(td.textContent).toBe('see https://a.com/x now');
  });

  it('should unwrap an anchor nested inside another element', () => {
    const td = document.createElement('td');
    const box = document.createElement('div');
    const link = createLinkElement(document, { href: 'https://a.com/x', target: '_blank' });

    link.append('label');
    box.append(link);
    td.append(box);

    expect(unwrapLinks(td, 'a.ht-link')).toBe(1);
    expect(box.innerHTML).toBe('label');
  });

  it('should unwrap anchors nested inside anchors', () => {
    const td = document.createElement('td');
    const outer = createLinkElement(document, { href: 'https://a.com/x', target: '_blank' });
    const inner = createLinkElement(document, { href: 'https://a.com/y', target: '_blank' });

    inner.append('label');
    outer.append(inner);
    td.append(outer);

    expect(unwrapLinks(td, 'a.ht-link')).toBe(2);
    expect(td.innerHTML).toBe('label');
  });

  it('should unwrap 50 sibling anchors in one pass and merge the text between them', () => {
    const td = document.createElement('td');

    for (let index = 0; index < 50; index++) {
      const link = createLinkElement(document, { href: `https://a.com/${index}`, target: '_blank' });

      link.append(`x${index}`);
      td.append(link);
    }

    expect(unwrapLinks(td, 'a.ht-link')).toBe(50);
    expect(td.querySelectorAll('a').length).toBe(0);
    expect(td.childNodes.length).toBe(1);
    expect(td.textContent).toBe(Array.from({ length: 50 }, (_, index) => `x${index}`).join(''));
  });

  it('should leave anchors that do not match the selector alone', () => {
    const td = document.createElement('td');
    const own = createLinkElement(document, {
      href: 'https://a.com/x', target: '_blank', classNames: ['ht-auto-link'],
    });
    const foreign = document.createElement('a');

    own.append('mine');
    foreign.href = 'https://a.com/user';
    foreign.append('user');
    td.append(own, foreign);

    expect(unwrapLinks(td, 'a.ht-auto-link')).toBe(1);
    expect(td.querySelectorAll('a').length).toBe(1);
    expect(td.querySelector('a')?.textContent).toBe('user');
  });
});

describe('hideSchemePrefix', () => {
  it('should wrap a `mailto:` prefix in a hidden span and keep the text content unchanged', () => {
    const link = createLinkElement(document, { href: 'mailto:a@b.com', target: '_blank' });

    link.textContent = 'mailto:a@b.com';

    expect(hideSchemePrefix(link)).toBe(true);
    expect(link.innerHTML).toBe(`<span class="${LINK_SCHEME_CLASS_NAME}">mailto:</span>a@b.com`);
    expect(link.textContent).toBe('mailto:a@b.com');
  });

  it('should wrap a `tel:` prefix with leading whitespace, keeping the whitespace outside the span', () => {
    const link = createLinkElement(document, { href: 'tel:+48123', target: '_blank' });

    link.textContent = '  tel:+48123';

    expect(hideSchemePrefix(link)).toBe(true);
    expect(link.innerHTML).toBe(`  <span class="${LINK_SCHEME_CLASS_NAME}">tel:</span>+48123`);
    expect(link.querySelector(`.${LINK_SCHEME_CLASS_NAME}`)?.textContent).toBe('tel:');
  });

  it('should return false and leave the anchor untouched for an `https:` href', () => {
    const link = createLinkElement(document, { href: 'https://a.com/x', target: '_blank' });

    link.textContent = 'https://a.com/x';

    expect(hideSchemePrefix(link)).toBe(false);
    expect(link.innerHTML).toBe('https://a.com/x');
  });

  it('should return false when the visible text does not start with the scheme', () => {
    const link = createLinkElement(document, { href: 'mailto:a@b.com', target: '_blank' });

    link.textContent = 'Email me';

    expect(hideSchemePrefix(link)).toBe(false);
    expect(link.innerHTML).toBe('Email me');
  });

  it('should match the scheme case-insensitively', () => {
    const link = createLinkElement(document, { href: 'mailto:a@b.com', target: '_blank' });

    link.textContent = 'MAILTO:a@b.com';

    expect(hideSchemePrefix(link)).toBe(true);
    expect(link.querySelector(`.${LINK_SCHEME_CLASS_NAME}`)?.textContent).toBe('MAILTO:');
    expect(link.textContent).toBe('MAILTO:a@b.com');
  });
});

describe('wrapCellContent', () => {
  it('should move a plain cell\'s content into the anchor and append the anchor to the cell', () => {
    const td = document.createElement('td');
    const link = createLinkElement(document, { href: 'https://a.com/x', target: '_blank' });

    td.textContent = 'https://a.com/x';

    wrapCellContent(td, link);

    expect(td.childNodes.length).toBe(1);
    expect(td.firstElementChild).toBe(link);
    expect(link.textContent).toBe('https://a.com/x');
  });

  it('should move the clip wrapper\'s content into the anchor and append the anchor inside the wrapper, not the TD', () => {
    const td = document.createElement('td');
    const wrapper = document.createElement('div');
    const link = createLinkElement(document, { href: 'https://a.com/x', target: '_blank' });

    wrapper.className = CELL_CLIP_CLASS;
    wrapper.textContent = 'https://a.com/x';
    td.appendChild(wrapper);

    wrapCellContent(td, link);

    expect(td.childNodes.length).toBe(1);
    expect(td.firstElementChild).toBe(wrapper);
    expect(wrapper.childNodes.length).toBe(1);
    expect(wrapper.firstElementChild).toBe(link);
    expect(link.textContent).toBe('https://a.com/x');
  });
});
