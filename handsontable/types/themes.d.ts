export type ThemeLightDarkValue = [string, string];

export type SizingKey =
  | 'size0'
  | 'size0_25'
  | 'size0_5'
  | 'size1'
  | 'size1_5'
  | 'size2'
  | 'size3'
  | 'size4'
  | 'size5'
  | 'size6'
  | 'size7'
  | 'size8'
  | 'size9'
  | 'size10';

export type ThemeSizingConfig = Partial<Record<SizingKey, string>> & Record<string, string>;

export type DensityType = 'default' | 'compact' | 'comfortable';

export type DensitySizeKey =
  | 'cellVertical'
  | 'cellHorizontal'
  | 'barsHorizontal'
  | 'barsVertical'
  | 'gap'
  | 'buttonHorizontal'
  | 'buttonVertical'
  | 'dialogHorizontal'
  | 'dialogVertical'
  | 'inputHorizontal'
  | 'inputVertical'
  | 'menuVertical'
  | 'menuHorizontal'
  | 'menuItemVertical'
  | 'menuItemHorizontal';

export type DensitySizeValues = Partial<Record<DensitySizeKey, string>> & Record<string, string>;

export type ThemeDensitySizes = {
  [K in DensityType]?: DensitySizeValues;
} & {
  [key: string]: DensitySizeValues;
};

export interface ThemeDensityConfig {
  type: DensityType;
  sizes: ThemeDensitySizes;
}

export type IconKey =
  | 'arrowRight'
  | 'arrowRightWithBar'
  | 'arrowLeft'
  | 'arrowLeftWithBar'
  | 'arrowDown'
  | 'menu'
  | 'selectArrow'
  | 'arrowNarrowUp'
  | 'arrowNarrowDown'
  | 'check'
  | 'checkbox'
  | 'caretHiddenLeft'
  | 'caretHiddenRight'
  | 'caretHiddenUp'
  | 'caretHiddenDown'
  | 'collapseOff'
  | 'collapseOn'
  | 'radio';

export type ThemeIconsConfig = Partial<Record<IconKey, string>> & Record<string, string>;

export interface ThemeColorsConfig {
  [key: string]: string | Record<string, string>;
}

export type TokenKey =
  // Typography
  | 'fontSize'
  | 'fontSizeSmall'
  | 'lineHeight'
  | 'lineHeightSmall'
  | 'fontWeight'
  | 'letterSpacing'
  // Layout
  | 'gapSize'
  | 'iconSize'
  | 'tableTransition'
  // Base colors
  | 'borderColor'
  | 'accentColor'
  | 'foregroundColor'
  | 'foregroundSecondaryColor'
  | 'backgroundColor'
  | 'backgroundSecondaryColor'
  | 'placeholderColor'
  | 'readOnlyColor'
  | 'disabledColor'
  // Shadow
  | 'shadowColor'
  | 'shadowX'
  | 'shadowY'
  | 'shadowBlur'
  | 'shadowOpacity'
  // Bars
  | 'barForegroundColor'
  | 'barBackgroundColor'
  | 'barHorizontalPadding'
  | 'barVerticalPadding'
  // Cell
  | 'cellHorizontalBorderColor'
  | 'cellVerticalBorderColor'
  | 'cellHorizontalPadding'
  | 'cellVerticalPadding'
  // Wrapper
  | 'wrapperBorderWidth'
  | 'wrapperBorderRadius'
  | 'wrapperBorderColor'
  // Row
  | 'rowHeaderOddBackgroundColor'
  | 'rowHeaderEvenBackgroundColor'
  | 'rowCellOddBackgroundColor'
  | 'rowCellEvenBackgroundColor'
  // Cell editor
  | 'cellEditorBorderWidth'
  | 'cellEditorBorderColor'
  | 'cellEditorForegroundColor'
  | 'cellEditorBackgroundColor'
  | 'cellEditorShadowBlurRadius'
  | 'cellEditorShadowColor'
  // Cell states
  | 'cellSuccessBackgroundColor'
  | 'cellErrorBackgroundColor'
  | 'cellReadOnlyBackgroundColor'
  // Cell selection
  | 'cellSelectionBorderColor'
  | 'cellSelectionBackgroundColor'
  // Cell autofill
  | 'cellAutofillSize'
  | 'cellAutofillHitAreaSize'
  | 'cellAutofillBorderWidth'
  | 'cellAutofillBorderRadius'
  | 'cellAutofillBorderColor'
  | 'cellAutofillBackgroundColor'
  | 'cellAutofillFillBorderColor'
  // Cell mobile
  | 'cellMobileHandleSize'
  | 'cellMobileHandleBorderWidth'
  | 'cellMobileHandleBorderRadius'
  | 'cellMobileHandleBackgroundOpacity'
  // Resize/Move indicators
  | 'resizeIndicatorColor'
  | 'moveBacklightColor'
  | 'moveBacklightOpacity'
  | 'moveIndicatorColor'
  | 'hiddenIndicatorColor'
  // Scrollbar
  | 'scrollbarBorderRadius'
  | 'scrollbarTrackColor'
  | 'scrollbarThumbColor'
  // Header
  | 'headerFontWeight'
  | 'headerForegroundColor'
  | 'headerBackgroundColor'
  | 'headerHighlightedShadowSize'
  | 'headerHighlightedForegroundColor'
  | 'headerHighlightedBackgroundColor'
  | 'headerActiveBorderColor'
  | 'headerActiveForegroundColor'
  | 'headerActiveBackgroundColor'
  | 'headerFilterBackgroundColor'
  // Header row
  | 'headerRowForegroundColor'
  | 'headerRowBackgroundColor'
  | 'headerRowHighlightedForegroundColor'
  | 'headerRowHighlightedBackgroundColor'
  | 'headerRowActiveForegroundColor'
  | 'headerRowActiveBackgroundColor'
  // Checkbox
  | 'checkboxSize'
  | 'checkboxBorderRadius'
  | 'checkboxBorderColor'
  | 'checkboxBackgroundColor'
  | 'checkboxIconColor'
  | 'checkboxFocusBorderColor'
  | 'checkboxFocusBackgroundColor'
  | 'checkboxFocusIconColor'
  | 'checkboxFocusRingColor'
  | 'checkboxDisabledBorderColor'
  | 'checkboxDisabledBackgroundColor'
  | 'checkboxDisabledIconColor'
  | 'checkboxCheckedBorderColor'
  | 'checkboxCheckedBackgroundColor'
  | 'checkboxCheckedIconColor'
  | 'checkboxCheckedFocusBorderColor'
  | 'checkboxCheckedFocusBackgroundColor'
  | 'checkboxCheckedFocusIconColor'
  | 'checkboxCheckedDisabledBorderColor'
  | 'checkboxCheckedDisabledBackgroundColor'
  | 'checkboxCheckedDisabledIconColor'
  | 'checkboxIndeterminateBorderColor'
  | 'checkboxIndeterminateBackgroundColor'
  | 'checkboxIndeterminateIconColor'
  | 'checkboxIndeterminateFocusBorderColor'
  | 'checkboxIndeterminateFocusBackgroundColor'
  | 'checkboxIndeterminateFocusIconColor'
  | 'checkboxIndeterminateDisabledBorderColor'
  | 'checkboxIndeterminateDisabledBackgroundColor'
  | 'checkboxIndeterminateDisabledIconColor'
  // Radio
  | 'radioSize'
  | 'radioBorderColor'
  | 'radioBackgroundColor'
  | 'radioIconColor'
  | 'radioFocusBorderColor'
  | 'radioFocusBackgroundColor'
  | 'radioFocusIconColor'
  | 'radioFocusRingColor'
  | 'radioDisabledBorderColor'
  | 'radioDisabledBackgroundColor'
  | 'radioDisabledIconColor'
  | 'radioCheckedBorderColor'
  | 'radioCheckedBackgroundColor'
  | 'radioCheckedIconColor'
  | 'radioCheckedFocusBorderColor'
  | 'radioCheckedFocusBackgroundColor'
  | 'radioCheckedFocusIconColor'
  | 'radioCheckedDisabledBorderColor'
  | 'radioCheckedDisabledBackgroundColor'
  | 'radioCheckedDisabledIconColor'
  // Icon button
  | 'iconButtonBorderRadius'
  | 'iconButtonLargeBorderRadius'
  | 'iconButtonLargePadding'
  | 'iconButtonBorderColor'
  | 'iconButtonBackgroundColor'
  | 'iconButtonIconColor'
  | 'iconButtonHoverBorderColor'
  | 'iconButtonHoverBackgroundColor'
  | 'iconButtonHoverIconColor'
  | 'iconButtonActiveBorderColor'
  | 'iconButtonActiveBackgroundColor'
  | 'iconButtonActiveIconColor'
  | 'iconButtonActiveHoverBorderColor'
  | 'iconButtonActiveHoverBackgroundColor'
  | 'iconButtonActiveHoverIconColor'
  // Collapse button
  | 'collapseButtonBorderRadius'
  | 'collapseButtonOpenBorderColor'
  | 'collapseButtonOpenBackgroundColor'
  | 'collapseButtonOpenIconColor'
  | 'collapseButtonOpenIconActiveColor'
  | 'collapseButtonOpenHoverBorderColor'
  | 'collapseButtonOpenHoverBackgroundColor'
  | 'collapseButtonOpenHoverIconColor'
  | 'collapseButtonOpenHoverIconActiveColor'
  | 'collapseButtonCloseBorderColor'
  | 'collapseButtonCloseBackgroundColor'
  | 'collapseButtonCloseIconColor'
  | 'collapseButtonCloseIconActiveColor'
  | 'collapseButtonCloseHoverBorderColor'
  | 'collapseButtonCloseHoverBackgroundColor'
  | 'collapseButtonCloseHoverIconColor'
  | 'collapseButtonCloseHoverIconActiveColor'
  // Button
  | 'buttonBorderRadius'
  | 'buttonHorizontalPadding'
  | 'buttonVerticalPadding'
  // Primary button
  | 'primaryButtonBorderColor'
  | 'primaryButtonForegroundColor'
  | 'primaryButtonBackgroundColor'
  | 'primaryButtonDisabledBorderColor'
  | 'primaryButtonDisabledForegroundColor'
  | 'primaryButtonDisabledBackgroundColor'
  | 'primaryButtonHoverBorderColor'
  | 'primaryButtonHoverForegroundColor'
  | 'primaryButtonHoverBackgroundColor'
  | 'primaryButtonFocusBorderColor'
  | 'primaryButtonFocusForegroundColor'
  | 'primaryButtonFocusBackgroundColor'
  // Secondary button
  | 'secondaryButtonBorderColor'
  | 'secondaryButtonForegroundColor'
  | 'secondaryButtonBackgroundColor'
  | 'secondaryButtonDisabledBorderColor'
  | 'secondaryButtonDisabledForegroundColor'
  | 'secondaryButtonDisabledBackgroundColor'
  | 'secondaryButtonHoverBorderColor'
  | 'secondaryButtonHoverForegroundColor'
  | 'secondaryButtonHoverBackgroundColor'
  | 'secondaryButtonFocusBorderColor'
  | 'secondaryButtonFocusForegroundColor'
  | 'secondaryButtonFocusBackgroundColor'
  // Comments
  | 'commentsTextareaHorizontalPadding'
  | 'commentsTextareaVerticalPadding'
  | 'commentsTextareaBorderWidth'
  | 'commentsTextareaBorderColor'
  | 'commentsTextareaForegroundColor'
  | 'commentsTextareaBackgroundColor'
  | 'commentsTextareaFocusBorderWidth'
  | 'commentsTextareaFocusBorderColor'
  | 'commentsTextareaFocusForegroundColor'
  | 'commentsTextareaFocusBackgroundColor'
  | 'commentsIndicatorSize'
  | 'commentsIndicatorColor'
  // License
  | 'licenseHorizontalPadding'
  | 'licenseVerticalPadding'
  | 'licenseForegroundColor'
  | 'licenseBackgroundColor'
  // Link
  | 'linkColor'
  | 'linkHoverColor'
  // Input
  | 'inputBorderWidth'
  | 'inputBorderRadius'
  | 'inputHorizontalPadding'
  | 'inputVerticalPadding'
  | 'inputBorderColor'
  | 'inputForegroundColor'
  | 'inputBackgroundColor'
  | 'inputHoverBorderColor'
  | 'inputHoverForegroundColor'
  | 'inputHoverBackgroundColor'
  | 'inputDisabledBorderColor'
  | 'inputDisabledForegroundColor'
  | 'inputDisabledBackgroundColor'
  | 'inputFocusBorderColor'
  | 'inputFocusForegroundColor'
  | 'inputFocusBackgroundColor'
  // Menu
  | 'menuBorderWidth'
  | 'menuBorderRadius'
  | 'menuHorizontalPadding'
  | 'menuVerticalPadding'
  | 'menuItemHorizontalPadding'
  | 'menuItemVerticalPadding'
  | 'menuBorderColor'
  | 'menuShadowX'
  | 'menuShadowY'
  | 'menuShadowBlur'
  | 'menuShadowColor'
  | 'menuShadowOpacity'
  | 'menuItemHoverColor'
  | 'menuItemHoverColorOpacity'
  | 'menuItemActiveColor'
  | 'menuItemActiveColorOpacity'
  // Dialog
  | 'dialogSemiTransparentBackgroundColor'
  | 'dialogSemiTransparentBackgroundOpacity'
  | 'dialogSolidBackgroundColor'
  | 'dialogContentPaddingHorizontal'
  | 'dialogContentPaddingVertical'
  | 'dialogContentBorderRadius'
  | 'dialogContentBackgroundColor'
  // Pagination
  | 'paginationBarForegroundColor'
  | 'paginationBarBackgroundColor'
  | 'paginationBarHorizontalPadding'
  | 'paginationBarVerticalPadding';

export type ThemeTokenValue = string | ThemeLightDarkValue;

export type ThemeTokensConfig = Partial<Record<TokenKey, ThemeTokenValue>>;

export type ThemeColorScheme = 'light' | 'dark' | 'auto';

export interface ThemeConfig {
  sizing: ThemeSizingConfig;
  density: ThemeDensityConfig;
  icons: ThemeIconsConfig;
  colors: ThemeColorsConfig;
  tokens: ThemeTokensConfig;
  colorScheme: ThemeColorScheme;
}

export interface ThemeParams {
  sizing?: Partial<ThemeSizingConfig>;
  density?: DensityType | Partial<ThemeDensityConfig>;
  icons?: Partial<ThemeIconsConfig>;
  colors?: Partial<ThemeColorsConfig>;
  tokens?: Partial<ThemeTokensConfig>;
  colorScheme?: ThemeColorScheme;
}

export type BaseTheme = ThemeParams;

export interface ThemeBuilder {
  subscribe(listener: (config: ThemeConfig) => void): () => void;
  params(paramsObject: ThemeParams): ThemeBuilder;
  setDensityType(type: DensityType): ThemeBuilder;
  setColorScheme(mode: ThemeColorScheme): ThemeBuilder;
  getThemeConfig(): ThemeConfig;
}

export function createTheme(baseTheme?: BaseTheme): ThemeBuilder;

export const classicTheme: ThemeBuilder;
export const mainTheme: ThemeBuilder;
export const horizonTheme: ThemeBuilder;
export const mainIcons: ThemeIconsConfig;
export const horizonIcons: ThemeIconsConfig;

declare module 'handsontable/themes/variables/colors/horizon' {
  const colors: ThemeColorsConfig;
  export default colors;
}

declare module 'handsontable/themes/variables/colors/classic' {
  const colors: ThemeColorsConfig;
  export default colors;
}

declare module 'handsontable/themes/variables/colors/main' {
  const colors: ThemeColorsConfig;
  export default colors;
}

declare module 'handsontable/themes/variables/colors/ant' {
  const colors: ThemeColorsConfig;
  export default colors;
}

declare module 'handsontable/themes/variables/colors/material' {
  const colors: ThemeColorsConfig;
  export default colors;
}

declare module 'handsontable/themes/variables/colors/shadcn' {
  const colors: ThemeColorsConfig;
  export default colors;
}

declare module 'handsontable/themes/variables/icons/horizon' {
  const icons: ThemeIconsConfig;
  export default icons;
}

declare module 'handsontable/themes/variables/icons/main' {
  const icons: ThemeIconsConfig;
  export default icons;
}

declare module 'handsontable/themes/variables/tokens/horizon' {
  const tokens: ThemeTokensConfig;
  export default tokens;
}

declare module 'handsontable/themes/variables/tokens/classic' {
  const tokens: ThemeTokensConfig;
  export default tokens;
}

declare module 'handsontable/themes/variables/tokens/main' {
  const tokens: ThemeTokensConfig;
  export default tokens;
}
