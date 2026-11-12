import Handsontable from 'handsontable';

const { sanitize } = Handsontable.helper;

const label = Handsontable.helper.sanitize(userInput);
const html = `<b>${sanitize(userInput)}</b>`;
const withOptions = sanitize(userInput, { ALLOWED_TAGS: [] });
const cleaned = items.map(Handsontable.helper.sanitize);

function local(Handsontable) {
  return Handsontable.helper.sanitize(userInput);
}
