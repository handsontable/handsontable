import Handsontable from "handsontable";
import type { BaseRenderer } from "handsontable/renderers";

const dom = (Handsontable as unknown as { dom: { addClass(el: HTMLElement, className: string): void; empty(el: HTMLElement): void } }).dom;

type AddClassWhenNeeded = (
  td: HTMLTableCellElement,
  cellProperties: Handsontable.CellProperties
) => void;

const addClassWhenNeeded: AddClassWhenNeeded = (td, cellProperties) => {
  const className = cellProperties.className;

  if (className !== undefined) {
    dom.addClass(td, className as string);
  }
};

const progressBarRendererImpl: BaseRenderer = (
  instance,
  td,
  row,
  column,
  prop,
  value,
  cellProperties
) => {
  const numValue = value as number;
  const div = document.createElement("div");

  div.style.width = `${numValue * 10}px`;
  div.ariaLabel = `${numValue * 10}%`;

  addClassWhenNeeded(td, cellProperties as Handsontable.CellProperties);
  dom.addClass(div, "progressBar");
  dom.empty(td);

  td.appendChild(div);
};

export const progressBarRenderer = Object.assign(progressBarRendererImpl, {
  RENDERER_TYPE: "base" as const,
});
