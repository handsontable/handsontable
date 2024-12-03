import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

// register Handsontable's modules
registerAllModules();

function model(opts) {
  const _pub = {
    id: undefined,
    name: undefined,
    address: undefined,
    attr: undefined,
  };

  const _priv = {};

  for (const i in opts) {
    if (opts.hasOwnProperty && opts.hasOwnProperty(i)) {
      _priv[i] = opts[i];
    }
  }

  _pub.attr = function (attr, val) {
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

const data = [
  model({ id: 1, name: 'Ted Right', address: '' }),
  model({ id: 2, name: 'Frank Honest', address: '' }),
  model({ id: 3, name: 'Joan Well', address: '' }),
  model({ id: 4, name: 'Gail Polite', address: '' }),
  model({ id: 5, name: 'Michael Fair', address: '' }),
];

const ExampleComponent = () => (
  <HotTable
    data={data}
    dataSchema={model}
    height="auto"
    width="auto"
    colHeaders={['ID', 'Name', 'Address']}
    columns={[
      { data: property('id') },
      { data: property('name') },
      { data: property('address') },
    ]}
    minSpareRows={1}
    autoWrapRow={true}
    autoWrapCol={true}
    licenseKey="non-commercial-and-evaluation"
  />
);

export default ExampleComponent;
