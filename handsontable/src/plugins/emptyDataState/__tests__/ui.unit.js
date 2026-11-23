import { EmptyDataStateUI } from '../ui';

describe('EmptyDataStateUI', () => {
  let gridContainer;
  let ui;

  beforeEach(() => {
    gridContainer = document.createElement('div');
    document.body.appendChild(gridContainer);
    ui = new EmptyDataStateUI({ gridContainer, rootDocument: document, idPrefix: 'ht_test' });
  });

  afterEach(() => {
    ui.destroy();
    gridContainer.remove();
  });

  describe('button type', () => {
    it('should render the supported types as they are', () => {
      ui.updateContent({
        title: 'Title',
        buttons: [
          { text: 'Reset', type: 'primary', callback() {} },
          { text: 'Cancel', type: 'secondary', callback() {} },
        ],
      });

      const buttons = ui.getElement().querySelectorAll('button');

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
      ui.updateContent({
        title: 'Title',
        buttons: [{ text: 'Reset', type, callback() {} }],
      });

      const element = ui.getElement();
      const button = element.querySelector('button');

      expect(Array.from(button.classList)).toEqual(['ht-button', 'ht-button--secondary']);
      expect(button.getAttributeNames()).toEqual(['class']);
      expect(element.querySelectorAll('img').length).toBe(0);
      expect(element.querySelectorAll('button').length).toBe(1);
    });
  });

  describe('the element that takes the focus', () => {
    const inner = () => ui.getElement().querySelector('.ht-empty-data-state__content-wrapper-inner');

    it('should be a group named by the title and the description', () => {
      ui.updateContent({ title: 'Title', description: 'Description' });

      const title = ui.getElement().querySelector('.ht-empty-data-state__title');
      const description = ui.getElement().querySelector('.ht-empty-data-state__description');

      expect(inner().getAttribute('role')).toBe('group');
      expect(title.id).toBe('ht_test-ht-empty-data-state-title');
      expect(description.id).toBe('ht_test-ht-empty-data-state-description');
      expect(inner().getAttribute('aria-labelledby')).toBe(`${title.id} ${description.id}`);
      expect(inner().hasAttribute('aria-describedby')).toBe(false);
    });

    it('should drop the reference to a part the message does not have', () => {
      ui.updateContent({ title: 'Title', description: 'Description' });
      ui.updateContent({ title: 'Title' });

      const title = ui.getElement().querySelector('.ht-empty-data-state__title');

      expect(inner().getAttribute('aria-labelledby')).toBe(title.id);
    });

    it('should be plain content while buttons take the focus instead', () => {
      ui.updateContent({ title: 'Title', description: 'Description' });
      ui.updateContent({ title: 'Title', buttons: [{ text: 'Reset', type: 'primary', callback() {} }] });

      expect(inner().hasAttribute('role')).toBe(false);
      expect(inner().hasAttribute('aria-labelledby')).toBe(false);
    });

    it('should not be an unnamed group when the message has neither a title nor a description', () => {
      ui.updateContent({ title: 'Title', description: 'Description' });
      ui.updateContent({ buttons: [] });

      expect(inner().hasAttribute('role')).toBe(false);
      expect(inner().hasAttribute('aria-labelledby')).toBe(false);
    });

    it.each([
      ['markup with no text', '<b></b>'],
      ['spaces', '   '],
    ])('should not name the group by a title of %s', (_, title) => {
      ui.updateContent({ title, description: 'Description' });

      const description = ui.getElement().querySelector('.ht-empty-data-state__description');

      expect(ui.getElement().querySelector('.ht-empty-data-state__title')).toBeNull();
      expect(inner().getAttribute('aria-labelledby')).toBe(description.id);
    });

    it('should be plain content when neither part shows text', () => {
      ui.updateContent({ title: '<i></i>', description: ' ' });

      expect(inner().hasAttribute('role')).toBe(false);
      expect(inner().hasAttribute('aria-labelledby')).toBe(false);
    });

    it('should give two grids ids of their own', () => {
      const otherContainer = document.createElement('div');

      document.body.appendChild(otherContainer);

      const other = new EmptyDataStateUI({
        gridContainer: otherContainer, rootDocument: document, idPrefix: 'ht_other'
      });

      try {
        ui.updateContent({ title: 'Title', description: 'Description' });
        other.updateContent({ title: 'Title', description: 'Description' });

        const ids = element => Array.from(element.querySelectorAll('h2, p'), node => node.id);

        expect(ids(ui.getElement())).not.toEqual(ids(other.getElement()));
        expect(new Set([...ids(ui.getElement()), ...ids(other.getElement())]).size).toBe(4);
      } finally {
        other.destroy();
        otherContainer.remove();
      }
    });

    it('should keep the role while the loading message is shown', () => {
      ui.updateContent({ title: 'Loading', description: 'Please wait' }, true);

      expect(inner().getAttribute('role')).toBe('group');
      expect(inner().getAttribute('aria-busy')).toBe('true');
    });

    it('should write none of it when `ariaTags` is off', () => {
      ui.destroy();
      ui = new EmptyDataStateUI({ gridContainer, rootDocument: document, idPrefix: 'ht_test', ariaTags: false });
      ui.updateContent({ title: 'Title', description: 'Description' });

      expect(inner().hasAttribute('role')).toBe(false);
      expect(inner().hasAttribute('aria-labelledby')).toBe(false);
    });
  });

  describe('text content', () => {
    it('should strip tags from the title, description and button text', () => {
      ui.updateContent({
        title: 'Title<img src="x">',
        description: 'Description<img src="x">',
        buttons: [{ text: 'Reset<img src="x">', type: 'primary', callback() {} }],
      });

      const element = ui.getElement();

      expect(element.querySelector('h2').textContent).toBe('Title');
      expect(element.querySelector('p').textContent).toBe('Description');
      expect(element.querySelector('button').textContent).toBe('Reset');
      expect(element.querySelectorAll('img').length).toBe(0);
    });
  });
});
