import { isObject } from '../../../helpers/object';
import { warn } from '../../../helpers/console';
import { throwWithCause } from '../../../helpers/errors';
import type { ThemeColorScheme, DensityType } from '../../types';

/**
 * Valid parameters keys.
 *
 * @type {Set<string>}
 */
const VALID_PARAMS_KEYS = new Set([
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
const VALID_COLOR_SCHEMES = new Set(['light', 'dark', 'auto']);

/**
 * Valid density type values.
 *
 * @type {Set<string>}
 */
const VALID_DENSITY_TYPES = new Set(['default', 'compact', 'comfortable']);

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
  'chipClose',
  'search',
]);

/**
 * Valid token key values.
 *
 * @type {Set<string>}
 */
const VALID_TOKEN_KEYS = new Set([
  // Typography
  'fontFamily',
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
  'borderRadius',
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
  'cellMobileHandleBorderColor',
  'cellMobileHandleBackgroundColor',
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
  'iconButtonHitAreaSize',
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
  // Notification (toast)
  'notificationForegroundColor',
  'notificationBackgroundColor',
  'notificationBorderColor',
  'notificationSuccessAccent',
  'notificationWarningAccent',
  'notificationErrorAccent',
  // Pagination
  'paginationBarForegroundColor',
  'paginationBarBackgroundColor',
  'paginationBarHorizontalPadding',
  'paginationBarVerticalPadding',
  'paginationButtonBorderColor',
  'paginationButtonForegroundColor',
  'paginationButtonBackgroundColor',
  'paginationButtonHoverBorderColor',
  'paginationButtonHoverForegroundColor',
  'paginationButtonHoverBackgroundColor',
  'paginationButtonDisabledForegroundColor',
  'paginationButtonDisabledBackgroundColor',
  'paginationButtonDisabledBorderColor',
  'paginationButtonFocusBorderColor',
  'paginationButtonFocusForegroundColor',
  'paginationButtonFocusBackgroundColor',
  // Multiselect
  'chipBackground',
  'chipBorderRadius',
  'chipVerticalPadding',
  'chipHorizontalPadding',
  'chipGap',
]);

/**
 * Validates a theme name value.
 *
 * @param {string} name The theme name to validate.
 * @param {string} context The context name for error messages.
 * @throws {Error} If the name is not a non-empty string.
 * @returns {string} The validated name.
 */
function validateName(name: string, context: string): string {
  if (typeof name !== 'string' || name.trim() === '') {
    throwWithCause(`[ThemeBuilder] ${context}.name must be a non-empty string.`);
  }

  return name;
}

/**
 * Validates a color scheme value.
 *
 * @param {string} mode The color scheme to validate.
 * @throws {Error} If the color scheme is invalid.
 * @returns {ThemeColorScheme} The validated color scheme.
 */
export function validateColorScheme(mode: string): ThemeColorScheme {
  if (!VALID_COLOR_SCHEMES.has(mode)) {
    const validModes = [...VALID_COLOR_SCHEMES].join(', ');

    throwWithCause(`[ThemeBuilder] Invalid color scheme: "${mode}". Must be one of: ${validModes}.`);
  }

  return mode as ThemeColorScheme;
}

/**
 * Validates and returns a density type.
 *
 * @param {string} type The density type to validate.
 * @throws {Error} If the density type is invalid.
 * @returns {DensityType} The validated density type.
 */
export function validateDensityType(type: string): DensityType {
  if (!VALID_DENSITY_TYPES.has(type)) {
    const validTypes = [...VALID_DENSITY_TYPES].join(', ');

    throwWithCause(
      `[ThemeBuilder] Invalid density: "${type}". Must be one of: ${validTypes}.`
    );
  }

  return type as DensityType;
}

/**
 * Validates the structure of the density sizes object.
 *
 * @param {object} sizes The density sizes object to validate.
 * @param {string} context The context name for error messages.
 * @throws {Error} If the density sizes structure is invalid.
 */
function validateDensitySizes(sizes: unknown, context: string): void {
  if (!isObject(sizes) || typeof sizes !== 'object' || sizes === null) {
    throwWithCause(`[ThemeBuilder] ${context}.sizes must be an object.`);

    return;
  }

  Object.keys(sizes).forEach((key) => {
    if (!VALID_DENSITY_TYPES.has(key)) {
      warn(
        `[ThemeBuilder] Unknown density size key: "${key}" in ${context}.sizes. ` +
        'This may be a custom density size or a typo.'
      );
    }
  });
}

/**
 * @param {object} density The density object to validate.
 * @param {string} context The context name for error messages.
 * @throws {Error} If the density structure is invalid.
 */
function validateDensityStructure(density: unknown, context: string): void {
  if (isObject(density)) {
    const d = density as Record<string, unknown>;

    if (!d.type || !d.sizes) {
      throwWithCause(`[ThemeBuilder] ${context} must be a string or an object with a 'type' and 'sizes' property.`);
    }

    validateDensityType(String(d.type));
    validateDensitySizes(d.sizes, `${context}.sizes`);

  } else if (typeof density === 'string') {
    validateDensityType(density);
  }
}

/**
 * Validates the structure of the colors object.
 * Colors can be either strings or nested objects containing strings.
 *
 * @param {object} colors The colors object to validate.
 * @param {string} context The context path for error messages.
 * @throws {Error} If the colors structure is invalid.
 */
function validateColorsStructure(colors: Record<string, unknown>, context: string): void {
  Object.entries(colors).forEach(([key, value]) => {
    const currentPath = `${context}.${key}`;

    if (typeof value === 'string') {
      return;
    }

    if (isObject(value)) {
      validateColorsStructure(value as Record<string, unknown>, currentPath);
    } else {
      throwWithCause(`[ThemeBuilder] ${currentPath} must be a string or an object.`);
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
function validateKeys(
  obj: Record<string, unknown> | undefined, validKeys: Set<string>, context: string,
  options: { type?: string; warnMissing?: boolean } = {}): void {
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
    const missingKeys: string[] = [];

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
export function validateParams(
  parameters: unknown, context: string, options: { requiredFields?: string[] } = {}): void {
  const { requiredFields = [] } = options;

  if (typeof parameters !== 'object' || parameters === null) {
    throwWithCause(`[ThemeBuilder] ${context} must be an object.`);
  }

  const params = parameters as Record<string, unknown>;
  const {
    name,
    sizing,
    density,
    icons,
    colors,
    tokens,
    colorScheme,
  } = params;

  validateKeys(params, VALID_PARAMS_KEYS, context, { type: 'param' });

  // Validate required fields
  requiredFields.forEach((field) => {
    if (params[field] === undefined) {
      throwWithCause(`[ThemeBuilder] ${context}.${field} is required.`);
    }
  });

  // Validate name
  if (name !== undefined) {
    validateName(name as string, context);
  }

  // Validate sizing
  if (sizing !== undefined) {
    if (!isObject(sizing)) {
      throwWithCause(`[ThemeBuilder] ${context}.sizing must be an object.`);
    }
  }

  // Validate density
  if (density !== undefined) {
    if (!isObject(density) && typeof density !== 'string') {
      throwWithCause(`[ThemeBuilder] ${context}.density must be a string or an object.`);
    }

    validateDensityStructure(density, `${context}.density`);
  }

  // Validate icons
  if (icons !== undefined) {
    if (!isObject(icons)) {
      throwWithCause(`[ThemeBuilder] ${context}.icons must be an object.`);
    }

    validateKeys(icons as Record<string, unknown>, VALID_ICON_KEYS, `${context}.icons`, {
      type: 'icon',
      warnMissing: requiredFields.includes('icons'),
    });
  }

  // Validate colors
  if (colors !== undefined) {
    if (!isObject(colors)) {
      throwWithCause(`[ThemeBuilder] ${context}.colors must be an object.`);
    }

    validateColorsStructure(colors as Record<string, unknown>, `${context}.colors`);
  }

  // Validate tokens
  if (tokens !== undefined) {
    if (!isObject(tokens)) {
      throwWithCause(`[ThemeBuilder] ${context}.tokens must be an object.`);
    }

    validateKeys(tokens as Record<string, unknown>, VALID_TOKEN_KEYS, `${context}.tokens`, {
      type: 'token',
      warnMissing: requiredFields.includes('tokens'),
    });
  }

  // Validate color scheme
  if (colorScheme !== undefined) {
    validateColorScheme(String(colorScheme));
  }
}
