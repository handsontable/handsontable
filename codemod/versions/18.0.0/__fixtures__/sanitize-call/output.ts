import Handsontable from 'handsontable';

const { sanitize } = Handsontable.helper;

// TODO(handsontable-codemod 18.0.0/helper-sanitize): Review Handsontable.helper.sanitize() by hand. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-built-in-dompurify-with-a-custom-sanitizer
const label = Handsontable.helper.sanitize(userInput);
// TODO(handsontable-codemod 18.0.0/helper-sanitize): Review Handsontable.helper.sanitize() by hand. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-built-in-dompurify-with-a-custom-sanitizer
const html = `<b>${sanitize(userInput)}</b>`;
// TODO(handsontable-codemod 18.0.0/helper-sanitize): Replace Handsontable.helper.sanitize() by hand: it has other arguments than the one that... See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-built-in-dompurify-with-a-custom-sanitizer
const withOptions = sanitize(userInput, { ALLOWED_TAGS: [] });
// TODO(handsontable-codemod 18.0.0/helper-sanitize): Replace Handsontable.helper.sanitize by hand: it is used without a call. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-built-in-dompurify-with-a-custom-sanitizer
const cleaned = items.map(Handsontable.helper.sanitize);

function local(Handsontable) {
  return Handsontable.helper.sanitize(userInput);
}
