import Handsontable from 'handsontable';

declare function strict(html: string): string;
declare function loose(html: string): string;

const container = document.querySelector('#grid') as HTMLElement;

new Handsontable(container, {
  licenseKey: 'your-license-key',
  // TODO(handsontable-codemod 18.1.0/sanitizer-source): Add a 'dialog' branch if dialog content needs different treatment from your default branch. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.0-to-18.1#update-a-sanitizer-that-branches-on-its-source-argument
  // TODO(handsontable-codemod 18.1.0/sanitizer-new-sources): Return the 'CopyPaste.paste.sourceData' content unchanged if this sanitizer escapes HTML. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.0-to-18.1#expect-your-sanitizer-to-see-two-surfaces-it-never-saw-before
  sanitizer: (content: string, source: string) => {
    // TODO(handsontable-codemod 18.1.0/sanitizer-source): Delete this 'innerHTML' test: the same condition already handles 'header'. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.0-to-18.1#update-a-sanitizer-that-branches-on-its-source-argument
    if (source === 'header' || source === 'innerHTML') {
      return strict(content);
    }

    return loose(content);
  },
});

const hot = new Handsontable(container, {
  licenseKey: 'your-license-key',
  // TODO(handsontable-codemod 18.1.0/sanitizer-source): Add a 'dialog' branch if dialog content needs different treatment from your default branch. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.0-to-18.1#update-a-sanitizer-that-branches-on-its-source-argument
  sanitizer(content: string, source: string) {
    // TODO(handsontable-codemod 18.1.0/sanitizer-source): Delete this 'innerHTML' test: the same condition already handles 'header'. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.0-to-18.1#update-a-sanitizer-that-branches-on-its-source-argument
    switch (source) {
    case 'innerHTML':
    case 'header':
      return strict(content);
    case 'dialog':
      return loose(content);
    default:
      return content;
    }
  },
});

new Handsontable(container, {
  licenseKey: 'your-license-key',
  // TODO(handsontable-codemod 18.1.0/sanitizer-source): Add a 'dialog' branch if dialog content needs different treatment from your default branch. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.0-to-18.1#update-a-sanitizer-that-branches-on-its-source-argument
  // TODO(handsontable-codemod 18.1.0/sanitizer-new-sources): Return the 'CopyPaste.paste.sourceData' content unchanged if this sanitizer escapes HTML. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.0-to-18.1#expect-your-sanitizer-to-see-two-surfaces-it-never-saw-before
  sanitizer: function(content: string, source: string) {
    // TODO(handsontable-codemod 18.1.0/sanitizer-source): Delete this 'innerHTML' test: the same condition already handles 'header'. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.0-to-18.1#update-a-sanitizer-that-branches-on-its-source-argument
    switch (source) {
    case 'header':
    case 'innerHTML':
      return strict(content);
    default:
      return loose(content);
    }
  },
});

// TODO(handsontable-codemod 18.1.0/sanitizer-source): Delete this 'innerHTML' test: the same condition already handles 'header'. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.0-to-18.1#update-a-sanitizer-that-branches-on-its-source-argument
// TODO(handsontable-codemod 18.1.0/sanitizer-source): Add a 'dialog' branch if dialog content needs different treatment from your default branch. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.0-to-18.1#update-a-sanitizer-that-branches-on-its-source-argument
// TODO(handsontable-codemod 18.1.0/sanitizer-new-sources): Return the 'CopyPaste.paste.sourceData' content unchanged if this sanitizer escapes HTML. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.0-to-18.1#expect-your-sanitizer-to-see-two-surfaces-it-never-saw-before
const named = (content: string, source: string) => (source == 'innerHTML' || source == 'header'
  ? strict(content) : loose(content));

hot.updateSettings({ sanitizer: named });
