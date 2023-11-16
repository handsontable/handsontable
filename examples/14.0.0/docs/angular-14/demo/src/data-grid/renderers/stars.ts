import Handsontable from "handsontable";
import { baseRenderer } from 'handsontable/renderers/baseRenderer';

export const starsRenderer: typeof baseRenderer = function(
  this: Handsontable,
  _instance,
  td,
  _row,
  _column,
  _prop,
  value,
  _cellProperties
) {
  const div = document.createElement("div");
  div.textContent = "★".repeat(value);
  div.ariaLabel = `${value}`;
  Handsontable.dom.addClass(div, "stars");
  Handsontable.dom.empty(td);

  td.appendChild(div);
};
