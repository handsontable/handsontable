import { useState } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const ExampleComponent = () => {
  const [locale, setLocale] = useState('en-US');

  const data = [
    { shift: 'Morning', start: '09:00', breakStart: '12:00', end: '17:00' },
    { shift: 'Afternoon', start: '13:30', breakStart: '16:00', end: '21:00' },
    { shift: 'Night', start: '22:00', breakStart: '01:00', end: '06:00' },
    { shift: 'Split', start: '08:00', breakStart: '12:30', end: '20:00' },
    { shift: 'Short day', start: '10:00', breakStart: '13:00', end: '15:00' },
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
        colHeaders={['Shift', 'Start', 'Break start', 'End']}
        locale={locale}
        columns={[
          {
            type: 'text',
            data: 'shift',
          },
          {
            type: 'intl-time',
            data: 'start',
            timeFormat: {
              timeStyle: 'short',
            },
          },
          {
            type: 'intl-time',
            data: 'breakStart',
            timeFormat: {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            },
          },
          {
            type: 'intl-time',
            data: 'end',
            timeFormat: {
              hour: 'numeric',
              hourCycle: 'h12',
              dayPeriod: 'short',
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
