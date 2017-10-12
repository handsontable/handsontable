import DateCalculator from '../dateCalculator';

let stdCache = null;
let disallowSplitWeeksCache = null;
beforeEach(() => {
  // eslint-disable-next-line
  stdCache = {'0':{'0':[1],'1':[2,3,4,5,6,7,8],'2':[9,10,11,12,13,14,15],'3':[16,17,18,19,20,21,22],'4':[23,24,25,26,27,28,29],'5':[30,31]},'1':{'6':[1,2,3,4,5],'7':[6,7,8,9,10,11,12],'8':[13,14,15,16,17,18,19],'9':[20,21,22,23,24,25,26],'10':[27,28]},'2':{'11':[1,2,3,4,5],'12':[6,7,8,9,10,11,12],'13':[13,14,15,16,17,18,19],'14':[20,21,22,23,24,25,26],'15':[27,28,29,30,31]},'3':{'16':[1,2],'17':[3,4,5,6,7,8,9],'18':[10,11,12,13,14,15,16],'19':[17,18,19,20,21,22,23],'20':[24,25,26,27,28,29,30]},'4':{'21':[1,2,3,4,5,6,7],'22':[8,9,10,11,12,13,14],'23':[15,16,17,18,19,20,21],'24':[22,23,24,25,26,27,28],'25':[29,30,31]},'5':{'26':[1,2,3,4],'27':[5,6,7,8,9,10,11],'28':[12,13,14,15,16,17,18],'29':[19,20,21,22,23,24,25],'30':[26,27,28,29,30]},'6':{'31':[1,2],'32':[3,4,5,6,7,8,9],'33':[10,11,12,13,14,15,16],'34':[17,18,19,20,21,22,23],'35':[24,25,26,27,28,29,30],'36':[31]},'7':{'37':[1,2,3,4,5,6],'38':[7,8,9,10,11,12,13],'39':[14,15,16,17,18,19,20],'40':[21,22,23,24,25,26,27],'41':[28,29,30,31]},'8':{'42':[1,2,3],'43':[4,5,6,7,8,9,10],'44':[11,12,13,14,15,16,17],'45':[18,19,20,21,22,23,24],'46':[25,26,27,28,29,30]},'9':{'47':[1],'48':[2,3,4,5,6,7,8],'49':[9,10,11,12,13,14,15],'50':[16,17,18,19,20,21,22],'51':[23,24,25,26,27,28,29],'52':[30,31]},'10':{'53':[1,2,3,4,5],'54':[6,7,8,9,10,11,12],'55':[13,14,15,16,17,18,19],'56':[20,21,22,23,24,25,26],'57':[27,28,29,30]},'11':{'58':[1,2,3],'59':[4,5,6,7,8,9,10],'60':[11,12,13,14,15,16,17],'61':[18,19,20,21,22,23,24],'62':[25,26,27,28,29,30,31]}};
  // eslint-disable-next-line
  disallowSplitWeeksCache = {'0':{'0':[26,27,28,29,30,31,1]},'1':{'1':[2,3,4,5,6,7,8],'2':[9,10,11,12,13,14,15],'3':[16,17,18,19,20,21,22],'4':[23,24,25,26,27,28,29]},'2':{'5':[30,31,1,2,3,4,5]},'3':{'6':[6,7,8,9,10,11,12],'7':[13,14,15,16,17,18,19],'8':[20,21,22,23,24,25,26]},'4':{'9':[27,28,1,2,3,4,5]},'5':{'10':[6,7,8,9,10,11,12],'11':[13,14,15,16,17,18,19],'12':[20,21,22,23,24,25,26]},'6':{'13':[27,28,29,30,31,1,2]},'7':{'14':[3,4,5,6,7,8,9],'15':[10,11,12,13,14,15,16],'16':[17,18,19,20,21,22,23],'17':[24,25,26,27,28,29,30]},'8':{'18':[1,2,3,4,5,6,7],'19':[8,9,10,11,12,13,14],'20':[15,16,17,18,19,20,21],'21':[22,23,24,25,26,27,28]},'9':{'22':[29,30,31,1,2,3,4]},'10':{'23':[5,6,7,8,9,10,11],'24':[12,13,14,15,16,17,18],'25':[19,20,21,22,23,24,25]},'11':{'26':[26,27,28,29,30,1,2]},'12':{'27':[3,4,5,6,7,8,9],'28':[10,11,12,13,14,15,16],'29':[17,18,19,20,21,22,23],'30':[24,25,26,27,28,29,30]},'13':{'31':[31,1,2,3,4,5,6]},'14':{'32':[7,8,9,10,11,12,13],'33':[14,15,16,17,18,19,20],'34':[21,22,23,24,25,26,27]},'15':{'35':[28,29,30,31,1,2,3]},'16':{'36':[4,5,6,7,8,9,10],'37':[11,12,13,14,15,16,17],'38':[18,19,20,21,22,23,24]},'17':{'39':[25,26,27,28,29,30,1]},'18':{'40':[2,3,4,5,6,7,8],'41':[9,10,11,12,13,14,15],'42':[16,17,18,19,20,21,22],'43':[23,24,25,26,27,28,29]},'19':{'44':[30,31,1,2,3,4,5]},'20':{'45':[6,7,8,9,10,11,12],'46':[13,14,15,16,17,18,19],'47':[20,21,22,23,24,25,26]},'21':{'48':[27,28,29,30,1,2,3]},'22':{'49':[4,5,6,7,8,9,10],'50':[11,12,13,14,15,16,17],'51':[18,19,20,21,22,23,24],'52':[25,26,27,28,29,30,31]}};
});

describe('DateCalculator', () => {
  describe('the `setYear` method', () => {
    it('should set the year as a base for calculations', () => {
      const plugin = new DateCalculator(2017);

      expect(plugin.year).toEqual(2017);
      plugin.setYear(2016);
      expect(plugin.year).toEqual(2016);
    });
  });

  describe('the `setFirstWeekDay` method', () => {
    it('should set the first week day', () => {
      const plugin = new DateCalculator(2017);

      expect(plugin.firstWeekDay).toEqual('monday');
      plugin.setFirstWeekDay('sunday');
      expect(plugin.firstWeekDay).toEqual('sunday');
    });

    it('should throw a warning if setting the first week day to something else than `monday` or `sunday`', () => {
      const plugin = new DateCalculator(2017);
      spyOn(global.console, 'warn');

      plugin.setFirstWeekDay('Dean Corso');

      expect(global.console.warn).toHaveBeenCalledWith('First day of the week must be set to either Monday or Sunday');
    });
  });

  describe('the `parseDate` method', () => {
    it('should return a Date object if the provided date string is valid and null if it\'s invalid', () => {
      const plugin = new DateCalculator(2017);

      expect(plugin.parseDate('01/01/2017') instanceof Date).toBe(true);
      expect(plugin.parseDate('01/31/2017') instanceof Date).toBe(true);
      expect(plugin.parseDate('31/01/2017') instanceof Date).toBe(false);
      expect(plugin.parseDate('31/01/2017')).toEqual(null);
    });

    it('should return a Date object if the provided date object is valid and null if it\'s invalid', () => {
      const plugin = new DateCalculator(2017);

      expect(plugin.parseDate(new Date()) instanceof Date).toBe(true);
      expect(plugin.parseDate({}) instanceof Date).toBe(false);
      expect(plugin.parseDate({})).toEqual(null);
    });
  });

  describe('the `dateToColumn` method', () => {
    it('should return a column for a provided date (in string or Date format), when `allowSplitWeeks` is set to true (default)', () => {
      const plugin = new DateCalculator(2017);

      // mock the day cache creation from the actual plugin:
      plugin.daysInColumns = stdCache;

      expect(plugin.dateToColumn('03/16/2017')).toEqual(13);
      expect(plugin.dateToColumn('06/16/2017')).toEqual(28);
      expect(plugin.dateToColumn(new Date('06/16/2017'))).toEqual(28);
    });

    it('should return a column for a provided date (in string or Date format), when `allowSplitWeeks` is set to false', () => {
      const plugin = new DateCalculator(2017, false);

      // mock the day cache creation from the actual plugin:
      plugin.daysInColumns = disallowSplitWeeksCache;

      expect(plugin.dateToColumn('03/16/2017')).toEqual(11);
      expect(plugin.dateToColumn('06/16/2017')).toEqual(24);
      expect(plugin.dateToColumn(new Date('06/16/2017'))).toEqual(24);
    });
  });

  describe('the `getWeekColumn` method', () => {
    it('should return a week column index for the provided day and month', () => {
      const plugin = new DateCalculator(2017);


      // mock the day cache creation from the actual plugin:
      plugin.daysInColumns = stdCache;

      expect(plugin.getWeekColumn(15, 2)).toEqual(13);
      expect(plugin.getWeekColumn(15, 5)).toEqual(28);
    });

    it('should return a week column index for the provided day and month, when `allowSplitWeeks` is set to false', () => {
      const plugin = new DateCalculator(2017, false);

      // mock the day cache creation from the actual plugin:
      plugin.daysInColumns = disallowSplitWeeksCache;

      expect(plugin.getWeekColumn(15, 2)).toEqual(11);
      expect(plugin.getWeekColumn(15, 5)).toEqual(24);
    });
  });

  describe('the `getMonthCacheArray` method', () => {
    it('should get the cached information for the provided month', () => {
      const plugin = new DateCalculator(2017);

      // mock the day cache creation from the actual plugin:
      plugin.daysInColumns = stdCache;

      expect(plugin.getMonthCacheArray(2)).toEqual(JSON.parse('[{"11":[1,2,3,4,5],"12":[6,7,8,9,10,11,12],"13":' +
        '[13,14,15,16,17,18,19],"14":[20,21,22,23,24,25,26],"15":[27,28,29,30,31]}]'));
    });
  });

  describe('the `columnToDate` method', () => {
    it('should return a Date object for the provided column index, if the column represents a single date', () => {
      const plugin = new DateCalculator(2017);

      // mock the day cache creation from the actual plugin:
      plugin.daysInColumns = stdCache;

      const date = plugin.columnToDate(0);
      const properDate = new Date('01/01/2017');
      expect(date.getUTCMonth()).toEqual(properDate.getUTCMonth());
      expect(date.getUTCDate()).toEqual(properDate.getUTCDate());
      expect(date.getUTCFullYear()).toEqual(properDate.getUTCFullYear());
    });

    // TODO: change the API to work like in the description below
    xit('should return an object with `start` and `end` properties representing a range of dates', () => {
      const plugin = new DateCalculator(2017);
    });
  });

  describe('the `isOnTheEdgeOfWeek` method', () => {
    it('should check whether the provided date is on the edge of the week', () => {
      const plugin = new DateCalculator(2017);

      // mock the day cache creation from the actual plugin:
      plugin.daysInColumns = stdCache;

      expect(JSON.stringify(plugin.isOnTheEdgeOfWeek('01/02/2017'))).toEqual('[1,0]');
      expect(JSON.stringify(plugin.isOnTheEdgeOfWeek('10/22/2017'))).toEqual('[0,1]');
      expect(JSON.stringify(plugin.isOnTheEdgeOfWeek('10/20/2017'))).toEqual('false');
    });
  });

  describe('the `addDaysToCache` method', () => {
    it('should update the plugin cache with the provided information', () => {
      const plugin = new DateCalculator(2017);

      plugin.addDaysToCache(0, 0, 1, 5);
      plugin.addDaysToCache(0, 3, 10, 15);
      plugin.addDaysToCache(3, 1, 2, 7);
      plugin.addDaysToCache(3, 3, 20, 25);

      const expectedCache = {
        0: {
          0: [1, 2, 3, 4, 5],
          3: [10, 11, 12, 13, 14, 15],
        },
        3: {
          1: [2, 3, 4, 5, 6, 7],
          3: [20, 21, 22, 23, 24, 25]
        }
      };

      expect(JSON.stringify(plugin.daysInColumns)).toEqual(JSON.stringify(expectedCache));
    });
  });

  describe('the `isValidRangeBarData` method', () => {
    it('should check whether the provided start and end dates are valid, to create a range bar', () => {
      const plugin = new DateCalculator(2017);

      expect(plugin.isValidRangeBarData(new Date('02/03/2017'), new Date('03/02/2017'))).toEqual(true);
      expect(plugin.isValidRangeBarData(new Date('03/13/2017'), new Date('12/02/2017'))).toEqual(true);
      expect(plugin.isValidRangeBarData(new Date('12/02/2017'), new Date('03/13/2017'))).toEqual(false);
    });
  });

  describe('the `calculateMonthData` method', () => {
    it('should return the object containing information about all the months', () => {
      const plugin = new DateCalculator(2017);
      const expectedResult = [
        {name: 'January', days: 31},
        {name: 'February', days: 28},
        {name: 'March', days: 31},
        {name: 'April', days: 30},
        {name: 'May', days: 31},
        {name: 'June', days: 30},
        {name: 'July', days: 31},
        {name: 'August', days: 31},
        {name: 'September', days: 30},
        {name: 'October', days: 31},
        {name: 'November', days: 30},
        {name: 'December', days: 31}
      ];

      expect(JSON.stringify(plugin.calculateMonthData())).toEqual(JSON.stringify(expectedResult));
    });
  });

  describe('the `calculateWeekStructure` method', () => {
    it('should modify the `monthList` property of the plugin with the month/week structure', () => {
      const plugin = new DateCalculator(2017);

      // mock the day cache creation from the actual plugin:
      plugin.daysInColumns = stdCache;

      plugin.calculateWeekStructure();

      let monthList = plugin.monthList;
      expect(monthList[0].name).toEqual('January');
      expect(monthList[0].days).toEqual(31);
      expect(monthList[0].daysBeforeFullWeeks).toEqual(1);
      expect(monthList[0].daysAfterFullWeeks).toEqual(2);
      expect(monthList[0].fullWeeks).toEqual(4);
      expect(monthList[11].name).toEqual('December');
      expect(monthList[11].days).toEqual(31);
      expect(monthList[11].daysBeforeFullWeeks).toEqual(3);
      expect(monthList[11].daysAfterFullWeeks).toEqual(0);
      expect(monthList[11].fullWeeks).toEqual(4);
    });

    it('should modify the `monthList` property of the plugin with the month/week structure, with `allowSplitWeeks` disabled', () => {
      const plugin = new DateCalculator(2017, false);

      // mock the day cache creation from the actual plugin:
      plugin.daysInColumns = disallowSplitWeeksCache;

      plugin.calculateWeekStructure();

      let monthList = plugin.monthList;
      expect(monthList[0].name).toEqual('Dec/Jan');
      expect(monthList[0].days).toEqual(7);
      expect(monthList[0].daysBeforeFullWeeks).toEqual(0);
      expect(monthList[0].daysAfterFullWeeks).toEqual(0);
      expect(monthList[0].fullWeeks).toEqual(1);
      expect(monthList[1].name).toEqual('January');
      expect(monthList[1].days).toEqual(31);
      expect(monthList[1].daysBeforeFullWeeks).toEqual(1);
      expect(monthList[1].daysAfterFullWeeks).toEqual(2);
      expect(monthList[1].fullWeeks).toEqual(4);
      expect(monthList[11].name).toEqual('Jun/Jul');
      expect(monthList[11].days).toEqual(7);
      expect(monthList[11].daysBeforeFullWeeks).toEqual(0);
      expect(monthList[11].daysAfterFullWeeks).toEqual(0);
      expect(monthList[11].fullWeeks).toEqual(1);
    });
  });
});
