import Handsontable from 'handsontable';

// A map of the project is read somewhere else by name, so its keys stay.
const cssVars = { '--ht-wrapper-border-radius': '4px' };
const radius = cssVars['--ht-wrapper-border-radius'];

// The keys of a style, and every string that is not a key, are renamed.
const rootStyle = { '--ht-wrapper-border-radius': '4px' };
document.body.style['--ht-wrapper-border-radius'] = '4px';
document.body.style.setProperty('--ht-wrapper-border-radius', '4px');
const css = `.grid { border-radius: var(--ht-wrapper-border-radius); }`;
