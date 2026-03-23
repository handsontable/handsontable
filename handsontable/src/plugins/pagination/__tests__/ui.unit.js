import { PaginationUI } from '../ui';

describe('PaginationUI', () => {
  let rootElement;
  let ui;

  const createPaginationUI = (isRtl = false) => new PaginationUI({
    rootElement,
    uiContainer: rootElement,
    isRtl,
    phraseTranslator: phrase => phrase,
    shouldHaveBorder: () => false,
    a11yAnnouncer: () => {},
  });

  afterEach(() => {
    ui?.destroy();
    rootElement?.remove();
    ui = null;
    rootElement = null;
  });

  it('should mark previous button as left-caret button in LTR mode', () => {
    rootElement = document.createElement('div');
    document.body.appendChild(rootElement);
    ui = createPaginationUI();

    const container = ui.getContainer();
    const prevButton = container.querySelector('.ht-page-prev');
    const nextButton = container.querySelector('.ht-page-next');

    expect(prevButton.classList.contains('ht-page-navigation-section__button--left-caret')).toBe(true);
    expect(nextButton.classList.contains('ht-page-navigation-section__button--left-caret')).toBe(false);
  });

  it('should mark next button as left-caret button in RTL mode', () => {
    rootElement = document.createElement('div');
    document.body.appendChild(rootElement);
    ui = createPaginationUI(true);

    const container = ui.getContainer();
    const prevButton = container.querySelector('.ht-page-prev');
    const nextButton = container.querySelector('.ht-page-next');

    expect(prevButton.classList.contains('ht-page-navigation-section__button--left-caret')).toBe(false);
    expect(nextButton.classList.contains('ht-page-navigation-section__button--left-caret')).toBe(true);
  });
});
