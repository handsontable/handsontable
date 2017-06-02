import {arrayEach} from './../../helpers/array';
import {hasClass} from './../../helpers/dom/element';
import {KEY as SEPARATOR} from './predefinedItems/separator';
import {isFunction} from '../../helpers/function';
import {hasOwnProperty} from '../../helpers/object';

export function normalizeSelection(selRange) {
  return {
    start: selRange.getTopLeftCorner(),
    end: selRange.getBottomRightCorner()
  };
}

export function getValidSelection(hot) {
  let selected = hot.getSelected();

  if (!selected) {
    return null;
  }
  if (selected[0] < 0) {
    return null;
  }

  return selected;
}

export function prepareVerticalAlignClass(className, alignment) {
  if (className.indexOf(alignment) != -1) {
    return className;
  }
  className = className
    .replace('htTop', '')
    .replace('htMiddle', '')
    .replace('htBottom', '')
    .replace('  ', '');

  className += ` ${alignment}`;

  return className;
}

export function prepareHorizontalAlignClass(className, alignment) {
  if (className.indexOf(alignment) != -1) {
    return className;
  }
  className = className
    .replace('htLeft', '')
    .replace('htCenter', '')
    .replace('htRight', '')
    .replace('htJustify', '')
    .replace('  ', '');

  className += ` ${alignment}`;

  return className;
}

export function getAlignmentClasses(range, callback) {
  const classes = {};

  for (let row = range.from.row; row <= range.to.row; row++) {
    for (let col = range.from.col; col <= range.to.col; col++) {
      if (!classes[row]) {
        classes[row] = [];
      }
      classes[row][col] = callback(row, col);
    }
  }

  return classes;
}

export function align(range, type, alignment, cellDescriptor, propertySetter) {
  if (range.from.row == range.to.row && range.from.col == range.to.col) {
    applyAlignClassName(range.from.row, range.from.col, type, alignment, cellDescriptor, propertySetter);
  } else {
    for (let row = range.from.row; row <= range.to.row; row++) {
      for (let col = range.from.col; col <= range.to.col; col++) {
        applyAlignClassName(row, col, type, alignment, cellDescriptor, propertySetter);
      }
    }
  }
}

function applyAlignClassName(row, col, type, alignment, cellDescriptor, propertySetter) {
  let cellMeta = cellDescriptor(row, col);
  let className = alignment;

  if (cellMeta.className) {
    if (type === 'vertical') {
      className = prepareVerticalAlignClass(cellMeta.className, alignment);
    } else {
      className = prepareHorizontalAlignClass(cellMeta.className, alignment);
    }
  }

  propertySetter(row, col, 'className', className);
}

export function checkSelectionConsistency(range, comparator) {
  let result = false;

  if (range) {
    range.forAll((row, col) => {
      if (comparator(row, col)) {
        result = true;

        return false;
      }
    });
  }

  return result;
}

export function markLabelAsSelected(label) {
  // workaround for https://github.com/handsontable/handsontable/issues/1946
  return `<span class="selected">${String.fromCharCode(10003)}</span>${label}`;
}

function shiftSeparators(items, separator) {
  let result = items.slice(0);

  for (let i = 0; i < result.length;) {
    if (result[i].name === separator) {
      result.shift();
    } else {
      break;
    }
  }
  return result;
}

function popSeparators(items, separator) {
  let result = items.slice(0);

  result.reverse();
  result = shiftSeparators(result, separator);
  result.reverse();

  return result;
}

function removeDuplicatedSeparators(items) {
  let result = [];

  arrayEach(items, (value, index) => {
    if (index > 0) {
      if (result[result.length - 1].name !== value.name) {
        result.push(value);
      }
    } else {
      result.push(value);
    }
  });

  return result;
}

export function filterSeparators(items, separator = SEPARATOR) {
  let result = items.slice(0);

  result = shiftSeparators(result, separator);
  result = popSeparators(result, separator);
  result = removeDuplicatedSeparators(result);

  return result;
}

export function isSubMenu(item) {
  return hasOwnProperty(item, 'submenu');
};

export function itemIsSeparator(item) {
  return new RegExp(SEPARATOR, 'i').test(item.name);
};

export function itemIsSelectionDisabled(item) {
  return item.disableSelection;
};

/**
 *
 * @param unfilteredItems
 * @returns {*}
 */
export function getParsedAndFiltredItems(parentHot, items) {
  const parsedItems = arrayEach(items, (item) => {
    parseValues(parentHot, item, 'name', 'name', false);
    parseValues(parentHot, item, 'hidden', 'isHidden');
    parseValues(parentHot, item, 'disabled', 'isDisabled');
  });
  const notHiddenItems = parsedItems.filter((item) => !item.isHidden);

  return filterSeparators(notHiddenItems, SEPARATOR);
}

export function parseValues(instance, item, key, parsedKey, toBoolean = true) {
  if (isFunction(item[key])) {
    item[parsedKey] = item[key].call(instance);
  }

  if (toBoolean) {
    item[parsedKey] = (item[parsedKey] === true);
  }
}

/**
 *
 * @param data
 */
export function prepareItemsAndReturnCellMeta(data) {
  const cellMetas = data.map((item, rowIndex) => {
    const properties = {
      row: rowIndex,
      col: 0,
      className: []
    };

    if (itemIsSeparator(item)) {
      properties.className.push('htSeparator');
      item.name = '';
      item.isSeparator = true;

    } else if (typeof item.renderer === 'function') {
      properties.className.push('htCustomMenuRenderer');
      properties.renderer = item.renderer;
    }

    if (item.isDisabled) {
      properties.className.push('htDisabled');

    } else if (isSubMenu(item)) {
      properties.className.push('htSubmenu');
      item.hasSubMenu = true;
    }

    if (item.disableSelection) {
      properties.className.push('htSelectionDisabled');
    }

    if (properties.className.length === 0) {
      delete properties.className;

    } else {
      properties.className = properties.className.join(' ');
    }

    return properties;
  });

  return cellMetas;
}
