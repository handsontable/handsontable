ChangeSummary
=============

A utility library which depends upon the ECMAScript Object.observe strawman and exposes JS Data Path/Object/Array observation.

* Object.observe strawman: http://wiki.ecmascript.org/doku.php?id=strawman:observe

Dependencies
============

This library is only useful when run against a JavaScript implemention which includes support for the Object.observe strawman. A branch of Google's v8 JavaScript engine which includes Object.observe() is here (binaries of Chromium Mac/Win available):

* https://github.com/rafaelw/v8

Also, this library uses ECMAScript Maps and Sets. (With the above Chromium binaries, go to about://flags and select "Enable Experimental JavaScript").

Usage
-----
ChangeSummary uses Object.observe() under the covers and exposes a high-level API, which is conceptually similar to the MutationSummary library (http://code.google.com/p/mutation-summary/).

    var observer = new ChangeSummary(function(summaries) {
      summaries.forEach(function(summary) {
        summary.object; // Object to which this summary describes changes which occurred.
        summary.added; // Object map: added property => new value.
        summary.removed // Object map: removed property => undefined.
        summary.changed // Object map: property whose value changed => new value.
        summary.arraySplices; // An Array of objects, each of which describes a "splice", if Array.isArray(summary.object).
        summary.pathChanged; // Object map: path whose value changed => new value.
        summary.getOldValue(propertyOr{ath); // A function which returns previous value of the changed property or path.
      });
    })

    var obj {
      prop1: 1,
      prop2: 2
    };
    observer.observeObject(obj); // Will report any added, removed or changed properties on obj.

    var arr = [0, 1, 2];
    observer.observeArray(arr); // Will report "splice" mutations which represent changes to index properties of arr.

    var objGraph = {
      foo: {
        bar: 2
      }
    };
    var currentValue = observer.observePath(objGraph, 'foo.bar'); // Will report when the value at objGraph.foo.bar changes. If the value is ever
                                                                  // unreachable, the value is considered to be undefined.

Array "splice" changes
----------------------
If you ask the ChangeSummary to observePropertySet on an Array object (Array.isArray(obj) === true), it will report changes to index properties (e.g. arr[1], arr[2], etc... as opposed to arr['foo'] or arr.bar) as a series of "splice" changes which are contained in the summary.arraySplices array.

The reason for this is that, although JavaScript treats Arrays like a bag of properties, they are used very differently from regular objects. In particular, they represent an ordered sequence of elements. Consider the following:

    var arr = [0, 1, 2, 3];
    arr.unshift(-1); // arr === [-1, 0, 1, 2, 3];

In order to accomplish the unshift() operation, the JavaScript runtime is actually going to change the value of properties '0', '1', '2', '3' and then add a new property ('4') on arr. If you look at the output of Object.observe(arr) for the above operation, you will see this (in addition to the length property being changed). This isn't so useful. What's really wanted is to understand that a single element was inserted at position 0. That's what the arraySplices tells you.

Any change to an array can be represented by a series of splices (usually just one). A splice is just what it sounds like: "at index i, a series elements were removed and a series of elements were inserted." A splice object looks like this

    summary.arraySplices.forEach(function(splice) {
      splice.index; // the position in the array the change occurred
      splice.removed; // an array of elements which were removed from the array
      splice.addedCount; // the number of elements which were inserted.
    });

To make this concrete, the following code transforms a copy of the old state of an array into it's current state, given the set of splices which were reported:

    var arr = createRandomArray();
    var copy = arr.slice();

    var observer = new ChangeSummary(function(summaries) {
      var arraySummary = summaries[0];
      var splices = summaries[0].arraySplices;
      splices.forEach(function(splice) {
        var spliceArgs = [splice.index, splice.removed.length];
        var addIndex = splice.index;
        while (addIndex < splice.index + splice.addCount) {
          spliceArgs.push(arr[addIndex]);
          addIndex++;
        }

        Array.prototype.splice.apply(copy, spliceArgs);
      });
    });

    observer.observePropertySet(arr);

Observing accessor properties (getter/setters)
----------------------------------------------
The Object.observe() mechanism only reports changes in value to data properties of objects. If a property is configured to be an accessor, nothing is reported about assignments to that accessor.

It is up to the implementation of the accessor to notify when its value has changed. The ChangeSummary library assumes that any accessor which wishes to be observable does this and does it correctly. E.g.

    var obj = {
      id: 1
    };

    var name_ = '';
    Object.defineOwnProperty(obj, 'name', {
      get: function() { return name_; },
      set: function(name) {
        if (name_ == name)
          return;

        Object.getNotifier(this).notify({
          type: 'updated',
          name: 'name',
          oldValue: _name
        });
        name_ = name;
      }
    })

Background: Object.observe()
----------------------------
The proposed Object.observe() mechanism allows observation of mutations to JavaScript objects. It offers the following abilities:

* Find out when the value of a *data* property changes (changes accessor properties, e.g. getters/setters are not detected).
* Find out when an object has new properties added and existing properties deleted.
* Find out when existing properties are reconfigured.

The basic pattern of interaction is:

* Register an observer, which is just a function with Object.observe(myObj, callback). Sometime later, your callback will be invoked with an Array of change records, representing the in-order sequence of changes which occurred to myObj.

Details: "Sometime later?"
-----------------
Object.observe() in conceptually similar to DOM Mutation Observers (https://developer.mozilla.org/en-US/docs/DOM/DOM_Mutation_Observers), and delivery of change records happens with similar timing. The easiest way to think about this is that your change records will be delivered immediately after the current script invocation exits. In the browser context, this will most often be after each event handler fires. Delivery continues until there are no more observers with pending change records.

