import mainThemeVariables from './variables/main';
import mainIconsData from './icons/main';
import horizonThemeVariables from './variables/horizon';
import horizonIconsData from './icons/horizon';
import classicThemeVariables from './variables/classic';
import { ThemeBuilder } from './themeBuilder';

// Export icon sets
export const mainIcons = mainIconsData;
export const horizonIcons = horizonIconsData;

// Export theme builders
export const mainTheme = new ThemeBuilder({
  light: mainThemeVariables.light,
  dark: mainThemeVariables.dark,
  theme: mainThemeVariables.theme,
  icons: mainIconsData,
});

export const horizonTheme = new ThemeBuilder({
  light: horizonThemeVariables.light,
  dark: horizonThemeVariables.dark,
  theme: horizonThemeVariables.theme,
  icons: horizonIconsData,
});

export const classicTheme = new ThemeBuilder({
  light: classicThemeVariables.light,
  dark: classicThemeVariables.dark,
  theme: classicThemeVariables.theme,
  icons: mainIconsData, // Classic uses main icons
});

// Export ThemeBuilder class for custom themes
export { ThemeBuilder };

