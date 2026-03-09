import { useState } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  const [locale, setLocale] = useState('en-US');

  const data = [
    {
      car: 'Mercedes A 160',
      product_date: '2002-06-15',
      payment_date: '2002-05-20',
      registration_date: '2002-07-01',
    },
    {
      car: 'Citroën C4 Coupe',
      product_date: '2007-03-22',
      payment_date: '2007-02-28',
      registration_date: '2007-04-10',
    },
    {
      car: 'Audi A4 Avant',
      product_date: '2011-09-08',
      payment_date: '2011-08-15',
      registration_date: '2011-09-20',
    },
    {
      car: 'Opel Astra',
      product_date: '2012-01-30',
      payment_date: '2012-01-10',
      registration_date: '2012-02-14',
    },
    {
      car: 'BMW 320i Coupe',
      product_date: '2004-11-12',
      payment_date: '2004-10-20',
      registration_date: '2004-12-01',
    },
  ];

  const handleLocaleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setLocale(event.target.value);
  };

  return (
    <>
      <div className="example-controls-container">
        <div className="controls">
          <label>
            Select locale:
            <select id="localeSelect" value={locale} onChange={handleLocaleChange}>
              <option value="ar-AR">Arabic (Global)</option>
              <option value="cs-CZ">Czech (Czechia)</option>
              <option value="de-CH">German (Switzerland)</option>
              <option value="de-DE">German (Germany)</option>
              <option value="en-US">English (United States)</option>
              <option value="es-MX">Spanish (Mexico)</option>
              <option value="fa-IR">Persian (Iran)</option>
              <option value="fr-FR">French (France)</option>
              <option value="hr-HR">Croatian (Croatia)</option>
              <option value="it-IT">Italian (Italy)</option>
              <option value="ja-JP">Japanese (Japan)</option>
              <option value="ko-KR">Korean (Korea)</option>
              <option value="lv-LV">Latvian (Latvia)</option>
              <option value="nb-NO">Norwegian Bokmal (Norway)</option>
              <option value="nl-NL">Dutch (Netherlands)</option>
              <option value="pl-PL">Polish (Poland)</option>
              <option value="pt-BR">Portuguese (Brazil)</option>
              <option value="ru-RU">Russian (Russia)</option>
              <option value="sr-SP">Serbian Latin (Serbia)</option>
              <option value="zh-CN">Chinese (Simplified, China)</option>
              <option value="zh-TW">Chinese (Traditional, Taiwan)</option>
            </select>
          </label>
        </div>
      </div>

      <style>{`
        .example-controls-container .controls {
          padding-top: 0;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .example-controls-container .controls label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
        }

        .example-controls-container .controls select {
          padding: 6px 12px;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
        }

        .example-controls-container .controls select:hover {
          border-color: #999;
        }

        .example-controls-container .controls select:focus {
          outline: none;
          border-color: #0066cc;
          box-shadow: 0 0 0 2px rgba(0, 102, 204, 0.2);
        }
      `}</style>

      <HotTable
        data={data}
        colHeaders={['Car', 'Product date', 'Payment date', 'Registration date']}
        locale={locale}
        columns={[
          {
            type: 'text',
            data: 'car',
          },
          {
            type: 'intl-date',
            data: 'product_date',
            dateFormat: { dateStyle: 'short' },
          },
          {
            type: 'intl-date',
            data: 'payment_date',
            dateFormat: {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            },
          },
          {
            type: 'intl-date',
            data: 'registration_date',
            dateFormat: {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            },
          },
        ]}
        columnSorting={true}
        filters={true}
        dropdownMenu={true}
        height="auto"
        autoWrapRow={true}
        autoWrapCol={true}
        licenseKey="non-commercial-and-evaluation"
      />
    </>
  );
};

export default ExampleComponent;
