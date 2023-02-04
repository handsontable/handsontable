import React from 'react';
import { getRangeValue, HandsontableProps } from './utils';
import { MESSAGE } from '../constants';

const minAllowedValue = 0;
const maxAllowedValue = 100;

export const ProgressBarRenderer = (props: HandsontableProps) => {
  if (props.cellProperties.valid !== false) {
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
