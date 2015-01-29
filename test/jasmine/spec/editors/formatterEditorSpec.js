describe('FormatterEditor', function () {
  var id = 'testContainer';

  var datetime_type = {
    pattern : '{{9999}}-{{99}}-{{99}} {{99}}:{{99}}',
    fromJstype : function(value) {

      function pad(num, size) {
        var s = num+"";
        while (s.length < size) s = "0" + s;
        return s;
      }
      //whet copy-paste, paste operation return value as string 
      //try convert string (Date.valueOf) to int 
      if (typeof(value) === 'string'){
        if (value === '') {
          return '';
        } else {
          value = Number(value);
        }
      }

      if (isNaN(value) ) {
        return '';
      }
      
      if (value === null || value === undefined) {
        return '';
      }
      value = new Date(value);
      var date_str = [String(value.getFullYear()), pad(value.getMonth() + 1, 2), pad(value.getDate(), 2)].join('-');
      var time_str = [pad(value.getHours(), 2), pad(value.getMinutes(),2)].join(':');

      return [date_str, time_str].join(' ');
    },
    toJstype : function(the_str ) {
    
      if (typeof(the_str) !== 'string'){
        return undefined;
      }
      var pattern = /\d\d\d\d-\d\d-\d\d\ \d\d:\d\d/i
      if (!pattern.test(the_str)){
        return undefined;
      }


      var date_time_str = the_str.split(' ');

      var date_str = date_time_str[0].split('-');

      var time_str = date_time_str[1].split(':')
      return new Date(
        Number(date_str[0]), 
        Number(date_str[1]-1), 
        Number(date_str[2]), 
        Number(time_str[0]), 
        Number(time_str[1]), 
        0).valueOf();
    }
  };

  beforeEach(function () {
    this.$container = $('<div id="' + id + '"></div>').appendTo('body');
  });

  afterEach(function () {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });
  
  var arrayOfObjects = function () {
    return [
      {
        dateType: "2015-01-01 01:00", 
        dateType2: "2015-01-01 01:00", 
      }
     
    ];
  };

  it("should convert string in format 'YYYY-MM-DD HH:MM' to a Date.valueOf() with the same value", function() {
    var onAfterValidate = jasmine.createSpy('onAfterValidate');

    hot = handsontable({
      data: arrayOfObjects(),
      columns: [
        { 
          data: 'dateType',
          type: 'formatter', 
          pattern : datetime_type.pattern,
          fromJstype : datetime_type.fromJstype,
          toJstype : datetime_type.toJstype
        }
       
      ],
      afterValidate: onAfterValidate
    });

    selectCell(0, 0);
    keyDown('enter');
    var editor = hot.getActiveEditor();
    editor.beginEditing();
    expect(editor.isOpened()).toBe(true);
    editor.TEXTAREA.value = '2015-01-01 00:00';
    expect(editor.getValue()).toEqual('2015-01-01 00:00');
    editor.finishEditing();

    runs(function () {
      expect(getDataAtCell(0, 0)).toEqual(new Date(2015, 0, 1, 0, 0, 0, 0).valueOf());
    });

  });

  it("should not convert string in format 'YYYY-MM-DD HH:MM' to a Date.valueOf() because in defenition of column pattern, fromJstype and toJstyp are equals undefined", function() {
    var onAfterValidate = jasmine.createSpy('onAfterValidate');

    hot = handsontable({
      data: arrayOfObjects(),
      columns: [
        { 
          data: 'dateType2',
          type: 'formatter', 

        },
       
      ],
      afterValidate: onAfterValidate
    });

    selectCell(0, 0);
    keyDown('enter');
    var editor = hot.getActiveEditor();
    editor.beginEditing();
    expect(editor.isOpened()).toBe(true);
    editor.TEXTAREA.value = '2015-01-01 00:00';
    expect(editor.getValue()).toEqual('2015-01-01 00:00');
    editor.finishEditing();

    runs(function () {
      expect(getDataAtCell(0, 0)).toEqual('2015-01-01 00:00');
    });
  });
});

