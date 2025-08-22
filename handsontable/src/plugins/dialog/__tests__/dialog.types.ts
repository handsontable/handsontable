import Handsontable from 'handsontable';

const hot = new Handsontable(document.createElement('div'), {
  dialog: true,
});

new Handsontable(document.createElement('div'), {
  dialog: {
    content: 'Simple dialog content',
    customClassName: 'custom-dialog',
    background: 'solid',
    contentBackground: false,
    contentDirections: 'row',
    animation: true,
    closable: false,
  }
});

new Handsontable(document.createElement('div'), {
  dialog: {
    content: document.createElement('div'),
    background: 'semi-transparent',
    contentDirections: 'column',
    animation: false,
    closable: true,
  }
});

new Handsontable(document.createElement('div'), {
  dialog: {
    content: '<h2>HTML Content</h2><p>This is HTML content.</p>',
    contentDirections: 'row-reverse',
  }
});

new Handsontable(document.createElement('div'), {
  dialog: {
    content: '<div>Content</div>',
    contentDirections: 'column-reverse',
    contentBackground: true,
  }
});

const dialog = hot.getPlugin('dialog');

dialog.isVisible();
dialog.show();
dialog.show({
  content: 'Custom dialog content',
  customClassName: 'show-dialog',
  background: 'solid',
  contentBackground: true,
  contentDirections: 'column',
  animation: false,
  closable: true,
});
dialog.show({
  content: document.createElement('div'),
  background: 'semi-transparent',
  contentDirections: 'row',
  animation: true,
  closable: false,
});
dialog.hide();
dialog.update({
  content: 'Updated content',
  customClassName: 'updated-dialog',
  background: 'semi-transparent',
  contentBackground: false,
  contentDirections: 'column-reverse',
  animation: true,
  closable: true,
});
dialog.update({
  content: document.createElement('span'),
  background: 'solid',
  contentDirections: 'row-reverse',
  animation: false,
  closable: false,
});
