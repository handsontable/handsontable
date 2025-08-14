/**
 * @returns {HTMLElement}
 */
export function filterByValueBoxRootElement() {
  const plugin = hot().getPlugin('filters');
  let root;

  if (plugin) {
    root = filterByValueMultipleSelect().getItemsBox().rootElement;
  }

  return root;
}

/**
 * @returns {BaseComponent}
 */
export function filterByValueMultipleSelect() {
  const plugin = hot().getPlugin('filters');
  let root;

  if (plugin && plugin.components.has('filter_by_value')) {
    root = plugin.components.get('filter_by_value').getMultipleSelectElement();
  }

  return root;
}

/**
 * Generates the string representation of the page size section.
 *
 * @param {HTMLElement} container The pagination container element.
 * @returns {string}
 */
export function stringifyPageSizeSection(container = getPaginationContainerElement()) {
  const pageSection = container.querySelector('.ht-page-size-section');
  const label = pageSection.querySelector('span').textContent.trim();
  const values = Array.from(pageSection.querySelectorAll('select option')).map((option) => {
    if (option.selected) {
      return `[${option.value}]`;
    }

    return option.value;
  });

  return `${label} [${values.join(', ')}]`;
}

/**
 * Generates the string representation of the page counter section.
 *
 * @param {HTMLElement} container The pagination container element.
 * @returns {string}
 */
export function stringifyPageCounterSection(container = getPaginationContainerElement()) {
  const pageSection = container.querySelector('.ht-page-counter-section');

  return pageSection.textContent.trim();
}

/**
 * Generates the string representation of the page navigation section.
 *
 * @param {HTMLElement} container The pagination container element.
 * @returns {string}
 */
export function stringifyPageNavigationSection(container = getPaginationContainerElement()) {
  const pageSection = container.querySelector('.ht-page-navigation-section');
  const [
    firstButtonState,
    prevButtonState,
    nextButtonState,
    lastButtonState,
  ] = [
    { selector: '.ht-page-first', icon: '|<' },
    { selector: '.ht-page-prev', icon: '<' },
    { selector: '.ht-page-next', icon: '>' },
    { selector: '.ht-page-last', icon: '>|' },
  ].map(({ selector, icon }) => {
    const button = pageSection.querySelector(selector);
    const disabled = button.disabled && button.getAttribute('aria-disabled') === 'true';

    return disabled ? icon : `[${icon}]`;
  });

  const label = pageSection.querySelector('span').textContent.trim();

  return `${firstButtonState} ${prevButtonState} ${label} ${nextButtonState} ${lastButtonState}`;
}

/**
 * Generates the string representation of the state of the pagination sections.
 *
 * @param {HTMLElement} container The pagination container element.
 * @returns {string[]}
 */
export function visualizePageSections(container = getPaginationContainerElement()) {
  const children = container
    .querySelector('.ht-pagination__inner')
    .children;

  return Array.from(children).reduce((acc, element) => {
    if (element.classList.contains('ht-page-size-section')) {
      acc.push(stringifyPageSizeSection(container));

    } else if (element.classList.contains('ht-page-counter-section')) {
      acc.push(stringifyPageCounterSection(container));

    } else if (element.classList.contains('ht-page-navigation-section')) {
      acc.push(stringifyPageNavigationSection(container));
    }

    return acc;
  }, []);
}

/**
 * Returns the pagination container element.
 *
 * @returns {HTMLElement}
 */
export function getPaginationContainerElement() {
  return hot().rootWrapperElement.querySelector('.ht-pagination');
}

/**
 * Returns the pagination container height.
 *
 * @returns {number}
 */
export function getPaginationContainerHeight() {
  switch (spec().loadedTheme) {
    case 'main':
      return 45;
    case 'horizon':
      return 49;
    default:
      return 34;
  }
}
