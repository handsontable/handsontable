import type { WalkontableInstance, StylesHandler } from '../../../../../common';
import type { CornerDefaultStyle } from './types';
export const getCornerStyle = (wot: WalkontableInstance): CornerDefaultStyle => {
  const stylesHandler = wot.wtSettings.getSetting('stylesHandler') as StylesHandler;

  const cornerSizeFromVar = stylesHandler.getCSSVariableValue('cell-autofill-size');
  const cornerBorderWidthFromVar = stylesHandler.getCSSVariableValue('cell-autofill-border-width');
  const cornerColorFromVar = stylesHandler.getCSSVariableValue('cell-autofill-border-color');

  return Object.freeze({
    width: cornerSizeFromVar,
    height: cornerSizeFromVar,
    borderWidth: cornerBorderWidthFromVar,
    borderStyle: 'solid',
    borderColor: cornerColorFromVar,
  });
};
