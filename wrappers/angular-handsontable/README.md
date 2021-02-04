<div align="center">
  
![Handsontable for Angular](https://raw.githubusercontent.com/handsontable/static-files/master/Images/Logo/Handsontable/handsontable-angular.png)

This is the official wrapper of [**Handsontable**](//github.com/handsontable/handsontable) data grid for Angular.<br>
It provides data binding, data validation, filtering, sorting and more.<br>

[![npm](https://img.shields.io/npm/dt/@handsontable/angular.svg)](//npmjs.com/package/@handsontable/angular)
[![npm](https://img.shields.io/npm/dm/@handsontable/angular.svg)](//npmjs.com/package/@handsontable/angular)
![Build status](https://img.shields.io/codeship/1ec34290-ed0a-0131-911c-1a47c8fbcce0/master)
</div>

<br>

<div align="center">
<a href="//handsontable.com/docs/frameworks-wrapper-for-angular-simple-example.html">
<img src="https://raw.githubusercontent.com/handsontable/static-files/master/Images/Screenshots/handsontable-screenshot-new.png" align="center" alt="A screenshot of a data grid for Angular"/>
</a>
</div>

<br>

## Installation

Use npm to install this wrapper together with Handsontable.
```
npm install handsontable @handsontable/angular
```

You can load it directly from [jsDelivr](//jsdelivr.com/package/npm/@handsontable/angular) as well.
```html
<script src="https://cdn.jsdelivr.net/npm/handsontable/dist/handsontable.full.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@handsontable/angular/bundles/handsontable-angular.umd.min.js"></script>

<link href="https://cdn.jsdelivr.net/npm/handsontable/dist/handsontable.full.min.css" rel="stylesheet">
```

The component will be available as `Handsontable.angular.HotTable`.

## Usage

Use this data grid as you would any other component in your application. [Options](//handsontable.com/docs/Options.html) can be set as `HotTable` props.

**Styles**
```css
@import '~handsontable/dist/handsontable.full.css';
```

**Angular Module**
```js
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { HotTableModule } from '@handsontable/angular';
 
@NgModule({
  imports: [
    BrowserModule,
    HotTableModule.forRoot()
  ],
  declarations: [ AppComponent ],
  bootstrap: [ AppComponent ],
})
export class AppModule { }
```

**Angular Component**
```js
import { Component } from '@angular/core';

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styleUrls: [ './app.component.css' ],
})
export class AppComponent  {
  data: any[] = [
    ['', 'Tesla', 'Mercedes', 'Toyota', 'Volvo'],
    ['2019', 10, 11, 12, 13],
    ['2020', 20, 11, 14, 13],
    ['2021', 30, 15, 12, 13]
  ],
}
```

**Template**

```html
<hot-table [data]="data" [colHeaders]="true" [rowHeaders]="true" [width]="600" [height]="300"></hot-table>
```

##### [See the live demo](//handsontable.com/docs/frameworks-wrapper-for-angular-simple-example.html)

## Features

A list of some of the most popular features:

- Multiple column sorting
- Non-contiguous selection
- Filtering data
- Export to file
- Validating data
- Conditional formatting
- Merging cells
- Custom cell types
- Freezing rows/columns
- Moving rows/columns
- Resizing rows/columns
- Hiding rows/columns
- Context menu
- Comments
- Auto-fill option

## Documentation

- [Developer guides](//handsontable.com/docs/angular)
- [API Reference](//handsontable.com/docs/Core.html)
- [Release notes](//handsontable.com/docs/tutorial-release-notes.html)
- [Twitter](//twitter.com/handsontable) (News and updates)

## Support and contribution

We provide support for all users through [GitHub issues](//github.com/handsontable/handsontable/issues). If you have a commercial license then you can add a new ticket through the [contact form](//handsontable.com/contact?category=technical_support).

If you would like to contribute to this project, make sure you first read the [guide for contributors](//github.com/handsontable/handsontable/blob/master/CONTRIBUTING.md).

## Browser compatibility

Handsontable is compatible with modern browsers such as Chrome, Firefox, Safari, Opera, and Edge. It also supports Internet Explorer 9 to 11 but with limited performance.

## License

This wrapper is released under [the MIT license](//github.com/handsontable/handsontable/blob/master/wrappers/angular-handsontable/LICENSE) but under the hood it uses [Handsontable](//github.com/handsontable/handsontable), which is dual-licensed. You can either use it for free in all your non-commercial projects or purchase a commercial license.

<table>
  <thead align="center">
    <tr>
      <th width="50%">Free license</th>
      <th width="50%">Paid license</th>
    </tr>    
  </thead>
  <tbody align="center">
    <tr>
      <td>For non-commercial purposes such as teaching, academic research, personal experimentation, and evaluating  on development and testing servers.</td>
      <td>For all commercial purposes</td>
    </tr>
    <tr>
      <td>All features are available</td>
      <td>All features are available</td>
    </tr>
    <tr>
      <td>Community support</td>
      <td>Dedicated support</td>
    </tr>    
    <tr>
      <td><a href="//github.com/handsontable/handsontable/blob/master/handsontable-non-commercial-license.pdf">Read the license</a></td>
      <td><a href="//handsontable.com/pricing">See plans</a></td>
    </tr>
  </tbody>
</table>

## License key

**The license key is obligatory since [Handsontable 7.0.0](//github.com/handsontable/handsontable/releases/tag/7.0.0) (released in March 2019).**

If you use Handsontable for purposes not intended toward monetary compensation such as, but not limited to, teaching, academic research, evaluation, testing and experimentation, pass the phrase `'non-commercial-and-evaluation'`, as presented below. 

You can pass it in the `settings` object: 

```js
settings: {
  data: data,
  rowHeaders: true,
  colHeaders: true,
  licenseKey: 'non-commercial-and-evaluation'
}
```

Alternatively, you can pass it to a `licenseKey` prop:

```html
<hot-table [settings]="settings" [licenseKey]="00000-00000-00000-00000-00000"></hot-table>
```

If, on the other hand, you use Handsontable in a project that supports your commercial activity, then you must purchase the license key at [handsontable.com](//handsontable.com/pricing).

The license key is validated in an offline mode.  No connection is made to any server. [Learn more](//handsontable.com/docs/tutorial-license-key.html) about how it works.

<br>
<br>

Created by [Handsoncode](//handsoncode.net) with ❤ and ☕ in [Tricity](//en.wikipedia.org/wiki/Tricity,_Poland).
