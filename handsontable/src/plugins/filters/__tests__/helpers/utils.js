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
