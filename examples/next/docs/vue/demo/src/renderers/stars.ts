import Handsontable from "handsontable";
import type { baseRenderer } from "handsontable/renderers";

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
