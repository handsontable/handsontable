import { HotTable } from '@handsontable/react-wrapper';
import { registerAllModules } from 'handsontable/registry';

// register Handsontable's modules
registerAllModules();

// the order you want in the "Filter by value" list, most severe first
const priorityOrder = ['Critical', 'High', 'Medium', 'Low'];
const sizeOrder = ['XS', 'S', 'M', 'L', 'XL'];

// turns an ordered list into a comparator; values the list does not know go last
const orderBy = (order) => (a, b) => {
  const rank = (value) => (order.indexOf(value) === -1 ? order.length : order.indexOf(value));

  return rank(a) - rank(b);
};

const ExampleComponent = () => {
  return (
    <HotTable
      data={[
        { task: 'Fix login timeout', priority: 'High', size: 'M' },
        { task: 'Update privacy page', priority: 'Low', size: 'XS' },
        { task: 'Database failover', priority: 'Critical', size: 'XL' },
        { task: 'Refresh icons', priority: 'Medium', size: 'S' },
        { task: 'Rotate API keys', priority: 'High', size: 'L' },
        { task: 'Archive old reports', priority: '', size: 'S' },
      ]}
      columns={[
        { title: 'Task', data: 'task', type: 'text' },
        {
          title: 'Priority',
          data: 'priority',
          type: 'text',
          // order this column's filter list by severity rather than alphabetically
          filterValueComparator: orderBy(priorityOrder),
        },
        {
          title: 'Size',
          data: 'size',
          type: 'text',
          filterValueComparator: orderBy(sizeOrder),
        },
      ]}
      filters={true}
      dropdownMenu={true}
      height="auto"
      autoWrapRow={true}
      autoWrapCol={true}
      licenseKey="non-commercial-and-evaluation"
    />
  );
};

export default ExampleComponent;
