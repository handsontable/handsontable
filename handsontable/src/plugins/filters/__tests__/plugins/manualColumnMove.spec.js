describe('Filters UI cooperation with ManualColumnMove', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should work as expected after actions sequence: filtering column by value -> moving the column -> ' +
     'filtering any other column by value', async() => {
    handsontable({
      data: [
        {
          id: 1,
          name: 'Nannie Patel',
          address: 'BBB City'
        },
        {
          id: 2,
          name: 'Leanne Ware',
          address: 'ZZZ City'
        },
        {
          id: 3,
          name: 'Mathis Boone',
          address: 'CCC City'
        },
        {
          id: 4,
          name: 'Heather Mcdaniel',
          address: 'DDD City'
        }
      ],
      columns: [
        { data: 'id', type: 'numeric', title: 'ID' },
        { data: 'name', type: 'text', title: 'Full name' },
        { data: 'address', type: 'text', title: 'Address' }
      ],
      dropdownMenu: true,
      manualColumnMove: true,
      filters: true,
      width: 500,
      height: 300
    });

    const manualColumnMove = getPlugin('manualColumnMove');

    // filtering first value of column (deselecting checkbox)
    await dropdownMenu(0);

    await simulateClick(byValueBoxRootElement().querySelector('tr:nth-child(1) [type=checkbox]'));
    await simulateClick(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input'));

    // moving column
    manualColumnMove.moveColumn(0, 1);
    await render();

    // filtering first value of column (deselecting checkbox)
    await dropdownMenu(2);

    await simulateClick(byValueBoxRootElement().querySelector('tr:nth-child(1) [type=checkbox]'));
    await simulateClick(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input'));

    expect(getData().length).toBe(2);
  });

  it('should work as expected after actions sequence: filtering column by value -> moving the column -> ' +
    'filtering the column by value ', async() => {
    handsontable({
      data: [
        {
          id: 1,
          name: 'Nannie Patel',
          address: 'BBB City'
        },
        {
          id: 2,
          name: 'Leanne Ware',
          address: 'ZZZ City'
        },
        {
          id: 3,
          name: 'Mathis Boone',
          address: 'CCC City'
        },
        {
          id: 4,
          name: 'Heather Mcdaniel',
          address: 'DDD City'
        }
      ],
      columns: [
        { data: 'id', type: 'numeric', title: 'ID' },
        { data: 'name', type: 'text', title: 'Full name' },
        { data: 'address', type: 'text', title: 'Address' }
      ],
      dropdownMenu: true,
      manualColumnMove: true,
      filters: true,
      width: 500,
      height: 300
    });

    const manualColumnMove = getPlugin('manualColumnMove');

    // filtering first value of column (deselecting checkbox)
    await dropdownMenu(0);

    await simulateClick(byValueBoxRootElement().querySelector('tr:nth-child(1) [type=checkbox]'));
    await simulateClick(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input'));

    // moving column
    manualColumnMove.moveColumn(0, 1);
    await render();

    // filtering second value of column (deselecting checkbox)
    await dropdownMenu(1);

    await simulateClick(byValueBoxRootElement().querySelector('tr:nth-child(2) [type=checkbox]'));
    await simulateClick(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input'));

    expect(getData().length).toEqual(2);
  });
});
