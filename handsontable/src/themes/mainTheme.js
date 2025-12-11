import { createTheme } from './utils/themeBuilder';
import mainIcons from './variables/icons/main';
import mainColors from './variables/colors/main';
import mainTokens from './variables/tokens/main';

const mainTheme = createTheme({
  icons: mainIcons,
  density: 'default',
  colors: mainColors,
  tokens: mainTokens,
});

export default mainTheme;
