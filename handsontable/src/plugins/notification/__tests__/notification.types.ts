import Handsontable from 'handsontable';

const hot = new Handsontable(document.createElement('div'), {
  notification: true,
});

new Handsontable(document.createElement('div'), {
  notification: {
    stackLimit: 5,
    animation: false,
  },
});

new Handsontable(document.createElement('div'), {
  notification: true,
  beforeNotificationShow(options) {
    const _id: string = options.id;
    const _variant: 'info' | 'success' | 'warning' | 'error' = options.variant;
    const _duration: number = options.duration;
    const _position: 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end' = options.position;
    const _closable: boolean = options.closable;
    const _actions: Array<{
      label: string;
      type?: 'primary' | 'secondary';
      callback: () => void;
    }> = options.actions;

    return true;
  },
  afterNotificationShow(id, options) {
    const _id: string = id;
    const _optsId: string = options.id;
  },
  beforeNotificationHide(id) {
    const _id: string = id;

    return true;
  },
  afterNotificationHide(id) {
    const _id: string = id;
  },
});

const plugin = hot.getPlugin('notification');

const id: string = plugin.showMessage({ message: 'Hello' });
plugin.showMessage({
  variant: 'success',
  title: 'Done',
  message: 'Saved.',
  duration: 4000,
  position: 'top-end',
  closable: true,
  actions: [
    {
      label: 'Undo',
      type: 'primary',
      callback: () => {},
    },
    {
      label: 'Dismiss',
      callback: () => {},
    },
  ],
});
plugin.showMessage({
  message: document.createElement('span'),
  variant: 'warning',
  position: 'bottom-start',
});

plugin.hide(id);
plugin.hideAll();

const visibleDefault: boolean = plugin.isVisible();
const visibleById: boolean = plugin.isVisible(id);
const queueSize: number = plugin.getQueueSize();
