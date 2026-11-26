import Handsontable from '../../../index';
import { TEST_LICENSE_KEY } from '../../../../test/helpers/licenseKey';
import { LOADING_ANNOUNCEMENT_DELAY } from '../emptyDataState';

import { announce } from '../../../utils/a11yAnnouncer';

// The announcer writes its message into the live region 100 ms after the call. The call itself is what
// this plugin owns, so the tests read the call and wait on no announcer timer.
jest.mock('../../../utils/a11yAnnouncer', () => {
  const actual = jest.requireActual('../../../utils/a11yAnnouncer');

  return { ...actual, announce: jest.fn(actual.announce) };
});

const wait = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms));
const flush = () => wait(0);
const waitPastDelay = () => wait(LOADING_ANNOUNCEMENT_DELAY + 50);

describe('EmptyDataState loading overlay announcement', () => {
  let container;
  let hot;
  let pending;

  const loadingAnnouncements = () => announce.mock.calls.filter(([, politeness]) => politeness === 'polite');

  const createGrid = async(settings = {}) => {
    pending = [];
    hot = new Handsontable(container, {
      columns: [{ data: 'id' }],
      emptyDataState: true,
      dataProvider: {
        rowId: 'id',
        fetchRows: () => new Promise((resolve, reject) => {
          pending.push({ resolve, reject });
        }),
        onRowsCreate: async() => [],
        onRowsUpdate: async() => {},
        onRowsRemove: async() => {},
      },
      licenseKey: TEST_LICENSE_KEY,
      ...settings,
    });
    await flush();
    pending.shift().resolve({ rows: [{ id: 1 }, { id: 2 }], totalRows: 2 });
    await flush();
  };

  const resolveFetch = async() => {
    pending.shift().resolve({ rows: [{ id: 1 }], totalRows: 1 });
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
    pending = [];
    hot = new Handsontable(container, {
      columns: [{ data: 'id' }],
      emptyDataState: true,
      dataProvider: {
        rowId: 'id',
        fetchRows: () => new Promise((resolve) => {
          pending.push({ resolve });
        }),
        onRowsCreate: async() => [],
        onRowsUpdate: async() => {},
        onRowsRemove: async() => {},
      },
      licenseKey: TEST_LICENSE_KEY,
    });
    await waitPastDelay();

    // The positive control: the first fetch did show the loading overlay, long enough to be announced.
    expect(hot.getPlugin('emptyDataState').isVisible()).toBe(true);

    await resolveFetch();

    expect(loadingAnnouncements()).toEqual([]);
  });

  it('should announce politely that the grid is loading once a fetch has run for the delay, and not before', async() => {
    await createGrid();
    hot.listen();

    void hot.getPlugin('dataProvider').fetchData();
    await wait(LOADING_ANNOUNCEMENT_DELAY - 100);

    expect(hot.getPlugin('emptyDataState').isVisible()).toBe(true);
    expect(loadingAnnouncements()).toEqual([]);

    await waitPastDelay();

    expect(loadingAnnouncements()).toEqual([['Loading data', 'polite']]);

    await resolveFetch();
  });

  it('should announce that the data loaded when the fetch whose start was announced ends', async() => {
    await createGrid();
    hot.listen();

    void hot.getPlugin('dataProvider').fetchData();
    await waitPastDelay();
    await resolveFetch();

    expect(hot.getPlugin('emptyDataState').isVisible()).toBe(false);
    expect(loadingAnnouncements()).toEqual([['Loading data', 'polite'], ['Data loaded', 'polite']]);
  });

  it('should say nothing for a fetch that ends before the delay, neither its start nor its end', async() => {
    await createGrid();
    hot.listen();

    const dataProvider = hot.getPlugin('dataProvider');

    void dataProvider.fetchData();

    // The positive control: the fetch did show the loading overlay.
    expect(hot.getPlugin('emptyDataState').isVisible()).toBe(true);

    await resolveFetch();
    await waitPastDelay();

    expect(loadingAnnouncements()).toEqual([]);
  });

  it('should not announce a start scheduled by a fetch that ended, when the next fetch is still young', async() => {
    await createGrid();
    hot.listen();

    const dataProvider = hot.getPlugin('dataProvider');

    void dataProvider.fetchData();
    await resolveFetch();
    await wait(LOADING_ANNOUNCEMENT_DELAY - 100);
    void dataProvider.fetchData();
    // The first fetch's timer fires now, while the second fetch has run for about 100 ms.
    await wait(150);

    expect(hot.getPlugin('emptyDataState').isVisible()).toBe(true);
    expect(loadingAnnouncements()).toEqual([]);

    await waitPastDelay();

    expect(loadingAnnouncements()).toEqual([['Loading data', 'polite']]);

    await resolveFetch();
  });

  it('should not say that the data loaded when the fetch fails', async() => {
    await createGrid({ notification: true });
    hot.listen();

    // `fetchData()` rethrows the failure to its caller.
    const fetching = hot.getPlugin('dataProvider').fetchData().catch(error => error);

    await waitPastDelay();
    pending.shift().reject(new Error('Network down'));

    expect((await fetching).message).toBe('Network down');
    await flush();

    // The positive control: the failure took the loading overlay down.
    expect(hot.getPlugin('emptyDataState').isVisible()).toBe(false);
    expect(loadingAnnouncements().filter(([text]) => text === 'Data loaded')).toEqual([]);
  });

  it('should announce the title an application set for the loading state, as plain text, with no extra ' +
     '`message` call', async() => {
    const loadingCalls = [];

    await createGrid({
      emptyDataState: {
        message: (source) => {
          if (source === 'loading') {
            loadingCalls.push(source);

            return { title: 'Fetching <b>orders</b>' };
          }

          return { title: 'Nothing here' };
        },
      },
    });
    hot.listen();
    loadingCalls.length = 0;

    void hot.getPlugin('dataProvider').fetchData();

    const callsBeforeAnnouncement = loadingCalls.length;

    await waitPastDelay();

    expect(callsBeforeAnnouncement).toBeGreaterThan(0);
    expect(loadingCalls).toHaveLength(callsBeforeAnnouncement);
    expect(loadingAnnouncements()).toEqual([['Fetching orders', 'polite']]);

    await resolveFetch();
  });

  it('should say nothing when a fetch starts in a grid that does not listen', async() => {
    await createGrid();
    hot.unlisten();

    void hot.getPlugin('dataProvider').fetchData();
    await waitPastDelay();

    // The positive control: the overlay is up, so only the listening state kept the grid quiet.
    expect(hot.getPlugin('emptyDataState').isVisible()).toBe(true);

    await resolveFetch();

    expect(loadingAnnouncements()).toEqual([]);
  });

  it('should say nothing with `ariaTags` off', async() => {
    await createGrid({ ariaTags: false });
    hot.listen();

    void hot.getPlugin('dataProvider').fetchData();
    await waitPastDelay();

    expect(hot.getPlugin('emptyDataState').isVisible()).toBe(true);

    await resolveFetch();

    expect(loadingAnnouncements()).toEqual([]);
  });

  it('should announce each slow fetch that shows the loading overlay, and none for a fetch that skips it', async() => {
    await createGrid();
    hot.listen();

    const dataProvider = hot.getPlugin('dataProvider');

    void dataProvider.fetchData();
    await waitPastDelay();
    await resolveFetch();

    void dataProvider.fetchData();
    await waitPastDelay();
    await resolveFetch();

    expect(loadingAnnouncements()).toEqual([
      ['Loading data', 'polite'], ['Data loaded', 'polite'],
      ['Loading data', 'polite'], ['Data loaded', 'polite'],
    ]);

    void dataProvider.fetchData({ skipLoading: true });
    await waitPastDelay();

    expect(hot.getPlugin('emptyDataState').isVisible()).toBe(false);
    expect(loadingAnnouncements()).toHaveLength(4);

    await resolveFetch();
  });
});
