import { HotTable } from '@handsontable/react';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/dist/handsontable.full.min.css';
import Handsontable from 'handsontable';

interface Person {
  id: number | undefined;
  name: string | undefined;
  address: string | undefined;
  attr: (attr: string, val?: Handsontable.CellValue) => keyof Person | Person;
}

// register Handsontable's modules
registerAllModules();
//TODO: add type
const ExampleComponent = () => {
  function model(opts: { [x: string]: any; id?: number; name?: string; address?: string; hasOwnProperty?: any; }) {
    let _pub = {
      id: undefined,
      name: undefined,
      address: undefined,
      attr: undefined
    };
    let _priv: Partial<Person> = {};

    for (const i in opts) {
      if (opts.hasOwnProperty(i)) {
        _priv[i] = opts[i];
      }
    }

    _pub.attr = function(attr: string | number, val: any) {
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

  function property(attr: string) {
    return (row: Handsontable.RowObject, value?: Handsontable.CellValue) => (row as Person).attr(attr, value);
  }

  const data = [
    model({ id: 1, name: 'Ted Right', address: '' }),
    model({ id: 2, name: 'Frank Honest', address: '' }),
    model({ id: 3, name: 'Joan Well', address: '' }),
    model({ id: 4, name: 'Gail Polite', address: '' }),
    model({ id: 5, name: 'Michael Fair', address: '' })
  ];

  return (
    <HotTable
      data={data}
      dataSchema={model}
      height="auto"
      width="auto"
      colHeaders={['ID', 'Name', 'Address']}
      columns={[
        { data: property('id') },
        { data: property('name') },
        { data: property('address') }
      ]}
      minSpareRows={1}
      autoWrapRow={true}
      autoWrapCol={true}
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

export default ExampleComponent;
