// A module that only re-exports the language file of the package is a use of Handsontable.
export * from 'handsontable/languages/sr-SP';
export { default } from 'handsontable/languages/sr-SP.js';
export { default as sr } from 'handsontable/i18n/languages/sr-SP.mjs';
export * as serbian from 'handsontable/dist/languages/sr-SP.min.js';

// The new language file, another language, and a module of the project are not reported.
export * from 'handsontable/languages/sr-Latn-RS';
export { default as pl } from 'handsontable/languages/pl-PL';
export * from './languages/sr-SP';
