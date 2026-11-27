import Handsontable from 'handsontable';

// A map of the project is read somewhere else by name, so its keys stay.
// TODO(handsontable-codemod 18.0.0/css-wrapper-border-radius): Rename --ht-wrapper-border-radius to --ht-border-radius here by hand if this key names the CSS... See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#update-theme-wrapper-border-variables
const cssVars = { '--ht-wrapper-border-radius': '4px' };
// TODO(handsontable-codemod 18.0.0/css-wrapper-border-radius): Rename --ht-wrapper-border-radius to --ht-border-radius here by hand if this key names the CSS... See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#update-theme-wrapper-border-variables
const radius = cssVars['--ht-wrapper-border-radius'];

// The keys of a style, and every string that is not a key, are renamed.
const rootStyle = { '--ht-border-radius': '4px' };
document.body.style['--ht-border-radius'] = '4px';
document.body.style.setProperty('--ht-border-radius', '4px');
const css = `.grid { border-radius: var(--ht-border-radius); }`;
