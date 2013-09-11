# Handsontable Editors
Handsontable separates the process of displaying the cell value from the process of changing the value.
Renderers are responsible for presenting the data and Editors helps altering it. As render has only one simple task:
*get actual value of the cell and return its representation as a HTML code* they can be a single function.
Editors, however, need to handle user input (that is, mouse and keyboard events),
validate data and behave according to validation results, so putting all those functionalities into a single function
wouldn't be a good idea. That's why Handsontable editors are represented by editor classes.

In Handsontable 1.0.0 we have rewritten most of the editors module to make it (hopefully) more understandable, predictable
and easier to extend. This tutorial will give you a comprehensive knowledge about how the whole process of cell edition works,
 how Handsontable Core manages editors, how editor life cycle looks like and finally, how to create your own editors.

## EditManager
`Handsontable.EditManager` is a class responsible for handling all editors available in Handsontable. If `Handsontable.Core` needs
to interact with editors it uses `Handsontable.EditManager` object. `Handsontable.EditManager` object is instantiated
in `init()` method which is run, after you invoke `handsontable()` constructor for the first time. The reference for `Handsontable.EditManager`
object is kept private in Handsontable instance and you cannot access it. However, there are ways to alter the default
behaviour of `Handsontable.EditManager`, more on that later.

### EditManager tasks
`EditManager` has 4 main tasks:

* selecting proper editor for an active cell
* preparing editor to be displayed
* displaying editor (based on user behaviour)
* closing editor (based on user behaviour).

We will discuss each of those tasks in detail.

#### Selecting proper editor for an active cell
When user selects a cell `EditManager` finds the editor class assigned to this cell, examining the value of `editor` property.
You can define `editor` property globally (for all cells in table), per column (for all cells in column) or for each cell
individually. For more details see [How cascading configuration works](https://github.com/warpech/jquery-handsontable/wiki/Options#how-does-cascading-configuration-work).

//TODO: add link to registering editors

The value of `editor` property can be either a string representing an editor (such as 'text', 'autocomplete', 'checkbox' etc.),
or an editor class. `EditManager` will then get an instance of editor class and the first very important thing to remember is:
**there is always one instance of certain editor class in a single table**, in other words each editor class object
 **is a singleton** within a single table, which means that it's constructor will be invoked only once per table.
 If you have 3 tables on a page, each table will have its own instance of editor class.
 This has some important implications that you have to consider creating your own editor.

#### Preparing editor to be displayed
When `EditManager` obtain editor class instance (editor object) it invokes its `prepare` method. The `prepare` method
sets editor objects properties related to the selected cell, but does not display the editor. `prepare` is called each time
user selects a cell. In some cases it can be invoked multiple times for the same cell, without changing the selection.

#### Displaying editor
When editor is prepared the `EditManager` waits for user event that triggers cell edition. Those events are:

* pressing <kbd>ENTER</kbd>
* double clicking cell
* pressing <kbd>F2</kbd>

If any of those events is triggered, `EditManager` calls editor's `beginEditing()` method, which should display the editor.

#### Closing editor
When editor is opened the `EditManager` waits for user event that should end cell edition. Those events are:

* clicking on another cell (saves changes)
* pressing <kbd>ENTER</kbd> (saves changes)
* pressing <kbd>ESC</kbd> (abort changes)
* pressing <kbd>ARROW_UP</kbd>, <kbd>ARROW_DOWN</kbd>, <kbd>ARROW_LEFT</kbd>, <kbd>ARROW_RIGHT</kbd> (saves changes)
* pressing <kbd>TAB</kbd> (saves changes)
* pressing <kbd>HOME</kbd>, <kbd>END</kbd> (saved changes)
* pressing <kbd>PAGE_UP</kbd>, <kbd>PAGE_DOWN</kbd> (saved changes)

If any of those events is triggered, `EditManager` calls editor's `finishEditing()` method, which should try to save changes
(unless <kbd>ESC</kbd> key has been pressed) and close the editor.

### Overriding EditorManager default behaviour
You may want to change the default events that causes editor to open or close. For example, your editor might use
<kbd>ARROW_UP</kbd> and <kbd>ARROW_DOWN</kbd> events to perform some actions (for example increasing or decreasing cell value)
and you don't want `EditManager` to close the editor when user press those keys. That's why `EditManager` runs `beforeKeyDown`
hook before processing user events. If you register a listener for `beforeKeyDown`, that call `stopImmediatePropagation()`
on `event` object `EditManager` won perform its default action. More on overriding `EditorManager`'s behaviour in section
"SelectEditor - creating editor from scratch".

You should now have a better understanding on how `EditManager` works. Let's go a bit deeper and see what methods every
editor class must implement and what those methods do.

## BaseEditor
`Handsontable.editors.BaseEditor` is an abstract class from which all editor classes should inherit.
It implements some of the basic editor methods as well as declares some methods that should be implemented by each editor class.
In this section we examine all of those methods.

### Common methods
Common methods, are methods implemented by `BaseEditor` class. They contain some core logic that every editor should have.
Most of the time, you shouldn't bother with those methods.
However, if you are creating some more complex editors, you might want to override some of the common methods, in which case you should always
invoke the original method and then perform other operations, specific to your editor.

**Example** - overriding common method

```javascript
//CustomEditor is a class function, inheriting form BaseEditor
CustomEditor.prototype.prepare = function(row, col, prop, td, originalValue, cellProperties){
  //Invoke the original method...
  Handsontable.editors.BaseEditor.prototype.prepare.apply(this, arguments);

  //...and then do some stuff specific to your CustomEditor
  this.customEditorSpecificProperty = 'foo';

};
```

There are 7 common methods. All of them are described below.

#### prepare(row: `Number`, col: `Number`, prop: `String`, td: `HTMLTableCellElement`, cellProperties: `Object`)
Prepares editor to be displayed for given cell. Sets most of the instance properties.

Returns: `undefined`

#### beginEditing(initialValue: 'String' *[optional]* )
Sets editor value to `initialValue`. If `initialValue` is undefined, the editor value is set to original cell value.
Calls `open()` method internally.

Returns: `undefined`

#### finishEditing(revertToOriginal: 'Boolean' *[optional]*, ctrlDown: `Boolean` *[optional]* )
Tries to finish cell edition. Calls `saveValue()` and `discardEditor()` internally.
If `revertToOriginal` is set to `true` cell value is being set to its original value (from before the edition).
`ctrlDown` value is passed to `saveValue()` as the second argument.

Returns: `jQuery Promise` - if new value is valid or `allowInvalid` property is set to true the promise is *resolved*,
otherwise the promise is *rejected*.

For more information about jQuery Promises see [jQuerry deffered object documentation](http://api.jquery.com/category/deferred-object/)

#### discardEditor(deferred: `jQuery Deferred`, validationResult: `Boolean`)
Called when cell validation ends. If new value is saved successfully (`validationResult` is set to `true` or `allowInvalid` property is `true`)
it calls `close()` method, otherwise calls `focus()` method and keeps editor opened.

Returns: `undefined`

#### saveValue(val: `Mixed`, ctrlDown: `Boolean`)
Tries to save `val` as new cell value. Performs validation internally. If `ctrlDown` is set to true the new value will be set to all selected cells.

Returns: `undefined`

#### isOpened()
Returns `true` if editor is opened or `false` if editor is closed. Editor is considered to be opened after `open()` has been called.
 Editor is considered closed `close()` after method has been called.

Returns: `Boolean`

#### extend()
Returns: `Function` - a class function that inherits from the current class. The `prototype` methods of the returned class can be safely
 overwritten, without a danger of altering parent's `prototype`.

**Example** - inheriting from `BaseEditor` and overriding its method

```javascript
var CustomEditor = Handsontable.editors.BaseEditor.prototype.extend();

//This won't alter BaseEditor.prototype.beginEditing()
CustomEditor.prototype.beginEditing = function(){};
```

**Example** - inheriting from another editor
```javascript
var CustomTextEditor = Handsontable.editors.TextEditor.prototype.extend();

//CustomTextEditor uses all methods implemented by TextEditor.
//You can safely override any method without affecting original TextEditor.
```

**Note:** This is an utility method not related to the process of editing cell.

### Editor specific methods
Editor specific methods are methods not implemented in `BaseEditor`. In order to work, every editor class has to
implement those methods.

#### init()
Method called when new instance of editor class is created. That happens at most once per table instance, as all used
editors as **singletons** within table instance. You should use this methods to perform tasks which results can be reused
during editor's lifecycle. The most common operation is creating HTML structure of editor.

Method does not need to return any value.

#### val(newValue: 'Mixed' *[optional]* )
If invoked without any arguments, method should act like a getter, returning the current editor value, that is value that
should be saved as a new cell value.

If invoked with `newValue` argument, method should act like a setter and set editor value to `newValue`.
When acting like setter, method does not need to return any value.

**Example**
Let's say we are implementing a DateEditor, which helps selecting date, by displaying a calendar.
`val()` method could work like so:

```javascript
CalendarEditor.prototype.val = function(newValue){
    if(typeof newValue == 'undefined'){
      return calendar.getDate(); //returns currently selected date, for example "2013/09/15"
    } else {
      calendar.highlightDate(newValue); //highlights given date on calendar
    }
}
```
#### open()
Displays the editor. In most cases this method can be as simple as:

```javascript
CustomEditor.prototype.open = function(){
    this.editorDiv.show();
};
```

This method does need to return any value.

#### close()
Hides the editor after cell value has been changed.  In most cases this method can be as simple as:

```javascript
CustomEditor.prototype.close = function(){
    this.editorDiv.hide();
};
```

This method does need to return any value.


#### focus()
Focuses the editor. This method is called when user wants to close the editor by selecting another cell and the value
in editor does not validate (and `allowInvalid` is `false`).   In most cases this method can be as simple as:

```javascript
CustomEditor.prototype.focus = function(){
    this.editorInput.focus();
};
```

This method does need to return any value.

### Common editor properties
All of the undermentioned properties are available in editor instance through `this` object (e.g. `this.instance`).

#### instance `Object:Handsontable.Core'
The instance of Handsontable to which this editor object belongs. Set in class constructor, immutable thorough the
whole lifecycle of editor.

#### row `Number`
The active cell row index. Updated on every `prepare()` method call.

#### col `Number`
The active cell col index. Updated on every `prepare()` method call.

#### prop `String`
The property name associated with active cell (relevant only when data source is an array of objects).
Updated on every `prepare()` method call.

#### TD `HTMLTableCellNode`
Node object of active cell. Updated on every `prepare()` method call.

#### cellProperties 'Object'
An object representing active cell properties. Updated on every `prepare()` method call.


## How to create a custom editor?
Now you now all the philosophy behind Handsontable editors and you're ready to write your own editor.
Basically, you can build a new editor from scratch, by creating a new editor class, which inherits form `BaseEditor`, or
if you just want to enhance an existing editor, you can extend its class and override only a few of its methods.

In this tutorial we will examine both approaches.
We will create a completely new `SelectEditor` which uses `<select>` list to alter the value of cell.
We will also create a `PasswordEditor` which works exactly like regular `TextEditor` except that it displays a password
input instead of textarea.

Let's begin with `PasswordEditor` as it is a bit easier.

### `PasswordEditor` - extending an existing editor
`TextEditor` is the most complex editor available in Handsontable by default. It displays a `<textarea>` which automatically
change its size to accommodate to its content. We would like to create a `PasswordEditor` which preserves all those capabilities
but displays `<input type="password" />` field instead of `<textarea>`.

As you may have guessed, we need to create a new editor class, that inherits from `TextEditor` and then override some of its
methods to replace `<textarea>` with `input:password`. Luckily, textarea and password input have the same API, so all we
have to do is replace the code responsible for creating HTML elements. If you take a look at TextEditor `init()` method,
you'll notice that it calls internal `createElements()` method, which creates `<textarea>` node and append it to DOM during
editor initialization - BINGO!.

Here is the code
```javascript
var PasswordEditor = Handsontable.editors.TextEditor.prototype.extend();

PasswordEditor.prototype.createElements = function () {

    //Call the original createElements method
    Handsontable.editors.TextEditor.prototype.createElements.apply(this, arguments);

    //Create password input and update relevant properties
    this.INPUT = document.createElement('input');
    this.INPUT.setAttribute('type', 'password');
    this.INPUT.className = 'handsontableInput';
    this.inputStyle = this.INPUT.style;
    this.inputStyle.width = 0;
    this.inputStyle.height = 0;
    this.$input = $(this.INPUT);

    //Replace textarea with password input
    $(this.INPUT_PARENT).empty().append(this.INPUT);

};
```

That's it! You can now use your new editor:

```javascript

$('#container').handsontable({
    data: someData,
    columns: [
        {
            type: 'text'
        },
        {
          editor: PasswordEditor
          //If you want to use string 'password' instead of passing the actual editor class check out section "Registering editor"
        }
    ]

});

```

Wow, that was easy. Just a few lines of code and everything works.
Let's try something more complex, let's build new editor from the ground up.


### `SelectEditor` - creating editor from scratch
We're going to build a full featured editor, that lets user choose a cell value from predefined list of options, using
standard `<select>` input. As an extra feature, we'll add an ability to change currently selected option with <kbd>ARROW_UP</kbd>
and <kbd>ARROW_DOWN</kbd> keys.

Things to do:

1. Create a new class that inherits from `Handsontable.editors.BaseEditor`.
1. Add function creating `<select>` input and attaching to DOM.
1. Add function that populate `<select>` with options array passed in cell properties.
1. Implement methods:
    * `val()`
    * `open()`
    * `close()`
    * `focus()`
1. Override the default `EditManager` behaviour, so that pressing <kbd>ARROW_UP</kbd> and <kbd>ARROW_DOWN</kbd> keys
won't close the editor, but instead change the currently selected value.
1. Register editor.

#### Creating new editor
That's probably the easiest part. All we have to do is call `BaseEditor.prototype.extend()` function which will return
a new function class that inherits from `BaseEditor`.

```javascript
var SelectEditor = Handsontable.editors.BaseEditor.prototype.extend();
```

Task one: **DONE**

#### Creating `<select>` input and attaching it to DOM
There are three potential places where we can put the function that will create `<select>` element and put it in the DOM:

* `init()` method
* `prepare()` method
* `open()` method

The key to choose the best solution is to understand when each of those methods is called.

`init()` method is called during
creation of editor class object. That happens at most one per table instance, because once the object is created it is
reused every time `EditManager` asks for this editor class instance (see [Singleton pattern](http://en.wikipedia.org/wiki/Singleton_pattern) for details).

`prepare()` method is called every time user selects a cell that has this particular editor class set as `editor` property.
So, if whe set `SelectEditor` as editor for an entire column, then selecting any cell in this column will invoke `prepare()`
method of `SelectEditor`. In other words, this method can be called hundreds of times during table life, especially when
working with large data. Another important aspect of `prepare()` is that it should not display the editor (its `open's` job).
Displaying editor is triggered by user event such as pressing <kbd>ENTER</kbd>, <kbd>F2</kbd> or double clicking a cell,
 so there is some time between calling `prepare()` and actually displaying the editor. Nevertheless, operations performed
 by `prepare()` should be as fast as possible, to provide the best user experience.

 `open()` method is called when editor needs to be displayed. In most cases this method should change CSS `display` property
 to `block` or perform something similar. User expects that editor will be displayed right after the event
 (pressing appropriate key or double clicking a cell) has been triggered, so `open()` method should work as fast as possible.

Knowing all this, the most reasonable place to put the code responsible for creating `<select>` input is somewhere in
`init()` method. DOM manipulation is considered to be quite expensive (regarding the resource consumption) operation, so
it's best to perform it once and reuse the produced HTML nodes throughout the life of editor.

```javascript
SelectEditor.prototype.init = function(){
   // Create detached node, add CSS class and make sure its not visible
   this.select = $('<select></select>')
     .addClass('htSelectEditor')
     .hide();

   // Attach node to DOM, by appending it to the container holding the table
   this.instance.rootElement.append(this.select);
};
```

```css
.htSelectEditor {
  padding: 5px 7px;
  position: absolute;
  /*
  * This hack enables to change <select> dimensions in WebKit browsers
  */
  -webkit-appearance: menulist-button !important;
}

```

Task two: **DONE**

#### Populating `<select>` with options
In the previous step we implemented a function that crates `<select>` input and attaches it to DOM. You've probably noticed
that we haven't written any code that would create `<option>` elements, therefore if we would display the list, it would be
empty.

We want to be able to define an option list like so:

```javascript
$('#container').handsontable({
    data: someData,
    columns: [
        {
            editor: SelectEditor,
            selectOptions: ['option1', 'option2', `option3']
        }
    ]
});
```

There is no (easy) way to get to the value of `selectOptions`. Even if we could get to this array we could only populate
 list with options once, what if we have more than one column using `SelectEditor` and each of them has it's own option list.
 It's even possible that two cells in the same column can have different option lists (cascade configuration - remember?)
 It's clear that we have to find a better place for the code that creates items for our list.

 We are left with two places `prepare()` and `open()`. The latter one is simpler to implement, but as we previously stated,
 `open()` should work as fast as possible and creating `<option>` nodes and attaching them to DOM might be time consuming,
 if `selectOptions` contains long list of options. Therefore, `prepare()` seems to be a safer place to do this kind of work.
 The only thing to keep in mind is that we should always invoke `BaseEditor's` original method when overriding `prepare()`.
  `BaseEditor.prototype.prepare()` sets some important properties, which are used by other editor methods.


```javascript
// Create options in open() method
SelectEditor.prototype.open = function(){

  var options = this.cellProperties.selectOptions || [];

  var optionElements = options.map(function(option){
      var optionElement = $('<option />');
      optionElement.val(option);
      optionElement.html(option);

      return optionElement
  });

  this.select.empty();
  this.select.append(optionElements);


  //here we will put some code that actually displays the <select>

};
```

```javascript
// Create options in prepare() method
SelectEditor.prototype.prepare = function(){

    //Remember to invoke parent's method
    Handsontable.editors.BaseEditor.prototype.prepare.apply(this, arguments);

    var options = this.cellProperties.selectOptions || [];

    var optionElements = options.map(function(option){
        var optionElement = $('<option />');
        optionElement.val(option);
        optionElement.html(option);

        return optionElement
    });

    this.select.empty();
    this.select.append(optionElements);

};

```

Task three: **DONE**

#### Implementing editor specific methods
Most of the work is done. Now we just need to implement all the editor specific methods. Luckily, our editor is quite simple
so those methods will be only few lines of code.

```javascript
SelectEditor.prototype.val = function (value) {
     if ( typeof value == 'undefined' ) {
       //if invoked without arguments, act like getter
       return this.select.val();
     } else {
       // otherwise act like setter
       this.select.val(value);
     }
};

SelectEditor.prototype.open = function () {
     //sets <select> dimensions to match cell size
     this.select.css({
       height: $(this.TD).height(),
       'min-width' : $(this.TD).outerWidth()
     });

    //display the list
    this.select.show();

    //make sure that list positions matches cell position
    this.select.offset($(this.TD).offset());
};

SelectEditor.prototype.close = function () {
     this.select.hide();
};

```

The implementations of `val()` and `close()` are self-explanatory, but `open()` requires a few words of comment. First of all,
the implementation assumes that code responsible for populating the list with options is placed in `prepare()`. Secondly, before
 displaying the list, we sets its `height` and `min-width` so that it matches the size of corresponding cell.
 It's an optional step, but without it the editor will have different sizes depending on the browser. Probably a good idea
 would be also to limit the maximum height of `<select>`. Finally, as the `<select>` has been appended to the end of the
 table container, we have to change its position so that it could be displayed above the cell that is being edited. Again,
 this is an optional step, but it seems quite reasonable to put the editor next to the appropriate cell.

Task four: **DONE**

At this point we should have an editor that is ready to use. Put the code somewhere in your page and pass `SelectEditor`
class function as value of `editor` property.

```javascript
/*
*
* PLACE EDITOR CODE HERE
*
*/

$('#container').handsontable({
    data: someData,
    columns: [
        {},
        {
            editor: SelectEditor,
            selectOptions: ['option1', 'option2', 'option3']
        }
    ]

});
```

#### Use <kbd>ARROW_UP</kbd> and <kbd>ARROW_DOWN</kbd> to change selected value
We know that our editor works, but let's add one more tweak to it. Currently, when editor is opened and user presses
<kbd>ARROW_UP</kbd> or <kbd>ARROW_DOWN</kbd> editor closes and the selection moves one cell up or down. Wouldn't
it be nice, if pressing up and down arrow keys changed the currently selected value? User could navigate to the cell, hit
<kbd>ENTER</kbd>, choose the desired value and save changes by hitting <kbd>ENTER</kbd> again. It would be possible to
work with the table without even laying your hand on a mouse. Sounds pretty good, but how to override the default behaviour?
After all, it's the `EditManager` who decides when to close the editor.

Don't worry. Although, you don't have a direct access to `EditManager` instance, you can still override its behaviour.
Before `EditManager` starts to process keyboard events it triggers `beforeKeyDown` hook. If any of the listening functions
 invoke `stopImmediatePropagation()` method on an `event` object `EditManager` won't process this event any further. Therefore,
 all we have to do is register a `beforeKeyDown` listener function that checks whether <kbd>ARROW_UP</kbd> or <kbd>ARROW_DOWN</kbd>
 has been pressed and if so, stops event propagation and changes the currently selected value in `<select>` list accordingly.

The thing that we need to keep in mind is that our listener should work only, when our editor is opened. We want to preserve
the default behaviour for other editors, as well as when no editor is opened. That's why the most reasonable place to
register our listener would be the `open()` method and the `close()` method should contain code that will remove our listener.

Here's how the listener function could look like:

```javascript
var onBeforeKeyDown = function (event) {

    var instance = this; //context of listener function is always set to Handsontable.Core instance
    var editor = this.getActiveEditor();

    switch (event.keyCode){
    case Handsontable.helper.keyCode.ARROW_UP:

      var previousOption = editor.select.find('option:selected').prev();

      if (previousOption.length == 1){          // if previous option exists
        previousOption.prop('selected', true);  // mark it as selected
      }

      event.stopImmediatePropagation();         // prevent EditManager from processing this event
      event.preventDefault();                   // prevent browser from scrolling the page up
      break;

    case Handsontable.helper.keyCode.ARROW_DOWN:

      var nextOption = editor.select.find('option:selected').next();

      if (nextOption.length == 1){              // if next option exists
        nextOption.prop('selected', true);      // mark it as selected
      }

      event.stopImmediatePropagation();         // prevent EditManager from processing this event
      event.preventDefault();                   // prevent browser from scrolling the page down
      break;
    }
};
```

The first two lines of `onBeforeKeyDown()` are the most important. First of all, in listeners `this` is set to instance
of `Handsontable.Core` **NOT** the instance of our editor. To get an instance of editor class, we need to call
`getActiveEditor()` method, which returns the active editor.

Active editor is the editor which `prepare()` method was called most recently. For example, if you select a cell which
editor is `Handsontable.TextEditor`, then `getActiveEditor()` will return an object of this editor class. If then select
a cell (presumably in another column) which editor is `Handsontable.DateEditor`, the active editor changes and now
`getActiveEditor()` will return an object of `DateEditor` class.

The rest of the code should be quite clear. Now all we have to do is register our listener.

```javascript
SelectEditor.prototype.open = function () {
    this.select.css({
      height: $(this.TD).height(),
      'min-width' : $(this.TD).outerWidth()
    });

    this.select.show();
    this.select.offset($(this.TD).offset());

    this.instance.addHook('beforeKeyDown', onBeforeKeyDown);       // register listener
};

SelectEditor.prototype.close = function () {
    this.select.hide();

    this.instance.removeHook('beforeKeyDown', onBeforeKeyDown);    // remove listener
};

```

Go ahead and test it!

## Registering an editor
When you create an editor, a good idea is to assign it an alias that will refer to this particular editor class.
Handsontable defines 6 aliases by default:

* `text` for `Handsontable.editors.TextEditor`
* `numeric` for `Handsontable.editors.NumericEditor`
* `date` for `Handsontable.editors.DateEditor`
* `autocomplete` for `Handsontable.editors.AutocompleteEditor`
* `checkbox` for `Handsontable.editors.CheckboxEditor`
* `handsontable` for `Handsontable.editors.HandsontableEditor`

It gives users a convenient way for defining which editor should be use when changing value of certain cells. User doesn't
 need to know which class is responsible for displaying the editor, he does not even need to know that there is any class
 at all. What is more, you can change the class associated with an alias without a need to change code that defines a table.

To register your own alias use `Handsontable.editors.registerEditor()` function. It takes two arguments:

* `editorName` - a string representing an editor
* `editorClass` - a class that will be represented by `editorName`

If you'd like to register `SelectEditor` under alias `select` you have to call:

```javascript
Handsontable.editors.registerEditor('select', SelectEditor);
```

Choose aliases wisely. If you register your editor under name that is already registered, the target class will be
overwritten:

```javascript
Handsontable.editors.registerEditor('text', MyNewTextEditor);

//Now 'text' alias points to MyNewTextEditor class, not Handsontable.editors.TextEditor
```

So, unless you intentionally want to overwrite an existing alias, try to choose a unique name. A good practice is
 prefixing your aliases with some custom name (for example your GitHub username) to minimize the possibility of name collisions.
 This is especially important if you want to publish your editor, because you never know aliases has been
 registered by the user who uses your editor.

  ```javascript
  Handsontable.editors.registerEditor('select', SelectEditor);

  //Someone might already registered such alias
  ```

 ```javascript
 Handsontable.editors.registerEditor('psmolenski.select', SelectEditor);

 //That's better.
 ```

## Preparing editor for publication
If you plan to publish your editor or just want to keep your code nice and clean (as we all do :) there are 3 simple steps
that will help you to organize your code.

### Enclose in IIFE
Put your code in some kind of module, to avoid polluting global namespace. You can use AMD, CommonJS or any other module
pattern, but the easiest way to isolate your code is to use plain immediately invoked function expression (IIFE).

```javascript
(function(Handsontable){

var CustomEditor = Handsontable.editors.BaseEditor.prototype.extend();

//...rest of the editor code

}(Handsontable);
```

Passing `Handsontable` namespace as argument is optional (as it is defined globally), but it's a good practice to use as
 few global objects as possible, to make modularisation and dependency management easier.

### Add editor to dedicated namespace
Code enclosed in IIFE cannot be accessed from outside, unless it's intentionally exposed. To keep things well organized
add your editor to a special namespace called `Handsontable.editors`. This way you can use your editor during table definition
and other users will have an easy access to your editor, in case they would like to extend it.

```javascript
(function(Handsontable){

var CustomEditor = Handsontable.editors.BaseEditor.prototype.extend();

//...rest of the editor code

//And at the end
Handsontable.editors.CustomEditor = CustomEditor;

}(Handsontable);
```

From now on, you can use `CustomEditor` like so:

```javascript
$('#container').handsontable({
    data: someData,
    columns: [
        {
            editor: Handsontable.editors.CustomEditor
        }
    ]

});
```

Extending your `CustomEditor` is also easy.

```javascript

var AnotherEditor = Handsontable.editors.CustomEditor.prototype.extend();

```


Keep in mind, that there is no restrictions on the name you choose, but choose wisely and do not overwrite existing
editors. Try to keep the names unique.

//TODO: add link to section Registering editors
### Registering an alias
The final touch is to register your editor under some alias, so that users can easily refer to it without the need
to now the actual class name. See Registering editor for details.

To sum up, a well prepared editor should look like this:

```javascript
(function(Handsontable){

var CustomEditor = Handsontable.editors.BaseEditor.prototype.extend();

//...rest of the editor code

//Put editor in dedicated namespace
Handsontable.editors.CustomEditor = CustomEditor;

//Register alias
Handsontable.editors.registerEditor('theBestEditor', CustomEditor);

}(Handsontable);
```

