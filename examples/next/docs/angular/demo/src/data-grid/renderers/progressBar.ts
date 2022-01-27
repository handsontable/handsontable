import Handsontable from "handsontable";

type AddClassWhenNeeded = (
  td: HTMLTableCellElement,
  cellProperties: Handsontable.CellProperties
) => void;

const addClassWhenNeeded: AddClassWhenNeeded = (td, cellProperties) => {
  const className = cellProperties.className;

  if (className !== void 0) {
    Handsontable.dom.addClass(td, className);
  }
};

export const progressBarRenderer: Handsontable.renderers.Base = (
  instance,
  td,
  row,
  column,
  prop,
  value,
  cellProperties
) => {
  const div = document.createElement("div");

  div.style.width = `${value * 10}px`;

  addClassWhenNeeded(td, cellProperties);
  Handsontable.dom.addClass(div, "progressBar");
  Handsontable.dom.empty(td);

  td.appendChild(div);
};
