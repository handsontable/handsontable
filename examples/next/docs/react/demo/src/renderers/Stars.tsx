import React from 'react';
import { baseRenderer } from 'handsontable/renderers';
import { getRangeValue, HandsontableProps } from './utils';
import { MESSAGE } from '../constants';

const minAllowedValue = 0;
const maxAllowedValue = 5;

export const StarsRenderer = (props: HandsontableProps) => {
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
    (props.cellProperties.validator as Function)(props.value, (isValueValid: boolean) => {
      isValid = isValueValid;
    });
  }

  if (isValid === true) {
    return (
        <div className="star htCenter">
          {'★'.repeat(getRangeValue(props.value, minAllowedValue, maxAllowedValue))}
        </div>
      );
  }

  return (
    <div className="error"> { MESSAGE?.BAD_VALUE } </div>
  );
};
