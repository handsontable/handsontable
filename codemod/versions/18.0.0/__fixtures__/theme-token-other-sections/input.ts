import { mainTheme, registerTheme } from 'handsontable/themes';

// Only the tokens object holds theme tokens. A palette entry or an icon slot that is spelled like one is not a token.
mainTheme.params({ colors: { wrapperBorderColor: '#000' } });
registerTheme('palette', { colors: { palette: { wrapperBorderRadius: '#fff' } }, icons: { wrapperBorderWidth: 'x' } });
mainTheme.params({
  colors: { wrapperBorderColor: '#111' },
  tokens: { wrapperBorderRadius: '4px', wrapperBorderColor: '#000' },
});
