import Handsontable from "handsontable";

export type RendererProps = {
  TD: HTMLTableCellElement;
  value: any;
  cellProperties: Handsontable.CellProperties;
};

export const addClassWhenNeeded = (props: RendererProps) => {
  const className = props.cellProperties.className;

  if (className !== undefined) {
    Handsontable.dom.addClass(props.TD, className);
  }
};
