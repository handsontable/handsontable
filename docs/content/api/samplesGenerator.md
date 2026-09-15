---
title: SamplesGenerator
metaTitle: SamplesGenerator - JavaScript Data Grid | Handsontable
permalink: /api/samples-generator
canonicalUrl: /api/samples-generator
searchCategory: API Reference
hotPlugin: false
editLink: false
id: n9lf8vn4
description: Options, members, and methods of Handsontable's SamplesGenerator API.
react:
  id: gh3nicnu
  metaTitle: SamplesGenerator - React Data Grid | Handsontable
angular:
  id: z8s1b9qr
  metaTitle: SamplesGenerator - Angular Data Grid | Handsontable
---

[[toc]]

## Description

Initializes the samples generator with the data factory function used to retrieve cell values during sampling.


## Members

### allowDuplicates

::: ask-about-api allowDuplicates|SamplesGenerator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/utils/samplesGenerator.ts#L205

:::

_samplesGenerator.allowDuplicates : boolean_

`true` if duplicate samples collection should be allowed, `false` otherwise.

**Default**: <code>{false}</code>  


### customSampleCount

::: ask-about-api customSampleCount|SamplesGenerator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/utils/samplesGenerator.ts#L199

:::

_samplesGenerator.customSampleCount : number_

Custom number of samples to take of each value length.

**Default**: <code>{null}</code>  


### dataFactory

::: ask-about-api dataFactory|SamplesGenerator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/utils/samplesGenerator.ts#L193

:::

_samplesGenerator.dataFactory : function_

Function which give the data to collect samples.



### includeHidden

::: ask-about-api includeHidden|SamplesGenerator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/utils/samplesGenerator.ts#L211

:::

_samplesGenerator.includeHidden : boolean_

`true` if hidden samples should be included, `false` otherwise.

**Default**: <code>{false}</code>  


### SAMPLE_COUNT

::: ask-about-api SAMPLE_COUNT|SamplesGenerator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/utils/samplesGenerator.ts#L52

:::

_SamplesGenerator.SAMPLE\_COUNT : number_

Number of samples to take of each value length.



### samples

::: ask-about-api samples|SamplesGenerator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/utils/samplesGenerator.ts#L188

:::

_samplesGenerator.samples : Map_

Samples prepared for calculations.

**Default**: <code>{null}</code>  

## Methods

### generateColumnSamples

::: ask-about-api generateColumnSamples|SamplesGenerator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/utils/samplesGenerator.ts#L101

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

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/utils/samplesGenerator.ts#L92

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

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/utils/samplesGenerator.ts#L135

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

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/utils/samplesGenerator.ts#L168

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

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/utils/samplesGenerator.ts#L111

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

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/utils/samplesGenerator.ts#L59

:::

_samplesGenerator.getSampleCount() ⇒ number_

Get the sample count for this instance.



### setAllowDuplicates

::: ask-about-api setAllowDuplicates|SamplesGenerator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/utils/samplesGenerator.ts#L76

:::

_samplesGenerator.setAllowDuplicates(allowDuplicates)_

Set if the generator should accept duplicate values.


| Param | Type | Description |
| --- | --- | --- |
| allowDuplicates | `boolean` | `true` to allow duplicate values. |



### setIncludeHidden

::: ask-about-api setIncludeHidden|SamplesGenerator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/utils/samplesGenerator.ts#L83

:::

_samplesGenerator.setIncludeHidden(includeHidden)_

Sets the sampler to the mode where it will generate samples for hidden indexes.


| Param | Type | Description |
| --- | --- | --- |
| includeHidden | `boolean` | `true` to include hidden indexes, `false` otherwise. |



### setSampleCount

::: ask-about-api setSampleCount|SamplesGenerator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/utils/samplesGenerator.ts#L69

:::

_samplesGenerator.setSampleCount(sampleCount)_

Set the sample count.


| Param | Type | Description |
| --- | --- | --- |
| sampleCount | `number` | Number of samples to be collected. |



## Description

Initializes the samples generator with the data factory function used to retrieve cell values during sampling.


## Members

### allowDuplicates

::: ask-about-api allowDuplicates|SamplesGenerator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/utils/samplesGenerator.ts#L205

:::

_samplesGenerator.allowDuplicates : boolean_

`true` if duplicate samples collection should be allowed, `false` otherwise.

**Default**: <code>{false}</code>  


### customSampleCount

::: ask-about-api customSampleCount|SamplesGenerator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/utils/samplesGenerator.ts#L199

:::

_samplesGenerator.customSampleCount : number_

Custom number of samples to take of each value length.

**Default**: <code>{null}</code>  


### dataFactory

::: ask-about-api dataFactory|SamplesGenerator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/utils/samplesGenerator.ts#L193

:::

_samplesGenerator.dataFactory : function_

Function which give the data to collect samples.



### includeHidden

::: ask-about-api includeHidden|SamplesGenerator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/utils/samplesGenerator.ts#L211

:::

_samplesGenerator.includeHidden : boolean_

`true` if hidden samples should be included, `false` otherwise.

**Default**: <code>{false}</code>  


### SAMPLE_COUNT

::: ask-about-api SAMPLE_COUNT|SamplesGenerator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/utils/samplesGenerator.ts#L52

:::

_SamplesGenerator.SAMPLE\_COUNT : number_

Number of samples to take of each value length.



### samples

::: ask-about-api samples|SamplesGenerator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/utils/samplesGenerator.ts#L188

:::

_samplesGenerator.samples : Map_

Samples prepared for calculations.

**Default**: <code>{null}</code>  

## Methods

### generateColumnSamples

::: ask-about-api generateColumnSamples|SamplesGenerator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/utils/samplesGenerator.ts#L101

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

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/utils/samplesGenerator.ts#L92

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

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/utils/samplesGenerator.ts#L135

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

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/utils/samplesGenerator.ts#L168

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

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/utils/samplesGenerator.ts#L111

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

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/utils/samplesGenerator.ts#L59

:::

_samplesGenerator.getSampleCount() ⇒ number_

Get the sample count for this instance.



### setAllowDuplicates

::: ask-about-api setAllowDuplicates|SamplesGenerator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/utils/samplesGenerator.ts#L76

:::

_samplesGenerator.setAllowDuplicates(allowDuplicates)_

Set if the generator should accept duplicate values.


| Param | Type | Description |
| --- | --- | --- |
| allowDuplicates | `boolean` | `true` to allow duplicate values. |



### setIncludeHidden

::: ask-about-api setIncludeHidden|SamplesGenerator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/utils/samplesGenerator.ts#L83

:::

_samplesGenerator.setIncludeHidden(includeHidden)_

Sets the sampler to the mode where it will generate samples for hidden indexes.


| Param | Type | Description |
| --- | --- | --- |
| includeHidden | `boolean` | `true` to include hidden indexes, `false` otherwise. |



### setSampleCount

::: ask-about-api setSampleCount|SamplesGenerator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/d245350fda6e344e4c2f941f434ac2a733697d46/prod-docs-18.1/handsontable/tmp/utils/samplesGenerator.ts#L69

:::

_samplesGenerator.setSampleCount(sampleCount)_

Set the sample count.


| Param | Type | Description |
| --- | --- | --- |
| sampleCount | `number` | Number of samples to be collected. |


