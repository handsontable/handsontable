import Handsontable from "handsontable";

export const starsRenderer: Handsontable.renderers.Base = (
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
