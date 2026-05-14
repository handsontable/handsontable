import type { StylesHandler } from '../../../../../common';
import type { WalkontableInstance } from '../../types';
import type { CornerDefaultStyle } from './types';
export const getCornerStyle = (wot: WalkontableInstance): CornerDefaultStyle => {
  const stylesHandler = wot.wtSettings.getSetting('stylesHandler') as StylesHandler;

  const cornerSizeFromVar = stylesHandler.getCSSVariableValue('cell-autofill-size') as string | number;
  const cornerBorderWidthFromVar = stylesHandler.getCSSVariableValue('cell-autofill-border-width') as string | number;
  const cornerColorFromVar = stylesHandler.getCSSVariableValue('cell-autofill-border-color') as string;

  return Object.freeze({
    width: cornerSizeFromVar,
    height: cornerSizeFromVar,
    borderWidth: cornerBorderWidthFromVar,
    borderStyle: 'solid',
    borderColor: cornerColorFromVar,
  });
};
