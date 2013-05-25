describe('Ctrl+', function () {
  var id = 'testContainer';

  beforeEach(function () {
    this.$container = $('<div id="' + id + '"></div>').appendTo('body');
  });

  afterEach(function () {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

   var arrayOfArrays = function () {
    return [
      ["Year", "Kia", "", "Toyota", "Honda", "Innova", ""],
      ["2008", 10, 11, 12, 13, "",""],
      [null, 20, 11, "", 13, "",""],
      ["", 30, 15, 12, 13, "",""],
	  ["2010", 30, 15, 12, 13, "",""],
	  ["2010", 30, 15, 12, 13, "",""],
	  ["2010", 30, 15, 12, 13, "",""],
	  ["", 30, 15, 12, 13, ""]
    ];
  };

  it('should copy Year to whole columns', function () {
    handsontable({
      data: arrayOfArrays()
    });

	waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      selectCell(0, 0, 0, 0); 
	  var firstCellValue = getDataAtCell(0, 0);
	  
	  keyDownUp('ctrl+shift+end');
      expect(getSelected()).toEqual([0, 0, 7, 0]);
	  
	  keyDownUp('ctrl+d');
	  
      expect(getDataAtCell(1, 0)).toEqual(firstCellValue);
	  expect(getDataAtCell(2, 0)).toEqual(firstCellValue);
	  expect(getDataAtCell(3, 0)).toEqual(firstCellValue);
	  expect(getDataAtCell(4, 0)).toEqual(firstCellValue);
	  expect(getDataAtCell(5, 0)).toEqual(firstCellValue);
	  expect(getDataAtCell(6, 0)).toEqual(firstCellValue);
	  expect(getDataAtCell(7, 0)).toEqual(firstCellValue);

    });
  });
  
   it('shift+arorow_right/arrow_down/arrow_left/arrow_up moves tests', function () {
    handsontable({
      data: arrayOfArrays()
    });

	waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      selectCell(0, 0, 0, 0); 
	  
	  keyDownUp('ctrl+shift+arrow_right');
      expect(getSelected()).toEqual([0, 0, 0, 1]);
	  
	  keyDownUp('ctrl+shift+arrow_right');
      expect(getSelected()).toEqual([0, 0, 0, 3]);
	  
	  keyDownUp('ctrl+shift+arrow_right');
      expect(getSelected()).toEqual([0, 0, 0, 5]);
	  
	  keyDownUp('ctrl+shift+arrow_right');
      expect(getSelected()).toEqual([0, 0, 0, 6]);
	  
	  keyDownUp('ctrl+shift+arrow_down');
      expect(getSelected()).toEqual([0, 0, 1, 6]);
	  
	  keyDownUp('ctrl+shift+arrow_down');
      expect(getSelected()).toEqual([0, 0, 4, 6]);
	  
	  keyDownUp('ctrl+shift+arrow_down');
      expect(getSelected()).toEqual([0, 0, 6, 6]);
	  
	  keyDownUp('ctrl+shift+arrow_left');
      expect(getSelected()).toEqual([0, 0, 6, 5]);
	  
	  keyDownUp('ctrl+shift+arrow_left');
      expect(getSelected()).toEqual([0, 0, 6, 3]);
	  
	  keyDownUp('ctrl+shift+arrow_left');
      expect(getSelected()).toEqual([0, 0, 6, 1]);
	  
	  keyDownUp('ctrl+shift+arrow_left');
      expect(getSelected()).toEqual([0, 0, 6, 0]);
	  
	  keyDownUp('ctrl+shift+arrow_up');
      expect(getSelected()).toEqual([0, 0, 4, 0]);
	  
	  keyDownUp('ctrl+shift+arrow_up');
      expect(getSelected()).toEqual([0, 0, 1, 0]);
	  
	  keyDownUp('ctrl+shift+arrow_up');
      expect(getSelected()).toEqual([0, 0, 0, 0]);
	  
	  keyDownUp('ctrl+shift+arrow_up');
      expect(getSelected()).toEqual([0, 0, 0, 0]);
    });
  });
    it('arorow_up moves tests', function () {
    handsontable({
      data: arrayOfArrays()
    });

	waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      selectCell(7, 0, 7, 0); 
	  
	  keyDownUp('ctrl+arrow_up');
      expect(getSelected()).toEqual([6, 0, 6, 0]);
	  
	  keyDownUp('ctrl+arrow_up');
      expect(getSelected()).toEqual([4, 0, 4, 0]);
	  
	  keyDownUp('ctrl+arrow_up');
      expect(getSelected()).toEqual([1, 0, 1, 0]);
	  
	  keyDownUp('ctrl+arrow_up');
      expect(getSelected()).toEqual([0, 0, 0, 0]);
	  
	  keyDownUp('ctrl+arrow_up');
      expect(getSelected()).toEqual([0, 0, 0, 0]);
    });
  });
  it('arorow_left moves tests', function () {
    handsontable({
      data: arrayOfArrays()
    });

	waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      selectCell(2, 6, 2, 6); 
	  
	  keyDownUp('ctrl+arrow_left');
      expect(getSelected()).toEqual([2, 4, 2, 4]);
	  
	  keyDownUp('ctrl+arrow_left');
      expect(getSelected()).toEqual([2, 2, 2, 2]);
	  
	  keyDownUp('ctrl+arrow_left');
      expect(getSelected()).toEqual([2, 1, 2, 1]);
	  
	  keyDownUp('ctrl+arrow_left');
      expect(getSelected()).toEqual([2, 0, 2, 0]);
	  
	  keyDownUp('ctrl+arrow_left');
      expect(getSelected()).toEqual([2, 0, 2, 0]);
    });
  });
  
  it('arorow_down moves tests', function () {
    handsontable({
      data: arrayOfArrays()
    });

	waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      selectCell(0, 0, 0, 0); 
	  
	  keyDownUp('ctrl+arrow_down');
      expect(getSelected()).toEqual([1, 0, 1, 0]);
	  
	  keyDownUp('ctrl+arrow_down');
      expect(getSelected()).toEqual([4, 0, 4, 0]);
	  
	  keyDownUp('ctrl+arrow_down');
      expect(getSelected()).toEqual([6, 0, 6, 0]);
	  
	  keyDownUp('ctrl+arrow_down');
      expect(getSelected()).toEqual([7, 0, 7, 0]);
	  
	  keyDownUp('ctrl+arrow_down');
      expect(getSelected()).toEqual([7, 0, 7, 0]);
    });
  });
  
  it(' arorow_right moves tests', function () {
    handsontable({
      data: arrayOfArrays()
    });

	waitsFor(nextFrame, 'next frame', 60);

    runs(function () {
      selectCell(0, 0, 0, 0); 
	  
	  keyDownUp('ctrl+arrow_right');
      expect(getSelected()).toEqual([0, 1, 0, 1]);
	  
	  keyDownUp('ctrl+arrow_right');
      expect(getSelected()).toEqual([0, 3, 0, 3]);
	  
	  keyDownUp('ctrl+arrow_right');
      expect(getSelected()).toEqual([0, 5, 0, 5]);
	  
	  keyDownUp('ctrl+arrow_right');
      expect(getSelected()).toEqual([0, 6, 0, 6]);
	  
	  keyDownUp('ctrl+arrow_right');
      expect(getSelected()).toEqual([0, 6, 0, 6]);
    });
  });
});