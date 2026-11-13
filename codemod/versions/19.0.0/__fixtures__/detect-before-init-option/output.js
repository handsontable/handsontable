import Handsontable from 'handsontable';

const container = document.querySelector('#grid');

new Handsontable(container, {
  data: [[1]],
  // TODO(handsontable-codemod 19.0.0/before-init-option): Check what this beforeInit callback does, because 19.0 runs it. See https://handsontable.com/docs/javascript-data-grid/migration-from-18.1-to-19.0#a-beforeinit-callback-in-your-settings-now-runs
  beforeInit() {
    this.rowCount = this.countRows();
  },
});

// addHook always worked, so it is not reported.
const hot = new Handsontable(container, { data: [[2]], afterInit() {} });

hot.addHook('beforeInit', () => {});

// A look-alike object that is not a grid configuration.
const task = { beforeInit() {} };
