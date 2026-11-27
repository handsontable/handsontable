// TODO(handsontable-codemod 19.0.0/icons-map-helper): Replace iconsMap(icons, themePrefix) with iconStyles(icons, scopeSelector) from... See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#icons-are-rendered-as-i-elements
import { iconsMap } from 'handsontable/themes/static/variables/helpers/iconsMap';
import { iconStyles } from 'handsontable/themes/static/variables/helpers/iconStyles';

export const css = iconsMap({ check: 'url(check.svg)' }, 'ht-theme-main');
export const scoped = iconStyles({ check: 'url(check.svg)' }, '.ht-theme-main');
