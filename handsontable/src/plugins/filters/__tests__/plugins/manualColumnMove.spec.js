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

  it('should maintain filter values after moving columns and adding new row (issue #11832)', async() => {
    handsontable({
      data: [
        ['Mar 27, 2023', 'Product A', 'Cycling Cap'],
        ['Oct 15, 2023', 'Product B', 'HL Mountain Shirt']
      ],
      colHeaders: ['Sold on', 'Product', 'Model'],
      dropdownMenu: true,
      manualColumnMove: true,
      filters: true,
      width: 500,
      height: 300
    });

    const manualColumnMove = getPlugin('manualColumnMove');

    // Move first column (Sold on) to third position, swapping with Model column
    manualColumnMove.moveColumn(0, 2);
    await render();

    // Filter the Model column (now at index 0) - select "Cycling Cap" and "HL Mountain Shirt"
    await dropdownMenu(0);

    // All should be checked by default, keep them checked
    await simulateClick(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input'));

    // Filter the Sold on column (now at index 2) - select the date values
    await dropdownMenu(2);

    // Keep all checked
    await simulateClick(dropdownMenuRootElement().querySelector('.htUIButton.htUIButtonOK input'));

    // Add a new row and set data
    const hot = getPlugin('filters').hot;

    await alter('insert_row_below', 1);
    hot.setDataAtRowProp(2, 0, 'Product C');
    hot.setDataAtRowProp(2, 1, 'Product C Name');
    hot.setDataAtRowProp(2, 2, 'Mar 27, 2023');

    await sleep(100);

    // Open the Sold on column filter again (at visual index 2)
    await dropdownMenu(2);

    // Check that the filter values are still visible and include the original dates
    const checkboxesAfter = byValueBoxRootElement().querySelectorAll('[type=checkbox]');
    const labels = Array.from(byValueBoxRootElement().querySelectorAll('label')).map(label => label.textContent.trim());

    // Should have at least the two original date values
    expect(labels).toContain('Mar 27, 2023');
    expect(labels).toContain('Oct 15, 2023');
    expect(checkboxesAfter.length).toBeGreaterThan(0);
  });
});
