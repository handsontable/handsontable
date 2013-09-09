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
          //If you want to use string 'password' instead of passing the actual editor class
          //check out section "Registering editor"
        }
    ]

});

```

Wow, that was easy. Just a few lines of code and everything works.
Let's try something more complex, let's build new editor from grounds up.


### `SelectEditor` - creating editor from scratch

## Registering editor
