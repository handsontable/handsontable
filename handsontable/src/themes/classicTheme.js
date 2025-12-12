import { createTheme } from '../utils/themeBuilder';
import mainIcons from './variables/icons/main';
import classicColors from './variables/colors/classic';
import classicTokens from './variables/tokens/classic';

const classicTheme = createTheme({
  icons: mainIcons,
  density: 'compact',
  colors: classicColors,
  tokens: classicTokens,
});

export default classicTheme;
