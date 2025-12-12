export type ThemeLightDarkValue = {
  light?: string;
  dark?: string;
};

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
  | 'cell_vertical'
  | 'cell_horizontal'
  | 'bars_horizontal'
  | 'bars_vertical'
  | 'gap'
  | 'button_horizontal'
  | 'button_vertical'
  | 'dialog_horizontal'
  | 'dialog_vertical'
  | 'input_horizontal'
  | 'input_vertical'
  | 'menu_vertical'
  | 'menu_horizontal'
  | 'menu_item_vertical'
  | 'menu_item_horizontal';

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
  | 'arrow_right'
  | 'arrow_right_with_bar'
  | 'arrow_left'
  | 'arrow_left_with_bar'
  | 'arrow_down'
  | 'menu'
  | 'select_arrow'
  | 'arrow_narrow_up'
  | 'arrow_narrow_down'
  | 'check'
  | 'checkbox'
  | 'caret_hidden_left'
  | 'caret_hidden_right'
  | 'caret_hidden_up'
  | 'caret_hidden_down'
  | 'collapse_off'
  | 'collapse_on'
  | 'radio';

export type ThemeIconsConfig = Partial<Record<IconKey, string>> & Record<string, string>;

export interface ThemeColorsConfig {
  [key: string]: string | Record<string, string>;
}

export type TokenKey =
  // Typography
  | 'font_size'
  | 'font_size_small'
  | 'line_height'
  | 'line_height_small'
  | 'font_weight'
  | 'letter_spacing'
  // Layout
  | 'gap_size'
  | 'icon_size'
  | 'table_transition'
  // Base colors
  | 'border_color'
  | 'accent_color'
  | 'foreground_color'
  | 'foreground_secondary_color'
  | 'background_color'
  | 'background_secondary_color'
  | 'placeholder_color'
  | 'read_only_color'
  | 'disabled_color'
  // Shadow
  | 'shadow_color'
  | 'shadow_x'
  | 'shadow_y'
  | 'shadow_blur'
  | 'shadow_opacity'
  // Bars
  | 'bar_foreground_color'
  | 'bar_background_color'
  | 'bar_horizontal_padding'
  | 'bar_vertical_padding'
  // Cell
  | 'cell_horizontal_border_color'
  | 'cell_vertical_border_color'
  | 'cell_horizontal_padding'
  | 'cell_vertical_padding'
  // Wrapper
  | 'wrapper_border_width'
  | 'wrapper_border_radius'
  | 'wrapper_border_color'
  // Row
  | 'row_header_odd_background_color'
  | 'row_header_even_background_color'
  | 'row_cell_odd_background_color'
  | 'row_cell_even_background_color'
  // Cell editor
  | 'cell_editor_border_width'
  | 'cell_editor_border_color'
  | 'cell_editor_foreground_color'
  | 'cell_editor_background_color'
  | 'cell_editor_shadow_blur_radius'
  | 'cell_editor_shadow_color'
  // Cell states
  | 'cell_success_background_color'
  | 'cell_error_background_color'
  | 'cell_read_only_background_color'
  // Cell selection
  | 'cell_selection_border_color'
  | 'cell_selection_background_color'
  // Cell autofill
  | 'cell_autofill_size'
  | 'cell_autofill_border_width'
  | 'cell_autofill_border_radius'
  | 'cell_autofill_border_color'
  | 'cell_autofill_background_color'
  | 'cell_autofill_fill_border_color'
  // Cell mobile
  | 'cell_mobile_handle_size'
  | 'cell_mobile_handle_border_width'
  | 'cell_mobile_handle_border_radius'
  | 'cell_mobile_handle_background_opacity'
  // Resize/Move indicators
  | 'resize_indicator_color'
  | 'move_backlight_color'
  | 'move_backlight_opacity'
  | 'move_indicator_color'
  | 'hidden_indicator_color'
  // Scrollbar
  | 'scrollbar_border_radius'
  | 'scrollbar_track_color'
  | 'scrollbar_thumb_color'
  // Header
  | 'header_font_weight'
  | 'header_foreground_color'
  | 'header_background_color'
  | 'header_highlighted_shadow_size'
  | 'header_highlighted_foreground_color'
  | 'header_highlighted_background_color'
  | 'header_active_border_color'
  | 'header_active_foreground_color'
  | 'header_active_background_color'
  | 'header_filter_background_color'
  // Header row
  | 'header_row_foreground_color'
  | 'header_row_background_color'
  | 'header_row_highlighted_foreground_color'
  | 'header_row_highlighted_background_color'
  | 'header_row_active_foreground_color'
  | 'header_row_active_background_color'
  // Checkbox
  | 'checkbox_size'
  | 'checkbox_border_radius'
  | 'checkbox_border_color'
  | 'checkbox_background_color'
  | 'checkbox_icon_color'
  | 'checkbox_focus_border_color'
  | 'checkbox_focus_background_color'
  | 'checkbox_focus_icon_color'
  | 'checkbox_focus_ring_color'
  | 'checkbox_disabled_border_color'
  | 'checkbox_disabled_background_color'
  | 'checkbox_disabled_icon_color'
  | 'checkbox_checked_border_color'
  | 'checkbox_checked_background_color'
  | 'checkbox_checked_icon_color'
  | 'checkbox_checked_focus_border_color'
  | 'checkbox_checked_focus_background_color'
  | 'checkbox_checked_focus_icon_color'
  | 'checkbox_checked_disabled_border_color'
  | 'checkbox_checked_disabled_background_color'
  | 'checkbox_checked_disabled_icon_color'
  | 'checkbox_indeterminate_border_color'
  | 'checkbox_indeterminate_background_color'
  | 'checkbox_indeterminate_icon_color'
  | 'checkbox_indeterminate_focus_border_color'
  | 'checkbox_indeterminate_focus_background_color'
  | 'checkbox_indeterminate_focus_icon_color'
  | 'checkbox_indeterminate_disabled_border_color'
  | 'checkbox_indeterminate_disabled_background_color'
  | 'checkbox_indeterminate_disabled_icon_color'
  // Radio
  | 'radio_size'
  | 'radio_border_color'
  | 'radio_background_color'
  | 'radio_icon_color'
  | 'radio_focus_border_color'
  | 'radio_focus_background_color'
  | 'radio_focus_icon_color'
  | 'radio_focus_ring_color'
  | 'radio_disabled_border_color'
  | 'radio_disabled_background_color'
  | 'radio_disabled_icon_color'
  | 'radio_checked_border_color'
  | 'radio_checked_background_color'
  | 'radio_checked_icon_color'
  | 'radio_checked_focus_border_color'
  | 'radio_checked_focus_background_color'
  | 'radio_checked_focus_icon_color'
  | 'radio_checked_disabled_border_color'
  | 'radio_checked_disabled_background_color'
  | 'radio_checked_disabled_icon_color'
  // Icon button
  | 'icon_button_border_radius'
  | 'icon_button_large_border_radius'
  | 'icon_button_large_padding'
  | 'icon_button_border_color'
  | 'icon_button_background_color'
  | 'icon_button_icon_color'
  | 'icon_button_hover_border_color'
  | 'icon_button_hover_background_color'
  | 'icon_button_hover_icon_color'
  | 'icon_button_active_border_color'
  | 'icon_button_active_background_color'
  | 'icon_button_active_icon_color'
  | 'icon_button_active_hover_border_color'
  | 'icon_button_active_hover_background_color'
  | 'icon_button_active_hover_icon_color'
  // Collapse button
  | 'collapse_button_border_radius'
  | 'collapse_button_open_border_color'
  | 'collapse_button_open_background_color'
  | 'collapse_button_open_icon_color'
  | 'collapse_button_open_icon_active_color'
  | 'collapse_button_open_hover_border_color'
  | 'collapse_button_open_hover_background_color'
  | 'collapse_button_open_hover_icon_color'
  | 'collapse_button_open_hover_icon_active_color'
  | 'collapse_button_close_border_color'
  | 'collapse_button_close_background_color'
  | 'collapse_button_close_icon_color'
  | 'collapse_button_close_icon_active_color'
  | 'collapse_button_close_hover_border_color'
  | 'collapse_button_close_hover_background_color'
  | 'collapse_button_close_hover_icon_color'
  | 'collapse_button_close_hover_icon_active_color'
  // Button
  | 'button_border_radius'
  | 'button_horizontal_padding'
  | 'button_vertical_padding'
  // Primary button
  | 'primary_button_border_color'
  | 'primary_button_foreground_color'
  | 'primary_button_background_color'
  | 'primary_button_disabled_border_color'
  | 'primary_button_disabled_foreground_color'
  | 'primary_button_disabled_background_color'
  | 'primary_button_hover_border_color'
  | 'primary_button_hover_foreground_color'
  | 'primary_button_hover_background_color'
  | 'primary_button_focus_border_color'
  | 'primary_button_focus_foreground_color'
  | 'primary_button_focus_background_color'
  // Secondary button
  | 'secondary_button_border_color'
  | 'secondary_button_foreground_color'
  | 'secondary_button_background_color'
  | 'secondary_button_disabled_border_color'
  | 'secondary_button_disabled_foreground_color'
  | 'secondary_button_disabled_background_color'
  | 'secondary_button_hover_border_color'
  | 'secondary_button_hover_foreground_color'
  | 'secondary_button_hover_background_color'
  | 'secondary_button_focus_border_color'
  | 'secondary_button_focus_foreground_color'
  | 'secondary_button_focus_background_color'
  // Comments
  | 'comments_textarea_horizontal_padding'
  | 'comments_textarea_vertical_padding'
  | 'comments_textarea_border_width'
  | 'comments_textarea_border_color'
  | 'comments_textarea_foreground_color'
  | 'comments_textarea_background_color'
  | 'comments_textarea_focus_border_width'
  | 'comments_textarea_focus_border_color'
  | 'comments_textarea_focus_foreground_color'
  | 'comments_textarea_focus_background_color'
  | 'comments_indicator_size'
  | 'comments_indicator_color'
  // License
  | 'license_horizontal_padding'
  | 'license_vertical_padding'
  | 'license_foreground_color'
  | 'license_background_color'
  // Link
  | 'link_color'
  | 'link_hover_color'
  // Input
  | 'input_border_width'
  | 'input_border_radius'
  | 'input_horizontal_padding'
  | 'input_vertical_padding'
  | 'input_border_color'
  | 'input_foreground_color'
  | 'input_background_color'
  | 'input_hover_border_color'
  | 'input_hover_foreground_color'
  | 'input_hover_background_color'
  | 'input_disabled_border_color'
  | 'input_disabled_foreground_color'
  | 'input_disabled_background_color'
  | 'input_focus_border_color'
  | 'input_focus_foreground_color'
  | 'input_focus_background_color'
  // Menu
  | 'menu_border_width'
  | 'menu_border_radius'
  | 'menu_horizontal_padding'
  | 'menu_vertical_padding'
  | 'menu_item_horizontal_padding'
  | 'menu_item_vertical_padding'
  | 'menu_border_color'
  | 'menu_shadow_x'
  | 'menu_shadow_y'
  | 'menu_shadow_blur'
  | 'menu_shadow_color'
  | 'menu_shadow_opacity'
  | 'menu_item_hover_color'
  | 'menu_item_hover_color_opacity'
  | 'menu_item_active_color'
  | 'menu_item_active_color_opacity'
  // Dialog
  | 'dialog_semi_transparent_background_color'
  | 'dialog_semi_transparent_background_opacity'
  | 'dialog_solid_background_color'
  | 'dialog_content_padding_horizontal'
  | 'dialog_content_padding_vertical'
  | 'dialog_content_border_radius'
  | 'dialog_content_background_color'
  // Pagination
  | 'pagination_bar_foreground_color'
  | 'pagination_bar_background_color'
  | 'pagination_bar_horizontal_padding'
  | 'pagination_bar_vertical_padding';

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
  density?: DensityType | ThemeDensityConfig;
  icons?: Partial<ThemeIconsConfig>;
  colors?: Partial<ThemeColorsConfig>;
  tokens?: Partial<ThemeTokensConfig>;
  colorScheme?: ThemeColorScheme;
}

export interface ThemeBuilder {
  subscribe(listener: (config: ThemeConfig) => void): () => void;
  params(paramsObject: ThemeParams): ThemeBuilder;
  setDensityType(type: DensityType): ThemeBuilder;
  setColorScheme(mode: ThemeColorScheme): ThemeBuilder;
  getThemeConfig(): ThemeConfig;
}

export function createTheme(baseTheme?: ThemeParams): ThemeBuilder;
