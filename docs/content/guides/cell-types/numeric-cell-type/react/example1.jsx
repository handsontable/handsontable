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

  // Sample data with various numeric types
  const data = [
    {
      car: 'Mercedes A 160',
      year: 2017,
      price_usd: 7000,
      price_eur: 7000,
      distance_km: 125000,
      fuel_liters: 45.5,
      discount_percent: 0.15,
      quantity: 1250,
    },
    {
      car: 'Citroen C4 Coupe',
      year: 2018,
      price_usd: 8330,
      price_eur: 8330,
      distance_km: 98000,
      fuel_liters: 52.3,
      discount_percent: 0.08,
      quantity: 2100,
    },
    {
      car: 'Audi A4 Avant',
      year: 2019,
      price_usd: 33900,
      price_eur: 33900,
      distance_km: 45000,
      fuel_liters: 60.0,
      discount_percent: 0.05,
      quantity: 850,
    },
    {
      car: 'Opel Astra',
      year: 2020,
      price_usd: 5000,
      price_eur: 5000,
      distance_km: 156000,
      fuel_liters: 48.7,
      discount_percent: 0.12,
      quantity: 3200,
    },
    {
      car: 'BMW 320i Coupe',
      year: 2021,
      price_usd: 30500,
      price_eur: 30500,
      distance_km: 32000,
      fuel_liters: 55.2,
      discount_percent: 0.03,
      quantity: 1500,
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
        colHeaders={['Car', 'Year', 'Price (USD)', 'Price (EUR)', 'Distance', 'Fuel', 'Discount', 'Quantity']}
        locale={locale}
        columns={[
          {
            data: 'car',
            type: 'text',
          },
          {
            data: 'year',
            type: 'numeric',
          },
          {
            data: 'price_usd',
            type: 'numeric',
            numericFormat: {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 2,
            },
          },
          {
            data: 'price_eur',
            type: 'numeric',
            numericFormat: {
              style: 'currency',
              currency: 'EUR',
              minimumFractionDigits: 2,
            },
          },
          {
            data: 'distance_km',
            type: 'numeric',
            numericFormat: {
              style: 'unit',
              unit: 'kilometer',
              useGrouping: true,
            },
          },
          {
            data: 'fuel_liters',
            type: 'numeric',
            numericFormat: {
              style: 'unit',
              unit: 'liter',
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            },
          },
          {
            data: 'discount_percent',
            type: 'numeric',
            numericFormat: {
              style: 'percent',
              minimumFractionDigits: 0,
              maximumFractionDigits: 2,
            },
          },
          {
            data: 'quantity',
            type: 'numeric',
            numericFormat: {
              style: 'decimal',
              useGrouping: true,
              minimumFractionDigits: 0,
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
