import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  return (
    <HotTable
      data={[
        {
          brand: 'Jetpulse',
          model: 'Racing Socks',
          color: 'White',
          price: 30,
          sellDate: '2023-10-11',
          sellTime: '01:23',
          inStock: false,
        },
        {
          brand: 'Gigabox',
          model: 'HL Frame',
          color: 'Black',
          price: 1890.9,
          sellDate: '2023-05-03',
          sellTime: '11:27',
          inStock: false,
        },
        {
          brand: 'Camido',
          model: 'Cycling Cap',
          color: 'Red',
          price: 130.1,
          sellDate: '2023-03-27',
          sellTime: '03:17',
          inStock: true,
        },
        {
          brand: 'Chatterpoint',
          model: 'Road Tire Tube',
          color: 'Green',
          price: 59,
          sellDate: '2023-08-28',
          sellTime: '08:01',
          inStock: true,
        },
        {
          brand: 'Eidel',
          model: 'HL Road Tire',
          color: 'Blue',
          price: 279.99,
          sellDate: '2023-10-02',
          sellTime: '13:23',
          inStock: true,
        },
      ]}
      columns={[
        {
          title: 'Brand',
          type: 'text',
          data: 'brand',
        },
        {
          title: 'Model',
          type: 'text',
          data: 'model',
        },
        {
          title: 'Color',
          type: 'text',
          data: 'color',
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
        },
        {
          title: 'Time',
          type: 'intl-time',
          data: 'sellTime',
          locale: 'en-US',
          timeFormat: { hour: '2-digit', minute: '2-digit', hour12: true },
          className: 'htRight',
        },
        {
          title: 'In stock',
          type: 'checkbox',
          data: 'inStock',
          className: 'htCenter',
        },
      ]}
      multiColumnSorting={{
        initialConfig: [
          {
            column: 0,
            sortOrder: 'asc',
          },
          {
            column: 1,
            sortOrder: 'desc',
          },
          {
            column: 2,
            sortOrder: 'asc',
          },
          {
            column: 3,
            sortOrder: 'desc',
          },
          {
            column: 4,
            sortOrder: 'asc',
          },
          {
            column: 5,
            sortOrder: 'desc',
          },
          {
            column: 6,
            sortOrder: 'asc',
          },
        ],
      }}
      className="custom-sort-icon-example-3"
      height="auto"
      stretchH="all"
      autoWrapRow={true}
      autoWrapCol={true}
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

export default ExampleComponent;
