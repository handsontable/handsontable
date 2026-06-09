import {
  getDataForFilters,
  getColumnsForFilters,
} from '../../helpers/fixtures';

describe('Filters condition (`date_before_or_equal` and `date_after_or_equal`)', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('date_before_or_equal', () => {
    it('should include the boundary date in results (unlike date_before which excludes it)', async() => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });
      const plugin = getPlugin('filters');

      // '2014-01-08' is the earliest static date in the dataset (id=8).
      // date_before_or_equal should include that exact date.
      plugin.addCondition(3, 'date_before_or_equal', ['2014-01-08']);
      await plugin.filter();

      const ids = getData().map(row => row[0]);

      expect(ids).toContain(8);
    });

    it('should not include dates strictly after the boundary', async() => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });
      const plugin = getPlugin('filters');

      plugin.addCondition(3, 'date_before_or_equal', ['2014-01-08']);
      await plugin.filter();

      // id=1 has registered '2014-01-29' which is after the boundary — must not appear
      const ids = getData().map(row => row[0]);

      expect(ids).not.toContain(1);
    });

    it('should return one more row than date_before for the same boundary date', async() => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });
      const plugin = getPlugin('filters');

      plugin.addCondition(3, 'date_before', ['2014-01-29']);
      await plugin.filter();
      const countExclusive = getData().length;

      await updateSettings({});
      plugin.clearConditions();

      plugin.addCondition(3, 'date_before_or_equal', ['2014-01-29']);
      await plugin.filter();
      const countInclusive = getData().length;

      // date_before_or_equal should return one extra row (the boundary date row itself)
      expect(countInclusive).toBe(countExclusive + 1);
    });
  });

  describe('date_after_or_equal', () => {
    it('should include the boundary date in results (unlike date_after which excludes it)', async() => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });
      const plugin = getPlugin('filters');

      // '2015-08-16' is the latest static date in the dataset (id=10).
      // date_after_or_equal should include that exact date.
      plugin.addCondition(3, 'date_after_or_equal', ['2015-08-16']);
      await plugin.filter();

      const ids = getData().map(row => row[0]);

      expect(ids).toContain(10);
    });

    it('should not include dates strictly before the boundary', async() => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });
      const plugin = getPlugin('filters');

      plugin.addCondition(3, 'date_after_or_equal', ['2015-08-16']);
      await plugin.filter();

      // id=4 has registered '2015-07-18' which is before the boundary — must not appear
      const ids = getData().map(row => row[0]);

      expect(ids).not.toContain(4);
    });

    it('should return one more row than date_after for the same boundary date', async() => {
      handsontable({
        data: getDataForFilters(),
        columns: getColumnsForFilters(),
        dropdownMenu: true,
        filters: true,
        width: 500,
        height: 300
      });
      const plugin = getPlugin('filters');

      plugin.addCondition(3, 'date_after', ['2015-07-18']);
      await plugin.filter();
      const countExclusive = getData().length;

      await updateSettings({});
      plugin.clearConditions();

      plugin.addCondition(3, 'date_after_or_equal', ['2015-07-18']);
      await plugin.filter();
      const countInclusive = getData().length;

      // date_after_or_equal should return one extra row (the boundary date row itself)
      expect(countInclusive).toBe(countExclusive + 1);
    });
  });
});
