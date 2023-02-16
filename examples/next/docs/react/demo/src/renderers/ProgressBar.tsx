import React from 'react';
import { getRangeValue, HandsontableProps } from './utils';
import { MESSAGE } from '../constants';

const minAllowedValue = 0;
const maxAllowedValue = 100;

export const ProgressBarRenderer = (props: HandsontableProps) => {
  let isValid = props.cellProperties.valid;
  // Run the validator for the cell at initialization.
  if (isValid === void 0) {
    (props.cellProperties.validator as Function)(props.value, (isValueValid: boolean) => {
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
