
describe("web-components ", function() {

  it('document.register should exist', function(){
    var componentsLoaded = false;
    document.addEventListener('DOMComponentsLoaded', function(){
      componentsLoaded = true;
    });

    runs(function(){
      var script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = '../src/document.register.js?d=' + new Date().getTime();
      document.getElementsByTagName('head')[0].appendChild(script);
    });

    waitsFor(function() {
      return componentsLoaded;
    }, "The document should be loaded", 1000);

    runs(function() {
      expect(document.register).toBeDefined();
    });
  });

  it('should fire created lifecycle event', function(){
    var created = false;
    document.register('x-foo', {
      lifecycle:{
        created: function(proto){
          created = true;
        }
      }
    });

    var foo = document.createElement('x-foo');

    waitsFor(function(){
      return created;
    }, "created should fire for new tag", 1000);

    runs(function(){
      expect(created).toEqual(true);
    });

  });

  it('should create an element with the same prototype of the newly created constructor', function(){
    var created = false;
    var XFoo = document.register('x-foo', {
      lifecycle:{
        created: function(proto){
          created = true;
        }
      }
    });

    var foo = new XFoo();

    expect(foo.constructor.prototype).toEqual(XFoo.prototype);
  });

  describe('using testbox', function(){
    var testBox;

    beforeEach(function(){
      testBox = document.getElementById('testbox');
    });

    afterEach(function(){
      testBox.innerHTML = "";
    });

    it('testbox should exist', function(){
      expect(testBox).toBeDefined();
    });

    it('should fire inserted lifecycle event when inserted', function(){

      var inserted = false;
      document.register('x-foo', {
        lifecycle:{
          inserted: function(){
            inserted = true;
          }
        }
      });

      var foo = document.createElement('x-foo');
      testBox.appendChild(foo);

      waitsFor(function(){
        return inserted;
      }, "inserted should fire", 1000);

      runs(function(){
        expect(inserted).toEqual(true);
        expect(document.getElementById('foo')).toBeDefined();

      });
    });

    it('should fire removed lifecycle event when removed', function(){

      var removed = false;
      document.register('x-foo', {
        lifecycle:{
          removed: function(){
            removed = true;
          }
        }
      });

      var foo = document.createElement('x-foo');
      testBox.appendChild(foo);
      testBox.removeChild(foo);

      waitsFor(function(){
        return removed;
      }, "removed should fire", 1000);

      runs(function(){
        expect(removed).toEqual(true);
        expect(document.getElementById('foo')).toBeNull();
      });
    });

    it('should fire attributeChanged lifecycle event', function(){

      var changed = false;
      document.register('x-foo', {
        lifecycle:{
          attributeChanged: function(attr, value, last){
            if (attr == 'bar' && value=='baz'){
              changed = true;
            }
          }
        }
      });

      var foo = document.createElement('x-foo');
      testBox.appendChild(foo);
      foo.setAttribute('bar','baz');

      waitsFor(function(){
        return changed;
      }, "changed should fire", 1000);

      runs(function(){
        expect(changed).toEqual(true);
      });

    });

    it('should fire elementreplace when ', function(){

      var elementreplaced = false;
      testbox.innerHTML = '<x-bar>herka durka</x-bar>';

      testbox.querySelector('x-bar').addEventListener('elementreplace', function(e){
        expect(e.upgrade).toBeDefined();
        // e.upgrade  new element
        // this old
        elementreplaced = true;
      });

      document.register('x-bar', {});

      waitsFor(function(){
        return elementreplaced;
      }, "changed should fire", 1000);

      runs(function(){
        expect(elementreplaced).toEqual(true);
      });

    });

    it('should fire elementupgrade on document', function(){

      var upgraded = false;
      testbox.innerHTML = '<x-bar2>herka durka</x-bar2>';

      var upgradeEvent = function(e){
        upgraded = true;
      };
      document.addEventListener('elementupgrade', upgradeEvent);
      document.register('x-bar2', {});

      waitsFor(function(){
        return upgraded;
      }, "changed should fire", 1000);

      runs(function(){
        expect(upgraded).toEqual(true);
        document.removeEventListener('elementupgrade',upgradeEvent);
      });

    });

    it('should fire created lifecycle event when set via innerHTML', function(){

      var created = false;
      document.register('x-foo', {
        lifecycle:{
          created: function(){
            created = true;
          }
        }
      });

      testBox.innerHTML = '<x-foo id="foo"></x-foo>';

      waitsFor(function(){
        return created;
      }, "created should fire", 1000);

      runs(function(){
        expect(created).toEqual(true);
        expect(document.getElementById('foo')).toBeDefined();

      });
    });

    it('should create a new element that has a toggle method', function(){

      var created = false;
      document.register('x-foo', {
        prototype: Object.create(window.HTMLDivElement.prototype, {
          toggle: {
            value: function(){
              return 'bar';
            }
          }
        })
      }, {
          toggle: {
            value: function(){
              return 'bar';
            }
          }
        });

      runs(function(){
        var foo = document.createElement('x-foo');
        expect(foo.toggle()).toEqual('bar');
      });
    });
  });
});