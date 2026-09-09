import Handsontable from 'handsontable';

new Handsontable(document.createElement('div'), {
  autoLink: true,
});
new Handsontable(document.createElement('div'), {
  autoLink: {
    target: '_self',
    schemes: ['http', 'https'],
    inline: false,
    className: 'company-link',
  },
});
new Handsontable(document.createElement('div'), {
  autoLink: true,
  columns: [
    { autoLink: false },
    { autoLink: { inline: false } },
  ],
});

const hot = new Handsontable(document.createElement('div'), {});
const autoLink = hot.getPlugin('autoLink');

autoLink.isEnabled();
autoLink.enablePlugin();
autoLink.disablePlugin();
