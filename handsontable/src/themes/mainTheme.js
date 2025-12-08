import ThemeBuilder from './themeBuilder';
import mainIcons from './icons/main';
import mainColors from './variables/colors/main';
import mainTokens from './variables/tokens/main';

const mainTheme = new ThemeBuilder({
  icons: mainIcons,
  density: 'default',
  colors: mainColors,
  tokens: mainTokens,
});

export default mainTheme;
