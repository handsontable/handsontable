import { useState, useEffect } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import {
  registerLanguageDictionary,
  getLanguagesDictionaries,
  arAR,
  csCZ,
  deCH,
  deDE,
  esMX,
  frFR,
  hrHR,
  itIT,
  jaJP,
  koKR,
  lvLV,
  nbNO,
  nlNL,
  plPL,
  ptBR,
  ruRU,
  srSP,
  zhCN,
  zhTW,
} from 'handsontable/i18n';
import { registerAllModules } from 'handsontable/registry';
import 'handsontable/styles/handsontable.css';
import 'handsontable/styles/ht-theme-main.css';

// register Handsontable's modules
registerAllModules();
registerLanguageDictionary(arAR);
registerLanguageDictionary(csCZ);
registerLanguageDictionary(deCH);
registerLanguageDictionary(deDE);
registerLanguageDictionary(esMX);
registerLanguageDictionary(frFR);
registerLanguageDictionary(hrHR);
registerLanguageDictionary(itIT);
registerLanguageDictionary(jaJP);
registerLanguageDictionary(koKR);
registerLanguageDictionary(lvLV);
registerLanguageDictionary(nbNO);
registerLanguageDictionary(nlNL);
registerLanguageDictionary(plPL);
registerLanguageDictionary(ptBR);
registerLanguageDictionary(ruRU);
registerLanguageDictionary(srSP);
registerLanguageDictionary(zhCN);
registerLanguageDictionary(zhTW);

const ExampleComponent = () => {
  const [language, setLanguage] = useState('en-US');
  const [languageList, setLanguageList] = useState([]);

  useEffect(() => {
    setLanguageList(getLanguagesDictionaries());
  }, []);

  const updateHotLanguage = (event) => {
    setLanguage(event.target.value);
  };

  return (
    <div>
      <div className="controls select-language">
        <label>
          Select language of the context menu:{' '}
          <select value={language} onChange={updateHotLanguage}>
            {languageList.map(({ languageCode }) => (
              <option key={languageCode} value={languageCode}>
                {languageCode}
              </option>
            ))}
          </select>
        </label>
      </div>

      <HotTable
        data={[
          ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1'],
          ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'H2', 'I2', 'J2'],
          ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3', 'H3', 'I3', 'J3'],
          ['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4', 'H4', 'I4', 'J4'],
          ['A5', 'B5', 'C5', 'D5', 'E5', 'F5', 'G5', 'H5', 'I5', 'J5'],
        ]}
        colHeaders={true}
        rowHeaders={true}
        contextMenu={true}
        height="auto"
        language={language}
        autoWrapRow={true}
        autoWrapCol={true}
        licenseKey="non-commercial-and-evaluation"
      />
    </div>
  );
};

export default ExampleComponent;
