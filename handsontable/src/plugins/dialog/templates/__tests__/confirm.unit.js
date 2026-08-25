import { confirmTemplate } from '../confirm';

/**
 * Renders the confirm template and returns the compiled fragment.
 *
 * @param {object} vars The template variables.
 * @returns {DocumentFragment}
 */
function render(vars) {
  return confirmTemplate(vars).compile().fragment;
}

describe('confirmTemplate', () => {
  describe('button type', () => {
    it('should render the supported types as they are', () => {
      const fragment = render({
        title: 'Title',
        buttons: [
          { text: 'Ok', type: 'primary' },
          { text: 'Cancel', type: 'secondary' },
        ],
      });
      const buttons = fragment.querySelectorAll('button');

      expect(Array.from(buttons[0].classList)).toEqual(['ht-button', 'ht-button--primary']);
      expect(Array.from(buttons[1].classList)).toEqual(['ht-button', 'ht-button--secondary']);
    });

    it.each([
      ['an attribute break', 'primary" onclick="window.pwned = true'],
      ['an element break', '"><img src="x" onerror="window.pwned = true">'],
      ['a space', 'a b'],
      ['a tag', '<img>'],
      ['a non-string', 123],
      ['an unsupported name', 'tertiary'],
    ])('should fall back to `secondary` when the type contains %s', (_, type) => {
      const fragment = render({
        title: 'Title',
        buttons: [{ text: 'Ok', type }],
      });
      const button = fragment.querySelector('button');

      expect(Array.from(button.classList)).toEqual(['ht-button', 'ht-button--secondary']);
      expect(button.getAttributeNames()).toEqual(['class']);
      expect(fragment.querySelectorAll('img').length).toBe(0);
      expect(fragment.querySelectorAll('button').length).toBe(1);
    });
  });

  describe('element ids', () => {
    it('should render the title and description ids derived from the passed id', () => {
      const template = confirmTemplate({
        id: 'ht_id',
        title: 'Title',
        description: 'Description',
      });
      const fragment = template.compile().fragment;
      const title = fragment.querySelector('h2');
      const description = fragment.querySelector('p');

      expect(title.getAttributeNames()).toEqual(['id', 'class']);
      expect(title.id).toBe('ht_id-dialog-confirm-title');
      expect(description.id).toBe('ht_id-dialog-confirm-description');
    });

    it('should keep the a11y references in sync with the rendered ids', () => {
      const template = confirmTemplate({
        id: 'ht_id',
        title: 'Title',
        description: 'Description',
      });
      const fragment = template.compile().fragment;
      const a11yOptions = template.dialogA11YOptions();

      expect(a11yOptions.ariaLabelledby).toBe(fragment.querySelector('h2').id);
      expect(a11yOptions.ariaDescribedby).toBe(fragment.querySelector('p').id);
    });
  });

  describe('text content', () => {
    it('should strip tags from the title, description and button text', () => {
      const fragment = render({
        title: 'Title<img src="x">',
        description: 'Description<img src="x">',
        buttons: [{ text: 'Ok<img src="x">', type: 'primary' }],
      });

      expect(fragment.querySelector('h2').textContent).toBe('Title');
      expect(fragment.querySelector('p').textContent).toBe('Description');
      expect(fragment.querySelector('button').textContent).toBe('Ok');
      expect(fragment.querySelectorAll('img').length).toBe(0);
    });
  });
});
