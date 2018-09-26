/* eslint-disable no-console */
describe('GanttChart', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
    this.$sourceContainer = $(`<div id="source_${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }

    if (this.$sourceContainer) {
      this.$sourceContainer.handsontable('destroy');
      this.$sourceContainer.remove();
    }
  });

  describe('initialization', () => {
    it('should update all the needed settings for the current instance', () => {
      const hot = handsontable({
        colHeaders: true,
        ganttChart: {
          firstWeekDay: 'monday'
        },
        height: 250
      });

      const ganttPlugin = hot.getPlugin('ganttChart');

      expect(hot.getSettings().readOnly).toEqual(true);
      expect(hot.getSettings().colWidths).toEqual(60);
      expect(hot.getSettings().hiddenColumns).toEqual(true);
      expect(hot.getSettings().nestedHeaders).toBeTruthy();
      expect(hot.getSettings().collapsibleColumns).toEqual(true);
      expect(hot.getSettings().columnSorting).toEqual(false);

      ganttPlugin.uniformBackgroundRenderer = jasmine.createSpy('renderer');

      hot.render();

      expect(ganttPlugin.uniformBackgroundRenderer.calls.count()).toEqual(hot.view.wt.wtTable.getRenderedColumnsCount());
    });

    it('should throw a warning if colHeaders property is not defined for the ganttChart-enabled instance', () => {
      const warnSpy = spyOn(console, 'warn');

      handsontable({
        ganttChart: true,
        height: 250
      });

      expect(warnSpy).toHaveBeenCalled();
    });
  });

  describe('disabling and enabling the plugin', () => {
    // TODO: commenting it out temporarily, to be fixed in #68
    xit('should revert to a clean Handsontable instance after calling the disablePlugin method', () => {
      const hot = handsontable({
        colHeaders: true,
        ganttChart: true,
        height: 250
      });

      hot.getPlugin('ganttChart').disablePlugin();
      hot.render();

      expect(hot.rootElement.className.indexOf('gantt')).toEqual(-1);
      expect($(hot.rootElement).find('.ht_clone_top thead').find('tr').size()).toEqual(1);
    });

    it('should allow to re-enable the plugin using the disablePlugin->enablePlugin methods', () => {
      const hot = handsontable({
        colHeaders: true,
        ganttChart: true,
        height: 250
      });

      const plugin = hot.getPlugin('ganttChart');

      plugin.disablePlugin();
      hot.render();
      plugin.enablePlugin();
      hot.render();

      expect(hot.rootElement.className.indexOf('gantt')).not.toEqual(-1);
      expect($(hot.rootElement).find('.ht_clone_top thead').find('tr').size()).toEqual(2);
    });

    it('should allow to change the gantt chart\'s year using the updateSettings method', () => {
      const source = [
        {
          additionalData: { vendor: 'Vendor One', format: 'Posters', market: 'New York, NY' },
          startDate: '1/5/2015',
          endDate: '1/20/2015'
        }
      ];

      const hot = handsontable({
        colHeaders: true,
        ganttChart: {
          startYear: 2015,
          dataSource: source
        },
        height: 250
      });

      expect(hot.getCellMeta(0, 1).className.indexOf('rangeBar')).toBeGreaterThan(-1);
      expect(hot.getCellMeta(0, 2).className.indexOf('rangeBar')).toBeGreaterThan(-1);
      expect(hot.getCellMeta(0, 3).className.indexOf('rangeBar')).toBeGreaterThan(-1);
      expect(hot.getCellMeta(0, 3).className.indexOf('partial')).toBeGreaterThan(-1);

      hot.updateSettings({
        ganttChart: {
          startYear: 1987,
          dataSource: source
        }
      });

      expect(hot.getCellMeta(0, 1).className).toEqual(void 0);
      expect(hot.getCellMeta(0, 2).className).toEqual(void 0);
      expect(hot.getCellMeta(0, 3).className).toEqual(void 0);
      expect(hot.getCellMeta(0, 3).className).toEqual(void 0);

      hot.updateSettings({
        ganttChart: {
          startYear: 2015,
          dataSource: source
        }
      });

      expect(hot.getCellMeta(0, 1).className.indexOf('rangeBar')).toBeGreaterThan(-1);
      expect(hot.getCellMeta(0, 2).className.indexOf('rangeBar')).toBeGreaterThan(-1);
      expect(hot.getCellMeta(0, 3).className.indexOf('rangeBar')).toBeGreaterThan(-1);
      expect(hot.getCellMeta(0, 3).className.indexOf('partial')).toBeGreaterThan(-1);

    });
  });

  describe('updateSettings', () => {
    it('should be able to turn on the plugin using the updateSettings method', () => {
      const hot = handsontable({
        colHeaders: true,
        height: 250
      });

      hot.updateSettings({
        ganttChart: true
      });

      expect(hot.rootElement.className.indexOf('gantt')).not.toEqual(-1);
      expect($(hot.rootElement).find('.ht_clone_top thead').find('tr').size()).toEqual(2);
    });
  });

  describe('header structure', () => {
    it('should calculate the right data for month and week structure', () => {
      const hot = handsontable({
        colHeaders: true,
        height: 250,
        ganttChart: {
          startYear: 2015
        }
      });

      const plugin = hot.getPlugin('ganttChart');

      const preDaysInMonths = [4, 1, 1, 5, 3, 0, 5, 2, 6, 4, 1, 6];
      const weeksInMonths = [3, 3, 4, 3, 4, 4, 3, 4, 3, 3, 4, 3];
      const postDaysInMonths = [6, 6, 2, 4, 0, 2, 5, 1, 3, 6, 1, 4];

      /* eslint-disable no-eval */
      expect(plugin.overallWeekSectionCount).toEqual(eval(weeksInMonths.join('+')) + preDaysInMonths.length + postDaysInMonths.length - 2); // 2 is the number of '0's in pre and post days

      for (let i = 0; i < 12; i++) {
        expect(plugin.monthList[i].daysBeforeFullWeeks).toEqual(preDaysInMonths[i]);
        expect(plugin.monthList[i].fullWeeks).toEqual(weeksInMonths[i]);
        expect(plugin.monthList[i].daysAfterFullWeeks).toEqual(postDaysInMonths[i]);
      }
    });

    it('should calculate the right data for month and week structure, when using the `allowSplitWeeks: false` option.', () => {
      const hot = handsontable({
        colHeaders: true,
        height: 250,
        ganttChart: {
          startYear: 2015,
          allowSplitWeeks: false
        }
      });

      const plugin = hot.getPlugin('ganttChart');

      const preDaysInMonths = [0, 4, 0, 1, 0, 1, 0, 5, 0, 3, 0, 0, 5, 0, 2, 0, 6, 0, 4, 0, 1, 0, 6, 0];
      const weeksInMonths = [1, 3, 1, 3, 1, 4, 1, 3, 1, 4, 4, 1, 3, 1, 4, 1, 3, 1, 3, 1, 4, 1, 3, 1];
      const postDaysInMonths = [0, 6, 0, 6, 0, 2, 0, 4, 0, 0, 2, 0, 5, 0, 1, 0, 3, 0, 6, 0, 1, 0, 4, 0];

      /* eslint-disable no-eval */
      expect(plugin.overallWeekSectionCount).toEqual(eval(weeksInMonths.join('+')));

      for (let i = 0; i < plugin.dateCalculator.monthListCache[2015].length; i++) {
        expect(plugin.monthList[i].daysBeforeFullWeeks).toEqual(preDaysInMonths[i]);
        expect(plugin.monthList[i].fullWeeks).toEqual(weeksInMonths[i]);
        expect(plugin.monthList[i].daysAfterFullWeeks).toEqual(postDaysInMonths[i]);
      }
    });

    it('should create a month/week structure of nested headers', () => {
      const hot = handsontable({
        colHeaders: true,
        height: 250,
        ganttChart: {
          startYear: 2015
        },
        viewportColumnRenderingOffset: 1000
      });

      const preDaysInMonths = [4, 1, 1, 5, 3, 0, 5, 2, 6, 4, 1, 6];
      const weeksInMonths = [3, 3, 4, 3, 4, 4, 3, 4, 3, 3, 4, 3];
      const postDaysInMonths = [6, 6, 2, 4, 0, 2, 5, 1, 3, 6, 1, 4];

      expect($(hot.rootElement).find('.ht_clone_top thead').find('tr').size()).toEqual(2);
      expect($(hot.rootElement).find('.ht_clone_top thead tr:first-child').find('th:not(".hiddenHeader")').size()).toEqual(12);
      /* eslint-disable no-eval */
      expect($(hot.rootElement).find('.ht_clone_top thead tr:nth-child(2)').find('th').size())
        .toEqual(eval(weeksInMonths.join('+')) + preDaysInMonths.length + postDaysInMonths.length - 2);

      const monthHeaders = $(hot.rootElement).find('.ht_clone_top thead tr:first-child').find('th:not(".hiddenHeader")');
      let currentColspan;

      for (let i = 0; i < 12; i++) {
        /* eslint-disable no-extra-boolean-cast */
        currentColspan = (!!preDaysInMonths[i] ? 1 : 0) + weeksInMonths[i] + (!!postDaysInMonths[i] ? 1 : 0);

        expect(parseInt(monthHeaders[i].getAttribute('colspan'), 0)).toEqual(currentColspan === 0 ? 'NaN' : currentColspan);
      }

    });

    describe('the `weekHeaderGenerator` option', () => {
      it('should display the week header labels accordingly to the definition of the `weekHeaderGenerator` function', () => {
        const hot = handsontable({
          colHeaders: true,
          height: 250,
          ganttChart: {
            startYear: 2017,
          }
        });

        let weekHeaders = $(hot.rootElement).find('.ht_clone_top thead tr:nth-child(2)').find('th:not(".hiddenHeader")');
        expect(weekHeaders[0].querySelector('span').innerText).toEqual('1');
        expect(weekHeaders[1].querySelector('span').innerText).toEqual('2 - 8');
        expect(weekHeaders[2].querySelector('span').innerText).toEqual('9 - 15');
        expect(weekHeaders[3].querySelector('span').innerText).toEqual('16 - 22');

        hot.updateSettings({
          ganttChart: {
            startYear: 2017,
            weekHeaderGenerator(start, end) {
              return `${start} -> ${end}`;
            }
          }
        });

        weekHeaders = $(hot.rootElement).find('.ht_clone_top thead tr:nth-child(2)').find('th:not(".hiddenHeader")');
        expect(weekHeaders[0].querySelector('span').innerText).toEqual('1 -> 1');
        expect(weekHeaders[1].querySelector('span').innerText).toEqual('2 -> 8');
        expect(weekHeaders[2].querySelector('span').innerText).toEqual('9 -> 15');
        expect(weekHeaders[3].querySelector('span').innerText).toEqual('16 -> 22');

        hot.updateSettings({
          ganttChart: {
            startYear: 2017,
            weekHeaderGenerator(start, end) {
              return `some text -> ${start}, ${end} (${end - start + 1})`;
            }
          }
        });

        weekHeaders = $(hot.rootElement).find('.ht_clone_top thead tr:nth-child(2)').find('th:not(".hiddenHeader")');
        expect(weekHeaders[0].querySelector('span').innerText).toEqual('some text -> 1, 1 (1)');
        expect(weekHeaders[1].querySelector('span').innerText).toEqual('some text -> 2, 8 (7)');
        expect(weekHeaders[2].querySelector('span').innerText).toEqual('some text -> 9, 15 (7)');
        expect(weekHeaders[3].querySelector('span').innerText).toEqual('some text -> 16, 22 (7)');

      });
    });

    it('should not render the incomplete week columns at the beginnings of the months, when the `hideDaysBeforeFullWeeks` option is enabled', async() => {
      const hot = handsontable({
        colHeaders: true,
        height: 250,
        ganttChart: {
          startYear: 2018,
          hideDaysBeforeFullWeeks: true
        }
      });

      expect(hot.countCols()).toEqual(53);

      let weekHeaders = $(hot.rootElement).find('.ht_clone_top thead tr:nth-child(2)').find('th:not(".hiddenHeader")');

      expect(weekHeaders[0].querySelector('span').innerText).toEqual('1 - 7');
      expect(weekHeaders[1].querySelector('span').innerText).toEqual('8 - 14');
      expect(weekHeaders[2].querySelector('span').innerText).toEqual('15 - 21');
      expect(weekHeaders[3].querySelector('span').innerText).toEqual('22 - 28');
      expect(weekHeaders[4].querySelector('span').innerText).toEqual('29 - 31');
      expect(weekHeaders[5].querySelector('span').innerText).toEqual('5 - 11');
      expect(weekHeaders[6].querySelector('span').innerText).toEqual('12 - 18');
      expect(weekHeaders[7].querySelector('span').innerText).toEqual('19 - 25');
      expect(weekHeaders[8].querySelector('span').innerText).toEqual('26 - 28');
      expect(weekHeaders[9].querySelector('span').innerText).toEqual('5 - 11');
      expect(weekHeaders[10].querySelector('span').innerText).toEqual('12 - 18');
      expect(weekHeaders[11].querySelector('span').innerText).toEqual('19 - 25');
      expect(weekHeaders[12].querySelector('span').innerText).toEqual('26 - 31');

      hot.selectCell(0, 52);

      await sleep(200);

      weekHeaders = $(hot.rootElement).find('.ht_clone_top thead tr:nth-child(2)').find('th:not(".hiddenHeader")');
      const firstRendered = 53 - weekHeaders.length;

      expect(weekHeaders[31 - firstRendered].querySelector('span').innerText).toEqual('6 - 12');
      expect(weekHeaders[32 - firstRendered].querySelector('span').innerText).toEqual('13 - 19');
      expect(weekHeaders[33 - firstRendered].querySelector('span').innerText).toEqual('20 - 26');
      expect(weekHeaders[34 - firstRendered].querySelector('span').innerText).toEqual('27 - 31');
      expect(weekHeaders[35 - firstRendered].querySelector('span').innerText).toEqual('3 - 9');
      expect(weekHeaders[36 - firstRendered].querySelector('span').innerText).toEqual('10 - 16');
      expect(weekHeaders[37 - firstRendered].querySelector('span').innerText).toEqual('17 - 23');
      expect(weekHeaders[38 - firstRendered].querySelector('span').innerText).toEqual('24 - 30');
    });

    it('should not render the incomplete week columns at the end of the months, when the `hideDaysAfterFullWeeks` option is enabled', async() => {
      const hot = handsontable({
        colHeaders: true,
        height: 250,
        ganttChart: {
          startYear: 2018,
          hideDaysAfterFullWeeks: true
        }
      });

      expect(hot.countCols()).toEqual(52);

      let weekHeaders = $(hot.rootElement).find('.ht_clone_top thead tr:nth-child(2)').find('th:not(".hiddenHeader")');

      expect(weekHeaders[0].querySelector('span').innerText).toEqual('1 - 7');
      expect(weekHeaders[1].querySelector('span').innerText).toEqual('8 - 14');
      expect(weekHeaders[2].querySelector('span').innerText).toEqual('15 - 21');
      expect(weekHeaders[3].querySelector('span').innerText).toEqual('22 - 28');
      expect(weekHeaders[4].querySelector('span').innerText).toEqual('1 - 4');
      expect(weekHeaders[5].querySelector('span').innerText).toEqual('5 - 11');
      expect(weekHeaders[6].querySelector('span').innerText).toEqual('12 - 18');
      expect(weekHeaders[7].querySelector('span').innerText).toEqual('19 - 25');
      expect(weekHeaders[8].querySelector('span').innerText).toEqual('1 - 4');
      expect(weekHeaders[9].querySelector('span').innerText).toEqual('5 - 11');
      expect(weekHeaders[10].querySelector('span').innerText).toEqual('12 - 18');
      expect(weekHeaders[11].querySelector('span').innerText).toEqual('19 - 25');
      expect(weekHeaders[12].querySelector('span').innerText).toEqual('1');

      hot.selectCell(0, 51);

      await sleep(200);

      weekHeaders = $(hot.rootElement).find('.ht_clone_top thead tr:nth-child(2)').find('th:not(".hiddenHeader")');
      const firstRendered = 53 - weekHeaders.length;

      expect(weekHeaders[31 - firstRendered].querySelector('span').innerText).toEqual('1 - 5');
      expect(weekHeaders[32 - firstRendered].querySelector('span').innerText).toEqual('6 - 12');
      expect(weekHeaders[33 - firstRendered].querySelector('span').innerText).toEqual('13 - 19');
      expect(weekHeaders[34 - firstRendered].querySelector('span').innerText).toEqual('20 - 26');
      expect(weekHeaders[35 - firstRendered].querySelector('span').innerText).toEqual('1 - 2');
      expect(weekHeaders[36 - firstRendered].querySelector('span').innerText).toEqual('3 - 9');
      expect(weekHeaders[37 - firstRendered].querySelector('span').innerText).toEqual('10 - 16');
      expect(weekHeaders[38 - firstRendered].querySelector('span').innerText).toEqual('17 - 23');
      expect(weekHeaders[39 - firstRendered].querySelector('span').innerText).toEqual('24 - 30');
    });

    it('should not render the incomplete week columns at the beginning nor end of the months, when ' +
      'the `hideDaysBeforeFullWeeks` and `hideDaysAfterFullWeeks` options are enabled', async() => {
      const hot = handsontable({
        colHeaders: true,
        height: 250,
        ganttChart: {
          startYear: 2018,
          hideDaysBeforeFullWeeks: true,
          hideDaysAfterFullWeeks: true
        }
      });

      expect(hot.countCols()).toEqual(42);

      const weekHeaders = $(hot.rootElement).find('.ht_clone_top thead tr:nth-child(2)').find('th:not(".hiddenHeader")');

      expect(weekHeaders[0].querySelector('span').innerText).toEqual('1 - 7');
      expect(weekHeaders[1].querySelector('span').innerText).toEqual('8 - 14');
      expect(weekHeaders[2].querySelector('span').innerText).toEqual('15 - 21');
      expect(weekHeaders[3].querySelector('span').innerText).toEqual('22 - 28');
      expect(weekHeaders[4].querySelector('span').innerText).toEqual('5 - 11');
      expect(weekHeaders[5].querySelector('span').innerText).toEqual('12 - 18');
      expect(weekHeaders[6].querySelector('span').innerText).toEqual('19 - 25');
      expect(weekHeaders[7].querySelector('span').innerText).toEqual('5 - 11');
      expect(weekHeaders[8].querySelector('span').innerText).toEqual('12 - 18');
      expect(weekHeaders[9].querySelector('span').innerText).toEqual('19 - 25');
      expect(weekHeaders[10].querySelector('span').innerText).toEqual('2 - 8');
      expect(weekHeaders[11].querySelector('span').innerText).toEqual('9 - 15');
      expect(weekHeaders[12].querySelector('span').innerText).toEqual('16 - 22');
    });
  });

  describe('data sources', () => {
    it('should be able to feed the gantt chart data from another HOT instance', function() {
      const source = this.$sourceContainer.handsontable({
        data: [
          ['Vendor One', 'Posters', 'New York, NY', '2', '1/5/2015', '1/20/2015'],
          ['Vendor Two', 'Malls', 'Los Angeles, CA', '1', '1/11/2015', '1/29/2015'],
          ['Vendor Three', 'Posters', 'Chicago, IL', '2', '1/15/2015', '2/20/2015'],
          ['Vendor Four', 'Malls', 'Philadelphia, PA', '1', '1/3/2015', '3/29/2015'],
          ['Vendor One', 'Posters', 'San Francisco, CA', '2', '4/5/2015', '4/20/2015'],
          ['Vendor Four', 'Malls', 'Los Angeles, CA', '1', '2/11/2015', '5/29/2015'],
          ['Vendor Two', 'Posters', 'New York, NY', '2', '2/15/2015', '3/20/2015'],
          ['Vendor Two', 'Malls', 'Los Angeles, CA', '1', '3/2/2015', '4/12/2015'],
        ]
      }).handsontable('getInstance');

      const hot = handsontable({
        colHeaders: true,
        height: 250,
        ganttChart: {
          startYear: 2015,
          dataSource: {
            instance: source,
            startDateColumn: 4,
            endDateColumn: 5,
            additionalData: {
              vendor: 0,
              format: 1,
              market: 2
            }
          }
        }
      });

      expect(hot.getCellMeta(0, 1).className.indexOf('rangeBar')).toBeGreaterThan(-1);
      expect(hot.getCellMeta(0, 2).className.indexOf('rangeBar')).toBeGreaterThan(-1);
      expect(hot.getCellMeta(0, 3).className.indexOf('rangeBar')).toBeGreaterThan(-1);
      expect(hot.getCellMeta(0, 3).className.indexOf('partial')).toBeGreaterThan(-1);

      expect(hot.getCellMeta(2, 2).className.indexOf('rangeBar')).toBeGreaterThan(-1);
      expect(hot.getCellMeta(2, 2).className.indexOf('partial')).toBeGreaterThan(-1);
      expect(hot.getCellMeta(2, 3).className.indexOf('rangeBar')).toBeGreaterThan(-1);
      expect(hot.getCellMeta(2, 3).className.indexOf('partial')).toEqual(-1);
      expect(hot.getCellMeta(2, 7).className.indexOf('rangeBar')).toBeGreaterThan(-1);
      expect(hot.getCellMeta(2, 7).className.indexOf('partial')).toEqual(-1);
      expect(hot.getCellMeta(2, 8).className.indexOf('rangeBar')).toBeGreaterThan(-1);
      expect(hot.getCellMeta(2, 8).className.indexOf('partial')).toBeGreaterThan(-1);
    });

    it('should be able to feed the gantt chart data from another HOT instance, when the asyncUpdates option is enabled', function(done) {
      const source = this.$sourceContainer.handsontable({
        data: [
          ['Vendor One', 'Posters', 'New York, NY', '2', '1/5/2015', '1/20/2015'],
          ['Vendor Two', 'Malls', 'Los Angeles, CA', '1', '1/11/2015', '1/29/2015'],
          ['Vendor Three', 'Posters', 'Chicago, IL', '2', '1/15/2015', '2/20/2015'],
          ['Vendor Four', 'Malls', 'Philadelphia, PA', '1', '1/3/2015', '3/29/2015'],
          ['Vendor One', 'Posters', 'San Francisco, CA', '2', '4/5/2015', '4/20/2015'],
          ['Vendor Four', 'Malls', 'Los Angeles, CA', '1', '2/11/2015', '5/29/2015'],
          ['Vendor Two', 'Posters', 'New York, NY', '2', '2/15/2015', '3/20/2015'],
          ['Vendor Two', 'Malls', 'Los Angeles, CA', '1', '3/2/2015', '4/12/2015'],
        ]
      }).handsontable('getInstance');
      const hot = handsontable({
        colHeaders: true,
        height: 250,
        ganttChart: {
          startYear: 2015,
          dataSource: {
            instance: source,
            startDateColumn: 4,
            endDateColumn: 5,
            additionalData: {
              vendor: 0,
              format: 1,
              market: 2
            },
            asyncUpdates: true
          }
        }
      });

      setTimeout(() => {
        expect(hot.getCellMeta(0, 1).className.indexOf('rangeBar')).toBeGreaterThan(-1);
        expect(hot.getCellMeta(0, 2).className.indexOf('rangeBar')).toBeGreaterThan(-1);
        expect(hot.getCellMeta(0, 3).className.indexOf('rangeBar')).toBeGreaterThan(-1);
        expect(hot.getCellMeta(0, 3).className.indexOf('partial')).toBeGreaterThan(-1);

        expect(hot.getCellMeta(2, 2).className.indexOf('rangeBar')).toBeGreaterThan(-1);
        expect(hot.getCellMeta(2, 2).className.indexOf('partial')).toBeGreaterThan(-1);
        expect(hot.getCellMeta(2, 3).className.indexOf('rangeBar')).toBeGreaterThan(-1);
        expect(hot.getCellMeta(2, 3).className.indexOf('partial')).toEqual(-1);
        expect(hot.getCellMeta(2, 7).className.indexOf('rangeBar')).toBeGreaterThan(-1);
        expect(hot.getCellMeta(2, 7).className.indexOf('partial')).toEqual(-1);
        expect(hot.getCellMeta(2, 8).className.indexOf('rangeBar')).toBeGreaterThan(-1);
        expect(hot.getCellMeta(2, 8).className.indexOf('partial')).toBeGreaterThan(-1);

        done();
      }, 200);
    });

    it('should be able to feed the gantt chart data from an object', () => {
      const source = [
        {
          additionalData: { vendor: 'Vendor One', format: 'Posters', market: 'New York, NY' },
          startDate: '1/5/2015',
          endDate: '1/20/2015'
        },
        {
          additionalData: { vendor: 'Vendor Two', format: 'Malls', market: 'Los Angeles, CA' },
          startDate: '1/11/2015',
          endDate: '1/29/2015'
        },
        {
          additionalData: { vendor: 'Vendor Three', format: 'Posters', market: 'Chicago, IL' },
          startDate: '1/15/2015',
          endDate: '2/20/2015'
        },
        {
          additionalData: { vendor: 'Vendor Four', format: 'Malls', market: 'Philadelphia, PA' },
          startDate: '1/3/2015',
          endDate: '3/29/2015'
        },
        {
          additionalData: { vendor: 'Vendor One', format: 'Posters', market: 'San Francisco, CA' },
          startDate: '4/5/2015',
          endDate: '4/20/2015'
        },
        {
          additionalData: { vendor: 'Vendor Four', format: 'Malls', market: 'Los Angeles, CA' },
          startDate: '2/11/2015',
          endDate: '5/29/2015'
        },
        {
          additionalData: { vendor: 'Vendor Two', format: 'Posters', market: 'New York, NY' },
          startDate: '2/15/2015',
          endDate: '3/20/2015'
        },
        {
          additionalData: { vendor: 'Vendor Two', format: 'Malls', market: 'Los Angeles, CA' },
          startDate: '3/2/2015',
          endDate: '4/12/2015'
        },
      ];

      const hot = handsontable({
        colHeaders: true,
        height: 250,
        ganttChart: {
          startYear: 2015,
          dataSource: source
        }
      });

      expect(hot.getCellMeta(0, 1).className.indexOf('rangeBar')).toBeGreaterThan(-1);
      expect(hot.getCellMeta(0, 2).className.indexOf('rangeBar')).toBeGreaterThan(-1);
      expect(hot.getCellMeta(0, 3).className.indexOf('rangeBar')).toBeGreaterThan(-1);
      expect(hot.getCellMeta(0, 3).className.indexOf('partial')).toBeGreaterThan(-1);

      expect(hot.getCellMeta(2, 2).className.indexOf('rangeBar')).toBeGreaterThan(-1);
      expect(hot.getCellMeta(2, 2).className.indexOf('partial')).toBeGreaterThan(-1);
      expect(hot.getCellMeta(2, 3).className.indexOf('rangeBar')).toBeGreaterThan(-1);
      expect(hot.getCellMeta(2, 3).className.indexOf('partial')).toEqual(-1);
      expect(hot.getCellMeta(2, 7).className.indexOf('rangeBar')).toBeGreaterThan(-1);
      expect(hot.getCellMeta(2, 7).className.indexOf('partial')).toEqual(-1);
      expect(hot.getCellMeta(2, 8).className.indexOf('rangeBar')).toBeGreaterThan(-1);
      expect(hot.getCellMeta(2, 8).className.indexOf('partial')).toBeGreaterThan(-1);
    });
  });

  describe('`hideDaysBeforeFullWeeks` and `hideDaysAfterFullWeeks`', () => {
    it('should render render the remaining parts of the range bars, when the beginning and/or end of the bar is not visible,' +
      'due to the `hideDaysBeforeFullWeeks` or `hideDaysAfterFullWeeks` setting', () => {
      const source = [
        {
          additionalData: { vendor: 'Vendor One', format: 'Posters', market: 'New York, NY' },
          startDate: '2/3/2018',
          endDate: '4/30/2018'
        },
        {
          additionalData: { vendor: 'Vendor Two', format: 'Malls', market: 'Los Angeles, CA' },
          startDate: '5/3/2018',
          endDate: '5/30/2018'
        },
        {
          additionalData: { vendor: 'Vendor Three', format: 'Posters', market: 'Chicago, IL' },
          startDate: '11/1/2018',
          endDate: '2/20/2019'
        },
      ];
      const hot = handsontable({
        colHeaders: true,
        height: 250,
        ganttChart: {
          dataSource: source,
          startYear: 2018,
          hideDaysBeforeFullWeeks: true,
          hideDaysAfterFullWeeks: true,
        }
      });

      expect((hot.getCellMeta(0, 3).className || '').indexOf('rangeBar')).toEqual(-1);
      expect(hot.getCellMeta(0, 4).className.indexOf('rangeBar')).toBeGreaterThan(-1);
      expect(hot.getCellMeta(0, 5).className.indexOf('rangeBar')).toBeGreaterThan(-1);
      expect(hot.getCellMeta(0, 6).className.indexOf('rangeBar')).toBeGreaterThan(-1);
      expect(hot.getCellMeta(0, 7).className.indexOf('rangeBar')).toBeGreaterThan(-1);
      expect(hot.getCellMeta(0, 8).className.indexOf('rangeBar')).toBeGreaterThan(-1);
      expect(hot.getCellMeta(0, 9).className.indexOf('rangeBar')).toBeGreaterThan(-1);
      expect(hot.getCellMeta(0, 10).className.indexOf('rangeBar')).toBeGreaterThan(-1);
      expect(hot.getCellMeta(0, 11).className.indexOf('rangeBar')).toBeGreaterThan(-1);
      expect(hot.getCellMeta(0, 12).className.indexOf('rangeBar')).toBeGreaterThan(-1);
      expect(hot.getCellMeta(0, 13).className.indexOf('rangeBar')).toBeGreaterThan(-1);
      expect((hot.getCellMeta(0, 14).className || '').indexOf('rangeBar')).toEqual(-1);

      expect((hot.getCellMeta(1, 13).className || '').indexOf('rangeBar')).toEqual(-1);
      expect(hot.getCellMeta(1, 14).className.indexOf('rangeBar')).toBeGreaterThan(-1);
      expect(hot.getCellMeta(1, 15).className.indexOf('rangeBar')).toBeGreaterThan(-1);
      expect(hot.getCellMeta(1, 16).className.indexOf('rangeBar')).toBeGreaterThan(-1);
      expect((hot.getCellMeta(1, 17).className || '').indexOf('rangeBar')).toEqual(-1);

      expect((hot.getCellMeta(2, 34).className || '').indexOf('rangeBar')).toEqual(-1);
      expect(hot.getCellMeta(2, 35).className.indexOf('rangeBar')).toBeGreaterThan(-1);
      expect(hot.getCellMeta(2, 36).className.indexOf('rangeBar')).toBeGreaterThan(-1);
      expect(hot.getCellMeta(2, 37).className.indexOf('rangeBar')).toBeGreaterThan(-1);
      expect(hot.getCellMeta(2, 38).className.indexOf('rangeBar')).toBeGreaterThan(-1);
      expect(hot.getCellMeta(2, 39).className.indexOf('rangeBar')).toBeGreaterThan(-1);
      expect(hot.getCellMeta(2, 40).className.indexOf('rangeBar')).toBeGreaterThan(-1);
      expect(hot.getCellMeta(2, 41).className.indexOf('rangeBar')).toBeGreaterThan(-1);
    });
  });
});
