import ThemeBuilder from './themeBuilder';
import mainIcons from './icons/main';
import horizonColors from './variables/colors/horizon';
import horizonTokens from './variables/tokens/horizon';

const horizonTheme = new ThemeBuilder({
  icons: mainIcons,
  density: 'comfortable',
  colors: horizonColors,
  tokens: horizonTokens,
});

export default horizonTheme;
