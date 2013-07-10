describe('persistentState', function () {
  var id = 'testContainer';

  beforeEach(function () {
    this.$container = $('<div id="' + id + '"></div>').appendTo('body');
  });

  afterEach(function () {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }

     window.localStorage.clear();
  });

  it("should run save function on given event", function () {
    var saved;
    handsontable({
      persistentState: {
         testRule: {
           hook: 'afterChange',
           save: function(storage){
             saved = true;
           },
           load: function(storage){}
         }
      }
    });

    expect(saved).toBeUndefined();

    setDataAtCell(0, 0, 'foo');

    expect(saved).toBe(true);

  });

  it("should run load function on init", function () {
    var loaded;

    expect(loaded).toBeUndefined();

    handsontable({
      persistentState: {
        testRule: {
          hook: 'afterChange',
          save: function(storage){},
          load: function(storage){
            loaded = true;
          }
        }
      }
    });


    setDataAtCell(0, 0, 'foo');
    expect(loaded).toBe(true);

  });

  it("should save data to local storage given event", function () {
    var globalStorage;
    handsontable({
      persistentState: {
        testRule: {
          hook: 'afterChange',
          save: function(storage){
            storage.saveValue('testKey', 100);
            globalStorage = storage; //assign to outer variable to test loadValue
          },
          load: function(storage){}
        }
      }
    });

    setDataAtCell(0, 0, 'foo');

    expect(globalStorage.loadValue('testKey')).toEqual(100);
  });

  it("should clear all the saved data", function () {
    var globalStorage;
    var hot = handsontable({
      persistentState: {
        testRule: {
          hook: 'afterChange',
          save: function(storage){
            storage.saveValue('testKey', 100);
            globalStorage = storage; //assign to outer variable to test loadValue
          },
          load: function(storage){}
        }
      }
    });

    setDataAtCell(0, 0, 'foo');

    expect(globalStorage.loadValue('testKey')).toEqual(100);

    hot.resetState();

    expect(globalStorage.loadValue('testKey')).toBeUndefined();

  });

});