import { isObject } from '../../helpers/object';
import { warn } from '../../helpers/console';

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
  'cell_vertical',
  'cell_horizontal',
  'bars_horizontal',
  'bars_vertical',
  'gap',
  'button_horizontal',
  'button_vertical',
  'dialog_horizontal',
  'dialog_vertical',
  'input_horizontal',
  'input_vertical',
  'menu_vertical',
  'menu_horizontal',
  'menu_item_vertical',
  'menu_item_horizontal',
]);

/**
 * Valid icon key values.
 *
 * @type {Set<string>}
 */
export const VALID_ICON_KEYS = new Set([
  'arrow_right',
  'arrow_right_with_bar',
  'arrow_left',
  'arrow_left_with_bar',
  'arrow_down',
  'menu',
  'select_arrow',
  'arrow_narrow_up',
  'arrow_narrow_down',
  'check',
  'checkbox',
  'caret_hidden_left',
  'caret_hidden_right',
  'caret_hidden_up',
  'caret_hidden_down',
  'collapse_off',
  'collapse_on',
  'radio',
]);

/**
 * Valid token key values.
 *
 * @type {Set<string>}
 */
export const VALID_TOKEN_KEYS = new Set([
  // Typography
  'font_size',
  'font_size_small',
  'line_height',
  'line_height_small',
  'font_weight',
  'letter_spacing',
  // Layout
  'gap_size',
  'icon_size',
  'table_transition',
  // Base colors
  'border_color',
  'accent_color',
  'foreground_color',
  'foreground_secondary_color',
  'background_color',
  'background_secondary_color',
  'placeholder_color',
  'read_only_color',
  'disabled_color',
  // Shadow
  'shadow_color',
  'shadow_x',
  'shadow_y',
  'shadow_blur',
  'shadow_opacity',
  // Bars
  'bar_foreground_color',
  'bar_background_color',
  'bar_horizontal_padding',
  'bar_vertical_padding',
  // Cell
  'cell_horizontal_border_color',
  'cell_vertical_border_color',
  'cell_horizontal_padding',
  'cell_vertical_padding',
  // Wrapper
  'wrapper_border_width',
  'wrapper_border_radius',
  'wrapper_border_color',
  // Row
  'row_header_odd_background_color',
  'row_header_even_background_color',
  'row_cell_odd_background_color',
  'row_cell_even_background_color',
  // Cell editor
  'cell_editor_border_width',
  'cell_editor_border_color',
  'cell_editor_foreground_color',
  'cell_editor_background_color',
  'cell_editor_shadow_blur_radius',
  'cell_editor_shadow_color',
  // Cell states
  'cell_success_background_color',
  'cell_error_background_color',
  'cell_read_only_background_color',
  // Cell selection
  'cell_selection_border_color',
  'cell_selection_background_color',
  // Cell autofill
  'cell_autofill_size',
  'cell_autofill_border_width',
  'cell_autofill_border_radius',
  'cell_autofill_border_color',
  'cell_autofill_background_color',
  'cell_autofill_fill_border_color',
  // Cell mobile
  'cell_mobile_handle_size',
  'cell_mobile_handle_border_width',
  'cell_mobile_handle_border_radius',
  'cell_mobile_handle_background_opacity',
  // Resize/Move indicators
  'resize_indicator_color',
  'move_backlight_color',
  'move_backlight_opacity',
  'move_indicator_color',
  'hidden_indicator_color',
  // Scrollbar
  'scrollbar_border_radius',
  'scrollbar_track_color',
  'scrollbar_thumb_color',
  // Header
  'header_font_weight',
  'header_foreground_color',
  'header_background_color',
  'header_highlighted_shadow_size',
  'header_highlighted_foreground_color',
  'header_highlighted_background_color',
  'header_active_border_color',
  'header_active_foreground_color',
  'header_active_background_color',
  'header_filter_background_color',
  // Header row
  'header_row_foreground_color',
  'header_row_background_color',
  'header_row_highlighted_foreground_color',
  'header_row_highlighted_background_color',
  'header_row_active_foreground_color',
  'header_row_active_background_color',
  // Checkbox
  'checkbox_size',
  'checkbox_border_radius',
  'checkbox_border_color',
  'checkbox_background_color',
  'checkbox_icon_color',
  'checkbox_focus_border_color',
  'checkbox_focus_background_color',
  'checkbox_focus_icon_color',
  'checkbox_focus_ring_color',
  'checkbox_disabled_border_color',
  'checkbox_disabled_background_color',
  'checkbox_disabled_icon_color',
  'checkbox_checked_border_color',
  'checkbox_checked_background_color',
  'checkbox_checked_icon_color',
  'checkbox_checked_focus_border_color',
  'checkbox_checked_focus_background_color',
  'checkbox_checked_focus_icon_color',
  'checkbox_checked_disabled_border_color',
  'checkbox_checked_disabled_background_color',
  'checkbox_checked_disabled_icon_color',
  'checkbox_indeterminate_border_color',
  'checkbox_indeterminate_background_color',
  'checkbox_indeterminate_icon_color',
  'checkbox_indeterminate_focus_border_color',
  'checkbox_indeterminate_focus_background_color',
  'checkbox_indeterminate_focus_icon_color',
  'checkbox_indeterminate_disabled_border_color',
  'checkbox_indeterminate_disabled_background_color',
  'checkbox_indeterminate_disabled_icon_color',
  // Radio
  'radio_size',
  'radio_border_color',
  'radio_background_color',
  'radio_icon_color',
  'radio_focus_border_color',
  'radio_focus_background_color',
  'radio_focus_icon_color',
  'radio_focus_ring_color',
  'radio_disabled_border_color',
  'radio_disabled_background_color',
  'radio_disabled_icon_color',
  'radio_checked_border_color',
  'radio_checked_background_color',
  'radio_checked_icon_color',
  'radio_checked_focus_border_color',
  'radio_checked_focus_background_color',
  'radio_checked_focus_icon_color',
  'radio_checked_disabled_border_color',
  'radio_checked_disabled_background_color',
  'radio_checked_disabled_icon_color',
  // Icon button
  'icon_button_border_radius',
  'icon_button_large_border_radius',
  'icon_button_large_padding',
  'icon_button_border_color',
  'icon_button_background_color',
  'icon_button_icon_color',
  'icon_button_hover_border_color',
  'icon_button_hover_background_color',
  'icon_button_hover_icon_color',
  'icon_button_active_border_color',
  'icon_button_active_background_color',
  'icon_button_active_icon_color',
  'icon_button_active_hover_border_color',
  'icon_button_active_hover_background_color',
  'icon_button_active_hover_icon_color',
  // Collapse button
  'collapse_button_border_radius',
  'collapse_button_open_border_color',
  'collapse_button_open_background_color',
  'collapse_button_open_icon_color',
  'collapse_button_open_icon_active_color',
  'collapse_button_open_hover_border_color',
  'collapse_button_open_hover_background_color',
  'collapse_button_open_hover_icon_color',
  'collapse_button_open_hover_icon_active_color',
  'collapse_button_close_border_color',
  'collapse_button_close_background_color',
  'collapse_button_close_icon_color',
  'collapse_button_close_icon_active_color',
  'collapse_button_close_hover_border_color',
  'collapse_button_close_hover_background_color',
  'collapse_button_close_hover_icon_color',
  'collapse_button_close_hover_icon_active_color',
  // Button
  'button_border_radius',
  'button_horizontal_padding',
  'button_vertical_padding',
  // Primary button
  'primary_button_border_color',
  'primary_button_foreground_color',
  'primary_button_background_color',
  'primary_button_disabled_border_color',
  'primary_button_disabled_foreground_color',
  'primary_button_disabled_background_color',
  'primary_button_hover_border_color',
  'primary_button_hover_foreground_color',
  'primary_button_hover_background_color',
  'primary_button_focus_border_color',
  'primary_button_focus_foreground_color',
  'primary_button_focus_background_color',
  // Secondary button
  'secondary_button_border_color',
  'secondary_button_foreground_color',
  'secondary_button_background_color',
  'secondary_button_disabled_border_color',
  'secondary_button_disabled_foreground_color',
  'secondary_button_disabled_background_color',
  'secondary_button_hover_border_color',
  'secondary_button_hover_foreground_color',
  'secondary_button_hover_background_color',
  'secondary_button_focus_border_color',
  'secondary_button_focus_foreground_color',
  'secondary_button_focus_background_color',
  // Comments
  'comments_textarea_horizontal_padding',
  'comments_textarea_vertical_padding',
  'comments_textarea_border_width',
  'comments_textarea_border_color',
  'comments_textarea_foreground_color',
  'comments_textarea_background_color',
  'comments_textarea_focus_border_width',
  'comments_textarea_focus_border_color',
  'comments_textarea_focus_foreground_color',
  'comments_textarea_focus_background_color',
  'comments_indicator_size',
  'comments_indicator_color',
  // License
  'license_horizontal_padding',
  'license_vertical_padding',
  'license_foreground_color',
  'license_background_color',
  // Link
  'link_color',
  'link_hover_color',
  // Input
  'input_border_width',
  'input_border_radius',
  'input_horizontal_padding',
  'input_vertical_padding',
  'input_border_color',
  'input_foreground_color',
  'input_background_color',
  'input_hover_border_color',
  'input_hover_foreground_color',
  'input_hover_background_color',
  'input_disabled_border_color',
  'input_disabled_foreground_color',
  'input_disabled_background_color',
  'input_focus_border_color',
  'input_focus_foreground_color',
  'input_focus_background_color',
  // Menu
  'menu_border_width',
  'menu_border_radius',
  'menu_horizontal_padding',
  'menu_vertical_padding',
  'menu_item_horizontal_padding',
  'menu_item_vertical_padding',
  'menu_border_color',
  'menu_shadow_x',
  'menu_shadow_y',
  'menu_shadow_blur',
  'menu_shadow_color',
  'menu_shadow_opacity',
  'menu_item_hover_color',
  'menu_item_hover_color_opacity',
  'menu_item_active_color',
  'menu_item_active_color_opacity',
  // Dialog
  'dialog_semi_transparent_background_color',
  'dialog_semi_transparent_background_opacity',
  'dialog_solid_background_color',
  'dialog_content_padding_horizontal',
  'dialog_content_padding_vertical',
  'dialog_content_border_radius',
  'dialog_content_background_color',
  // Pagination
  'pagination_bar_foreground_color',
  'pagination_bar_background_color',
  'pagination_bar_horizontal_padding',
  'pagination_bar_vertical_padding',
]);

/**
 * Validates sizing keys and warns about unknown keys.
 *
 * @param {object} sizing The sizing object to validate.
 * @param {string} context The context name for warning messages.
 */
export function validateSizingKeys(sizing, context) {
  if (!sizing) {
    return;
  }

  Object.keys(sizing).forEach((key) => {
    if (!VALID_SIZING_KEYS.has(key)) {
      warn(`[ThemeBuilder] Unknown sizing key: "${key}" in ${context}. ` +
        `Valid keys are: ${[...VALID_SIZING_KEYS].join(', ')}`);
    }
  });
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
 * Validates icon keys and warns about unknown keys.
 *
 * @param {object} icons The icons object to validate.
 * @param {string} context The context name for warning messages.
 */
export function validateIconKeys(icons, context) {
  if (!icons) {
    return;
  }

  Object.keys(icons).forEach((key) => {
    if (!VALID_ICON_KEYS.has(key)) {
      warn(`[ThemeBuilder] Unknown icon key: "${key}" in ${context}. ` +
        'This may be a custom icon or a typo.');
    }
  });
}

/**
 * Validates token keys and warns about unknown keys.
 *
 * @param {object} tokens The tokens object to validate.
 * @param {string} context The context name for warning messages.
 */
export function validateTokenKeys(tokens, context) {
  if (!tokens) {
    return;
  }

  Object.keys(tokens).forEach((key) => {
    if (!VALID_TOKEN_KEYS.has(key)) {
      warn(`[ThemeBuilder] Unknown token key: "${key}" in ${context}. ` +
        'This may be a custom token or a typo.');
    }
  });
}

/**
 * Validates the parameters object.
 * The parameters object must be an object. Each top-level key is optional but if provided must be of the correct type.
 *
 * @param {*} parameters The parameters object to validate.
 * @param {string} context The context name for error messages (e.g., 'baseTheme', 'params').
 * @throws {Error} If the parameters object is not an object or any provided value has an invalid type.
 */
export function validateParams(parameters, context) {
  if (typeof parameters !== 'object' || parameters === null) {
    throw new Error(`[ThemeBuilder] ${context} must be an object.`);
  }

  const {
    sizing,
    density,
    icons,
    colors,
    tokens,
    colorScheme,
  } = parameters;

  if (sizing !== undefined) {
    if (!isObject(sizing)) {
      throw new Error(`[ThemeBuilder] ${context}.sizing must be an object.`);
    }

    validateSizingKeys(sizing, `${context}.sizing`);
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

    validateIconKeys(icons, `${context}.icons`);
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

    validateTokenKeys(tokens, `${context}.tokens`);
  }

  if (colorScheme !== undefined) {
    validateColorScheme(colorScheme);
  }
}
