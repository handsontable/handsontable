import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const data = [
  {
    brand: 'Jetpulse',
    model: 'Racing Socks',
    price: 30,
    sellDate: '2023-10-11',
    inStock: false,
  },
  {
    brand: 'Gigabox',
    model: 'HL Mountain Frame',
    price: 1890.9,
    sellDate: '2023-05-03',
    inStock: false,
  },
  {
    brand: 'Camido',
    model: 'Cycling Cap',
    price: 130.1,
    sellDate: '2023-03-27',
    inStock: true,
  },
  {
    brand: 'Chatterpoint',
    model: 'Road Tire Tube',
    price: 59,
    sellDate: '2023-08-28',
    inStock: true,
  },
  {
    brand: 'Eidel',
    model: 'HL Road Tire',
    price: 279.99,
    sellDate: '2023-10-02',
    inStock: true,
  },
];

const ExampleComponent = () => {
  return (
    <HotTable
      data={data}
      columns={[
        {
          title: 'Brand',
          type: 'text',
          data: 'brand',
          // offer only these conditions, in this order
          filters: {
            availableConditions: ['eq', 'neq', '---------', 'empty', 'not_empty'],
          },
        },
        {
          title: 'Model',
          type: 'text',
          data: 'model',
        },
        {
          title: 'Price',
          type: 'numeric',
          data: 'price',
          locale: 'en-US',
          numericFormat: {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
          },
        },
        {
          title: 'Date',
          type: 'intl-date',
          data: 'sellDate',
          locale: 'en-US',
          dateFormat: { month: 'short', day: 'numeric', year: 'numeric' },
          className: 'htRight',
          // the default date conditions, minus the relative ones
          filters: {
            availableConditions: {
              exclude: ['intl_date_today', 'intl_date_tomorrow', 'intl_date_yesterday'],
            },
          },
        },
        {
          title: 'In stock',
          type: 'checkbox',
          data: 'inStock',
          className: 'htCenter',
        },
      ]}
      // remove "Is not between" from every numeric column
      filters={{
        availableConditions: {
          numeric: { exclude: ['not_between'] },
        },
      }}
      dropdownMenu={true}
      height="auto"
      autoWrapRow={true}
      autoWrapCol={true}
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

export default ExampleComponent;
