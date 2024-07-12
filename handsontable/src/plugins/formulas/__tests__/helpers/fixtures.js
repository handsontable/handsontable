export const FORMULAS_DATE_FORMAT = 'YYYY-MM-DD';

/**
 * @returns {Array[]}
 */
export function getDataSimpleExampleFormulas() {
  return [
    ['=$B$2', 'Maserati', 'Mazda', 'Mercedes', 'Mini', '=A$1'],
    [2009, 0, 2941, 4303, 354, 5814],
    [2010, 5, 2905, 2867, '=SUM(A4,2,3)', '=$B1'],
    [2011, 4, 2517, 4822, 552, 6127],
    [2012, '=Sum(a2:a5)', '=SUM(B5,E3)', '=A2/B2', 12, '\'=SUM(E5)']
  ];
}

/**
 * @returns {Array[]}
 */
export function getDataAdvancedExampleFormulas() {
  /* eslint-disable */
  return [
    ['Example #1', '', '', '', '', '', '', ''],
    ['Text', 'yellow', 'red', 'blue', 'green', 'pink', 'gray', ''],
    ['Yellow dog on green grass', "=IF(ISNUMBER(SEARCH(B2, A3)), B2, \"\")", "=IF(ISNUMBER(SEARCH(C2, A3)), C2, \"\")", "=IF(ISNUMBER(SEARCH(D2, A3)), D2, \"\")", "=IF(ISNUMBER(SEARCH(E2, A3)), E2, \"\")", "=IF(ISNUMBER(SEARCH(F2, A3)), F2, \"\")", "=IF(ISNUMBER(SEARCH(G2, A3)), G2, \"\")", ''],
    ['Gray sweater with blue stripes', "=IF(ISNUMBER(SEARCH(B2, A4)), B2, \"\")", "=IF(ISNUMBER(SEARCH(C2, A4)), C2, \"\")", "=IF(ISNUMBER(SEARCH(D2, A4)), D2, \"\")", "=IF(ISNUMBER(SEARCH(E2, A4)), E2, \"\")", "=IF(ISNUMBER(SEARCH(F2, A4)), F2, \"\")", "=IF(ISNUMBER(SEARCH(G2, A4)), G2, \"\")", ''],
    ['A red sun on a pink horizon', "=IF(ISNUMBER(SEARCH(B2, A5)), B2, \"\")", "=IF(ISNUMBER(SEARCH(C2, A5)), C2, \"\")", "=IF(ISNUMBER(SEARCH(D2, A5)), D2, \"\")", "=IF(ISNUMBER(SEARCH(E2, A5)), E2, \"\")", "=IF(ISNUMBER(SEARCH(F2, A5)), F2, \"\")", "=IF(ISNUMBER(SEARCH(G2, A5)), G2, \"\")", ''],
    ['Blue neon signs everywhere', "=IF(ISNUMBER(SEARCH(B2, A6)), B2, \"\")", "=IF(ISNUMBER(SEARCH(C2, A6)), C2, \"\")", "=IF(ISNUMBER(SEARCH(D2, A6)), D2, \"\")", "=IF(ISNUMBER(SEARCH(E2, A6)), E2, \"\")", "=IF(ISNUMBER(SEARCH(F2, A6)), F2, \"\")", "=IF(ISNUMBER(SEARCH(G2, A6)), G2, \"\")", ''],
    ['Waves of blue and green', "=IF(ISNUMBER(SEARCH(B2, A7)), B2, \"\")", "=IF(ISNUMBER(SEARCH(C2, A7)), C2, \"\")", "=IF(ISNUMBER(SEARCH(D2, A7)), D2, \"\")", "=IF(ISNUMBER(SEARCH(E2, A7)), E2, \"\")", "=IF(ISNUMBER(SEARCH(F2, A7)), F2, \"\")", "=IF(ISNUMBER(SEARCH(G2, A7)), G2, \"\")", ''],
    ['Hot pink socks and gray socks', "=IF(ISNUMBER(SEARCH(B2, A8)), B2, \"\")", "=IF(ISNUMBER(SEARCH(C2, A8)), C2, \"\")", "=IF(ISNUMBER(SEARCH(D2, A8)), D2, \"\")", "=IF(ISNUMBER(SEARCH(E2, A8)), E2, \"\")", "=IF(ISNUMBER(SEARCH(F2, A8)), F2, \"\")", "=IF(ISNUMBER(SEARCH(G2, A8)), G2, \"\")", ''],
    ['Deep blue eyes', "=IF(ISNUMBER(SEARCH(B2, A9)), B2, \"\")", "=IF(ISNUMBER(SEARCH(C2, A9)), C2, \"\")", "=IF(ISNUMBER(SEARCH(D2, A9)), D2, \"\")", "=IF(ISNUMBER(SEARCH(E2, A9)), E2, \"\")", "=IF(ISNUMBER(SEARCH(F2, A9)), F2, \"\")", "=IF(ISNUMBER(SEARCH(G2, A9)), G2, \"\")", ''],
    ['Count of colors', '=COUNTIF(B3:B9, B2)', '=COUNTIF(C3:C9, C2)', '=COUNTIF(D3:D9, D2)', '=COUNTIF(E3:E9, E2)', '=COUNTIF(F3:F9, F2)', '=COUNTIF(G3:G9, G2)', '="SUM: "&SUM(B10:G10)'],
    ['', '', '', '', '', '', '', ''],
    ['Example #2', '', '', '', '', '', '', ''],
    ['Name', 'Email', 'Email domain', '', '', '', '', ''],
    ['Ann Chang', 'achang@maaker.com', '=RIGHT(B14, LEN(B14) - FIND("@", B14))', '', '', '', '', '', ''],
    ['Jan Siuk', 'jan@yahoo.com', '=RIGHT(B15, LEN(B15) - FIND("@", B15))', '', '', '', '', '', ''],
    ['Ken Siuk', 'ken@gmail.com', '=RIGHT(B16, LEN(B16) - FIND("@", B16))', '', '', '', '', '', ''],
    ['Marcin Kowalski', 'ken@syndex.pl', '=RIGHT(B17, LEN(B17) - FIND("@", B17))', '', '', '', '', '', ''],
  ];
}

/**
 * Returns fixed length dataset which can be extended.
 *
 * @param {number} row The row index from the "value" argument will injected.
 * @param {number} column The column index from the "value" argument will injected.
 * @param {Array} value The value that overwrites the dataset.
 * @returns {object[]}
 */
export function getDataForFormulas(row, column, value) {
  var data = [
    {
      id: 1,
      name: 'Nannie Patel',
      address: 'Jenkinsville',
      registered: '2014-01-29',
      eyeColor: {color: 'green'},
      balance: 1261.6,
      active: true,
    },
    {
      id: 2,
      name: 'Leanne Ware',
      address: 'Gardiner',
      registered: '2014-12-08',
      eyeColor: {color: 'blue'},
      balance: 2231.76,
      active: false,
    },
    {
      id: 3,
      name: 'Mathis Boone',
      address: 'Saranap',
      registered: '2015-04-11',
      eyeColor: {color: 'blue'},
      balance: 2930.58,
      active: true,
    },
    {
      id: 4,
      name: 'Cruz Benjamin',
      address: 'Cascades',
      registered: '2015-07-18',
      eyeColor: {color: 'green'},
      balance: 1621.93,
      active: false,
    },
    {
      id: 5,
      name: 'Reese David',
      address: 'Soham',
      registered: '2014-08-25',
      eyeColor: {color: 'green'},
      balance: 2998.15,
      active: true,
    },
    {
      id: 6,
      name: 'Ernestine Wiggins',
      address: 'Needmore',
      registered: '2014-03-13',
      eyeColor: {color: 'brown'},
      balance: 1800.03,
      active: true,
    },
    {
      id: 7,
      name: 'Chelsea Solomon',
      address: 'Alamo',
      registered: '2014-11-12',
      eyeColor: {color: 'green'},
      balance: 2450.68,
      active: false,
    },
    {
      id: 8,
      name: 'Vang Farmer',
      address: 'Canby',
      registered: '2014-01-08',
      eyeColor: {color: 'brown'},
      balance: 3869.5,
      active: false,
    },
    {
      id: 9,
      name: 'Mcintyre Clarke',
      address: 'Wakarusa',
      registered: '2014-06-28',
      eyeColor: {color: 'green'},
      balance: 3012.56,
      active: true,
    },
    {
      id: 10,
      name: 'Padilla Casey',
      address: 'Garberville',
      registered: '2015-08-16',
      eyeColor: {color: 'blue'},
      balance: 3472.56,
      active: false,
    },
    {
      id: 11,
      name: 'Hickman King',
      address: 'Yukon',
      registered: '2014-05-21',
      eyeColor: {color: 'brown'},
      balance: 2565.74,
      active: true,
    },
    {
      id: 12,
      name: 'Becky Ross',
      address: 'Layhill',
      registered: '2015-02-19',
      eyeColor: {color: 'brown'},
      balance: 2796.7,
      active: false,
    },
    {
      id: 13,
      name: 'Dina Randolph',
      address: 'Henrietta',
      registered: '2014-04-29',
      eyeColor: {color: 'blue'},
      balance: 3827.99,
      active: false,
    },
    {
      id: 14,
      name: 'Helga Mathis',
      address: 'Brownsville',
      registered: '2015-03-22',
      eyeColor: {color: 'brown'},
      balance: 3917.34,
      active: true,
    },
    {
      id: 15,
      name: 'Carissa Villarreal',
      address: 'Wildwood',
      registered: '2014-08-17',
      eyeColor: {color: 'green'},
      balance: 1181.55,
      active: true,
    },
    {
      id: 16,
      name: 'Lee Reed',
      address: 'Finderne',
      registered: '2014-02-23',
      eyeColor: {color: 'blue'},
      balance: 3623.74,
      active: true,
    },
    {
      id: 17,
      name: 'Bridges Sawyer',
      address: 'Bowie',
      registered: '2015-06-28',
      eyeColor: {color: 'green'},
      balance: 1792.36,
      active: false,
    },
    {
      id: 18,
      name: 'Gertrude Nielsen',
      address: 'Sidman',
      registered: '2015-04-18',
      eyeColor: {color: 'brown'},
      balance: 2356.96,
      active: false,
    },
    {
      id: 19,
      name: 'Patsy Mooney',
      address: 'Lund',
      registered: '2015-04-30',
      eyeColor: {color: 'blue'},
      balance: 1260,
      active: true,
    },
    {
      id: 20,
      name: 'Twila Goodman',
      address: 'Guilford',
      registered: '2014-04-05',
      eyeColor: {color: 'green'},
      balance: 3242.95,
      active: false,
    },
    {
      id: 21,
      name: 'Freda Robinson',
      address: 'Weeksville',
      registered: '2015-03-13',
      eyeColor: {color: 'brown'},
      balance: 3440.85,
      active: true,
    },
    {
      id: 22,
      name: 'Burt Cash',
      address: 'Coral',
      registered: '2014-03-14',
      eyeColor: {color: 'brown'},
      balance: 2367.56,
      active: true,
    },
    {
      id: 23,
      name: 'Mejia Osborne',
      address: 'Fowlerville',
      registered: '2014-05-24',
      eyeColor: {color: 'blue'},
      balance: 1852.34,
      active: false,
    },
    {
      id: 24,
      name: 'Greta Patterson',
      address: 'Bartonsville',
      registered: moment().add(-2, 'days').format(FORMULAS_DATE_FORMAT),
      eyeColor: {color: 'green'},
      balance: 2437.58,
      active: false,
    },
    {
      id: 25,
      name: 'Whitley Jordan',
      address: 'Driftwood',
      registered: '2015-03-04',
      eyeColor: {color: 'brown'},
      balance: 2493.11,
      active: true,
    },
    {
      id: 26,
      name: 'Stanton Britt',
      address: 'Nipinnawasee',
      registered: moment().add(-1, 'days').format(FORMULAS_DATE_FORMAT),
      eyeColor: {color: 'green'},
      balance: 3592.18,
      active: false,
    },
    {
      id: 27,
      name: 'Peterson Bowers',
      address: 'Nelson',
      registered: moment().add(-1, 'days').format(FORMULAS_DATE_FORMAT),
      eyeColor: {color: 'green'},
      balance: 3710.07,
      active: false,
    },
    {
      id: 28,
      name: 'Ferguson Nichols',
      address: 'Rossmore',
      registered: '2014-07-11',
      eyeColor: {color: 'blue'},
      balance: 3893.67,
      active: true,
    },
    {
      id: 29,
      name: 'Pearson Douglas',
      address: 'Esmont',
      registered: '2015-04-30',
      eyeColor: {color: 'blue'},
      balance: 3054.16,
      active: false,
    },
    {
      id: 30,
      name: 'Alice Blake',
      address: 'Kimmell',
      registered: '2014-05-31',
      eyeColor: {color: 'blue'},
      balance: 1769.95,
      active: false,
    },
    {
      id: 31,
      name: 'Ella Owen',
      address: 'Nutrioso',
      registered: '2014-07-09',
      eyeColor: {color: 'brown'},
      balance: 3366.37,
      active: true,
    },
    {
      id: 32,
      name: 'Long Mathews',
      address: 'Masthope',
      registered: moment().add(-1, 'days').format(FORMULAS_DATE_FORMAT),
      eyeColor: {color: 'green'},
      balance: 3379.52,
      active: false,
    },
    {
      id: 33,
      name: 'Molly Walton',
      address: 'Courtland',
      registered: '2015-03-20',
      eyeColor: {color: 'green'},
      balance: 1453.02,
      active: true,
    },
    {
      id: 34,
      name: 'Rocha Maddox',
      address: 'Machias',
      registered: moment().add(1, 'days').format(FORMULAS_DATE_FORMAT),
      eyeColor: {color: 'green'},
      balance: 3365.53,
      active: false,
    },
    {
      id: 35,
      name: 'Craft Keith',
      address: 'Summerfield',
      registered: moment().add(-3, 'days').format(FORMULAS_DATE_FORMAT),
      eyeColor: {color: 'blue'},
      balance: 3468.15,
      active: false,
    },
    {
      id: 36,
      name: 'Alyssa Francis',
      address: 'Nord',
      registered: moment().add(-2, 'days').format(FORMULAS_DATE_FORMAT),
      eyeColor: {color: 'blue'},
      balance: 3414.37,
      active: true,
    },
    {
      id: 37,
      name: 'Milagros Parsons',
      address: 'Dunlo',
      registered: moment().add(2, 'days').format(FORMULAS_DATE_FORMAT),
      eyeColor: {color: 'brown'},
      balance: 1230.63,
      active: false,
    },
    {
      id: 38,
      name: 'Heather Mcdaniel',
      address: 'Glenshaw',
      registered: '2014-12-15',
      eyeColor: {color: 'brown'},
      balance: 3259.04,
      active: true,
    },
    {
      id: 39,
      name: 'Everett James',
      address: 'Manitou',
      registered: moment().add(1, 'days').format(FORMULAS_DATE_FORMAT),
      eyeColor: {color: 'blue'},
      balance: 3347,
      active: false,
    }
  ];

  if (row !== undefined) {
    if (!Array.isArray(value)) {
      value = [value];
    }
    value.forEach(function(v, index) {
      data[row + index][column] = v;
    });
  }

  return data;
}

/**
 * @returns {object[]}
 */
export function getColumnsForFormulas() {
  return [
    {data: 'id', type: 'numeric', title: 'ID'},
    {data: 'name', type: 'text', title: 'Full name'},
    {data: 'address', type: 'text', title: 'Address'},
    {data: 'registered', type: 'date', title: 'Registered', dateFormat: FORMULAS_DATE_FORMAT},
    {data: 'eyeColor.color', type: 'dropdown', title: 'Eye color', source: ['blue', 'brown', 'green']},
    {data: 'balance', type: 'numeric', title: 'Balance', numericFormat: {pattern: '0,00.00 $'}},
    {data: 'active', type: 'checkbox', title: 'Active'},
  ];
}
