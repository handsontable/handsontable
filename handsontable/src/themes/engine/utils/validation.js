import { isObject } from '../../../helpers/object';
import { warn } from '../../../helpers/console';

/**
 * Valid parameters keys.
 *
 * @type {Set<string>}
 */
export const VALID_PARAMS_KEYS = new Set([
  'name',
  'sizing',
  'density',
  'icons',
  'colors',
  'tokens',
  'colorScheme',
]);

/**
 * Valid color scheme values.
 *
 * @type {Set<string>}
 */
export const VALID_COLOR_SCHEMES = new Set(['light', 'dark', 'auto']);

/**
 * Valid density type values.
 *
 * @type {Set<string>}
 */
export const VALID_DENSITY_TYPES = new Set(['default', 'compact', 'comfortable']);

/**
 * Valid sizing key values.
 *
 * @type {Set<string>}
 */
export const VALID_SIZING_KEYS = new Set([
  'size_0',
  'size_0_25',
  'size_0_5',
  'size_1',
  'size_1_5',
  'size_2',
  'size_3',
  'size_4',
  'size_5',
  'size_6',
  'size_7',
  'size_8',
  'size_9',
  'size_10',
]);

/**
 * Valid density size key values.
 *
 * @type {Set<string>}
 */
export const VALID_DENSITY_SIZE_KEYS = new Set([
  'cellVertical',
  'cellHorizontal',
  'barsHorizontal',
  'barsVertical',
  'gap',
  'buttonHorizontal',
  'buttonVertical',
  'dialogHorizontal',
  'dialogVertical',
  'inputHorizontal',
  'inputVertical',
  'menuVertical',
  'menuHorizontal',
  'menuItemVertical',
  'menuItemHorizontal',
]);

/**
 * Valid icon key values.
 *
 * @type {Set<string>}
 */
export const VALID_ICON_KEYS = new Set([
  'arrowRight',
  'arrowRightWithBar',
  'arrowLeft',
  'arrowLeftWithBar',
  'arrowDown',
  'menu',
  'selectArrow',
  'arrowNarrowUp',
  'arrowNarrowDown',
  'check',
  'checkbox',
  'caretHiddenLeft',
  'caretHiddenRight',
  'caretHiddenUp',
  'caretHiddenDown',
  'collapseOff',
  'collapseOn',
  'radio',
]);

/**
 * Valid token key values.
 *
 * @type {Set<string>}
 */
export const VALID_TOKEN_KEYS = new Set([
  // Typography
  'fontSize',
  'fontSizeSmall',
  'lineHeight',
  'lineHeightSmall',
  'fontWeight',
  'letterSpacing',
  // Layout
  'gapSize',
  'iconSize',
  'tableTransition',
  // Base colors
  'borderColor',
  'accentColor',
  'foregroundColor',
  'foregroundSecondaryColor',
  'backgroundColor',
  'backgroundSecondaryColor',
  'placeholderColor',
  'readOnlyColor',
  'disabledColor',
  // Shadow
  'shadowColor',
  'shadowX',
  'shadowY',
  'shadowBlur',
  'shadowOpacity',
  // Bars
  'barForegroundColor',
  'barBackgroundColor',
  'barHorizontalPadding',
  'barVerticalPadding',
  // Cell
  'cellHorizontalBorderColor',
  'cellVerticalBorderColor',
  'cellHorizontalPadding',
  'cellVerticalPadding',
  // Wrapper
  'wrapperBorderWidth',
  'wrapperBorderRadius',
  'wrapperBorderColor',
  // Row
  'rowHeaderOddBackgroundColor',
  'rowHeaderEvenBackgroundColor',
  'rowCellOddBackgroundColor',
  'rowCellEvenBackgroundColor',
  // Cell editor
  'cellEditorBorderWidth',
  'cellEditorBorderColor',
  'cellEditorForegroundColor',
  'cellEditorBackgroundColor',
  'cellEditorShadowBlurRadius',
  'cellEditorShadowColor',
  // Cell states
  'cellSuccessBackgroundColor',
  'cellErrorBackgroundColor',
  'cellReadOnlyBackgroundColor',
  // Cell selection
  'cellSelectionBorderColor',
  'cellSelectionBackgroundColor',
  // Cell autofill
  'cellAutofillSize',
  'cellAutofillHitAreaSize',
  'cellAutofillBorderWidth',
  'cellAutofillBorderRadius',
  'cellAutofillBorderColor',
  'cellAutofillBackgroundColor',
  'cellAutofillFillBorderColor',
  // Cell mobile
  'cellMobileHandleSize',
  'cellMobileHandleBorderWidth',
  'cellMobileHandleBorderRadius',
  'cellMobileHandleBackgroundOpacity',
  // Resize/Move indicators
  'resizeIndicatorColor',
  'moveBacklightColor',
  'moveBacklightOpacity',
  'moveIndicatorColor',
  'hiddenIndicatorColor',
  // Scrollbar
  'scrollbarBorderRadius',
  'scrollbarTrackColor',
  'scrollbarThumbColor',
  // Header
  'headerFontWeight',
  'headerForegroundColor',
  'headerBackgroundColor',
  'headerHighlightedShadowSize',
  'headerHighlightedForegroundColor',
  'headerHighlightedBackgroundColor',
  'headerActiveBorderColor',
  'headerActiveForegroundColor',
  'headerActiveBackgroundColor',
  'headerFilterBackgroundColor',
  // Header row
  'headerRowForegroundColor',
  'headerRowBackgroundColor',
  'headerRowHighlightedForegroundColor',
  'headerRowHighlightedBackgroundColor',
  'headerRowActiveForegroundColor',
  'headerRowActiveBackgroundColor',
  // Checkbox
  'checkboxSize',
  'checkboxBorderRadius',
  'checkboxBorderColor',
  'checkboxBackgroundColor',
  'checkboxIconColor',
  'checkboxFocusBorderColor',
  'checkboxFocusBackgroundColor',
  'checkboxFocusIconColor',
  'checkboxFocusRingColor',
  'checkboxDisabledBorderColor',
  'checkboxDisabledBackgroundColor',
  'checkboxDisabledIconColor',
  'checkboxCheckedBorderColor',
  'checkboxCheckedBackgroundColor',
  'checkboxCheckedIconColor',
  'checkboxCheckedFocusBorderColor',
  'checkboxCheckedFocusBackgroundColor',
  'checkboxCheckedFocusIconColor',
  'checkboxCheckedDisabledBorderColor',
  'checkboxCheckedDisabledBackgroundColor',
  'checkboxCheckedDisabledIconColor',
  'checkboxIndeterminateBorderColor',
  'checkboxIndeterminateBackgroundColor',
  'checkboxIndeterminateIconColor',
  'checkboxIndeterminateFocusBorderColor',
  'checkboxIndeterminateFocusBackgroundColor',
  'checkboxIndeterminateFocusIconColor',
  'checkboxIndeterminateDisabledBorderColor',
  'checkboxIndeterminateDisabledBackgroundColor',
  'checkboxIndeterminateDisabledIconColor',
  // Radio
  'radioSize',
  'radioBorderColor',
  'radioBackgroundColor',
  'radioIconColor',
  'radioFocusBorderColor',
  'radioFocusBackgroundColor',
  'radioFocusIconColor',
  'radioFocusRingColor',
  'radioDisabledBorderColor',
  'radioDisabledBackgroundColor',
  'radioDisabledIconColor',
  'radioCheckedBorderColor',
  'radioCheckedBackgroundColor',
  'radioCheckedIconColor',
  'radioCheckedFocusBorderColor',
  'radioCheckedFocusBackgroundColor',
  'radioCheckedFocusIconColor',
  'radioCheckedDisabledBorderColor',
  'radioCheckedDisabledBackgroundColor',
  'radioCheckedDisabledIconColor',
  // Icon button
  'iconButtonBorderRadius',
  'iconButtonLargeBorderRadius',
  'iconButtonLargePadding',
  'iconButtonBorderColor',
  'iconButtonBackgroundColor',
  'iconButtonIconColor',
  'iconButtonHoverBorderColor',
  'iconButtonHoverBackgroundColor',
  'iconButtonHoverIconColor',
  'iconButtonActiveBorderColor',
  'iconButtonActiveBackgroundColor',
  'iconButtonActiveIconColor',
  'iconButtonActiveHoverBorderColor',
  'iconButtonActiveHoverBackgroundColor',
  'iconButtonActiveHoverIconColor',
  // Collapse button
  'collapseButtonBorderRadius',
  'collapseButtonOpenBorderColor',
  'collapseButtonOpenBackgroundColor',
  'collapseButtonOpenIconColor',
  'collapseButtonOpenIconActiveColor',
  'collapseButtonOpenHoverBorderColor',
  'collapseButtonOpenHoverBackgroundColor',
  'collapseButtonOpenHoverIconColor',
  'collapseButtonOpenHoverIconActiveColor',
  'collapseButtonCloseBorderColor',
  'collapseButtonCloseBackgroundColor',
  'collapseButtonCloseIconColor',
  'collapseButtonCloseIconActiveColor',
  'collapseButtonCloseHoverBorderColor',
  'collapseButtonCloseHoverBackgroundColor',
  'collapseButtonCloseHoverIconColor',
  'collapseButtonCloseHoverIconActiveColor',
  // Button
  'buttonBorderRadius',
  'buttonHorizontalPadding',
  'buttonVerticalPadding',
  // Primary button
  'primaryButtonBorderColor',
  'primaryButtonForegroundColor',
  'primaryButtonBackgroundColor',
  'primaryButtonDisabledBorderColor',
  'primaryButtonDisabledForegroundColor',
  'primaryButtonDisabledBackgroundColor',
  'primaryButtonHoverBorderColor',
  'primaryButtonHoverForegroundColor',
  'primaryButtonHoverBackgroundColor',
  'primaryButtonFocusBorderColor',
  'primaryButtonFocusForegroundColor',
  'primaryButtonFocusBackgroundColor',
  // Secondary button
  'secondaryButtonBorderColor',
  'secondaryButtonForegroundColor',
  'secondaryButtonBackgroundColor',
  'secondaryButtonDisabledBorderColor',
  'secondaryButtonDisabledForegroundColor',
  'secondaryButtonDisabledBackgroundColor',
  'secondaryButtonHoverBorderColor',
  'secondaryButtonHoverForegroundColor',
  'secondaryButtonHoverBackgroundColor',
  'secondaryButtonFocusBorderColor',
  'secondaryButtonFocusForegroundColor',
  'secondaryButtonFocusBackgroundColor',
  // Comments
  'commentsTextareaHorizontalPadding',
  'commentsTextareaVerticalPadding',
  'commentsTextareaBorderWidth',
  'commentsTextareaBorderColor',
  'commentsTextareaForegroundColor',
  'commentsTextareaBackgroundColor',
  'commentsTextareaFocusBorderWidth',
  'commentsTextareaFocusBorderColor',
  'commentsTextareaFocusForegroundColor',
  'commentsTextareaFocusBackgroundColor',
  'commentsIndicatorSize',
  'commentsIndicatorColor',
  // License
  'licenseHorizontalPadding',
  'licenseVerticalPadding',
  'licenseForegroundColor',
  'licenseBackgroundColor',
  // Link
  'linkColor',
  'linkHoverColor',
  // Input
  'inputBorderWidth',
  'inputBorderRadius',
  'inputHorizontalPadding',
  'inputVerticalPadding',
  'inputBorderColor',
  'inputForegroundColor',
  'inputBackgroundColor',
  'inputHoverBorderColor',
  'inputHoverForegroundColor',
  'inputHoverBackgroundColor',
  'inputDisabledBorderColor',
  'inputDisabledForegroundColor',
  'inputDisabledBackgroundColor',
  'inputFocusBorderColor',
  'inputFocusForegroundColor',
  'inputFocusBackgroundColor',
  // Menu
  'menuBorderWidth',
  'menuBorderRadius',
  'menuHorizontalPadding',
  'menuVerticalPadding',
  'menuItemHorizontalPadding',
  'menuItemVerticalPadding',
  'menuBorderColor',
  'menuShadowX',
  'menuShadowY',
  'menuShadowBlur',
  'menuShadowColor',
  'menuShadowOpacity',
  'menuItemHoverColor',
  'menuItemHoverColorOpacity',
  'menuItemActiveColor',
  'menuItemActiveColorOpacity',
  // Dialog
  'dialogSemiTransparentBackgroundColor',
  'dialogSemiTransparentBackgroundOpacity',
  'dialogSolidBackgroundColor',
  'dialogContentPaddingHorizontal',
  'dialogContentPaddingVertical',
  'dialogContentBorderRadius',
  'dialogContentBackgroundColor',
  // Pagination
  'paginationBarForegroundColor',
  'paginationBarBackgroundColor',
  'paginationBarHorizontalPadding',
  'paginationBarVerticalPadding',
]);

/**
 * Validates a theme name value.
 *
 * @param {string} name The theme name to validate.
 * @param {string} context The context name for error messages.
 * @throws {Error} If the name is not a non-empty string.
 * @returns {string} The validated name.
 */
export function validateName(name, context) {
  if (typeof name !== 'string' || name.trim() === '') {
    throw new Error(`[ThemeBuilder] ${context}.name must be a non-empty string.`);
  }

  return name;
}

/**
 * Validates and returns a density type.
 *
 * @param {string} type The density type to validate.
 * @throws {Error} If the density type is invalid.
 * @returns {string} The validated density type.
 */
export function validateDensityType(type) {
  if (!VALID_DENSITY_TYPES.has(type)) {
    const validTypes = [...VALID_DENSITY_TYPES].join(', ');

    throw new Error(
      `[ThemeBuilder] Invalid density: "${type}". Must be one of: ${validTypes}.`
    );
  }

  return type;
}

/**
 * @param {object} density The density object to validate.
 * @param {string} context The context name for error messages.
 * @throws {Error} If the density structure is invalid.
 */
export function validateDensityStructure(density, context) {
  if (isObject(density)) {
    if (!density.type || !density.sizes) {
      throw new Error(`[ThemeBuilder] ${context} must be a string or an object with a 'type' and 'sizes' property.`);
    }

    validateDensityType(density.type);
  } else if (typeof density === 'string') {
    validateDensityType(density);
  }
}

/**
 * Validates a color scheme value.
 *
 * @param {string} mode The color scheme to validate.
 * @throws {Error} If the color scheme is invalid.
 * @returns {string} The validated color scheme.
 */
export function validateColorScheme(mode) {
  if (!VALID_COLOR_SCHEMES.has(mode)) {
    const validModes = [...VALID_COLOR_SCHEMES].join(', ');

    throw new Error(`[ThemeBuilder] Invalid color scheme: "${mode}". Must be one of: ${validModes}.`);
  }

  return mode;
}

/**
 * Validates the structure of the colors object.
 * Colors can be either strings or nested objects containing strings.
 *
 * @param {object} colors The colors object to validate.
 * @param {string} context The context path for error messages.
 * @throws {Error} If the colors structure is invalid.
 */
export function validateColorsStructure(colors, context) {
  Object.entries(colors).forEach(([key, value]) => {
    const currentPath = `${context}.${key}`;

    if (typeof value === 'string') {
      return;
    }

    if (isObject(value)) {
      validateColorsStructure(value, currentPath);
    } else {
      throw new Error(`[ThemeBuilder] ${currentPath} must be a string or an object.`);
    }
  });
}

/**
 * Validates keys and warns about unknown or missing keys.
 *
 * @param {object} obj The object to validate.
 * @param {Set<string>} validKeys The set of valid keys.
 * @param {string} context The context name for warning messages.
 * @param {object} [options] Validation options.
 * @param {string} [options.type='key'] The type name for warning messages.
 * @param {boolean} [options.warnMissing=false] Whether to warn about missing keys.
 */
export function validateKeys(obj, validKeys, context, options = {}) {
  const { type = 'key', warnMissing = false } = options;

  if (!obj) {
    if (warnMissing) {
      warn(`[ThemeBuilder] No ${type}s provided in ${context}. All ${type}s are missing.`);
    }

    return;
  }

  const providedKeys = Object.keys(obj);

  // Warn about unknown keys
  providedKeys.forEach((key) => {
    if (!validKeys.has(key)) {
      warn(`[ThemeBuilder] Unknown ${type} key: "${key}" in ${context}. ` +
        `This may be a custom ${type} or a typo.`);
    }
  });

  // Warn about missing keys only if required
  if (warnMissing) {
    const missingKeys = [];

    validKeys.forEach((key) => {
      if (!(key in obj)) {
        missingKeys.push(key);
      }
    });

    if (missingKeys.length > 0) {
      warn(`[ThemeBuilder] Missing ${type}(s) in ${context}: ${missingKeys.join(', ')}`);
    }
  }
}

/**
 * Validates the parameters object structure.
 *
 * @param {*} parameters The parameters object to validate.
 * @param {string} context The context name for error messages.
 * @param {object} [options] Validation options.
 * @param {string[]} [options.requiredFields=[]] Array of field names that are required.
 * @throws {Error} If the parameters object structure is invalid.
 */
export function validateParams(parameters, context, options = {}) {
  const { requiredFields = [] } = options;

  if (typeof parameters !== 'object' || parameters === null) {
    throw new Error(`[ThemeBuilder] ${context} must be an object.`);
  }

  const {
    name,
    sizing,
    density,
    icons,
    colors,
    tokens,
    colorScheme,
  } = parameters;

  validateKeys(parameters, VALID_PARAMS_KEYS, context, { type: 'param' });

  // Validate required fields
  requiredFields.forEach((field) => {
    if (parameters[field] === undefined) {
      throw new Error(`[ThemeBuilder] ${context}.${field} is required.`);
    }
  });

  if (name !== undefined) {
    validateName(name, context);
  }

  if (sizing !== undefined) {
    if (!isObject(sizing)) {
      throw new Error(`[ThemeBuilder] ${context}.sizing must be an object.`);
    }

    validateKeys(sizing, VALID_SIZING_KEYS, `${context}.sizing`, { type: 'sizing' });
  }

  if (density !== undefined) {
    if (!isObject(density) && typeof density !== 'string') {
      throw new Error(`[ThemeBuilder] ${context}.density must be a string or an object.`);
    }

    validateDensityStructure(density, `${context}.density`);
  }

  if (icons !== undefined) {
    if (!isObject(icons)) {
      throw new Error(`[ThemeBuilder] ${context}.icons must be an object.`);
    }

    validateKeys(icons, VALID_ICON_KEYS, `${context}.icons`, {
      type: 'icon',
      warnMissing: requiredFields.includes('icons'),
    });
  }

  if (colors !== undefined) {
    if (!isObject(colors)) {
      throw new Error(`[ThemeBuilder] ${context}.colors must be an object.`);
    }

    validateColorsStructure(colors, `${context}.colors`);
  }

  if (tokens !== undefined) {
    if (!isObject(tokens)) {
      throw new Error(`[ThemeBuilder] ${context}.tokens must be an object.`);
    }

    validateKeys(tokens, VALID_TOKEN_KEYS, `${context}.tokens`, {
      type: 'token',
      warnMissing: requiredFields.includes('tokens'),
    });
  }

  if (colorScheme !== undefined) {
    validateColorScheme(colorScheme);
  }
}
