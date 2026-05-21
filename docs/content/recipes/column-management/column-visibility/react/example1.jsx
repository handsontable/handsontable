import { useCallback, useMemo, useState } from 'react';
import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

registerAllModules();

/* start:skip-in-preview */
const data = [
  { name: 'Alice Johnson', department: 'Engineering', role: 'Senior Engineer', salary: 95000, startDate: '2019-03-12', location: 'New York', status: 'Active' },
  { name: 'Bob Martinez', department: 'Marketing', role: 'Marketing Manager', salary: 78000, startDate: '2020-07-01', location: 'Chicago', status: 'Active' },
  { name: 'Carol Lee', department: 'Engineering', role: 'Tech Lead', salary: 115000, startDate: '2017-11-15', location: 'San Francisco', status: 'Active' },
  { name: 'David Kim', department: 'HR', role: 'HR Specialist', salary: 65000, startDate: '2021-02-28', location: 'Austin', status: 'On Leave' },
  { name: 'Eva Novak', department: 'Finance', role: 'Financial Analyst', salary: 82000, startDate: '2018-09-03', location: 'New York', status: 'Active' },
  { name: 'Frank Chen', department: 'Engineering', role: 'Junior Engineer', salary: 72000, startDate: '2022-05-16', location: 'Seattle', status: 'Active' },
  { name: 'Grace Okafor', department: 'Sales', role: 'Sales Executive', salary: 70000, startDate: '2020-01-20', location: 'Dallas', status: 'Active' },
  { name: 'Henry Walsh', department: 'Finance', role: 'Finance Director', salary: 130000, startDate: '2015-06-10', location: 'Chicago', status: 'Active' },
];
/* end:skip-in-preview */

// The full columns config is the immutable source of truth.
// Never mutate this array -- always derive a visible subset from it.
const allColumns = [
  { data: 'name', title: 'Name', type: 'text', width: 140 },
  { data: 'department', title: 'Department', type: 'text', width: 120 },
  { data: 'role', title: 'Role', type: 'text', width: 150 },
  {
    data: 'salary',
    title: 'Salary',
    type: 'numeric',
    numericFormat: { pattern: '$0,0', culture: 'en-US' },
    width: 110,
  },
  { data: 'startDate', title: 'Start Date', type: 'date', dateFormat: 'YYYY-MM-DD', width: 110 },
  { data: 'location', title: 'Location', type: 'text', width: 110 },
  {
    data: 'status',
    title: 'Status',
    type: 'dropdown',
    source: ['Active', 'On Leave', 'Inactive'],
    width: 100,
  },
];

const ExampleComponent = () => {
  // Track which column indices (into allColumns) are currently visible.
  // Start with all columns visible.
  const [visibleIndices, setVisibleIndices] = useState(
    () => new Set(allColumns.map((_, i) => i))
  );

  const handleToggle = useCallback((index) => {
    setVisibleIndices((prev) => {
      // Prevent hiding the last visible column.
      if (prev.has(index) && prev.size === 1) {
        return prev;
      }

      const next = new Set(prev);

      if (prev.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }

      return next;
    });
  }, []);

  const columns = useMemo(
    () => allColumns.filter((_, i) => visibleIndices.has(i)),
    [visibleIndices]
  );
  const colHeaders = useMemo(
    () => allColumns.filter((_, i) => visibleIndices.has(i)).map((col) => col.title),
    [visibleIndices]
  );

  return (
    <>
      <div className="example-controls-container">
        <div className="controls">
          {allColumns.map((col, index) => (
            <label key={col.data}>
              <input
                type="checkbox"
                checked={visibleIndices.has(index)}
                disabled={visibleIndices.size === 1 && visibleIndices.has(index)}
                onChange={() => handleToggle(index)}
              />
              {col.title}
            </label>
          ))}
        </div>
      </div>
      <HotTable
        data={data}
        columns={columns}
        colHeaders={colHeaders}
        rowHeaders={true}
        height="auto"
        width="100%"
        autoWrapRow={true}
        licenseKey="non-commercial-and-evaluation"
      />
    </>
  );
};

export default ExampleComponent;
