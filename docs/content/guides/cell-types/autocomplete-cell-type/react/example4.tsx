import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  const shipmentKVData = [
    ['Electronics and Gadgets','Los Angeles International Airport'],
    ['Medical Supplies', 'John F. Kennedy International Airport'],
    ['Auto Parts', "Chicago O'Hare International Airport"],
    ['Fresh Produce', 'London Heathrow Airport'],
    ['Textiles', 'Charles de Gaulle Airport'],
    ['Industrial Equipment', 'Dubai International Airport'],
    ['Pharmaceuticals', 'Tokyo Haneda Airport'],
    ['Consumer Goods', 'Beijing Capital International Airport'],
    ['Machine Parts', 'Singapore Changi Airport'],
    ['Food Products', 'Amsterdam Airport Schiphol']
  ];
  const airportKVData = [
    'Los Angeles International Airport',
    'John F. Kennedy International Airport',
    "Chicago O'Hare International Airport",
    'London Heathrow Airport',
    'Charles de Gaulle Airport',
    'Dubai International Airport',
    'Tokyo Haneda Airport',
    'Beijing Capital International Airport',
    'Singapore Changi Airport',
    'Amsterdam Airport Schiphol',
    'Frankfurt Airport',
    'Seoul Incheon International Airport',
    'Toronto Pearson International Airport',
    'Madrid-Barajas Airport',
    'Bangkok Suvarnabhumi Airport',
    'Munich International Airport',
    'Sydney Kingsford Smith Airport',
    'Barcelona-El Prat Airport',
    'Kuala Lumpur International Airport',
    'Zurich Airport'
  ];

  return (
    <HotTable
      themeName="ht-theme-main"
      autoWrapRow={true}
      autoWrapCol={true}
      licenseKey="non-commercial-and-evaluation"
      data={shipmentKVData}
      columns={[
        {
          title: 'Shipment',
        },
        {
          type: 'autocomplete',
          source: airportKVData,
          title: 'Airport',
        },
      ]}
    />
  );
};

export default ExampleComponent;
