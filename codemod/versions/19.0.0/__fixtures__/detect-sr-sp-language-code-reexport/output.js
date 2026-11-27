// A module that only re-exports the language file of the package is a use of Handsontable.
// TODO(handsontable-codemod 19.0.0/sr-sp-language-code): Replace the sr-SP language code with sr-Latn-RS. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#the-sr-sp-language-code-is-deprecated
export * from 'handsontable/languages/sr-SP';
// TODO(handsontable-codemod 19.0.0/sr-sp-language-code): Replace the sr-SP language code with sr-Latn-RS. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#the-sr-sp-language-code-is-deprecated
export { default } from 'handsontable/languages/sr-SP.js';
// TODO(handsontable-codemod 19.0.0/sr-sp-language-code): Replace the sr-SP language code with sr-Latn-RS. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#the-sr-sp-language-code-is-deprecated
export { default as sr } from 'handsontable/i18n/languages/sr-SP.mjs';
// TODO(handsontable-codemod 19.0.0/sr-sp-language-code): Replace the sr-SP language code with sr-Latn-RS. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#the-sr-sp-language-code-is-deprecated
export * as serbian from 'handsontable/dist/languages/sr-SP.min.js';

// The new language file, another language, and a module of the project are not reported.
export * from 'handsontable/languages/sr-Latn-RS';
export { default as pl } from 'handsontable/languages/pl-PL';
export * from './languages/sr-SP';
