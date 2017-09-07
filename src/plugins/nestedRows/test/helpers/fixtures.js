/* eslint-disable import/prefer-default-export */
export function getDataForNestedRows() {
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
          b: 'b0-b1',
          __children: [
            {
              a: 'a0-a1-a0',
              b: 'b0-b1-b0',
              __children: [
                {
                  a: 'a0-a1-a0-a0',
                  b: 'b0-b1-b0-b0'
                }
              ]
            }
          ]
        },
        {
          a: 'a0-a2',
          b: 'b0-b2'
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
