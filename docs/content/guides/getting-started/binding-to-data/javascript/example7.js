import Handsontable from 'handsontable';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

const container = document.querySelector('#example7');

new Handsontable(container, {
  data: [
    model({ id: 1, name: 'Ted Right', address: '' }),
    model({ id: 2, name: 'Frank Honest', address: '' }),
    model({ id: 3, name: 'Joan Well', address: '' }),
    model({ id: 4, name: 'Gail Polite', address: '' }),
    model({ id: 5, name: 'Michael Fair', address: '' }),
  ],
  dataSchema: model,
  height: 'auto',
  width: 'auto',
  colHeaders: ['ID', 'Name', 'Address'],
  columns: [
    { data: property('id') },
    { data: property('name') },
    { data: property('address') },
  ],
  minSpareRows: 1,
  autoWrapRow: true,
  autoWrapCol: true,
  licenseKey: 'non-commercial-and-evaluation',
});

function model(person) {
  const _pub = {
    id: undefined,
    name: undefined,
    address: undefined,
    attr: () => _pub,
  };

  const _priv = {};

  for (const prop in person) {
    if (person.hasOwnProperty(prop)) {
      _priv[prop] = person[prop];
    }
  }

  _pub.attr = (attr, val) => {
    if (typeof val === 'undefined') {
      window.console && console.log('GET the', attr, 'value of', _pub);

      return _priv[attr];
    }

    window.console && console.log('SET the', attr, 'value of', _pub);
    _priv[attr] = val;

    return _pub;
  };

  return _pub;
}

function property(attr) {
  return (row, value) => row.attr(attr, value);
}
