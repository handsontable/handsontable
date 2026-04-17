import { useRef, useState, useEffect } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const localeOptions = [
  { value: 'ar-AR', label: 'Arabic (Global)' },
  { value: 'cs-CZ', label: 'Czech (Czechia)' },
  { value: 'de-CH', label: 'German (Switzerland)' },
  { value: 'de-DE', label: 'German (Germany)' },
  { value: 'en-US', label: 'English (United States)' },
  { value: 'es-MX', label: 'Spanish (Mexico)' },
  { value: 'fa-IR', label: 'Persian (Iran)' },
  { value: 'fr-FR', label: 'French (France)' },
  { value: 'hr-HR', label: 'Croatian (Croatia)' },
  { value: 'it-IT', label: 'Italian (Italy)' },
  { value: 'ja-JP', label: 'Japanese (Japan)' },
  { value: 'ko-KR', label: 'Korean (Korea)' },
  { value: 'lv-LV', label: 'Latvian (Latvia)' },
  { value: 'nb-NO', label: 'Norwegian Bokmal (Norway)' },
  { value: 'nl-NL', label: 'Dutch (Netherlands)' },
  { value: 'pl-PL', label: 'Polish (Poland)' },
  { value: 'pt-BR', label: 'Portuguese (Brazil)' },
  { value: 'ru-RU', label: 'Russian (Russia)' },
  { value: 'sr-SP', label: 'Serbian Latin (Serbia)' },
  { value: 'zh-CN', label: 'Chinese (Simplified, China)' },
  { value: 'zh-TW', label: 'Chinese (Traditional, Taiwan)' },
];

const ExampleComponent = () => {
  const hotRef = useRef(null);
  const dropdownRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [locale, setLocale] = useState('en-US');

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('click', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('click', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleSelect = (value) => {
    setLocale(value);
    setIsOpen(false);
    hotRef.current?.hotInstance?.updateSettings({ locale: value });
  };

  const selectedLabel = localeOptions.find((o) => o.value === locale)?.label;

  const data = [
    { shift: 'Morning', start: '09:00', breakStart: '12:00', end: '17:00' },
    { shift: 'Afternoon', start: '13:30', breakStart: '16:00', end: '21:00' },
    { shift: 'Night', start: '22:00', breakStart: '01:00', end: '06:00' },
    { shift: 'Split', start: '08:00', breakStart: '12:30', end: '20:00' },
    { shift: 'Short day', start: '10:00', breakStart: '13:00', end: '15:00' },
  ];

  return (
    <>
      <div className="example-controls-container">
        <div className="controls">
          <div className="theme-dropdown" ref={dropdownRef}>
            <button
              className="theme-dropdown-trigger"
              type="button"
              aria-haspopup="listbox"
              aria-expanded={isOpen}
              onClick={() => setIsOpen(!isOpen)}
            >
              <span>{selectedLabel}</span>
              <svg className="theme-dropdown-chevron" aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6l6 -6"/></svg>
            </button>
            {isOpen && (
              <ul className="theme-dropdown-menu" role="listbox">
                {localeOptions.map((opt) => (
                  <li
                    key={opt.value}
                    role="option"
                    aria-selected={locale === opt.value}
                    onClick={() => handleSelect(opt.value)}
                  >
                    {opt.label}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <HotTable
        ref={hotRef}
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
