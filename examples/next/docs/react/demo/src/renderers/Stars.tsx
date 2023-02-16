import React from 'react';
import { getRangeValue, HandsontableProps } from './utils';
import { MESSAGE } from '../constants';

const minAllowedValue = 0;
const maxAllowedValue = 5;

export const StarsRenderer = (props: HandsontableProps) => {
  let isValid = props.cellProperties.valid;
  // Run the validator for the cell at initization.
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
