---
title: SamplesGenerator
metaTitle: SamplesGenerator | Handsontable DataGrid for JavaScript
permalink: /api/samples-generator
canonicalUrl: /api/samples-generator
searchCategory: API Reference
hotPlugin: false
editLink: false
id: n9lf8vn4
description: Options, members, and methods of Handsontable DataGrid's SamplesGenerator API.
react:
  id: gh3nicnu
  metaTitle: SamplesGenerator | Handsontable DataGrid for React
angular:
  id: z8s1b9qr
  metaTitle: SamplesGenerator | Handsontable DataGrid for Angular
---

[[toc]]

## Description

Initializes the samples generator with the data factory function used to retrieve cell values during sampling.


## Members

### allowDuplicates

::: ask-about-api allowDuplicates|SamplesGenerator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/samplesGenerator.ts#L231

:::

_samplesGenerator.allowDuplicates : boolean_

`true` if duplicate samples collection should be allowed, `false` otherwise.

**Default**: <code>{false}</code>  


### customSampleCount

::: ask-about-api customSampleCount|SamplesGenerator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/samplesGenerator.ts#L225

:::

_samplesGenerator.customSampleCount : number_

Custom number of samples to take of each value length.

**Default**: <code>{null}</code>  


### dataFactory

::: ask-about-api dataFactory|SamplesGenerator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/samplesGenerator.ts#L219

:::

_samplesGenerator.dataFactory : function_

Function which give the data to collect samples.



### includeHidden

::: ask-about-api includeHidden|SamplesGenerator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/samplesGenerator.ts#L237

:::

_samplesGenerator.includeHidden : boolean_

`true` if hidden samples should be included, `false` otherwise.

**Default**: <code>{false}</code>  


### SAMPLE_COUNT

::: ask-about-api SAMPLE_COUNT|SamplesGenerator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/samplesGenerator.ts#L54

:::

_SamplesGenerator.SAMPLE\_COUNT : number_

Number of samples to take of each value length.



### samples

::: ask-about-api samples|SamplesGenerator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/samplesGenerator.ts#L214

:::

_samplesGenerator.samples : Map_

Samples prepared for calculations.

**Default**: <code>{null}</code>  

## Methods

### applySamplingOptions

::: ask-about-api applySamplingOptions|SamplesGenerator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/samplesGenerator.ts#L98

:::

_samplesGenerator.applySamplingOptions(options) ⇒ boolean_

Applies both sampling options at once and reports whether either of them changed.

Callers use the return value to decide whether the sizes they measured earlier are still
usable. Both options change which cells end up in a sample, so a size measured under the
previous options cannot be trusted once they change - the auto-size plugins answer a `true`
here by re-measuring.

The raw `samplingRatio` is resolved here rather than by each caller, so that every plugin
reading the option agrees on what it means. See [resolveSampleCount](#samplesgenerator.resolvesamplecount).


| Param | Type | Description |
| --- | --- | --- |
| options | `object` | The sampling options to apply. |
| options.samplingRatio | `*` | The raw `samplingRatio` option value. |
| options.allowDuplicates | `boolean` | `true` to allow duplicate values. |


**Returns**: `boolean` - `true` when at least one option changed its value.  

### generateColumnSamples

::: ask-about-api generateColumnSamples|SamplesGenerator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/samplesGenerator.ts#L127

:::

_samplesGenerator.generateColumnSamples(colRange, rowRange) ⇒ object_

Generate samples for column. You can control which area should be sampled by passing `colRange` object and `rowRange` object.


| Param | Type | Description |
| --- | --- | --- |
| colRange | `object` <br/> `number` | The columns range to generate the samples. |
| rowRange | `object` <br/> `Array<number>` | The row range (or an explicit list of row indexes) to generate the samples. |



### generateRowSamples

::: ask-about-api generateRowSamples|SamplesGenerator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/samplesGenerator.ts#L118

:::

_samplesGenerator.generateRowSamples(rowRange, colRange) ⇒ object_

Generate samples for row. You can control which area should be sampled by passing `rowRange` object and `colRange` object.


| Param | Type | Description |
| --- | --- | --- |
| rowRange | `object` <br/> `number` | The rows range to generate the samples. |
| colRange | `object` <br/> `Array<number>` | The column range (or an explicit list of column indexes) to generate the samples. |



### generateSample

::: ask-about-api generateSample|SamplesGenerator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/samplesGenerator.ts#L161

:::

_samplesGenerator.generateSample(type, range, specifierValue, [existingSamples]) ⇒ Map_

Generate sample for specified type (`row` or `col`).

When `existingSamples` is provided, the new samples are accumulated into it instead of a fresh
map. This lets callers sweep a large range in slices (e.g. one slice per animation frame)
while keeping the per-bucket sample limits and the duplicate detection working across slices.


| Param | Type | Description |
| --- | --- | --- |
| type | `string` | Samples type `row` or `col`. |
| range | `object` <br/> `Array<number>` | The range (or an explicit list of indexes) to generate the samples. |
| specifierValue | `number` | The row (for `row` type) or column (for `col` type) index to sample. |
| [existingSamples] | `Map` | `optional` A samples map from a previous call to accumulate into. |



### generateSampleFromValues

::: ask-about-api generateSampleFromValues|SamplesGenerator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/samplesGenerator.ts#L194

:::

_samplesGenerator.generateSampleFromValues(type, entries) ⇒ Map_

Generates one samples map from already-known values, bypassing the data factory. Used to
bucket-and-cap values that can no longer be read from the data source (e.g. the previous
cell values carried by a change batch).


| Param | Type | Description |
| --- | --- | --- |
| type | `string` | Samples type `row` or `col`. |
| entries | `Array` | An array of `{ index, value }` objects, where `index` is the opposite-axis index the value belongs to (a row index for `col` type samples). |



### generateSamples

::: ask-about-api generateSamples|SamplesGenerator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/samplesGenerator.ts#L137

:::

_samplesGenerator.generateSamples(type, range, specifierRange) ⇒ Map_

Generate collection of samples.


| Param | Type | Description |
| --- | --- | --- |
| type | `string` | Type to generate. Can be `col` or `row`. |
| range | `object` <br/> `Array<number>` | The range (or an explicit list of indexes) to generate the samples. |
| specifierRange | `object` <br/> `number` | The range to generate the samples. |



### getSampleCount

::: ask-about-api getSampleCount|SamplesGenerator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/samplesGenerator.ts#L61

:::

_samplesGenerator.getSampleCount() ⇒ number_

Get the sample count for this instance.



### resolveSampleCount

::: ask-about-api resolveSampleCount|SamplesGenerator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/samplesGenerator.ts#L79

:::

_SamplesGenerator.resolveSampleCount(samplingRatio) ⇒ number | null_

Resolves a `samplingRatio` option into a usable sample count.

Anything that is not a whole number above zero resolves to `null`, meaning the default
[SAMPLE_COUNT](#samplesgenerator.sample_count). That covers the option being absent, but also the values
that used to be stored raw and then quietly broke the sampler: `true` and `[]` became `NaN`,
which made every later comparison report a change because `NaN !== NaN`; a negative number
became a `needed` count that collected no samples at all; and the string `'6'` compared as
different from the number `6`.


| Param | Type | Description |
| --- | --- | --- |
| samplingRatio | `*` | The raw option value. |


**Returns**: `number` | `null` - The sample count to use, or `null` for the default.  

### setIncludeHidden

::: ask-about-api setIncludeHidden|SamplesGenerator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/samplesGenerator.ts#L109

:::

_samplesGenerator.setIncludeHidden(includeHidden)_

Sets the sampler to the mode where it will generate samples for hidden indexes.


| Param | Type | Description |
| --- | --- | --- |
| includeHidden | `boolean` | `true` to include hidden indexes, `false` otherwise. |



## Description

Initializes the samples generator with the data factory function used to retrieve cell values during sampling.


## Members

### allowDuplicates

::: ask-about-api allowDuplicates|SamplesGenerator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/samplesGenerator.ts#L231

:::

_samplesGenerator.allowDuplicates : boolean_

`true` if duplicate samples collection should be allowed, `false` otherwise.

**Default**: <code>{false}</code>  


### customSampleCount

::: ask-about-api customSampleCount|SamplesGenerator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/samplesGenerator.ts#L225

:::

_samplesGenerator.customSampleCount : number_

Custom number of samples to take of each value length.

**Default**: <code>{null}</code>  


### dataFactory

::: ask-about-api dataFactory|SamplesGenerator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/samplesGenerator.ts#L219

:::

_samplesGenerator.dataFactory : function_

Function which give the data to collect samples.



### includeHidden

::: ask-about-api includeHidden|SamplesGenerator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/samplesGenerator.ts#L237

:::

_samplesGenerator.includeHidden : boolean_

`true` if hidden samples should be included, `false` otherwise.

**Default**: <code>{false}</code>  


### SAMPLE_COUNT

::: ask-about-api SAMPLE_COUNT|SamplesGenerator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/samplesGenerator.ts#L54

:::

_SamplesGenerator.SAMPLE\_COUNT : number_

Number of samples to take of each value length.



### samples

::: ask-about-api samples|SamplesGenerator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/samplesGenerator.ts#L214

:::

_samplesGenerator.samples : Map_

Samples prepared for calculations.

**Default**: <code>{null}</code>  

## Methods

### applySamplingOptions

::: ask-about-api applySamplingOptions|SamplesGenerator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/samplesGenerator.ts#L98

:::

_samplesGenerator.applySamplingOptions(options) ⇒ boolean_

Applies both sampling options at once and reports whether either of them changed.

Callers use the return value to decide whether the sizes they measured earlier are still
usable. Both options change which cells end up in a sample, so a size measured under the
previous options cannot be trusted once they change - the auto-size plugins answer a `true`
here by re-measuring.

The raw `samplingRatio` is resolved here rather than by each caller, so that every plugin
reading the option agrees on what it means. See [resolveSampleCount](#samplesgenerator.resolvesamplecount).


| Param | Type | Description |
| --- | --- | --- |
| options | `object` | The sampling options to apply. |
| options.samplingRatio | `*` | The raw `samplingRatio` option value. |
| options.allowDuplicates | `boolean` | `true` to allow duplicate values. |


**Returns**: `boolean` - `true` when at least one option changed its value.  

### generateColumnSamples

::: ask-about-api generateColumnSamples|SamplesGenerator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/samplesGenerator.ts#L127

:::

_samplesGenerator.generateColumnSamples(colRange, rowRange) ⇒ object_

Generate samples for column. You can control which area should be sampled by passing `colRange` object and `rowRange` object.


| Param | Type | Description |
| --- | --- | --- |
| colRange | `object` <br/> `number` | The columns range to generate the samples. |
| rowRange | `object` <br/> `Array<number>` | The row range (or an explicit list of row indexes) to generate the samples. |



### generateRowSamples

::: ask-about-api generateRowSamples|SamplesGenerator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/samplesGenerator.ts#L118

:::

_samplesGenerator.generateRowSamples(rowRange, colRange) ⇒ object_

Generate samples for row. You can control which area should be sampled by passing `rowRange` object and `colRange` object.


| Param | Type | Description |
| --- | --- | --- |
| rowRange | `object` <br/> `number` | The rows range to generate the samples. |
| colRange | `object` <br/> `Array<number>` | The column range (or an explicit list of column indexes) to generate the samples. |



### generateSample

::: ask-about-api generateSample|SamplesGenerator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/samplesGenerator.ts#L161

:::

_samplesGenerator.generateSample(type, range, specifierValue, [existingSamples]) ⇒ Map_

Generate sample for specified type (`row` or `col`).

When `existingSamples` is provided, the new samples are accumulated into it instead of a fresh
map. This lets callers sweep a large range in slices (e.g. one slice per animation frame)
while keeping the per-bucket sample limits and the duplicate detection working across slices.


| Param | Type | Description |
| --- | --- | --- |
| type | `string` | Samples type `row` or `col`. |
| range | `object` <br/> `Array<number>` | The range (or an explicit list of indexes) to generate the samples. |
| specifierValue | `number` | The row (for `row` type) or column (for `col` type) index to sample. |
| [existingSamples] | `Map` | `optional` A samples map from a previous call to accumulate into. |



### generateSampleFromValues

::: ask-about-api generateSampleFromValues|SamplesGenerator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/samplesGenerator.ts#L194

:::

_samplesGenerator.generateSampleFromValues(type, entries) ⇒ Map_

Generates one samples map from already-known values, bypassing the data factory. Used to
bucket-and-cap values that can no longer be read from the data source (e.g. the previous
cell values carried by a change batch).


| Param | Type | Description |
| --- | --- | --- |
| type | `string` | Samples type `row` or `col`. |
| entries | `Array` | An array of `{ index, value }` objects, where `index` is the opposite-axis index the value belongs to (a row index for `col` type samples). |



### generateSamples

::: ask-about-api generateSamples|SamplesGenerator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/samplesGenerator.ts#L137

:::

_samplesGenerator.generateSamples(type, range, specifierRange) ⇒ Map_

Generate collection of samples.


| Param | Type | Description |
| --- | --- | --- |
| type | `string` | Type to generate. Can be `col` or `row`. |
| range | `object` <br/> `Array<number>` | The range (or an explicit list of indexes) to generate the samples. |
| specifierRange | `object` <br/> `number` | The range to generate the samples. |



### getSampleCount

::: ask-about-api getSampleCount|SamplesGenerator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/samplesGenerator.ts#L61

:::

_samplesGenerator.getSampleCount() ⇒ number_

Get the sample count for this instance.



### resolveSampleCount

::: ask-about-api resolveSampleCount|SamplesGenerator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/samplesGenerator.ts#L79

:::

_SamplesGenerator.resolveSampleCount(samplingRatio) ⇒ number | null_

Resolves a `samplingRatio` option into a usable sample count.

Anything that is not a whole number above zero resolves to `null`, meaning the default
[SAMPLE_COUNT](#samplesgenerator.sample_count). That covers the option being absent, but also the values
that used to be stored raw and then quietly broke the sampler: `true` and `[]` became `NaN`,
which made every later comparison report a change because `NaN !== NaN`; a negative number
became a `needed` count that collected no samples at all; and the string `'6'` compared as
different from the number `6`.


| Param | Type | Description |
| --- | --- | --- |
| samplingRatio | `*` | The raw option value. |


**Returns**: `number` | `null` - The sample count to use, or `null` for the default.  

### setIncludeHidden

::: ask-about-api setIncludeHidden|SamplesGenerator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/6941cffd7848ac6d33d5e9583421e7cc49932e3c/handsontable/handsontable/tmp/utils/samplesGenerator.ts#L109

:::

_samplesGenerator.setIncludeHidden(includeHidden)_

Sets the sampler to the mode where it will generate samples for hidden indexes.


| Param | Type | Description |
| --- | --- | --- |
| includeHidden | `boolean` | `true` to include hidden indexes, `false` otherwise. |


