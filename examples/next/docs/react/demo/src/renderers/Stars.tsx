import React from 'react';
import { BaseEditorComponent } from '@handsontable/react';
import { getRangeValue } from './utils';
import { MESSAGE } from '../constants';

const minAllowedValue = 0;
const maxAllowedValue = 5;

export class StarsRenderer extends BaseEditorComponent {
  value: number;
  isValid: boolean;
  
  constructor(props: any) {
    super(props);
    this.isValid = props.cellProperties.valid === false ? false : true;
    this.value = props.value;
  }
  
  render() {
    if (this.isValid) {
      return (
        <div className="star htCenter">
          {"★".repeat(getRangeValue(this.value, minAllowedValue, maxAllowedValue))}
        </div>
      );
    } else {
      return (
        <div className="error"> { MESSAGE?.BAD_VALUE } </div>
      );
    }
  }
}
