import { loadingContent } from '../content';
import { html } from '../../../helpers/templateLiteralTag';

/**
 * Builds the loading content and returns it as a DOM fragment.
 *
 * @param {object} vars The content variables.
 * @returns {DocumentFragment}
 */
function render(vars) {
  return html`${loadingContent({ id: 'ht_id', icon: '', ...vars })}`.fragment;
}

describe('loadingContent', () => {
  it('should render the title and description as text', () => {
    const fragment = render({ title: 'Loading', description: 'Please wait' });

    expect(fragment.querySelector('.ht-loading__title').textContent).toBe('Loading');
    expect(fragment.querySelector('.ht-loading__description').textContent).toBe('Please wait');
  });

  it('should strip tags from the title and the description', () => {
    const fragment = render({
      title: 'Loading<img src="x">',
      description: 'Please wait<img src="x">',
    });

    expect(fragment.querySelector('.ht-loading__title').textContent).toBe('Loading');
    expect(fragment.querySelector('.ht-loading__description').textContent).toBe('Please wait');
    expect(fragment.querySelectorAll('img').length).toBe(0);
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
