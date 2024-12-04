import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import { registerLanguageDictionary, arAR } from 'handsontable/i18n';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

// register Handsontable's modules
registerAllModules();
registerLanguageDictionary(arAR);

//  generate random RTL data (e.g., Arabic)
function generateArabicData() {
  const randomName = () =>
    ['عمر', 'علي', 'عبد الله', 'معتصم'][Math.floor(Math.random() * 3)];

  const randomCountry = () =>
    ['تركيا', 'مصر', 'لبنان', 'العراق'][Math.floor(Math.random() * 3)];

  const randomDate = () =>
    new Date(Math.floor(Math.random() * Date.now())).toLocaleDateString();

  const randomBool = () => Math.random() > 0.5;
  const randomNumber = (a = 0, b = 1000) => a + Math.floor(Math.random() * b);
  const randomPhrase = () =>
    `${randomCountry()} ${randomName()} ${randomNumber()}`;

  const arr = Array.from({ length: 10 }, () => [
    randomBool(),
    randomName(),
    randomCountry(),
    randomPhrase(),
    randomDate(),
    randomPhrase(),
    randomBool(),
    randomNumber(0, 200).toString(),
    randomNumber(0, 10),
    randomNumber(0, 5),
  ]);

  return arr;
}

const ExampleComponent = () => {
  return (
    <HotTable
      autoWrapRow={true}
      autoWrapCol={true}
      licenseKey="non-commercial-and-evaluation"
      data={generateArabicData()}
      colHeaders={true}
      rowHeaders={true}
      height="auto"
      layoutDirection="rtl"
      language="ar-AR"
      dropdownMenu={true}
      filters={true}
      contextMenu={true}
    />
  );
};

export default ExampleComponent;
