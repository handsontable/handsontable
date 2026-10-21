import { EmptyDataStateUI } from '../ui';

describe('EmptyDataStateUI', () => {
  let gridContainer;
  let ui;

  beforeEach(() => {
    gridContainer = document.createElement('div');
    document.body.appendChild(gridContainer);
    ui = new EmptyDataStateUI({ gridContainer, rootDocument: document });
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
