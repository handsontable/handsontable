
import {hasClass} from './../../helpers/dom/element';

export function normalizeSelection(selRange) {
  return {
    start: selRange.getTopLeftCorner(),
    end: selRange.getBottomRightCorner()
  };
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

  className += ' ' + alignment;

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

  className += ' ' + alignment;

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

export function align(range, type, alignment, cellDescriptor) {
  if (range.from.row == range.to.row && range.from.col == range.to.col) {
    applyAlignClassName(range.from.row, range.from.col, type, alignment, cellDescriptor);
  } else {
    for (let row = range.from.row; row <= range.to.row; row++) {
      for (let col = range.from.col; col <= range.to.col; col++) {
        applyAlignClassName(row, col, type, alignment, cellDescriptor);
      }
    }
  }
}

function applyAlignClassName(row, col, type, alignment, cellDescriptor) {
  let cellMeta = cellDescriptor(row, col);
  let className = alignment;

  if (cellMeta.className) {
    if (type === 'vertical') {
      className = prepareVerticalAlignClass(cellMeta.className, alignment);
    } else {
      className = prepareHorizontalAlignClass(cellMeta.className, alignment);
    }
  }
  cellMeta.className = className;
}

export function checkSelectionConsistency(range, comparator) {
  let result = false;

  if (range) {
    range.forAll(function(row, col) {
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
  return '<span class="selected">' + String.fromCharCode(10003) + '</span>' + label;
}
