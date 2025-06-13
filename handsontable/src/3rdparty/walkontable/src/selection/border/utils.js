export const getCornerStyle = (wot) => {
  const stylesHandler = wot.wtSettings.getSetting('stylesHandler');

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

  return Object.freeze({
    width: cornerSizeFromVar,
    height: cornerSizeFromVar,
    borderWidth: 0,
    borderStyle: 'solid',
    borderColor: 'transparent',
  });
};
