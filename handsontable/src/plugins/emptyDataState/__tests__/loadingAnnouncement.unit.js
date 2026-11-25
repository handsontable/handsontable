import Handsontable from '../../../index';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';

import { announce } from '../../../utils/a11yAnnouncer';

// The announcer writes its message into the live region 100 ms after the call. The call itself is what
// this plugin owns, so the tests read the call and wait on no timer.
jest.mock('../../../utils/a11yAnnouncer', () => {
  const actual = jest.requireActual('../../../utils/a11yAnnouncer');

  return { ...actual, announce: jest.fn(actual.announce) };
});

const flush = () => new Promise(resolve => setTimeout(resolve, 0));

describe('EmptyDataState loading overlay announcement', () => {
  let container;
  let hot;
  let pending;

  const loadingAnnouncements = () => announce.mock.calls.filter(([, politeness]) => politeness === 'polite');

  let overlayShownOnFirstLoad;

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
    overlayShownOnFirstLoad = hot.getPlugin('emptyDataState').isVisible();
    pending.shift()({ rows: [{ id: 1 }, { id: 2 }], totalRows: 2 });
    await flush();
  };

  beforeEach(() => {
    announce.mockClear();
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

    // The positive control: the first fetch did show the loading overlay.
    expect(overlayShownOnFirstLoad).toBe(true);
    expect(loadingAnnouncements()).toEqual([]);
  });

  it('should announce politely that the grid is loading when a fetch starts in a grid that listens', async() => {
    await createGrid();
    hot.listen();

    void hot.getPlugin('dataProvider').fetchData();

    expect(hot.getPlugin('emptyDataState').isVisible()).toBe(true);
    expect(loadingAnnouncements()).toEqual([['Loading data', 'polite']]);
  });

  it('should announce the title an application set for the loading state, as plain text', async() => {
    await createGrid({
      emptyDataState: {
        message: source => (source === 'loading' ? { title: 'Fetching <b>orders</b>' } : { title: 'Nothing here' }),
      },
    });
    hot.listen();

    void hot.getPlugin('dataProvider').fetchData();

    expect(loadingAnnouncements()).toEqual([['Fetching orders', 'polite']]);
  });

  it('should say nothing when a fetch starts in a grid that does not listen', async() => {
    await createGrid();
    hot.unlisten();

    void hot.getPlugin('dataProvider').fetchData();

    // The positive control: the overlay is up, so only the listening state kept the grid quiet.
    expect(hot.getPlugin('emptyDataState').isVisible()).toBe(true);
    expect(loadingAnnouncements()).toEqual([]);
  });

  it('should say nothing with `ariaTags` off', async() => {
    await createGrid({ ariaTags: false });
    hot.listen();

    void hot.getPlugin('dataProvider').fetchData();

    expect(hot.getPlugin('emptyDataState').isVisible()).toBe(true);
    expect(loadingAnnouncements()).toEqual([]);
  });
  it('should announce each fetch that shows the loading overlay, and none for a fetch that skips it', async() => {
    await createGrid();
    hot.listen();

    const dataProvider = hot.getPlugin('dataProvider');

    void dataProvider.fetchData();
    pending.shift()({ rows: [{ id: 1 }], totalRows: 1 });
    await flush();

    void dataProvider.fetchData();
    pending.shift()({ rows: [{ id: 1 }], totalRows: 1 });
    await flush();

    expect(loadingAnnouncements()).toEqual([['Loading data', 'polite'], ['Loading data', 'polite']]);

    void dataProvider.fetchData({ skipLoading: true });

    expect(hot.getPlugin('emptyDataState').isVisible()).toBe(false);
    expect(loadingAnnouncements()).toHaveLength(2);

    pending.shift()({ rows: [{ id: 1 }], totalRows: 1 });
    await flush();
  });
});
