import Handsontable from "handsontable";

const root = document.querySelector('.ht-theme-main') as HTMLElement;

root.style.setProperty("--ht-border-radius", '8px');
root.style.setProperty('--ht-wrapper-border-radius-extra', '2px');

const radius = 'var(--ht-border-radius)';
const css = `.grid { border-radius: var(--ht-border-radius, 4px); color: ${radius}; }`;
// TODO(handsontable-codemod 18.0.0/css-wrapper-border-width): Draw the outer border with a box-shadow on the root wrapper, because 18.0 removed this variable. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#update-theme-wrapper-border-variables
const overrides = { '--ht-border-radius': '4px', "--ht-wrapper-border-width": '1px' };

// The identifier is not a CSS variable name and must not change.
const wrapperBorderRadius = 4;

const hot = new Handsontable(root, { data: [[wrapperBorderRadius]] });

export { css, hot, overrides, radius };
