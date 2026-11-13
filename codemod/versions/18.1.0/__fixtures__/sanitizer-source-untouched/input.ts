import Handsontable from 'handsontable';

declare function strict(html: string): string;
declare function loose(html: string): string;
declare function getMode(): string;

const container = document.querySelector('#grid') as HTMLElement;
const mode = getMode();

// The comparison is on another variable, not on the source argument.
new Handsontable(container, {
  licenseKey: 'your-license-key',
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
  sanitizer: (content: string, source: string) => {
    if (source !== 'innerHTML') {
      return loose(content);
    }

    return strict(content);
  },
});

// A switch whose 'innerHTML' case has its own body: removing it would change the result.
new Handsontable(container, {
  licenseKey: 'your-license-key',
  sanitizer(content: string, source: string) {
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
function shared(content: string, source: string) {
  return source === 'header' || source === 'innerHTML' ? strict(content) : loose(content);
}

new Handsontable(container, { licenseKey: 'your-license-key', sanitizer: shared });
Handsontable.dom.fastInnerHTML(container, '<b>x</b>', shared);

// 'innerHTML' outside any sanitizer option.
const property = 'innerHTML';

container[property] = 'x';
