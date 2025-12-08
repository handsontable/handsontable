import ThemeBuilder from './themeBuilder';
import mainIcons from './icons/main';
import classicColors from './variables/colors/classic';
import classicTokens from './variables/tokens/classic';

const classicTheme = new ThemeBuilder({
  icons: mainIcons,
  density: 'compact',
  colors: classicColors,
  tokens: classicTokens,
});

export default classicTheme;
