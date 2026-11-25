import Handsontable from '../../../index';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

const flush = () => new Promise(resolve => setTimeout(resolve, 0));
// The announcer writes its message 100 ms after the call.
const announced = () => new Promise(resolve => setTimeout(resolve, 150));

describe('EmptyDataState loading overlay announcement', () => {
  let container;
  let hot;
  let pending;

  const politeText = () => document.querySelector('[role="status"][aria-live="polite"]')?.textContent ?? '';

  const createGrid = async(settings = {}) => {
    pending = [];
    hot = new Handsontable(container, {
      columns: [{ data: 'id' }],
      emptyDataState: true,
      dataProvider: {
        rowId: 'id',
        fetchRows: () => new Promise((resolve) => {
          pending.push(resolve);
        }),
        onRowsCreate: async() => [],
        onRowsUpdate: async() => {},
        onRowsRemove: async() => {},
      },
      licenseKey: TEST_LICENSE_KEY,
      ...settings,
    });
    await flush();
    pending.shift()({ rows: [{ id: 1 }, { id: 2 }], totalRows: 2 });
    await flush();
    await announced();
  };

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
  });

  it('should say nothing for the first load of a grid the user is not working in', async() => {
    await createGrid();

    expect(politeText()).toBe('');
  });

  it('should announce politely that the grid is loading when a fetch starts in a grid that listens', async() => {
    await createGrid();
    hot.listen();

    void hot.getPlugin('dataProvider').fetchData();

    expect(hot.getPlugin('emptyDataState').isVisible()).toBe(true);

    await announced();

    expect(politeText()).toBe('Loading data');
  });

  it('should announce the title an application set for the loading state, as plain text', async() => {
    await createGrid({
      emptyDataState: {
        message: source => (source === 'loading' ? { title: 'Fetching <b>orders</b>' } : { title: 'Nothing here' }),
      },
    });
    hot.listen();

    void hot.getPlugin('dataProvider').fetchData();
    await announced();

    expect(politeText()).toBe('Fetching orders');
  });

  it('should say nothing when a fetch starts in a grid that does not listen', async() => {
    await createGrid();
    hot.unlisten();

    void hot.getPlugin('dataProvider').fetchData();

    // The positive control: the overlay is up, so only the listening state kept the grid quiet.
    expect(hot.getPlugin('emptyDataState').isVisible()).toBe(true);

    await announced();

    expect(politeText()).toBe('');
  });

  it('should say nothing with `ariaTags` off', async() => {
    await createGrid({ ariaTags: false });
    hot.listen();

    void hot.getPlugin('dataProvider').fetchData();

    expect(hot.getPlugin('emptyDataState').isVisible()).toBe(true);

    await announced();

    expect(politeText()).toBe('');
  });
});
