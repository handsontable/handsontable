export const getCornerStyle = (wot) => {
  const stylesHandler = wot.stylesHandler;

  if (stylesHandler.isClassicTheme()) {
    return Object.freeze({
      width: 6,
      height: 6,
      borderWidth: 1,
      borderStyle: 'solid',
      borderColor: '#FFF',
    });
  }

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
