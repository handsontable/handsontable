import { loadingContent } from '../content';
import { DEFAULT_ICON } from '../loading';

/**
 * Builds the loading content.
 *
 * `loadingContent` returns a `DocumentFragment` now, so nothing here parses a string - which is the
 * point of the change: the dialog plugin used to write its output through `fastInnerHTML`, a Trusted
 * Types sink, so `loading.show()` threw under enforcement.
 *
 * @param {object} vars The content variables.
 * @returns {DocumentFragment}
 */
function render(vars) {
  return loadingContent({ id: 'ht_id', icon: DEFAULT_ICON, ...vars }, document);
}

describe('loadingContent', () => {
  it('should render the title and description as text', () => {
    const fragment = render({ title: 'Loading', description: 'Please wait' });

    expect(fragment.querySelector('.ht-loading__title').textContent).toBe('Loading');
    expect(fragment.querySelector('.ht-loading__description').textContent).toBe('Please wait');
  });

  it('should render markup in the title and the description as text', () => {
    const fragment = render({
      title: 'Loading<img src="x">',
      description: 'Please wait<img src="x">',
    });
    const title = fragment.querySelector('.ht-loading__title');
    const description = fragment.querySelector('.ht-loading__description');

    // the element assertions are the load-bearing ones: an unescaped payload parses into a child
    // element, and the payload chosen here carries no text of its own, so `textContent` alone
    // would read the same either way
    expect(title.children.length).toBe(0);
    expect(description.children.length).toBe(0);
    expect(fragment.querySelectorAll('img').length).toBe(0);
    expect(title.textContent).toBe('Loading<img src="x">');
    expect(description.textContent).toBe('Please wait<img src="x">');
  });

  it('should keep a title containing a less-than sign whole', () => {
    const fragment = render({ title: 'Loaded 5 < 10 rows', description: 'a < b and c > d' });

    expect(fragment.querySelector('.ht-loading__title').textContent).toBe('Loaded 5 < 10 rows');
    expect(fragment.querySelector('.ht-loading__description').textContent).toBe('a < b and c > d');
  });

  it('should build the default spinner as DOM, in the SVG namespace', () => {
    const fragment = render({ title: 'Loading' });
    const svg = fragment.querySelector('.ht-loading__icon-svg');

    // an `<svg>` created without the SVG namespace is an unknown HTML element that renders
    // nothing at all, with no error to notice
    expect(svg.namespaceURI).toBe('http://www.w3.org/2000/svg');
    expect(svg.querySelector('path').namespaceURI).toBe('http://www.w3.org/2000/svg');
    expect(svg.getAttribute('viewBox')).toBe('0 0 16 16');
    expect(svg.querySelector('path').getAttribute('d')).toBe('M15 8a7 7 0 1 1-3.5-6.062');
  });

  it('should match what parsing the documented default produced', () => {
    const parser = document.createElement('div');

    parser.innerHTML = DEFAULT_ICON;

    const built = render({ title: 'Loading' }).querySelector('.ht-loading__icon-svg');
    const parsed = parser.querySelector('.ht-loading__icon-svg');

    // `xmlns` is the one difference: the parser records it as an attribute, `createElementNS` does
    // not, and both produce an element in the SVG namespace. Everything else must agree.
    expect(built.namespaceURI).toBe(parsed.namespaceURI);
    expect(built.getAttribute('class')).toBe(parsed.getAttribute('class'));
    expect(built.innerHTML).toBe(parsed.innerHTML);
  });

  it('should still write a custom icon as markup, since the option documents it as markup', () => {
    const fragment = render({ title: 'Loading', icon: '<svg class="my-icon"></svg>' });

    expect(fragment.querySelectorAll('.my-icon').length).toBe(1);
    expect(fragment.querySelectorAll('.ht-loading__icon-svg').length).toBe(0);
  });

  it('should derive the element ids from the passed id', () => {
    const fragment = render({ title: 'Loading', description: 'Please wait' });
    const title = fragment.querySelector('.ht-loading__title');
    const description = fragment.querySelector('.ht-loading__description');

    // sorted: the attribute order follows the order `buildTemplate` writes them in (`class` before
    // `attrs`) and carries no meaning. The set is what matters.
    expect(title.getAttributeNames().sort()).toEqual(['class', 'id']);
    expect(title.id).toBe('ht_id-loading-title');
    expect(description.id).toBe('ht_id-loading-description');
  });
});
