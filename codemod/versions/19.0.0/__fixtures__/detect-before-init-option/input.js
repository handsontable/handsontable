import Handsontable from 'handsontable';

const container = document.querySelector('#grid');

new Handsontable(container, {
  data: [[1]],
  beforeInit() {
    this.rowCount = this.countRows();
  },
});

// addHook always worked, so it is not reported.
const hot = new Handsontable(container, { data: [[2]], afterInit() {} });

hot.addHook('beforeInit', () => {});

// A look-alike object that is not a grid configuration.
const task = { beforeInit() {} };
