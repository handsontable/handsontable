import Handsontable from "handsontable";

const dom = (Handsontable as unknown as {
  dom: { addClass(el: HTMLElement, className: string): void };
}).dom;

export type RendererProps = {
  TD?: HTMLTableCellElement;
  value?: any;
  cellProperties?: Handsontable.CellProperties;
};

export const addClassWhenNeeded = (props: RendererProps) => {
  const className = props?.cellProperties?.className;

  if (className !== undefined && props?.TD) {
    dom.addClass(props.TD, className as string);
  }
};
