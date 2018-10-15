import { arrayEach, arrayMap } from './../../helpers/array';
import { hasClass } from './../../helpers/dom/element';
import { KEY as SEPARATOR } from './predefinedItems/separator';

export function normalizeSelection(selRanges) {
  return arrayMap(selRanges, function (range) {
    return {
      start: range.getTopLeftCorner(),
      end: range.getBottomRightCorner()
    };
  });
}

export function isSeparator(cell) {
  return hasClass(cell, 'htSeparator');
}

export function hasSubMenu(cell) {
  return hasClass(cell, 'htSubmenu');
}

export function isDisabled(cell) {
  return hasClass(cell, 'htDisabled');
}

export function isSelectionDisabled(cell) {
  return hasClass(cell, 'htSelectionDisabled');
}

export function getValidSelection(hot) {
  var selected = hot.getSelected();

  if (!selected) {
    return null;
  }
  if (selected[0] < 0) {
    return null;
  }

  return selected;
}

export function prepareVerticalAlignClass(className, alignment) {
  if (className.indexOf(alignment) !== -1) {
    return className;
  }

  var replacedClassName = className.replace('htTop', '').replace('htMiddle', '').replace('htBottom', '').replace('  ', '');

  return replacedClassName + ' ' + alignment;
}

export function prepareHorizontalAlignClass(className, alignment) {
  if (className.indexOf(alignment) !== -1) {
    return className;
  }
  var replacedClassName = className.replace('htLeft', '').replace('htCenter', '').replace('htRight', '').replace('htJustify', '').replace('  ', '');

  return replacedClassName + ' ' + alignment;
}

export function getAlignmentClasses(ranges, callback) {
  var classes = {};

  arrayEach(ranges, function (_ref) {
    var from = _ref.from,
        to = _ref.to;

    for (var row = from.row; row <= to.row; row++) {
      for (var col = from.col; col <= to.col; col++) {
        if (!classes[row]) {
          classes[row] = [];
        }
        classes[row][col] = callback(row, col);
      }
    }
  });

  return classes;
}

export function align(ranges, type, alignment, cellDescriptor, propertySetter) {
  arrayEach(ranges, function (_ref2) {
    var from = _ref2.from,
        to = _ref2.to;

    if (from.row === to.row && from.col === to.col) {
      applyAlignClassName(from.row, from.col, type, alignment, cellDescriptor, propertySetter);
    } else {
      for (var row = from.row; row <= to.row; row++) {
        for (var col = from.col; col <= to.col; col++) {
          applyAlignClassName(row, col, type, alignment, cellDescriptor, propertySetter);
        }
      }
    }
  });
}

function applyAlignClassName(row, col, type, alignment, cellDescriptor, propertySetter) {
  var cellMeta = cellDescriptor(row, col);
  var className = alignment;

  if (cellMeta.className) {
    if (type === 'vertical') {
      className = prepareVerticalAlignClass(cellMeta.className, alignment);
    } else {
      className = prepareHorizontalAlignClass(cellMeta.className, alignment);
    }
  }

  propertySetter(row, col, 'className', className);
}

export function checkSelectionConsistency(ranges, comparator) {
  var result = false;

  if (Array.isArray(ranges)) {
    arrayEach(ranges, function (range) {
      range.forAll(function (row, col) {
        if (comparator(row, col)) {
          result = true;

          return false;
        }
      });

      return result;
    });
  }

  return result;
}

export function markLabelAsSelected(label) {
  // workaround for https://github.com/handsontable/handsontable/issues/1946
  return '<span class="selected">' + String.fromCharCode(10003) + '</span>' + label;
}

export function isItemHidden(item, instance) {
  return !item.hidden || !(typeof item.hidden === 'function' && item.hidden.call(instance));
}

function shiftSeparators(items, separator) {
  var result = items.slice(0);

  for (var i = 0; i < result.length;) {
    if (result[i].name === separator) {
      result.shift();
    } else {
      break;
    }
  }
  return result;
}

function popSeparators(items, separator) {
  var result = items.slice(0);

  result.reverse();
  result = shiftSeparators(result, separator);
  result.reverse();

  return result;
}

function removeDuplicatedSeparators(items) {
  var result = [];

  arrayEach(items, function (value, index) {
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

export function filterSeparators(items) {
  var separator = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : SEPARATOR;

  var result = items.slice(0);

  result = shiftSeparators(result, separator);
  result = popSeparators(result, separator);
  result = removeDuplicatedSeparators(result);

  return result;
}