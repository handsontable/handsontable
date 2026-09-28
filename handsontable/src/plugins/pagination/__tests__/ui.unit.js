import { PaginationUI } from '../ui';

describe('PaginationUI', () => {
  let rootElement;
  let uiContainer;
  let ui;

  beforeEach(() => {
    rootElement = document.createElement('div');
    uiContainer = document.createElement('div');
    document.body.appendChild(rootElement);
    document.body.appendChild(uiContainer);

    ui = new PaginationUI({
      rootElement,
      uiContainer,
      isRtl: false,
      themeName: 'ht-theme-main',
      phraseTranslator: key => String(key),
      a11yAnnouncer: () => {},
    });
  });

  afterEach(() => {
    ui.destroy();
    rootElement.remove();
    uiContainer.remove();
  });

  // This template was retyped by hand from an HTML string when the string templates became DOM
  // specs, and nothing in the suite read the result. A dropped class or a missing `name="pageSize"`
  // would have shipped silently, so the structure is pinned here rather than described.
  it('should build the documented element structure', () => {
    const container = uiContainer.querySelector('.ht-pagination');

    expect(container).not.toBe(null);
    // `ht-theme-main` is added by `install()` from the passed theme name, so the exact set also
    // pins that the theme reaches the container at all.
    expect(Array.from(container.classList).sort())
      .toEqual(['handsontable', 'ht-pagination', 'ht-theme-main']);
    expect(container.querySelectorAll('.ht-pagination__inner').length).toBe(1);
    expect(container.querySelectorAll('.ht-page-size-section').length).toBe(1);
    expect(container.querySelectorAll('.ht-page-size-section__label').length).toBe(1);
    expect(container.querySelectorAll('.ht-page-size-section__select-wrapper').length).toBe(1);
    expect(container.querySelectorAll('.ht-page-counter-section').length).toBe(1);
    expect(container.querySelectorAll('nav.ht-page-navigation-section').length).toBe(1);
    expect(container.querySelectorAll('.ht-page-navigation-section__label').length).toBe(1);
  });

  it('should keep the page-size select addressable by name and by the input marker', () => {
    const select = uiContainer.querySelector('.ht-pagination select');

    // `name="pageSize"` and `data-hot-input` are both behavioral: the first is how the control is
    // identified, the second is how the grid recognizes its own inputs in event handling.
    expect(select.tagName).toBe('SELECT');
    expect(select.getAttribute('name')).toBe('pageSize');
    expect(select.hasAttribute('data-hot-input')).toBe(true);
  });

  it('should build the four navigation buttons in document order', () => {
    const buttons = Array.from(
      uiContainer.querySelectorAll('.ht-page-navigation-section button')
    );

    expect(buttons.map(button => button.tagName)).toEqual(['BUTTON', 'BUTTON', 'BUTTON', 'BUTTON']);
    expect(buttons.map(button => Array.from(button.classList).join(' '))).toEqual([
      'ht-page-navigation-section__button ht-page-first',
      'ht-page-navigation-section__button ht-page-prev',
      'ht-page-navigation-section__button ht-page-next',
      'ht-page-navigation-section__button ht-page-last',
    ]);
  });

  // Hiding the section and disabling its select must stay coupled: the stylesheet drops the
  // select's disabled background (the fill lives on the wrapper `<div>`, which has no `:disabled`),
  // so a disabled-but-visible select would render undimmed. The section is never visible while the
  // select is disabled, which is what keeps that safe.
  it('should disable the page-size select exactly when it hides the section', () => {
    const section = uiContainer.querySelector('.ht-page-size-section');
    const select = section.querySelector('select');

    ui.setPageSizeSectionVisibility(false);

    expect(section.style.display).toBe('none');
    expect(select.disabled).toBe(true);

    ui.setPageSizeSectionVisibility(true);

    expect(section.style.display).toBe('');
    expect(select.disabled).toBe(false);
  });
});
