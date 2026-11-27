import Handsontable from "handsontable";

const root = document.querySelector('.ht-theme-main') as HTMLElement;

root.style.setProperty("--ht-wrapper-border-radius", '8px');
root.style.setProperty('--ht-wrapper-border-radius-extra', '2px');

const radius = 'var(--ht-wrapper-border-radius)';
const css = `.grid { border-radius: var(--ht-wrapper-border-radius, 4px); color: ${radius}; }`;
const overrides = { '--ht-wrapper-border-radius': '4px', "--ht-wrapper-border-width": '1px' };

// The identifier is not a CSS variable name and must not change.
const wrapperBorderRadius = 4;

const hot = new Handsontable(root, { data: [[wrapperBorderRadius]] });

export { css, hot, overrides, radius };
