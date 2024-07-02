import Handsontable from 'handsontable';
import numbro from 'numbro';

const config = {
  data: [
    ['', 'Tesla', 'Mazda', 'Mercedes', 'Mini', 'Mitsubishi'],
    ['2017', 0, 2941, 4303, 354, 5814],
    ['2018', 3, 2905, 2867, 412, 5284],
    ['2019', 4, 2517, 4822, 552, 6127],
    ['2020', 2, 2422, 5399, 776, 4151],
  ],
  minRows: 5,
  minCols: 6,
  height: 'auto',
  stretchH: 'all',
  minSpareRows: 1,
  autoWrapRow: true,
  colHeaders: true,
  contextMenu: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
};

const example1Events = document.getElementById('example1_events');
const hooksList = document.getElementById('hooksList');
const hooks = Handsontable.hooks.getRegistered();

hooks.forEach((hook) => {
  let checked = '';

  if (
    hook === 'afterChange' ||
    hook === 'afterSelection' ||
    hook === 'afterCreateRow' ||
    hook === 'afterRemoveRow' ||
    hook === 'afterCreateCol' ||
    hook === 'afterRemoveCol'
  ) {
    checked = 'checked';
  }

  hooksList.innerHTML += `<li><label><input type="checkbox" ${checked} id="check_${hook}"> ${hook}</label></li>`;
  config[hook] = function () {
    log_events(hook, arguments);
  };
});

const start = new Date().getTime();
let i = 0;
let timer;

/**
 * @param event
 * @param data
 */
function log_events(event, data) {
  if (document.getElementById(`check_${event}`).checked) {
    const now = new Date().getTime();
    const diff = now - start;
    let str;
    const vals = [i, `@${numbro(diff / 1000).format('0.000')}`, `[${event}]`];

    for (let d = 0; d < data.length; d++) {
      try {
        str = JSON.stringify(data[d]);
      } catch (e) {
        str = data[d].toString();
      }

      if (str === void 0) {
        continue;
      }

      if (str.length > 20) {
        str = data[d].toString();
      }

      if (d < data.length - 1) {
        str += ',';
      }

      vals.push(str);
    }

    if (window.console) {
      console.log(
        i,
        `@${numbro(diff / 1000).format('0.000')}`,
        `[${event}]`,
        data
      );
    }

    const div = document.createElement('div');
    const text = document.createTextNode(vals.join(' '));

    div.appendChild(text);
    example1Events.appendChild(div);
    clearTimeout(timer);
    timer = setTimeout(() => {
      example1Events.scrollTop = example1Events.scrollHeight;
    }, 10);
    i++;
  }
}

const example1 = document.querySelector('#example1');

new Handsontable(example1, config);
document
  .querySelector('#check_select_all')
  .addEventListener('click', function () {
    const state = this.checked;
    const inputs = document.querySelectorAll('#hooksList input[type=checkbox]');

    Array.prototype.forEach.call(inputs, (input) => {
      input.checked = state;
    });
  });
document
  .querySelector('#hooksList input[type=checkbox]')
  .addEventListener('click', function () {
    if (!this.checked) {
      document.getElementById('check_select_all').checked = false;
    }
  });
