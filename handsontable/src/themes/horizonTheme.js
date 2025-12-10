import { createTheme } from './utils/themeBuilder';
import mainIcons from './icons/main';
import horizonColors from './variables/colors/horizon';
import horizonTokens from './variables/tokens/horizon';

const horizonTheme = createTheme({
  icons: mainIcons,
  density: 'comfortable',
  colors: horizonColors,
  tokens: horizonTokens,
});

export default horizonTheme;
