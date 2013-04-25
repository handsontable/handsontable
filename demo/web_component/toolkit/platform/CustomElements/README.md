## Learn the tech

### Why Custom Elements?

Custom Elements let authors define their own elements. Authors associate JavaScript code with custom tag names, and then use those custom tag names as they would any standard tag.

For example, after registering a special kind of button called `super-button`, use the super button just like this:

    <super-button></super-button>

Custom elements are still elements. We can create, use, manipulate, and compose them just as easily as any standard `<div>` or `<span>` today.

### Basic usage

As with any element, custom elements can be created in JavaScript or declared.
**Their name must always contain a dash (-).**

#### Element registration

Before you can use a custom element, it needs to be registered using one of the following
methods. Otherwise, the browser considers it an <code>HTMLUnknownElement</code>.

##### &lt;element&gt;

The `<element>` tag provides a mechanism to encapsulate HTML, CSS, and JavaScript into reusable, encapsulated components.

Here's the declarative version of the previous example:

    <element name="x-foo">
      <section>
        I'm an x-foo!
      </section>
      <script>
        // When <element> is in document, we might run in wrong context.
        // Only do work when this == <element>.
        if (this !== window) {
          var section = this.querySelector('section');

          // Has built-in 'window' protection.
          this.register({
            prototype: {
              readyCallback: function() {
                this.innerHTML = section.innerHTML;
              },
              foo: function() {
                console.log('foo() called');
              }
            }
         });
        }
      </script>
    </element>

**Extending existing elements**

Using `<element>`, the prototype must be a simple object, but the `extends` attribute
can be used to extend existing DOM elements. The system chains the correct prototype
based the value of this attribute.
  
Example of extending `button`:

    <element name="x-foo" extends="button">

##### document.register()

To register a new custom element in JavaScript, invoke `document.register()` somewhere in the page.
As before, custom elements built this way work just like standard elements.

    var XFooPrototype = Object.create(HTMLElement.prototype);
    XFooPrototype.readyCallback = function() {
      this.textContent = "I'm an x-foo!";
    };
    XFooPrototype.foo = function() {
      console.log('foo() called');
    };

    var XFoo = document.register('x-foo', {
      prototype: XFooPrototype
    });

**Note:** the prototype must be chained to `HTMLElement.prototype` (i.e. `instanceof HTMLElement.prototype`).

**Extending existing elements**

If you want to inherit from a specialized form of `HTMLElement` (e.g. `HTMLButtonElement`),
declare the type using the `extends` option when calling `document.register()`:
  
Example extending `button`:
  
    var XFooPrototype = Object.create(HTMLButtonElement.prototype);
    XFooPrototype.readyCallback = function() {
      this.textContent = "I'm an x-foo!";
    };

    var XFoo = document.register('x-foo', {
      prototype: XFooPrototype,
      extends: 'button'
    });

#### Using a custom element

After registration, you can constructor an instance of your element just like
standard DOM elements:

    <x-foo></x-foo>

In the `document.register()` example above, `XFoo` was defined as the new element's constructor. Browser limitations require that we supply the constructor while you supply the prototype. Use the `readyCallback` to do initialization work that might otherwise be in the constructor.

    var xFoo = new XFoo();
    document.body.appendChild(xFoo);

    var xFoo2 = document.createElement('x-foo');
    xFoo2.foo(); // "foo() called"

## Polyfill details

### Getting Started

Include the `custom-elements.js` or `custom-elements.min.js` (minified) file in your project.

    <script src="CustomElements/custom-elements.js"></script>

`custom-elements.js` is the debug loader and uses `document.write` to load additional modules. 
Use the minified version (`custom-elements.min.js`) if you need to load the file dynamically.

### Polyfill Notes

The polyfill parses `<element>` tags and handles element upgrades _asynchronously_. To know when the polyfill has
finished all start up tasks, listen to the `WebComponentsReady` event on `document` or `window`.

Example:

    <script>
      // hide body to prevent FOUC
      document.body.style.opacity = 0;
      window.addEventListener('WebComponentsReady', function() {
        // show body now that everything is ready
        document.body.style.opacity = 1;
      });
    </script>

The Custom Elements specification is still under discussion. The polyfill implements certain features in advance of the specification. In particular, there are several notification callback methods that are used if implemented on the element prototype.

* `readyCallback()` is called when a custom element is created.
* `insertedCallback()` is called when a custom element is inserted into a DOM subtree.
* `removedCallback()` is called when a custom element is removed from a DOM subtree.
* `attributeChanged(attributeName)` is called when a custom element's attribute value has changed

`readyCallback` is invoked _synchronously_ with element instantiation, the other callbacks are called _asyncronously_. The asynchronous callbacks generally use the MutationObserver timing model, which means they are called before layouts, paints, or other triggered events, so the developer need not worry about flashing content or other bad things happening before the callback has a chance to react to changes.

The `extends` option to `document.register()` (discussed above)  is exclusive to this polyfill.

## Tools & Testing

For running tests or building minified files, consult the [tooling information](http://toolkitchen.github.com/tooling-strategy.html).
