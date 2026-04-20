import Handsontable from 'handsontable/base';
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

// Track which column indices (into allColumns) are currently visible.
// Start with all columns visible.
const visibleIndices = new Set(allColumns.map((_, i) => i));

// Returns only the column configs that are currently visible.
function getVisibleColumns() {
  return allColumns.filter((_, i) => visibleIndices.has(i));
}

// Returns only the column headers that are currently visible.
function getVisibleHeaders() {
  return allColumns.filter((_, i) => visibleIndices.has(i)).map(col => col.title);
}

const container = document.querySelector('#example1');

const hot = new Handsontable(container, {
  data,
  columns: getVisibleColumns(),
  colHeaders: getVisibleHeaders(),
  rowHeaders: true,
  height: 'auto',
  width: '100%',
  autoWrapRow: true,
  licenseKey: 'non-commercial-and-evaluation',
});

// Build a checkbox for each column and attach toggle logic.
const togglesContainer = document.querySelector('#column-toggles');

allColumns.forEach((col, index) => {
  const label = document.createElement('label');
  label.style.marginRight = '12px';
  label.style.display = 'inline-flex';
  label.style.alignItems = 'center';
  label.style.gap = '4px';

  const checkbox = document.createElement('input');

  checkbox.type = 'checkbox';
  checkbox.checked = true; // all columns are visible on load
  checkbox.dataset.colIndex = String(index);

  checkbox.addEventListener('change', () => {
    if (!checkbox.checked) {
      // Prevent hiding the last visible column.
      if (visibleIndices.size === 1) {
        checkbox.checked = true;
        return;
      }
      visibleIndices.delete(index);
    } else {
      visibleIndices.add(index);
    }

    // Apply the new visible subset. hot.updateSettings() re-renders the grid
    // with only the provided columns config -- no DOM manipulation needed.
    hot.updateSettings({
      columns: getVisibleColumns(),
      colHeaders: getVisibleHeaders(),
    });

    // When only one column remains visible, disable its checkbox so the user
    // cannot produce an empty grid.
    togglesContainer.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      const idx = Number(cb.dataset.colIndex);

      cb.disabled = visibleIndices.size === 1 && visibleIndices.has(idx);
    });
  });

  label.appendChild(checkbox);
  label.appendChild(document.createTextNode(col.title));
  togglesContainer.appendChild(label);
});
