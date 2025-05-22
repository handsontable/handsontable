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
 * @param {HTMLElement} pageSection The element reference to the page size section.
 * @returns {string}
 */
export function stringifyPageSizeSection(pageSection) {
  const label = pageSection.querySelector('span').textContent.trim();
  const values = Array.from(pageSection.querySelectorAll('select option')).map(option => option.value);

  return `${label} [${values.join(', ')}]`;
}

/**
 * Generates the string representation of the page counter section.
 *
 * @param {HTMLElement} pageSection The element reference to the page counter section.
 * @returns {string}
 */
export function stringifyPageCounterSection(pageSection) {
  return pageSection.textContent.trim();
}

/**
 * Generates the string representation of the page navigation section.
 *
 * @param {HTMLElement} pageSection The element reference to the page navigation section.
 * @returns {string}
 */
export function stringifyPageNavigationSection(pageSection) {
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
 * @returns {string[]}
 */
export function visualizePageSections() {
  const container = hot().rootWrapperElement.querySelector('.ht-pagination-container');

  return Array.from(container.children).reduce((acc, element) => {
    if (element.classList.contains('ht-page-size-section')) {
      acc.push(stringifyPageSizeSection(element));

    } else if (element.classList.contains('ht-page-counter-section')) {
      acc.push(stringifyPageCounterSection(element));

    } else if (element.classList.contains('ht-page-navigation-section')) {
      acc.push(stringifyPageNavigationSection(element));
    }

    return acc;
  }, []);
}
