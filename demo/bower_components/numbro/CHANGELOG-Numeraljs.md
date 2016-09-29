_This is the historical changelog for the [`numeral-js`
project](https://github.com/adamwdraper/Numeral-js), which `numbro` is built upon. The `numbro`
changelog is at [CHANGELOG.md](CHANGELOG.md)._


### 1.5.3

Added currency symbol to optionally appear before negative sign / open paren

Added float precision math support

Added specification of abbreviation in thousands, millions, billions

### 1.5.2

Bug fix: Unformat should pass through if given a number

Added a mechanism to control rounding behaviour

Added languageData() for getting and setting language props at runtime

### 1.5.1

Bug fix: Make sure values aren't changed during formatting

### 1.5.0

Add defaultFormat(). numeral().format() uses the default to format if no string is provided

.unformat() returns 0 when passed no string

Added languages.js that contains all languages

Bug fix: Fix bug while unformatting ordinals

Add format option to always show signed value

Added ability to instantiate numeral with a string value of a number

### 1.4.9

Bug fix: Fix bug while unformatting ordinals

### 1.4.8

Bug fix: Throw error if language is not defined

### 1.4.7

Bug fix: Fix typo for trillion

### 1.4.6

Bug fix: remove ' from unformatting regex that was causing an error with fr-CH.js

### 1.4.5

Add zeroFormat() function that accepts a string for custom formating of zeros

Add valueOf() function

Chain functionality to language function

Make all minified files have the same .min.js filename ending

### 1.4.1

Bug fix: Bytes not formatting correctly

### 1.4.0

Add optional format for all decimals

### 1.3.4

Remove AMD module id. (This is encouraged by require.js to make the module more portable, and keep it from creating a global)

### 1.3.3

AMD define() compatibility.

### 1.3.2

Bug fix: Formatting some numbers results in the wrong value. Issue #21

### 1.3.1

Bug fix: Minor fix to unformatting parser

### 1.3.0

Add support for spaces before/after $, a, o, b in a format string

Bug fix: Fix unformat for languages that use '.' in ordinals

Bug fix: Fix round up floating numbers with no precision correctly.

Bug fix: Fix currency signs at the end in unformat

### 1.2.6

Add support for optional decimal places

### 1.2.5

Add support for appending currency symbol

### 1.2.4

Add support for humanized filesizes

### 1.2.3

Bug Fix: Fix unformatting for languages that use '.' as thousands delimiter

### 1.2.2

Changed language definition property 'money' to 'currency'

### 1.2.1

Bug fix: Fix unformatting non-negative abbreviations

### 1.2.0

Add language support

Update testing for to include languages

### 1.1.0

Add Tests

Bug fix: Fix difference returning negative values

### 1.0.4

Bug fix: Non negative numbers were displaying as negative when using parentheses

### 1.0.3

Add ordinal formatting using 'o' in the format

### 1.0.2

Add clone functionality

### 1.0.1

Added abbreviations for thousands and millions using 'a' in the format

### 1.0.0

Initial release
