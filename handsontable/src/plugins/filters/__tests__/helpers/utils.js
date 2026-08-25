/**
 * @returns {object}
 */
export function conditionMenuRootElements() {
  const plugin = hot().getPlugin('filters');
  const root = {
    first: null,
    second: null
  };

  if (plugin) {
    if (plugin.components.has('filter_by_condition')) {
      root.first = plugin.components.get('filter_by_condition').getSelectElement().getMenu().container;
    }

    if (plugin.components.has('filter_by_condition2')) {
      root.second = plugin.components.get('filter_by_condition2').getSelectElement().getMenu().container;
    }
  }

  return root;
}

/**
 * @returns {object}
 */
export function conditionSelectRootElements() {
  const plugin = hot().getPlugin('filters');
  const root = {
    first: null,
    second: null
  };

  if (plugin) {
    if (plugin.components.has('filter_by_condition')) {
      root.first = plugin.components.get('filter_by_condition').getSelectElement().element;
    }

    if (plugin.components.has('filter_by_condition2')) {
      root.second = plugin.components.get('filter_by_condition2').getSelectElement().element;
    }
  }

  return root;
}

/**
 * @param {number} index The 0-based index, which tells what input element we want to retrieve.
 * @returns {HTMLElement}
 */
export function conditionRadioInput(index) {
  const plugin = hot().getPlugin('filters');
  let root;

  if (plugin && plugin.components.has('filter_operators')) {
    root = plugin.components.get('filter_operators').elements[index];
  }

  return root;
}

/**
 * @returns {HTMLElement}
 */
export function byValueBoxRootElement() {
  const plugin = hot().getPlugin('filters');
  let root;

  if (plugin) {
    root = byValueMultipleSelect().getItemsBox().rootElement;
  }

  return root;
}

/**
 * @returns {BaseComponent}
 */
export function byValueMultipleSelect() {
  const plugin = hot().getPlugin('filters');
  let root;

  if (plugin && plugin.components.has('filter_by_value')) {
    root = plugin.components.get('filter_by_value').getMultipleSelectElement();
  }

  return root;
}

/**
 * @param {object} meta The cell meta object.
 * @returns {Function}
 */
export function dateRowFactory(meta) {
  const options = { meta: meta || {} };

  return function(value) {
    options.value = value;

    return options;
  };
}

/**
 * @param {Function} funcForCall The function with custom condition.
 * @returns {Function}
 */
export function conditionFactory(funcForCall) {
  return function(args = []) {
    return {
      args,
      func: dataRow => funcForCall.apply(dataRow.meta.instance, [].concat([dataRow], [args]))
    };
  };
}

/**
 * Returns the "OK" button element of the filter dropdown menu.
 *
 * @returns {HTMLElement}
 */
export function getFilterDropdownMenuOKButton() {
  return dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input');
}

/**
 * Returns the "Cancel" button element of the filter dropdown menu.
 *
 * @returns {HTMLElement}
 */
export function getFilterDropdownMenuCancelButton() {
  return dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonCancel input');
}

/**
 * Unchecks the item with the given label on the "filter by value" list. The list is rendered by a
 * nested Handsontable instance, so it is virtualized - the search box narrows it down first to make
 * sure the wanted row is rendered. Searching in the default `show` mode only hides rows, it does not
 * touch the items' checked state.
 *
 * @param {string} label The label of the item to uncheck.
 */
export async function uncheckByValueItem(label) {
  const searchInput = dropdownMenuRootElement().querySelector('.htUIMultipleSelectSearch input');

  searchInput.focus();
  searchInput.value = label;
  // The list reloads synchronously, so no wait is needed here.
  searchInput.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));

  const row = Array.from(byValueBoxRootElement().querySelectorAll('tr'))
    .find(tr => tr.textContent.trim() === label);

  if (!row) {
    throw new Error(`The "${label}" item is not present on the "filter by value" list.`);
  }

  await simulateClick(row.querySelector('[type=checkbox]'));
}
