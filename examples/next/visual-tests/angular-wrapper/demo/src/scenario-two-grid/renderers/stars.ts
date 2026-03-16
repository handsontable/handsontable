import Handsontable from "handsontable";
import type { BaseRenderer } from "handsontable/renderers";

const TextRenderer = (Handsontable.renderers as unknown as { TextRenderer: (...args: unknown[]) => void }).TextRenderer;

const starsRendererImpl: BaseRenderer = function (
  this: Handsontable,
  instance,
  td,
  row,
  column,
  prop,
  value,
  cellProperties
) {
  TextRenderer.apply(this, [
    instance,
    td,
    row,
    column,
    prop,
    "★".repeat(value as number),
    cellProperties,
  ]);
};

export const starsRenderer = Object.assign(starsRendererImpl, {
  RENDERER_TYPE: "base" as const,
});
