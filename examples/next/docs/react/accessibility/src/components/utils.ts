import Handsontable from "handsontable";
import { useEffect } from "react";

export type RendererProps = {
  TD?: HTMLTableCellElement;
  value?: any;
  cellProperties?: Handsontable.CellProperties;
};

export const useAddClass = (props: RendererProps) => {
  useEffect(() => {
    const className = props.cellProperties?.className;

    if (className !== void 0 && props.TD) {
      Handsontable.dom.addClass(props.TD, className);
    }
  }, [props.cellProperties?.className, props.TD]);
};
