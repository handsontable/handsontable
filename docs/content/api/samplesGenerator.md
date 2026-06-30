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

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/samplesGenerator.ts#L170

:::

_samplesGenerator.allowDuplicates : boolean_

`true` if duplicate samples collection should be allowed, `false` otherwise.

**Default**: <code>{false}</code>  


### customSampleCount

::: ask-about-api customSampleCount|SamplesGenerator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/samplesGenerator.ts#L164

:::

_samplesGenerator.customSampleCount : number_

Custom number of samples to take of each value length.

**Default**: <code>{null}</code>  


### dataFactory

::: ask-about-api dataFactory|SamplesGenerator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/samplesGenerator.ts#L158

:::

_samplesGenerator.dataFactory : function_

Function which give the data to collect samples.



### includeHidden

::: ask-about-api includeHidden|SamplesGenerator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/samplesGenerator.ts#L176

:::

_samplesGenerator.includeHidden : boolean_

`true` if hidden samples should be included, `false` otherwise.

**Default**: <code>{false}</code>  


### SAMPLE_COUNT

::: ask-about-api SAMPLE_COUNT|SamplesGenerator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/samplesGenerator.ts#L22

:::

_SamplesGenerator.SAMPLE\_COUNT : number_

Number of samples to take of each value length.



### samples

::: ask-about-api samples|SamplesGenerator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/samplesGenerator.ts#L153

:::

_samplesGenerator.samples : Map_

Samples prepared for calculations.

**Default**: <code>{null}</code>  

## Methods

### generateColumnSamples

::: ask-about-api generateColumnSamples|SamplesGenerator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/samplesGenerator.ts#L71

:::

_samplesGenerator.generateColumnSamples(colRange, rowRange) ⇒ object_

Generate samples for column. You can control which area should be sampled by passing `colRange` object and `rowRange` object.


| Param | Type | Description |
| --- | --- | --- |
| colRange | `object` | Column index. |
| rowRange | `object` | Column index. |



### generateRowSamples

::: ask-about-api generateRowSamples|SamplesGenerator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/samplesGenerator.ts#L62

:::

_samplesGenerator.generateRowSamples(rowRange, colRange) ⇒ object_

Generate samples for row. You can control which area should be sampled by passing `rowRange` object and `colRange` object.


| Param | Type | Description |
| --- | --- | --- |
| rowRange | `object` <br/> `number` | The rows range to generate the samples. |
| colRange | `object` | The column range to generate the samples. |



### generateSample

::: ask-about-api generateSample|SamplesGenerator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/samplesGenerator.ts#L100

:::

_samplesGenerator.generateSample(type, range, specifierValue) ⇒ Map_

Generate sample for specified type (`row` or `col`).


| Param | Type | Description |
| --- | --- | --- |
| type | `string` | Samples type `row` or `col`. |
| range | `object` | The range to generate the samples. |
| specifierValue | `number` | The range to generate the samples. |



### generateSamples

::: ask-about-api generateSamples|SamplesGenerator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/samplesGenerator.ts#L81

:::

_samplesGenerator.generateSamples(type, range, specifierRange) ⇒ Map_

Generate collection of samples.


| Param | Type | Description |
| --- | --- | --- |
| type | `string` | Type to generate. Can be `col` or `row`. |
| range | `object` | The range to generate the samples. |
| specifierRange | `object` <br/> `number` | The range to generate the samples. |



### getSampleCount

::: ask-about-api getSampleCount|SamplesGenerator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/samplesGenerator.ts#L29

:::

_samplesGenerator.getSampleCount() ⇒ number_

Get the sample count for this instance.



### setAllowDuplicates

::: ask-about-api setAllowDuplicates|SamplesGenerator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/samplesGenerator.ts#L46

:::

_samplesGenerator.setAllowDuplicates(allowDuplicates)_

Set if the generator should accept duplicate values.


| Param | Type | Description |
| --- | --- | --- |
| allowDuplicates | `boolean` | `true` to allow duplicate values. |



### setIncludeHidden

::: ask-about-api setIncludeHidden|SamplesGenerator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/samplesGenerator.ts#L53

:::

_samplesGenerator.setIncludeHidden(includeHidden)_

Sets the sampler to the mode where it will generate samples for hidden indexes.


| Param | Type | Description |
| --- | --- | --- |
| includeHidden | `boolean` | `true` to include hidden indexes, `false` otherwise. |



### setSampleCount

::: ask-about-api setSampleCount|SamplesGenerator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/samplesGenerator.ts#L39

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

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/samplesGenerator.ts#L170

:::

_samplesGenerator.allowDuplicates : boolean_

`true` if duplicate samples collection should be allowed, `false` otherwise.

**Default**: <code>{false}</code>  


### customSampleCount

::: ask-about-api customSampleCount|SamplesGenerator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/samplesGenerator.ts#L164

:::

_samplesGenerator.customSampleCount : number_

Custom number of samples to take of each value length.

**Default**: <code>{null}</code>  


### dataFactory

::: ask-about-api dataFactory|SamplesGenerator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/samplesGenerator.ts#L158

:::

_samplesGenerator.dataFactory : function_

Function which give the data to collect samples.



### includeHidden

::: ask-about-api includeHidden|SamplesGenerator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/samplesGenerator.ts#L176

:::

_samplesGenerator.includeHidden : boolean_

`true` if hidden samples should be included, `false` otherwise.

**Default**: <code>{false}</code>  


### SAMPLE_COUNT

::: ask-about-api SAMPLE_COUNT|SamplesGenerator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/samplesGenerator.ts#L22

:::

_SamplesGenerator.SAMPLE\_COUNT : number_

Number of samples to take of each value length.



### samples

::: ask-about-api samples|SamplesGenerator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/samplesGenerator.ts#L153

:::

_samplesGenerator.samples : Map_

Samples prepared for calculations.

**Default**: <code>{null}</code>  

## Methods

### generateColumnSamples

::: ask-about-api generateColumnSamples|SamplesGenerator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/samplesGenerator.ts#L71

:::

_samplesGenerator.generateColumnSamples(colRange, rowRange) ⇒ object_

Generate samples for column. You can control which area should be sampled by passing `colRange` object and `rowRange` object.


| Param | Type | Description |
| --- | --- | --- |
| colRange | `object` | Column index. |
| rowRange | `object` | Column index. |



### generateRowSamples

::: ask-about-api generateRowSamples|SamplesGenerator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/samplesGenerator.ts#L62

:::

_samplesGenerator.generateRowSamples(rowRange, colRange) ⇒ object_

Generate samples for row. You can control which area should be sampled by passing `rowRange` object and `colRange` object.


| Param | Type | Description |
| --- | --- | --- |
| rowRange | `object` <br/> `number` | The rows range to generate the samples. |
| colRange | `object` | The column range to generate the samples. |



### generateSample

::: ask-about-api generateSample|SamplesGenerator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/samplesGenerator.ts#L100

:::

_samplesGenerator.generateSample(type, range, specifierValue) ⇒ Map_

Generate sample for specified type (`row` or `col`).


| Param | Type | Description |
| --- | --- | --- |
| type | `string` | Samples type `row` or `col`. |
| range | `object` | The range to generate the samples. |
| specifierValue | `number` | The range to generate the samples. |



### generateSamples

::: ask-about-api generateSamples|SamplesGenerator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/samplesGenerator.ts#L81

:::

_samplesGenerator.generateSamples(type, range, specifierRange) ⇒ Map_

Generate collection of samples.


| Param | Type | Description |
| --- | --- | --- |
| type | `string` | Type to generate. Can be `col` or `row`. |
| range | `object` | The range to generate the samples. |
| specifierRange | `object` <br/> `number` | The range to generate the samples. |



### getSampleCount

::: ask-about-api getSampleCount|SamplesGenerator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/samplesGenerator.ts#L29

:::

_samplesGenerator.getSampleCount() ⇒ number_

Get the sample count for this instance.



### setAllowDuplicates

::: ask-about-api setAllowDuplicates|SamplesGenerator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/samplesGenerator.ts#L46

:::

_samplesGenerator.setAllowDuplicates(allowDuplicates)_

Set if the generator should accept duplicate values.


| Param | Type | Description |
| --- | --- | --- |
| allowDuplicates | `boolean` | `true` to allow duplicate values. |



### setIncludeHidden

::: ask-about-api setIncludeHidden|SamplesGenerator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/samplesGenerator.ts#L53

:::

_samplesGenerator.setIncludeHidden(includeHidden)_

Sets the sampler to the mode where it will generate samples for hidden indexes.


| Param | Type | Description |
| --- | --- | --- |
| includeHidden | `boolean` | `true` to include hidden indexes, `false` otherwise. |



### setSampleCount

::: ask-about-api setSampleCount|SamplesGenerator

:::

::: source-code-link https://github.com/handsontable/handsontable/blob/cc633febde18fe826bc52392f0b4a580fde1c719/handsontable-develop/handsontable/tmp/utils/samplesGenerator.ts#L39

:::

_samplesGenerator.setSampleCount(sampleCount)_

Set the sample count.


| Param | Type | Description |
| --- | --- | --- |
| sampleCount | `number` | Number of samples to be collected. |


