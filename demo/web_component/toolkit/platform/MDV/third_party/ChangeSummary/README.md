ChangeSummary
=============

A library for observing JavaScript values which is built on top of Object.observe (http://wiki.ecmascript.org/doku.php?id=strawman:observe) and is capable of dirty-checking for changes if Object.observe isn't available. It supports observing Arrays, Objects and "Paths" (e.g. obj.foo.bar), .

Note
-----
This README is currently incomplete. It's lacks documentation about available API and important information about usage. More information coming soon...


Usage
-----
ChangeSummary exposes a high-level API, which is conceptually similar to the MutationSummary library (http://code.google.com/p/mutation-summary/).

    var observer = new ChangeSummary(function(summaries) {
      summaries.forEach(function(summary) {
        summary.object; // Object to which this summary describes changes which occurred.
        summary.added; // Object map: added property => new value.
        summary.removed // Object map: removed property => undefined.
        summary.changed // Object map: property whose value changed => new value.
        summary.splices; // An Array of objects, each of which describes a "splice", if Array.isArray(summary.object).
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

