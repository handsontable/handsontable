import mainIcons from '../static/variables/icons/main';
import classicColors from '../static/variables/colors/classic';
import classicTokens from '../static/variables/tokens/classic';
import type { BaseTheme } from '../types';

const classicTheme: BaseTheme = {
  name: 'classic',
  density: 'compact',
  icons: mainIcons,
  colors: classicColors,
  tokens: classicTokens,
};

export { classicTheme };
