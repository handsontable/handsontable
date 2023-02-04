import React from 'react';
import { getRangeValue, HandsontableProps } from './utils';
import { MESSAGE } from '../constants';

const minAllowedValue = 0;
const maxAllowedValue = 5;

export const StarsRenderer = (props: HandsontableProps) => {
  if (props.cellProperties.valid !== false) {
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
