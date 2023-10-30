import React from 'react';
import { baseRenderer } from 'handsontable/renderers';
import { getRangeValue, HandsontableProps } from './utils';
import { MESSAGE } from '../constants';

const minAllowedValue = 0;
const maxAllowedValue = 100;

export const ProgressBarRenderer = (props: HandsontableProps) => {
  const {
    TD,
    row,
    col,
    prop,
    value,
    cellProperties
  } = props;
  let isValid = cellProperties.valid;

  baseRenderer(cellProperties.instance, TD, row, col, prop, value, cellProperties);

  // Run the validator for the cell at initialization.
  if (isValid === void 0) {
    (cellProperties.validator as Function)(value, (isValueValid: boolean) => {
      isValid = isValueValid;
    });
  }

  if (isValid === true) {
    return (
      <div
        className="progressBar"
        style={{ width: `${getRangeValue(props.value, minAllowedValue, maxAllowedValue)}px` }}
      />
    );
  }

  return (
    <div className="error"> { MESSAGE?.BAD_VALUE } </div>
  );
}
