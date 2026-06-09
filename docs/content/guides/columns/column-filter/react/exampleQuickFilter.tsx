import { useEffect, useRef, useState } from 'react';
import { HotTable, HotTableRef } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

// Embedded so the example is self-contained in StackBlitz and bundler environments.
const QUICK_FILTER_STYLES = `
  .controlsQuickFilter {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin: 0;
    padding: 0;
  }
  #filterField {
    border: 1px solid var(--sl-color-gray-5, #e0e0e0);
    background: none;
    color: var(--sl-color-text, #333333);
    font-size: var(--sl-text-sm, 0.875rem);
    padding: 0.4rem 0.625rem;
    outline: none;
    width: 140px;
  }
  #filterField::placeholder { color: var(--sl-color-gray-3, #777777); }
  #filterField:focus { border-color: var(--sl-color-accent, #1A42E8); }
  #filterField:focus-visible {
    border-color: var(--sl-color-accent, #1A42E8);
    box-shadow: 0 0 0 1px var(--sl-color-accent, #1A42E8);
  }
  .filter-dropdown {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }
  .filter-dropdown-label {
    color: var(--sl-color-gray-2, #555555);
    font-size: var(--sl-text-sm, 0.875rem);
    white-space: nowrap;
  }
  .filter-dropdown-trigger {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    background: none;
    border: 1px solid var(--sl-color-gray-5, #e0e0e0);
    color: var(--sl-color-gray-2, #555555);
    cursor: pointer;
    font-size: var(--sl-text-sm, 0.875rem);
    font-weight: 500;
    padding: 0.4rem 0.625rem;
    transition: color 0.15s, background-color 0.15s;
    white-space: nowrap;
    border-radius: 0;
  }
  .filter-dropdown-trigger:hover {
    color: var(--sl-color-white, #333333);
    background: var(--sl-color-gray-7, var(--sl-color-gray-6, #eeeeee));
  }
  .filter-dropdown-chevron {
    flex-shrink: 0;
    margin-inline-start: 0.15rem;
    transition: transform 0.15s;
  }
  .filter-dropdown-trigger[aria-expanded='true'] .filter-dropdown-chevron { transform: rotate(180deg); }
  .filter-dropdown-menu {
    background: var(--sl-color-bg-nav, #ffffff);
    border: 1px solid var(--sl-color-gray-5, #e0e0e0);
    border-radius: 0;
    box-shadow: none;
    inset-inline-start: 0;
    list-style: none;
    margin: 0;
    min-width: 100%;
    overflow-y: auto;
    padding: 0;
    position: absolute;
    top: 100%;
    z-index: 9999;
  }
  .filter-dropdown-menu li {
    align-items: center;
    color: var(--sl-color-text, #333333);
    display: flex;
    font-size: var(--sl-text-sm, 0.875rem);
    padding: 0.5rem 0.75rem;
    cursor: pointer;
    border-bottom: 1px solid var(--sl-color-gray-5, #e0e0e0);
    transition: background 0.1s, color 0.1s;
    white-space: nowrap;
    list-style: none;
    margin: 0;
  }
  .filter-dropdown-menu li:last-child { border-bottom: none; }
  .filter-dropdown-menu li:hover,
  .filter-dropdown-menu li:focus-visible {
    background: var(--sl-color-gray-6, #eeeeee);
    color: var(--sl-color-white, #333333);
    outline: none;
  }
  .filter-dropdown-menu li[aria-selected='true'] {
    color: var(--sl-color-white, #333333);
    box-shadow: inset 0 0 0 1px var(--sl-color-accent, #1A42E8);
  }
`;

const columnOptions = [
  { value: '0', label: 'Brand' },
  { value: '1', label: 'Model' },
  { value: '2', label: 'Price' },
  { value: '3', label: 'Date' },
  { value: '4', label: 'Time' },
  { value: '5', label: 'In stock' },
];

const ExampleComponent = () => {
  const hotTableComponentRef = useRef<HotTableRef>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [selectedColumn, setSelectedColumn] = useState('0');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);

    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleFilter = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const handsontableInstance = hotTableComponentRef.current?.hotInstance;
    const filtersPlugin = handsontableInstance?.getPlugin('filters');

    filtersPlugin?.removeConditions(Number(selectedColumn));
    filtersPlugin?.addCondition(Number(selectedColumn), 'contains', [(event.target as HTMLInputElement).value]);
    filtersPlugin?.filter();
    handsontableInstance?.render();
  };

  const handleSelect = (col: { value: string; label: string }) => {
    setSelectedColumn(col.value);
    setOpen(false);
  };

  const selectedLabel = columnOptions.find((c) => c.value === selectedColumn)?.label || 'Brand';

  return (
    <>
      <style>{QUICK_FILTER_STYLES}</style>
      <div className="example-controls-container">
        <div className="controlsQuickFilter">
          <div className="filter-dropdown" ref={dropdownRef}>
            <span className="filter-dropdown-label">Select a column:</span>
            <button
              className="filter-dropdown-trigger"
              type="button"
              aria-haspopup="listbox"
              aria-expanded={open}
              onClick={() => setOpen(!open)}
            >
              <span className="filter-dropdown-text">{selectedLabel}</span>
              <svg className="filter-dropdown-chevron" aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6l6 -6"/></svg>
            </button>
            {open && (
              <ul className="filter-dropdown-menu" role="listbox">
                {columnOptions.map((col) => (
                  <li
                    key={col.value}
                    role="option"
                    aria-selected={col.value === selectedColumn}
                    onClick={() => handleSelect(col)}
                  >
                    {col.label}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <input id="filterField" type="text" placeholder="Filter" onKeyUp={handleFilter} />
        </div>
      </div>
      <HotTable
        ref={hotTableComponentRef}
        data={[
          {
            brand: 'Jetpulse',
            model: 'Racing Socks',
            price: 30,
            sellDate: '2023-10-11',
            sellTime: '01:23',
            inStock: false,
          },
          {
            brand: 'Gigabox',
            model: 'HL Mountain Frame',
            price: 1890.9,
            sellDate: '2023-05-03',
            sellTime: '11:27',
            inStock: false,
          },
          {
            brand: 'Camido',
            model: 'Cycling Cap',
            price: 130.1,
            sellDate: '2023-03-27',
            sellTime: '03:17',
            inStock: true,
          },
          {
            brand: 'Chatterpoint',
            model: 'Road Tire Tube',
            price: 59,
            sellDate: '2023-08-28',
            sellTime: '08:01',
            inStock: true,
          },
          {
            brand: 'Eidel',
            model: 'HL Road Tire',
            price: 279.99,
            sellDate: '2023-10-02',
            sellTime: '01:23',
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
        filters={true}
        height="auto"
        className="exampleQuickFilter"
        autoWrapRow={true}
        autoWrapCol={true}
        licenseKey="non-commercial-and-evaluation"
      />
    </>
  );
};

export default ExampleComponent;
