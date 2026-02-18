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
    animation: true,
    closable: false,
    a11y: {
      role: 'alertdialog',
      ariaLabel: 'Alert',
      ariaLabelledby: 'alert-title',
      ariaDescribedby: 'alert-description',
    },
  }
});

new Handsontable(document.createElement('div'), {
  dialog: {
    content: document.createElement('div'),
    background: 'semi-transparent',
    animation: false,
    closable: true,
  }
});

new Handsontable(document.createElement('div'), {
  dialog: {
    content: '<h2>HTML Content</h2><p>This is HTML content.</p>',
  }
});

new Handsontable(document.createElement('div'), {
  dialog: {
    content: '<div>Content</div>',
    contentBackground: true,
  }
});

new Handsontable(document.createElement('div'), {
  dialog: {
    template: {
      type: 'confirm',
      title: 'Oops… something went wrong',
    },
  }
});

new Handsontable(document.createElement('div'), {
  dialog: {
    template: {
      type: 'confirm',
      title: 'Confirm',
      description: 'This is a confirm',
      buttons: [
        {
          text: 'OK',
          type: 'primary',
          callback: (event: Event) => {}
        },
      ],
    },
    contentBackground: true,
    closable: false,
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
  animation: false,
  closable: true,
});
dialog.show({
  content: document.createElement('div'),
  background: 'semi-transparent',
  animation: true,
  closable: false,
});
dialog.hide();
dialog.update({
  content: 'Updated content',
  customClassName: 'updated-dialog',
  background: 'semi-transparent',
  contentBackground: false,
  animation: true,
  closable: true,
});
dialog.update({
  content: document.createElement('span'),
  background: 'solid',
  animation: false,
  closable: false,
});
dialog.update({
  content: document.createElement('span'),
  a11y: {
    role: 'alertdialog',
    ariaLabel: 'Alert',
    ariaLabelledby: 'alert-title',
    ariaDescribedby: 'alert-description',
  },
});
dialog.update({
  template: {
    type: 'confirm',
    title: 'Confirm',
    description: 'This is a confirm',
    buttons: [
      {
        text: 'OK',
        type: 'primary',
        callback: (event: Event) => {},
      },
    ],
  },
  contentBackground: true,
  closable: false,
});
dialog.focus();

dialog.showAlert();
dialog.showAlert('Alert');
dialog.showAlert({
  title: 'Alert',
});
dialog.showAlert({
  title: 'Alert',
  description: 'This is an alert'
});
dialog.showAlert('Alert', (event) => {
  const myEvent: MouseEvent = event;
});

dialog.showConfirm();
dialog.showConfirm('Confirm');
dialog.showConfirm({
  title: 'Confirm',
  description: 'This is an alert'
});
dialog.showConfirm({
  title: 'Confirm',
});
dialog.showConfirm('Confirm', (event) => {
  const myEvent: MouseEvent = event;
});
dialog.showConfirm(
  'Confirm',
  (event) => {
    const myEvent: MouseEvent = event;
  },
  (event) => {
    const myEvent: MouseEvent = event;
  }
);
