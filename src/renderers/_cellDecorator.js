/**
 * Adds appropriate CSS class to table cell, based on cellProperties
 */
import {addClass, removeClass} from './../helpers/dom/element';
import {registerRenderer} from './../renderers';

function FakeElement(className) {
  if (className.length) {
    className += ' ';
  }
  function add(id) {
    if (id && className.indexOf(id) < 0) {
      className += id + ' ';
    }
  };
  function remove(id) {
    if (id && className.indexOf(id + ' ') >= 0) {
      className.replace(id + ' ', ' ');
    }
  };
  return {
    set: function (_) { className = _; },
    get: function () { return className.trim(); },
    addClass: add,
    removeClass: remove,
    classList: {
      add: add,
      remove: remove
    }
  };
}

function cellDecorator(instance, TD, row, col, prop, value, cellProperties) {
  var fakeTD = FakeElement(TD.className);
  fakeTD.addClass(cellProperties.className);

  if (cellProperties.readOnly) {
    fakeTD.addClass(cellProperties.readOnlyCellClassName);
  }

  if (cellProperties.valid === false && cellProperties.invalidCellClassName) {
    fakeTD.addClass(cellProperties.invalidCellClassName);
  } else {
    fakeTD.removeClass(cellProperties.invalidCellClassName);
  }

  if (cellProperties.wordWrap === false && cellProperties.noWordWrapClassName) {
    fakeTD.addClass(cellProperties.noWordWrapClassName);
  }

  if (!value && cellProperties.placeholder) {
    fakeTD.addClass(cellProperties.placeholderCellClassName);
  }

  if (TD.className !== fakeTD.get()) {
    TD.className = fakeTD.get();
  }
}

registerRenderer('base', cellDecorator);

export default cellDecorator;
