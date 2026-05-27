import { useEffect, useRef, useState } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';
import './exampleQuickFilter.css';

// register Handsontable's modules
registerAllModules();

const columns = [
  { value: '0', label: 'Brand' },
  { value: '1', label: 'Model' },
  { value: '2', label: 'Price' },
  { value: '3', label: 'Date' },
  { value: '4', label: 'Time' },
  { value: '5', label: 'In stock' },
];

const ExampleComponent = () => {
  const hotTableComponentRef = useRef(null);
  const dropdownRef = useRef(null);
  const [selectedColumn, setSelectedColumn] = useState('0');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);

    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleFilter = (event) => {
    const handsontableInstance = hotTableComponentRef.current?.hotInstance;
    const filtersPlugin = handsontableInstance?.getPlugin('filters');

    filtersPlugin?.removeConditions(Number(selectedColumn));
    filtersPlugin?.addCondition(Number(selectedColumn), 'contains', [event.target.value]);
    filtersPlugin?.filter();
    handsontableInstance?.render();
  };

  const handleSelect = (col) => {
    setSelectedColumn(col.value);
    setOpen(false);
  };

  const selectedLabel = columns.find((c) => c.value === selectedColumn)?.label || 'Brand';

  return (
    <>
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
              {columns.map((col) => (
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
