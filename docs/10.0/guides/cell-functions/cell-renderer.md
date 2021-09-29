---
title: Cell renderer
metaTitle: Cell renderer - Guide - Handsontable Documentation
permalink: /10.0/cell-renderer
canonicalUrl: /cell-renderer
---

# Cell renderer

[[toc]]

When you create a renderer, a good idea is to assign it as an alias that will refer to this particular renderer function. Handsontable defines 10 aliases by default:

* `autocomplete` for `Handsontable.renderers.AutocompleteRenderer`
* `base` for `Handsontable.renderers.BaseRenderer`
* `checkbox` for `Handsontable.renderers.CheckboxRenderer`
* `date` for `Handsontable.renderers.DateRenderer`
* `dropdown` for `Handsontable.renderers.DropdownRenderer`
* `html` for `Handsontable.renderers.HtmlRenderer`
* `numeric` for `Handsontable.renderers.NumericRenderer`
* `password` for `Handsontable.renderers.PasswordRenderer`
* `text` for `Handsontable.renderers.TextRenderer`
* `time` for `Handsontable.renderers.TimeRenderer`

It gives users a convenient way for defining which renderer should be used when table rendering was triggered. User doesn't need to know which renderer function is responsible for displaying the cell value, he does not even need to know that there is any function at all. What is more, you can change the render function associated with an alias without a need to change code that defines a table.

## Using a cell renderer

Use the renderer name of your choice when configuring the column:

```js
const container = document.getElementById('container');
const hot = new Handsontable(container, {
  data: someData,
  columns: [{
    renderer: 'numeric'
  }]
});
```

## Registering custom cell renderer

To register your own alias use `Handsontable.renderers.registerRenderer()` function. It takes two arguments:

* `rendererName` - a string representing a renderer function
* `renderer` - a renderer function that will be represented by `rendererName`

If you'd like to register `asterixDecoratorRenderer` under alias `asterix` you have to call:

```js
Handsontable.renderers.registerRenderer('asterix', asterixDecoratorRenderer);
```

Choose aliases wisely. If you register your renderer under name that is already registered, the target function will be overwritten:

```js
Handsontable.renderers.registerRenderer('text', asterixDecoratorRenderer);
```

Now 'text' alias points to `asterixDecoratorRenderer` function, not `Handsontable.renderers.TextRenderer`.

So, unless you intentionally want to overwrite an existing alias, try to choose a unique name. A good practice is prefixing your aliases with some custom name (for example your GitHub username) to minimize the possibility of name collisions. This is especially important if you want to publish your renderer, because you never know aliases has been registered by the user who uses your renderer.

```js
Handsontable.renderers.registerRenderer('asterix', asterixDecoratorRenderer);
```

Someone might already registered such alias

```js
Handsontable.renderers.registerRenderer('my.asterix', asterixDecoratorRenderer);
```

That's better.

## Using an alias

The final touch is to using the registered aliases, so that users can easily refer to it without the need to now the actual renderer function is.

To sum up, a well prepared renderer function should look like this:

```js
function customRenderer(hotInstance, td, row, column, prop, value, cellProperties) {
  // Optionally include `BaseRenderer` which is responsible for
  // adding/removing CSS classes to/from the table cells.
  Handsontable.renderers.BaseRenderer.apply(this, arguments);

  // ...your custom logic of the renderer
}

// Register an alias
Handsontable.renderers.registerRenderer('my.custom', customRenderer);
```

From now on, you can use `customRenderer` like so:

```js
const container = document.querySelector('#container');
const hot = new Handsontable(container, {
  data: someData,
  columns: [{
    renderer: 'my.custom'
  }]
});
```

## Rendering custom HTML in cells

This example shows how to use custom cell renderers to display HTML content in a cell. This is a very powerful feature. Just remember to escape any HTML code that could be used for XSS attacks. In the below configuration:

* **Title** column uses built-in HTML renderer that allows any HTML. This is unsafe if your code comes from untrusted source. Take notice that a Handsontable user can use it to enter `<script>` or other potentially malicious tags using the cell editor!
* **Description** column also uses HTML renderer (same as above)
* **Comments** column uses a custom renderer (`safeHtmlRenderer`). This should be safe for user input, because only certain tags are allowed
* **Cover** column accepts image URL as a string and converts it to a `<img>` in the renderer

::: example #example1
```js
const data = [
  {
    title: '<a href="https://www.amazon.com/Professional-JavaScript-Developers-Nicholas-Zakas/dp/1118026691">Professional JavaScript for Web Developers</a>',
    description: 'This <a href="https://bit.ly/sM1bDf">book</a> provides a developer-level introduction along with more advanced and useful features of <b>JavaScript</b>.',
    comments: 'I would rate it &#x2605;&#x2605;&#x2605;&#x2605;&#x2606;',
    cover: 'https://handsontable.com/docs/10.0/img/examples/professional-javascript-developers-nicholas-zakas.jpg'
  },
  {
    title: '<a href="https://shop.oreilly.com/product/9780596517748.do">JavaScript: The Good Parts</a>',
    description: 'This book provides a developer-level introduction along with <b>more advanced</b> and useful features of JavaScript.',
    comments: 'This is the book about JavaScript',
    cover: 'https://handsontable.com/docs/10.0/img/examples/javascript-the-good-parts.jpg'
  },
  {
    title: '<a href="https://shop.oreilly.com/product/9780596805531.do">JavaScript: The Definitive Guide</a>',
    description: '<em>JavaScript: The Definitive Guide</em> provides a thorough description of the core <b>JavaScript</b> language and both the legacy and standard DOMs implemented in web browsers.',
    comments: 'I\'ve never actually read it, but the <a href="https://shop.oreilly.com/product/9780596805531.do">comments</a> are highly <strong>positive</strong>.',
    cover: 'https://handsontable.com/docs/10.0/img/examples/javascript-the-definitive-guide.jpg'
  }
];

const container = document.getElementById('example1');
const hot = new Handsontable(container, {
  data,
  colWidths: [200, 200, 200, 80],
  colHeaders: ['Title', 'Description', 'Comments', 'Cover'],
  height: 'auto',
  columns: [
    { data: 'title', renderer: 'html' },
    { data: 'description', renderer: 'html' },
    { data: 'comments', renderer: safeHtmlRenderer },
    { data: 'cover', renderer: coverRenderer }
  ],
  licenseKey: 'non-commercial-and-evaluation'
});

function safeHtmlRenderer(instance, td, row, col, prop, value, cellProperties) {
  // be sure you only allow certain HTML tags to avoid XSS threats
  // (you should also remove unwanted HTML attributes)
  td.innerHTML = Handsontable.helper.sanitize(value, {
    ALLOWED_TAGS: ['em', 'b', 'strong', 'a', 'big'],
  });
}

function coverRenderer(instance, td, row, col, prop, value, cellProperties) {
  const stringifiedValue = Handsontable.helper.stringify(value);

  if (stringifiedValue.startsWith('http')) {
    const img = document.createElement('IMG');

    img.src = value;

    Handsontable.dom.addEvent(img, 'mousedown', event =>{
      event.preventDefault(); // prevent selection quirk
    });

    Handsontable.dom.empty(td);
    td.appendChild(img);
  } else {
    // render as text
    Handsontable.renderers.TextRenderer.apply(this, arguments);
  }
}
```
:::

## Rendering custom HTML in header

You can also put HTML into row and column headers. If you need to attach events to DOM elements like the checkbox below, just remember to identify the element by class name, not by id. This is because row and column headers are duplicated in the DOM tree and id attribute must be unique.

::: example #example2
```js
let isChecked = false;
const container = document.querySelector('#example2');


const hot = new Handsontable(container, {
  height: 'auto',
  columns: [
    {},
    { renderer: customRenderer }
  ],
  colHeaders(col) {
    switch (col) {
      case 0:
        return '<b>Bold</b> and <em>Beautiful</em>';

      case 1:
        return `Some <input type="checkbox" class="checker" ${isChecked ? `checked="checked"` : ''}> checkbox`;
    }
  }
});

function customRenderer(instance, td) {
  Handsontable.renderers.TextRenderer.apply(this, arguments);
  if (isChecked) {
    td.style.backgroundColor = 'yellow';
  } else {
    td.style.backgroundColor = 'white';
  }
}

Handsontable.dom.addEvent(container, 'mousedown', event => {
  if (event.target.nodeName == 'INPUT' && event.target.className == 'checker') {
    event.stopPropagation();
  }
});

Handsontable.dom.addEvent(container, 'mouseup', event => {
  if (event.target.nodeName == 'INPUT' && event.target.className == 'checker') {
    isChecked = !event.target.checked;
    hot.render();
  }
});
```
:::

## Adding event listeners in cell renderer function

If you are writing an advanced cell renderer, and you want to add some custom behavior after a certain user action (i.e. after user hover a mouse pointer over a cell) you might be tempted to add an event listener directly to table cell node passed as an argument to the `renderer` function. Unfortunately, this will almost always cause you trouble and you will end up with either performance issues or having the listeners attached to the wrong cell.

This is because Handsontable:

* calls `renderer` functions multiple times per cell - this can lead to having multiple copies of the same event listener attached to a cell
* reuses table cell nodes during table scrolling and adding/removing new rows/columns - this can lead to having event listeners attached to the wrong cell

Before deciding to attach an event listener in cell renderer make sure, that there is no [Handsontable event](@/guides/getting-started/events-and-hooks.md) that suits your needs. Using _Handsontable events_ system is the safest way to respond to user actions.

If you did't find a suitable _Handsontable event_ put the cell content into a wrapping `<div>`, attach the event listener to the wrapper and then put it into the table cell.

## Performance considerations

Cell renderers are called separately for every displayed cell, during every table render. Table can be rendered multiple times during its lifetime (after table scroll, after table sorting, after cell edit etc.), therefore you should keep your `renderer` functions as simple and fast as possible or you might experience a performance drop, especially when dealing with large sets of data.
