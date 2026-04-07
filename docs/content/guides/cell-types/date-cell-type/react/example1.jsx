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
