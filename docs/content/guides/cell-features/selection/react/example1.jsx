import { useRef, useState, useEffect } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

const options = [
  { value: 'single', label: 'Single selection' },
  { value: 'range', label: 'Range selection' },
  { value: 'multiple', label: 'Multiple ranges selection' },
];

const ExampleComponent = () => {
  const dropdownRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState('multiple');

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
    setSelected(value);
    setIsOpen(false);
  };

  const selectedLabel = options.find((o) => o.value === selected)?.label;

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
                {options.map((opt) => (
                  <li
                    key={opt.value}
                    role="option"
                    aria-selected={selected === opt.value}
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
        data={[
          ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1'],
          ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'H2', 'I2'],
          ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3', 'H3', 'I3'],
          ['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4', 'H4', 'I4'],
          ['A5', 'B5', 'C5', 'D5', 'E5', 'F5', 'G5', 'H5', 'I5'],
          ['A6', 'B6', 'C6', 'D6', 'E6', 'F6', 'G6', 'H6', 'I6'],
          ['A7', 'B7', 'C7', 'D7', 'E7', 'F7', 'G7', 'H7', 'I7'],
          ['A8', 'B8', 'C8', 'D8', 'E8', 'F8', 'G8', 'H8', 'I8'],
          ['A9', 'B9', 'C9', 'D9', 'E9', 'F9', 'G9', 'H9', 'I9'],
        ]}
        width="auto"
        height="auto"
        colWidths={100}
        rowHeaders={true}
        colHeaders={true}
        selectionMode={selected}
        autoWrapRow={true}
        autoWrapCol={true}
        licenseKey="non-commercial-and-evaluation"
      />
    </>
  );
};

export default ExampleComponent;
