# Chroma.js

Chroma.js is a tiny JavaScript library (8.5kB) for all kinds of color conversions and color scales.

### Usage


Initiate and manipulate colors:

```javascript
chroma('#D4F880').darken().hex();  // #9BC04B
```

Working with color scales is easy, too:

```javascript    
scale = chroma.scale(['white', 'red']);
scale(0.5).hex(); // #FF7F7F
```

Lab/Lch interpolation looks better than than RGB

```javascript    
chroma.scale(['white', 'red']).mode('lab');
```

Custom domains! Quantiles! Color Brewer!! 

```javascript    
chroma.scale('RdYlBu').domain(myValues, 7, 'quantiles');    
```

And why not use logarithmic color scales once in your life?

```javascript
chroma.scale(['lightyellow', 'navy']).domain([1, 100000], 7, 'log');    
```

### Like it?

Why not dive into the [API docs](https://github.com/gka/chroma.js/blob/master/doc/api.md) (quite short actually), and download [chroma.min.js](https://raw.github.com/gka/chroma.js/master/chroma.min.js) right away.

You can use it in node.js, too!

    npm install chroma-js


### Build instructions

To compile the coffee-script source files you have to run ``build.sh``.

To run the tests simply run

    vows test/*.coffee


### Similar Libraries / Prior Art

* [Chromatist](https://github.com/jrus/chromatist)
* [GrapeFruit](https://github.com/xav/Grapefruit) (Python)
* [colors.py](https://github.com/mattrobenolt/colors.py) (Python)
* [d3.js](https://github.com/mbostock/d3)


### Author

Chroma.js is written by [Gregor Aisch](http://driven-by-data.net).

### License

Released under [BSD license](http://opensource.org/licenses/BSD-3-Clause).
Versions prior to 0.4 were released under [GPL](http://www.gnu.org/licenses/gpl-3.0).

### Known issues

* HSI color conversion is experimental and produces weird results sometimes

### Further reading

* [How To Avoid Equidistant HSV Colors](https://vis4.net/blog/posts/avoid-equidistant-hsv-colors/)
* [Mastering Multi-hued Color Scales with Chroma.js](https://vis4.net/blog/posts/mastering-multi-hued-color-scales/)
