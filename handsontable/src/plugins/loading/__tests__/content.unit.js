import { loadingContent } from '../content';

/**
 * Builds the loading content and returns it as a DOM fragment.
 *
 * `loadingContent` returns an HTML string, so the test parses it the way the dialog plugin does.
 * Parsing here is a test-only step - the grid reaches this string through `fastInnerHTML`, where the
 * configured `sanitizer` decides what is written.
 *
 * @param {object} vars The content variables.
 * @returns {DocumentFragment}
 */
function render(vars) {
  const template = document.createElement('template');

  template.innerHTML = loadingContent({ id: 'ht_id', icon: '', ...vars });

  return template.content;
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

  it('should render the icon as markup, so the spinner SVG keeps working', () => {
    const fragment = render({ title: 'Loading', icon: '<svg class="ht-loading__icon-svg"></svg>' });

    expect(fragment.querySelectorAll('.ht-loading__icon-svg').length).toBe(1);
  });

  it('should derive the element ids from the passed id', () => {
    const fragment = render({ title: 'Loading', description: 'Please wait' });
    const title = fragment.querySelector('.ht-loading__title');
    const description = fragment.querySelector('.ht-loading__description');

    expect(title.getAttributeNames()).toEqual(['id', 'class']);
    expect(title.id).toBe('ht_id-loading-title');
    expect(description.id).toBe('ht_id-loading-description');
  });
});
