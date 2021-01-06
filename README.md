[![npm version](https://img.shields.io/npm/v/@openactive/skos)](https://www.npmjs.com/package/@openactive/skos)
[![Build Status](https://travis-ci.org/openactive/skos.js.svg?branch=master)](https://travis-ci.org/openactive/skos.js)
[![Coverage Status](https://coveralls.io/repos/github/openactive/skos.js/badge.svg?branch=master)](https://coveralls.io/github/openactive/skos.js?branch=master)

# SKOS.js
Simple JavaScript library to wrap the [OpenActive](https://www.openactive.io) JSON-LD representation of [SKOS](https://www.w3.org/TR/skos-reference).

### Compatible Platforms and Browsers
SKOS.js will run on any version of Node.js, and is built to use CommonJS so can be built with Webpack and Browserify.

SKOS.js has been tested on IE 9 and above without transpilation or polyfills, and all other major browsers.

## Installation

### Dependencies
SKOS.js does not have any runtime dependencies. It is written natively in ES5.

### As a library

Simply install using npm:
```sh
$ npm install @openactive/skos --save
```

Now you can begin using it on either the client or server side.

```js
var skos = require('@openactive/skos');

// returns an array of the names of all types of Yoga
var response = request('GET', 'https://openactive.io/activity-list', { headers: { accept: 'application/ld+json' } });
if (response && response.statusCode == 200) {
  var activityListJsonObject = JSON.parse(response.getBody('utf8'));

  var scheme = new skos.ConceptScheme(activityListJsonObject);
  return scheme.getConceptByLabel('Yoga').getBroaderTransitive().map(concept => concept.prefLabel);
}
```

### In the browser

See the [live demo](https://www.openactive.io/skos.js/demo/).

```html
<script src="https://code.jquery.com/jquery-3.3.1.min.js" type="text/javascript"></script>
<script src="https://cdn.jsdelivr.net/npm/@openactive/skos/dist/skos.min.js" type="text/javascript"></script>
<script type="text/javascript">
  $.getJSON('https://openactive.io/activity-list/activity-list.jsonld', function(activityListJsonObject) {
    var scheme = new skos.ConceptScheme(activityListJsonObject);
    var labels = scheme.getConceptByLabel('Yoga').getNarrowerTransitive();
    $.each(labels, function(index, concept) {
      $('#activity-list').append($('<p>', {
        text: concept.prefLabel
      }));
    });
  });
</script>
```

# API Reference
Note this library is written in ES5 to provide client-side compatibility
without requiring transpiling. It has been tested on IE9 upwards.


* [skos](#module_skos)
    * [~ConceptScheme](#module_skos..ConceptScheme)
        * [new ConceptScheme(scheme, [id], [filter])](#new_module_skos..ConceptScheme_new)
        * [.getConceptByID(id)](#module_skos..ConceptScheme+getConceptByID) ⇒ <code>Concept</code>
        * [.getConceptByLabel(label)](#module_skos..ConceptScheme+getConceptByLabel) ⇒ <code>Concept</code>
        * [.getAllConcepts()](#module_skos..ConceptScheme+getAllConcepts) ⇒ <code>Array</code>
        * [.getAllConceptsByID()](#module_skos..ConceptScheme+getAllConceptsByID) ⇒ <code>Array</code>
        * [.getAllConceptsByLabel()](#module_skos..ConceptScheme+getAllConceptsByLabel) ⇒ <code>Object</code>
        * [.getTopConcepts()](#module_skos..ConceptScheme+getTopConcepts) ⇒ <code>Array</code>
        * [.getJSON()](#module_skos..ConceptScheme+getJSON) ⇒ <code>Object</code>
        * [.toString()](#module_skos..ConceptScheme+toString) ⇒ <code>String</code>
        * [.generateSubset(filter)](#module_skos..ConceptScheme+generateSubset) ⇒ <code>ConceptScheme</code>
    * [~Concept](#module_skos..Concept)
        * [new Concept(concept)](#new_module_skos..Concept_new)
        * _instance_
            * [.getNarrower()](#module_skos..Concept+getNarrower) ⇒ <code>Array</code>
            * [.getNarrowerTransitive()](#module_skos..Concept+getNarrowerTransitive) ⇒ <code>Array</code>
            * [.getBroader()](#module_skos..Concept+getBroader) ⇒ <code>Array</code>
            * [.getBroaderTransitive()](#module_skos..Concept+getBroaderTransitive) ⇒ <code>Array</code>
            * [.getRelated()](#module_skos..Concept+getRelated) ⇒ <code>Array</code>
            * [.equals(concept)](#module_skos..Concept+equals) ⇒ <code>boolean</code>
            * [.toString()](#module_skos..Concept+toString) ⇒ <code>String</code>
            * [.getJSON()](#module_skos..Concept+getJSON) ⇒ <code>Object</code>
        * _static_
            * [.compare(a, b)](#module_skos..Concept.compare) ⇒ <code>Integer</code>

<a name="module_skos..ConceptScheme"></a>

### skos~ConceptScheme
**Kind**: inner class of [<code>skos</code>](#module_skos)  
**Access**: public  

* [~ConceptScheme](#module_skos..ConceptScheme)
    * [new ConceptScheme(scheme, [id], [filter])](#new_module_skos..ConceptScheme_new)
    * [.getConceptByID(id)](#module_skos..ConceptScheme+getConceptByID) ⇒ <code>Concept</code>
    * [.getConceptByLabel(label)](#module_skos..ConceptScheme+getConceptByLabel) ⇒ <code>Concept</code>
    * [.getAllConcepts()](#module_skos..ConceptScheme+getAllConcepts) ⇒ <code>Array</code>
    * [.getAllConceptsByID()](#module_skos..ConceptScheme+getAllConceptsByID) ⇒ <code>Array</code>
    * [.getAllConceptsByLabel()](#module_skos..ConceptScheme+getAllConceptsByLabel) ⇒ <code>Object</code>
    * [.getTopConcepts()](#module_skos..ConceptScheme+getTopConcepts) ⇒ <code>Array</code>
    * [.getJSON()](#module_skos..ConceptScheme+getJSON) ⇒ <code>Object</code>
    * [.toString()](#module_skos..ConceptScheme+toString) ⇒ <code>String</code>
    * [.generateSubset(filter)](#module_skos..ConceptScheme+generateSubset) ⇒ <code>ConceptScheme</code>

<a name="new_module_skos..ConceptScheme_new"></a>

#### new ConceptScheme(scheme, [id], [filter])
ConceptScheme constructor.


| Param | Type | Description |
| --- | --- | --- |
| scheme | <code>Object</code> \| <code>Array</code> | Either a JSON ConceptScheme object *OR* Array of Concepts |
| [id] | <code>String</code> | The scheme id, only required if an array is provided for scheme |
| [filter] | <code>Object</code> \| <code>Array</code> | Filter of ids to be included in the ConceptScheme. Values in the object literal must be true or contain an object of keys which can be assigned on each resulting Concept. Prefer generateSubset() for most use cases. |

**Example**  
```js
// returns Concept for American Football
var activityListJsonObject = JSON.parse(response.getBody('utf8'));
var scheme = new skos.ConceptScheme(activityListJsonObject);
return scheme.getConceptByID('https://openactive.io/activity-list#9caeb442-2834-4859-b660-9172ed61ee71');
```
**Example**  
```js
// returns ConceptScheme for a provided custom subset of the Activity List
var activityListConceptArray = myApiResult.items;
var scheme = new skos.ConceptScheme(activityListConceptArray, 'https://openactive.io/activity-list');
return scheme;
```
<a name="module_skos..ConceptScheme+getConceptByID"></a>

#### conceptScheme.getConceptByID(id) ⇒ <code>Concept</code>
Get Concept by ID

**Kind**: instance method of [<code>ConceptScheme</code>](#module_skos..ConceptScheme)  
**Returns**: <code>Concept</code> - the Concept, or null if no matching concept exists  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>String</code> | The id of the Concept |

**Example**  
```js
// returns Concept for American Football
var scheme = new skos.ConceptScheme(activityListJsonObject);
return scheme.getConceptByID('https://openactive.io/activity-list#9caeb442-2834-4859-b660-9172ed61ee71');
```
<a name="module_skos..ConceptScheme+getConceptByLabel"></a>

#### conceptScheme.getConceptByLabel(label) ⇒ <code>Concept</code>
Get Concept by prefLabel / altLabel

This will return a case-sensitive exact match based on the prefLabel and altLabel

**Kind**: instance method of [<code>ConceptScheme</code>](#module_skos..ConceptScheme)  
**Returns**: <code>Concept</code> - the Concept, or null if no matching concept exists  

| Param | Type | Description |
| --- | --- | --- |
| label | <code>String</code> | The label of the Concept |

**Example**  
```js
// returns Concept for American Football
var scheme = new skos.ConceptScheme(activityListJsonObject);
return scheme.getConceptByLabel('American Football');
```
<a name="module_skos..ConceptScheme+getAllConcepts"></a>

#### conceptScheme.getAllConcepts() ⇒ <code>Array</code>
Return an array of all concepts in the scheme.

**Kind**: instance method of [<code>ConceptScheme</code>](#module_skos..ConceptScheme)  
**Returns**: <code>Array</code> - an array of Concept  
<a name="module_skos..ConceptScheme+getAllConceptsByID"></a>

#### conceptScheme.getAllConceptsByID() ⇒ <code>Array</code>
Return a map of all concepts in the scheme, keyed by ID. This can be useful to power autocomplete dropdowns.

**Kind**: instance method of [<code>ConceptScheme</code>](#module_skos..ConceptScheme)  
**Returns**: <code>Array</code> - an map of Concept by ID  
<a name="module_skos..ConceptScheme+getAllConceptsByLabel"></a>

#### conceptScheme.getAllConceptsByLabel() ⇒ <code>Object</code>
Return a map of all concepts in the scheme, keyed by altLabel and prefLabel. This can be useful to power autocomplete dropdowns.

**Kind**: instance method of [<code>ConceptScheme</code>](#module_skos..ConceptScheme)  
**Returns**: <code>Object</code> - a map of Concept by altLabel / prefLabel  
<a name="module_skos..ConceptScheme+getTopConcepts"></a>

#### conceptScheme.getTopConcepts() ⇒ <code>Array</code>
Return an array of the top concepts in a hierarchical scheme.

**Kind**: instance method of [<code>ConceptScheme</code>](#module_skos..ConceptScheme)  
**Returns**: <code>Array</code> - an array of Concept  
<a name="module_skos..ConceptScheme+getJSON"></a>

#### conceptScheme.getJSON() ⇒ <code>Object</code>
Return the original JSON object representing the ConceptScheme.

**Kind**: instance method of [<code>ConceptScheme</code>](#module_skos..ConceptScheme)  
**Returns**: <code>Object</code> - a JSON object  
<a name="module_skos..ConceptScheme+toString"></a>

#### conceptScheme.toString() ⇒ <code>String</code>
Return a string rendering the ConceptScheme as Markdown.

**Kind**: instance method of [<code>ConceptScheme</code>](#module_skos..ConceptScheme)  
**Returns**: <code>String</code> - a Markdown string  
<a name="module_skos..ConceptScheme+generateSubset"></a>

#### conceptScheme.generateSubset(filter) ⇒ <code>ConceptScheme</code>
Generate ConceptScheme subset

The subset will be generated to include all broader Concepts of any of those included in the filter, and will have pruned any references to related Concepts that are not included in the resulting subset.

**Kind**: instance method of [<code>ConceptScheme</code>](#module_skos..ConceptScheme)  
**Returns**: <code>ConceptScheme</code> - the ConceptScheme subset  

| Param | Type | Description |
| --- | --- | --- |
| filter | <code>Object</code> \| <code>Array</code> | Filter of ids to be included in the ConceptScheme. Values in the object literal must be true or contain an object of keys which can be assigned on each resulting Concept. |

**Example**  
```js
// returns ConceptScheme subset of just Pole Vault and its broader concepts (Athletics)
var scheme = new skos.ConceptScheme(activityListJsonObject);
return scheme.generateSubset(['https://openactive.io/activity-list#5df80216-2af8-4ad3-8120-a34c11ea1a87']);
```
**Example**  
```js
// returns ConceptScheme subset of just Pole Vault and its broader concepts (Athletics), including metadata attached to Pole Vault.
var scheme = new skos.ConceptScheme(activityListJsonObject);
return scheme.generateSubset({'https://openactive.io/activity-list#5df80216-2af8-4ad3-8120-a34c11ea1a87': {'ext:metadata': 34}});
```
<a name="module_skos..Concept"></a>

### skos~Concept
**Kind**: inner class of [<code>skos</code>](#module_skos)  

* [~Concept](#module_skos..Concept)
    * [new Concept(concept)](#new_module_skos..Concept_new)
    * _instance_
        * [.getNarrower()](#module_skos..Concept+getNarrower) ⇒ <code>Array</code>
        * [.getNarrowerTransitive()](#module_skos..Concept+getNarrowerTransitive) ⇒ <code>Array</code>
        * [.getBroader()](#module_skos..Concept+getBroader) ⇒ <code>Array</code>
        * [.getBroaderTransitive()](#module_skos..Concept+getBroaderTransitive) ⇒ <code>Array</code>
        * [.getRelated()](#module_skos..Concept+getRelated) ⇒ <code>Array</code>
        * [.equals(concept)](#module_skos..Concept+equals) ⇒ <code>boolean</code>
        * [.toString()](#module_skos..Concept+toString) ⇒ <code>String</code>
        * [.getJSON()](#module_skos..Concept+getJSON) ⇒ <code>Object</code>
    * _static_
        * [.compare(a, b)](#module_skos..Concept.compare) ⇒ <code>Integer</code>

<a name="new_module_skos..Concept_new"></a>

#### new Concept(concept)
Concept class.

A wrapper for the SKOS Concept JSON object


| Param | Type | Description |
| --- | --- | --- |
| concept | <code>Object</code> | A Concept JSON object |

<a name="module_skos..Concept+getNarrower"></a>

#### concept.getNarrower() ⇒ <code>Array</code>
Get an array of immediately narrower concepts.

**Kind**: instance method of [<code>Concept</code>](#module_skos..Concept)  
**Returns**: <code>Array</code> - an array of Concept  
**Example**  
```js
// returns only the types of Yoga that are one level below "Yoga"
var scheme = new skos.ConceptScheme(activityListJsonObject);
return scheme.getConceptByLabel('Yoga').getNarrower();
```
<a name="module_skos..Concept+getNarrowerTransitive"></a>

#### concept.getNarrowerTransitive() ⇒ <code>Array</code>
Get an array of all narrower concepts following transitivity (all children).

**Kind**: instance method of [<code>Concept</code>](#module_skos..Concept)  
**Returns**: <code>Array</code> - an array of Concept  
**Example**  
```js
// returns all type of Yoga
var scheme = new skos.ConceptScheme(activityListJsonObject);
return scheme.getConceptByLabel('Yoga').getNarrowerTransitive();
```
<a name="module_skos..Concept+getBroader"></a>

#### concept.getBroader() ⇒ <code>Array</code>
Get an array of immediately broader concepts.

**Kind**: instance method of [<code>Concept</code>](#module_skos..Concept)  
**Returns**: <code>Array</code> - an array of Concept  
**Example**  
```js
// returns only the next level up in the hierarchy
var scheme = new skos.ConceptScheme(activityListJsonObject);
return scheme.getConceptByLabel('Yoga')getBroader();
```
<a name="module_skos..Concept+getBroaderTransitive"></a>

#### concept.getBroaderTransitive() ⇒ <code>Array</code>
Get an array of all broader concepts following transitivity (all parents).

**Kind**: instance method of [<code>Concept</code>](#module_skos..Concept)  
**Returns**: <code>Array</code> - an array of Concept  
**Example**  
```js
// returns all the higher level categories above Yoga
var scheme = new skos.ConceptScheme(activityListJsonObject);
return scheme.getConceptByLabel('Yoga').getBroaderTransitive();
```
<a name="module_skos..Concept+getRelated"></a>

#### concept.getRelated() ⇒ <code>Array</code>
Get an array of related concepts.

**Kind**: instance method of [<code>Concept</code>](#module_skos..Concept)  
**Returns**: <code>Array</code> - an array of Concept  
<a name="module_skos..Concept+equals"></a>

#### concept.equals(concept) ⇒ <code>boolean</code>
Return true if two Concepts are equal and of the same type.
If a raw JSON Concept is supplied it is coerced into a Concept object.

**Kind**: instance method of [<code>Concept</code>](#module_skos..Concept)  
**Returns**: <code>boolean</code> - representing whether the two Concepts are equal  

| Param | Type | Description |
| --- | --- | --- |
| concept | <code>Concept</code> | Concept to compare |

<a name="module_skos..Concept+toString"></a>

#### concept.toString() ⇒ <code>String</code>
Return the prefLabel of the Concept.

**Kind**: instance method of [<code>Concept</code>](#module_skos..Concept)  
**Returns**: <code>String</code> - a JSON string  
<a name="module_skos..Concept+getJSON"></a>

#### concept.getJSON() ⇒ <code>Object</code>
Return the original JSON object representing the Concept.

**Kind**: instance method of [<code>Concept</code>](#module_skos..Concept)  
**Returns**: <code>Object</code> - a JSON object  
<a name="module_skos..Concept.compare"></a>

#### Concept.compare(a, b) ⇒ <code>Integer</code>
Compare two Concepts based on prefLabel, for use with native .sort()

**Kind**: static method of [<code>Concept</code>](#module_skos..Concept)  
**Returns**: <code>Integer</code> - representing which should be sorted above the other  

| Param | Type | Description |
| --- | --- | --- |
| a | <code>Concept</code> | Concept A |
| b | <code>Concept</code> | Concept B |

**Example**  
```js
var sortedConcepts = concepts.sort(skos.Concept.compare);
```

* * *
