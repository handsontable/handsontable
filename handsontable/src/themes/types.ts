export type ThemeLightDarkValue = [string, string];

export type SizingKey =
  | 'size_0'
  | 'size_0_25'
  | 'size_0_5'
  | 'size_1'
  | 'size_1_5'
  | 'size_2'
  | 'size_3'
  | 'size_4'
  | 'size_5'
  | 'size_6'
  | 'size_7'
  | 'size_8'
  | 'size_9'
  | 'size_10';

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
  | 'fontFamily'
  | 'fontSize'
  | 'fontSizeSmall'
  | 'lineHeight'
  | 'lineHeightSmall'
  | 'fontWeight'
  | 'letterSpacing'
  // Layout
  | 'gapSize'
  | 'iconSize'
  | 'iconButtonHitAreaSize'
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
  | 'cellMobileHandleBorderColor'
  | 'cellMobileHandleBackgroundColor'
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
  // Notification (toast)
  | 'notificationForegroundColor'
  | 'notificationBackgroundColor'
  | 'notificationBorderColor'
  | 'notificationSuccessAccent'
  | 'notificationWarningAccent'
  | 'notificationErrorAccent'
  // Pagination
  | 'paginationBarForegroundColor'
  | 'paginationBarBackgroundColor'
  | 'paginationBarHorizontalPadding'
  | 'paginationBarVerticalPadding'
  | 'paginationButtonBorderColor'
  | 'paginationButtonForegroundColor'
  | 'paginationButtonBackgroundColor'
  | 'paginationButtonHoverBorderColor'
  | 'paginationButtonHoverForegroundColor'
  | 'paginationButtonHoverBackgroundColor'
  | 'paginationButtonDisabledForegroundColor'
  | 'paginationButtonDisabledBackgroundColor'
  | 'paginationButtonDisabledBorderColor'
  | 'paginationButtonFocusBorderColor'
  | 'paginationButtonFocusForegroundColor'
  | 'paginationButtonFocusBackgroundColor'
  // Multiselect
  | 'chipBackground'
  | 'chipBorderRadius'
  | 'chipVerticalPadding'
  | 'chipHorizontalPadding'
  | 'chipGap';

export type ThemeTokenValue = string | ThemeLightDarkValue;

export type ThemeTokensConfig = Partial<Record<TokenKey, ThemeTokenValue>>;

export type ThemeColorScheme = 'light' | 'dark' | 'auto';

export interface ThemeConfig {
  name: string | undefined;
  sizing: ThemeSizingConfig;
  density: ThemeDensityConfig;
  icons: ThemeIconsConfig;
  colors: ThemeColorsConfig;
  tokens: ThemeTokensConfig;
  colorScheme: ThemeColorScheme;
}

export interface ThemeParams {
  name?: string;
  sizing?: Partial<ThemeSizingConfig>;
  density?: DensityType | Partial<ThemeDensityConfig>;
  icons?: Partial<ThemeIconsConfig>;
  colors?: Partial<ThemeColorsConfig>;
  tokens?: Partial<ThemeTokensConfig>;
  colorScheme?: ThemeColorScheme;
}

export type BaseTheme = ThemeParams;
