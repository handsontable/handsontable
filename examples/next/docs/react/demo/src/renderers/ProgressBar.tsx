import React from "react";
import { BaseEditorComponent, HotEditorProps } from '@handsontable/react';
import { getRangeValue } from './utils';

const minAllowedValue = 0;
const maxAllowedValue = 100;


interface IProgressBarRendererProps extends HotEditorProps {
  value: number;
}

export class ProgressBarRenderer extends BaseEditorComponent {
  props!: IProgressBarRendererProps;
  
  render() {
    return (
      <div
        className="progressBar" 
        style={{ width: `${getRangeValue(this.props.value, minAllowedValue, maxAllowedValue)}px` }}
      />
    );
  }
}
