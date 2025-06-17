import Handsontable from "handsontable";
import { baseRenderer } from 'handsontable/renderers/baseRenderer';

export const starsRenderer: typeof baseRenderer = function(
  this: Handsontable,
  instance,
  td,
  row,
  column,
  prop,
  value,
  cellProperties
) {
  Handsontable.renderers.TextRenderer.apply(this, [
    instance,
    td,
    row,
    column,
    prop,
    "★".repeat(value),
    cellProperties
  ]);
};
