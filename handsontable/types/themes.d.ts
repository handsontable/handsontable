export type ThemeLightDarkValue = {
  light?: string;
  dark?: string;
};

export type ThemeSizingConfig = Record<string, string>;

export type ThemeIconsConfig = Record<string, string>;

export type ThemeColorsConfig = {
  [key: string]: string | ThemeColorsConfig;
};

export type ThemeTokenValue = string | ThemeLightDarkValue;

export type ThemeTokensConfig = Record<string, ThemeTokenValue>;

export type ThemeDensitySizes = {
  [densityName: string]: Record<string, string>;
};

export interface ThemeDensityConfig {
  type: string;
  sizes: ThemeDensitySizes;
}

export type ThemeColorScheme = 'light' | 'dark' | 'auto';

export interface ThemeConfig {
  sizing: ThemeSizingConfig;
  density: ThemeDensityConfig;
  icons: ThemeIconsConfig;
  colors: ThemeColorsConfig;
  tokens: ThemeTokensConfig;
  colorScheme: ThemeColorScheme;
}

export interface BaseTheme {
  icons?: ThemeIconsConfig;
  colors?: ThemeColorsConfig;
  tokens?: ThemeTokensConfig;
  density?: string;
}

export interface ThemeParams {
  density?: string | { type: string; sizes: ThemeDensitySizes };
  sizing?: ThemeSizingConfig;
  icons?: ThemeIconsConfig;
  colors?: ThemeColorsConfig;
  tokens?: ThemeTokensConfig;
}

export interface ThemeBuilder {
  subscribe(listener: (config: ThemeConfig) => void): () => void;
  params(paramsObject: ThemeParams): ThemeBuilder;
  setColorScheme(mode: ThemeColorScheme): ThemeBuilder;
  getThemeConfig(): ThemeConfig;
}

export function createTheme(baseTheme: BaseTheme): ThemeBuilder;

