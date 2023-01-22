import { CSSProperties } from 'react';
import Handsontable from "handsontable";

export type RendererProps = {
  TD: HTMLTableCellElement;
  value: any;
  cellProperties: Handsontable.CellProperties;
};

export const addClassWhenNeeded = (props: RendererProps) => {
  const className = props.cellProperties.className;

  if (className !== void 0) {
    Handsontable.dom.addClass(props.TD, className);
  }
};

export const defaultEditorStyles: CSSProperties = {
  display: 'none',
  position: 'absolute',
  left: 0,
  top: 0,
  zIndex: 1,
  width: 0,
  marginLeft: 1,
  marginTop: 1,
  background: 'white'
};

export function getRangeValue(value: string, minAllowedValue: number, maxAllowedValue: number): number {
  const numberValue = parseInt(value);

  if (numberValue < minAllowedValue || !numberValue) {
    return minAllowedValue;
  }

  if (numberValue > maxAllowedValue) {
    return maxAllowedValue;
  }

  return numberValue;
}