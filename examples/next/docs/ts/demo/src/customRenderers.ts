import Handsontable from "handsontable";
import { baseRenderer } from "handsontable/renderers";

type AddClassWhenNeeded = (
  td: HTMLTableCellElement,
  cellProperties: Handsontable.CellProperties
) => void;

const addClassWhenNeeded: AddClassWhenNeeded = (td, cellProperties) => {
  const className = cellProperties.className;

  if (className !== undefined) {
    Handsontable.dom.addClass(td, className);
  }
};

export const progressBarRenderer: typeof baseRenderer = (
  _instance,
  td,
  _row,
  _col,
  _prop,
  value,
  cellProperties
): void => {
  const div = document.createElement("div");

  div.style.width = `${value * 10}px`;
  div.ariaLabel = `${value * 10}%`;

  addClassWhenNeeded(td, cellProperties);
  Handsontable.dom.addClass(div, "progressBar");
  Handsontable.dom.empty(td);

  td.appendChild(div);
};

export const starsRenderer: typeof baseRenderer = (
  _instance,
  td,
  _row,
  _col,
  _prop,
  value,
  _cellProperties
): void => {
  const div = document.createElement("div");
  div.textContent = "★".repeat(value);
  div.ariaLabel = `${value}`;
  Handsontable.dom.addClass(div, "stars");
  Handsontable.dom.empty(td);

  td.appendChild(div);
};
