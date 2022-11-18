import Handsontable from "handsontable";
import { baseRenderer } from "handsontable/renderers";

export const starsRenderer: typeof baseRenderer = (
  instance,
  td,
  row,
  column,
  prop,
  value,
  cellProperties
) => {
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
