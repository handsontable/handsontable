import Handsontable from 'handsontable';

declare function strict(html: string): string;
declare function loose(html: string): string;
declare function getMode(): string;

const container = document.querySelector('#grid') as HTMLElement;
const mode = getMode();

// The comparison is on another variable, not on the source argument.
new Handsontable(container, {
  licenseKey: 'your-license-key',
  // TODO(handsontable-codemod 18.1.0/sanitizer-source): Add a 'dialog' branch if dialog content needs different treatment from your default branch. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.0-to-18.1#update-a-sanitizer-that-branches-on-its-source-argument
  // TODO(handsontable-codemod 18.1.0/sanitizer-new-sources): Return the 'CopyPaste.paste.sourceData' content unchanged if this sanitizer escapes HTML. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.0-to-18.1#expect-your-sanitizer-to-see-two-surfaces-it-never-saw-before
  sanitizer: (content: string, source: string) => {
    if (mode === 'innerHTML') {
      return strict(content);
    }

    return source === 'header' ? strict(content) : loose(content);
  },
});

// A different test of the source: the codemod only reports it.
new Handsontable(container, {
  licenseKey: 'your-license-key',
  // TODO(handsontable-codemod 18.1.0/sanitizer-source): Add a 'dialog' branch if dialog content needs different treatment from your default branch. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.0-to-18.1#update-a-sanitizer-that-branches-on-its-source-argument
  // TODO(handsontable-codemod 18.1.0/sanitizer-new-sources): Return the 'CopyPaste.paste.sourceData' content unchanged if this sanitizer escapes HTML. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.0-to-18.1#expect-your-sanitizer-to-see-two-surfaces-it-never-saw-before
  sanitizer: (content: string, source: string) => {
    // TODO(handsontable-codemod 18.1.0/sanitizer-source): Delete this 'innerHTML' branch: 18.1 no longer passes 'innerHTML' to the sanitizer option. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.0-to-18.1#update-a-sanitizer-that-branches-on-its-source-argument
    if (source !== 'innerHTML') {
      return loose(content);
    }

    return strict(content);
  },
});

// A switch whose 'innerHTML' case has its own body: removing it would change the result.
new Handsontable(container, {
  licenseKey: 'your-license-key',
  // TODO(handsontable-codemod 18.1.0/sanitizer-source): Add a 'dialog' branch if dialog content needs different treatment from your default branch. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.0-to-18.1#update-a-sanitizer-that-branches-on-its-source-argument
  sanitizer(content: string, source: string) {
    // TODO(handsontable-codemod 18.1.0/sanitizer-source): Delete this 'innerHTML' branch: 18.1 no longer passes 'innerHTML' to the sanitizer option. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.0-to-18.1#update-a-sanitizer-that-branches-on-its-source-argument
    switch (source) {
    case 'innerHTML':
      return strict(content);
    case 'header':
      return loose(content);
    default:
      return content;
    }
  },
});

// The function is also passed to fastInnerHTML(), which still defaults its context to 'innerHTML'.
// TODO(handsontable-codemod 18.1.0/sanitizer-source): Add a 'dialog' branch if dialog content needs different treatment from your default branch. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.0-to-18.1#update-a-sanitizer-that-branches-on-its-source-argument
// TODO(handsontable-codemod 18.1.0/sanitizer-new-sources): Return the 'CopyPaste.paste.sourceData' content unchanged if this sanitizer escapes HTML. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.0-to-18.1#expect-your-sanitizer-to-see-two-surfaces-it-never-saw-before
function shared(content: string, source: string) {
  // TODO(handsontable-codemod 18.1.0/sanitizer-source): Delete this 'innerHTML' test: the same condition already handles 'header'. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.0-to-18.1#update-a-sanitizer-that-branches-on-its-source-argument
  return source === 'header' || source === 'innerHTML' ? strict(content) : loose(content);
}

new Handsontable(container, { licenseKey: 'your-license-key', sanitizer: shared });
Handsontable.dom.fastInnerHTML(container, '<b>x</b>', shared);

// 'innerHTML' outside any sanitizer option.
const property = 'innerHTML';

container[property] = 'x';
