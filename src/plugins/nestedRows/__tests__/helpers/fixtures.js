/**
 * @returns {object[]}
 */
export function getMoreComplexNestedData() {
  return [
    {
      a: 'a0',
      b: 'b0',
      __children: [
        {
          a: 'a0-a0',
          b: 'b0-b0'
        },
        {
          a: 'a0-a1',
          b: 'b0-b1'
        },
        {
          a: 'a0-a2',
          b: 'b0-b2',
          __children: [
            {
              a: 'a0-a2-a0',
              b: 'b0-b2-b0',
              __children: [
                {
                  a: 'a0-a2-a0-a0',
                  b: 'b0-b2-b0-b0'
                }
              ]
            }
          ]
        },
        {
          a: 'a0-a3',
          b: 'b0-b3'
        }
      ]
    },
    {
      a: 'a1',
      b: 'b1'
    },
    {
      a: 'a2',
      b: 'b2',
      __children: [
        {
          a: 'a2-a0',
          b: 'b2-b0',
          __children: []
        },
        {
          a: 'a2-a1',
          b: 'b2-b1',
          __children: [
            {
              a: 'a2-a1-a0',
              b: 'b2-b1-b0',
              __children: []
            },
            {
              a: 'a2-a1-a1',
              b: 'b2-b1-b1'
            }
          ]
        }
      ]
    }
  ];
}

/**
 * @returns {object[]}
 */
export function getSimplerNestedData() {
  return [
    {
      category: 'Best Rock Performance',
      artist: null,
      title: null,
      label: null,
      __children: [
        {
          title: 'Don\'t Wanna Fight',
          artist: 'Alabama Shakes',
          label: 'ATO Records'
        },
        {
          title: 'What Kind Of Man',
          artist: 'Florence & The Machine',
          label: 'Republic'
        },
        {
          title: 'Something From Nothing',
          artist: 'Foo Fighters',
          label: 'RCA Records'
        },
        {
          title: 'Ex\'s & Oh\'s',
          artist: 'Elle King',
          label: 'RCA Records'
        },
        {
          title: 'Moaning Lisa Smile',
          artist: 'Wolf Alice',
          label: 'RCA Records/Dirty Hit'
        }
      ]
    },
    {
      category: 'Best Metal Performance',
      __children: [
        {
          title: 'Cirice',
          artist: 'Ghost',
          label: 'Loma Vista Recordings'
        },
        {
          title: 'Identity',
          artist: 'August Burns Red',
          label: 'Fearless Records'
        },
        {
          title: '512',
          artist: 'Lamb Of God',
          label: 'Epic Records'
        },
        {
          title: 'Thank You',
          artist: 'Sevendust',
          label: '7Bros Records'
        },
        {
          title: 'Custer',
          artist: 'Slipknot',
          label: 'Roadrunner Records'
        }
      ]
    },
    {
      category: 'Best Rock Song',
      __children: [
        {
          title: 'Don\'t Wanna Fight',
          artist: 'Alabama Shakes',
          label: 'ATO Records'
        },
        {
          title: 'Ex\'s & Oh\'s',
          artist: 'Elle King',
          label: 'RCA Records'
        },
        {
          title: 'Hold Back The River',
          artist: 'James Bay',
          label: 'Republic'
        },
        {
          title: 'Lydia',
          artist: 'Highly Suspect',
          label: '300 Entertainment'
        },
        {
          title: 'What Kind Of Man',
          artist: 'Florence & The Machine',
          label: 'Republic'
        }
      ]
    }
  ];
}
