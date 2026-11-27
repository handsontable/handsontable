import { mainTheme, registerTheme } from 'handsontable/themes';

// Only the tokens object holds theme tokens. A palette entry or an icon slot that is spelled like one is not a token.
mainTheme.params({ colors: { wrapperBorderColor: '#000' } });
registerTheme('palette', { colors: { palette: { wrapperBorderRadius: '#fff' } }, icons: { wrapperBorderWidth: 'x' } });
mainTheme.params({
  colors: { wrapperBorderColor: '#111' },
  // TODO(handsontable-codemod 18.0.0/theme-token-wrapper-border-color): Delete this token, because 18.0 removed it. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#update-theme-wrapper-border-variables
  tokens: { borderRadius: '4px', wrapperBorderColor: '#000' },
});
