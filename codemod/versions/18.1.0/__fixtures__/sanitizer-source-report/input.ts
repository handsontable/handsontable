import Handsontable from 'handsontable';

declare function strict(html: string): string;
declare function loose(html: string): string;

const container = document.querySelector('#grid') as HTMLElement;

new Handsontable(container, {
  licenseKey: 'your-license-key',
  sanitizer: (content: string, source: string) => {
    if (source === 'header' || source === 'innerHTML') {
      return strict(content);
    }

    return loose(content);
  },
});

const hot = new Handsontable(container, {
  licenseKey: 'your-license-key',
  sanitizer(content: string, source: string) {
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
  sanitizer: function(content: string, source: string) {
    switch (source) {
      case 'header':
      case 'innerHTML':
        return strict(content);
      default:
        return loose(content);
    }
  },
});

const named = (content: string, source: string) => (source == 'innerHTML' || source == 'header'
  ? strict(content) : loose(content));

hot.updateSettings({ sanitizer: named });
