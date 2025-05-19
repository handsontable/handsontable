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
