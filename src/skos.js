// ==ClosureCompiler==
// @output_file_name skos.min.js
// @compilation_level SIMPLE_OPTIMIZATIONS
// ==/ClosureCompiler==

'use strict';

/**
 * Note this library is written in ES5 to provide client-side compatibility
 * without requiring transpiling. It has been tested on IE9 upwards.
 * @module skos
 */

/**
 * ConceptScheme constructor.
 * @public
 * @example
 * // returns Concept for American Football
 * var activityListJsonObject = JSON.parse(response.getBody('utf8'));
 * var scheme = new skos.ConceptScheme(activityListJsonObject);
 * return scheme.getConceptByID('https://openactive.io/activity-list#9caeb442-2834-4859-b660-9172ed61ee71');
 *
 * @example
 * // returns ConceptScheme for a provided custom subset of the Activity List
 * var activityListConceptArray = myApiResult.items;
 * var scheme = new skos.ConceptScheme(activityListConceptArray, 'https://openactive.io/activity-list');
 * return scheme;
 *
 * @constructor
 * @param {Object | Array} scheme  Either a JSON ConceptScheme object *OR* Array of Concepts
 * @param {String} [id] The scheme id, only required if an array is provided for scheme
 */
function ConceptScheme(scheme, id) {
  // Construct from scheme from array if needed
  if (Array.isArray(scheme)) {
    if (typeof id === 'undefined') throw new Error('ID must be supplied with Concept array');
    this.scheme = {
      'type': 'ConceptScheme',
      'id': id,
      'concept': scheme
    };
  } else if (typeof scheme === 'object' && scheme !== null && typeof scheme.concept !== 'undefined' && typeof scheme.id !== 'undefined' && scheme.type === 'ConceptScheme') {
    this.scheme = scheme;
  } else {
    throw new Error('Invalid scheme supplied to ConceptScheme');
  }

  // Create list of parent ConceptScheme
  var topConcepts = [];
  var labelIndex = {};
  var conceptIndex = {};
  var conceptArray = [];

  // Declaire once for the following loops
  var concept;

  // Create an index of all concepts by ID
  for (var i = 0; i < this.scheme.concept.length; i++) {
    concept = new Concept(this.scheme.concept[i]);
    concept._partOfScheme = true;

    // Add to indexes
    conceptIndex[concept.id] = concept;
    labelIndex[concept.prefLabel] = concept;
    conceptArray.push(concept);

    // Add altLabels to prefLabel index. Ignore hidden labels,
    // as a good autocomplete will handle fuzzy matching.
    if (concept.altLabel && Array.isArray(concept.altLabel)) {
      for (var j = 0; j < concept.altLabel.length; j++) {
        labelIndex[concept.altLabel[j]] = concept;
      }
    }

    // If topConcept then also add to topConcepts
    if (this.scheme.concept[i].topConceptOf === this.scheme.id) {
      topConcepts.push(concept);
    }
  }

  // Add ._broaderConcepts to all Concepts, throwing error for graph inconsistencies
  for (var k = 0; k < conceptArray.length; k++) {
    concept = conceptArray[k];
    var conceptBroaderDupCheck = {};
    var broader = concept._originalConcept.broader || concept._originalConcept.broaderTransitive || [];
    if (!Array.isArray(broader)) broader = [broader];
    for (var l = 0; l < broader.length; l++) {
      var broaderConceptId = broader[l];

      if (!conceptIndex[broaderConceptId]) {
        throw new Error('Invalid scheme supplied to ConceptScheme: Concept "' + concept.id + '" has referenced broader Concept "' + broaderConceptId + '", which was not found in scheme');
      } else if (conceptBroaderDupCheck[broaderConceptId] === true) {
        throw new Error('Invalid scheme supplied to ConceptScheme: Concept "' + concept.id + '" has duplicated broader references to "' + broaderConceptId + '"');
      } else {
        concept._broaderConcepts.push(conceptIndex[broaderConceptId]);
        conceptBroaderDupCheck[broaderConceptId] = true;
      }
    }
    if (concept._originalConcept.related && Array.isArray(concept._originalConcept.related)) {
      var conceptRelatedDupCheck = {};
      for (var m = 0; m < concept._originalConcept.related.length; m++) {
        var relatedConceptId = concept._originalConcept.related[m];
        if (!conceptIndex[relatedConceptId]) {
          throw new Error('Invalid scheme supplied to ConceptScheme: Concept "' + concept.id + '" has referenced related Concept "' + relatedConceptId + '", which was not found in scheme');
        } else if (conceptRelatedDupCheck[relatedConceptId] === true) {
          throw new Error('Invalid scheme supplied to ConceptScheme: Concept "' + concept.id + '" has duplicated related references to "' + relatedConceptId + '"');
        } else {
          concept._relatedConcepts.push(conceptIndex[relatedConceptId]);
          conceptRelatedDupCheck[relatedConceptId] = true;
        }
      }
    }
  }

  // Add ._narrowerConcepts to all Concepts
  for (var n = 0; n < conceptArray.length; n++) {
    concept = conceptArray[n];
    for (var p = 0; p < concept._broaderConcepts.length; p++) {
      concept._broaderConcepts[p]._narrowerConcepts.push(concept);
    }
  }

  this.topConcepts = topConcepts.sort(Concept.compare);
  this.index = conceptIndex;
  this.labelIndex = labelIndex;
}

/**
 * Get Concept by ID
 *
 * This will handle IDs with and without prefixes for OpenActive controlled vocabularies
 *
 * @example
 * // returns Concept for American Football
 * var scheme = new skos.ConceptScheme(activityListJsonObject);
 * return scheme.getConceptByID('https://openactive.io/activity-list#9caeb442-2834-4859-b660-9172ed61ee71');
 *
 * @example
 * // returns Concept for American Football using a prefixed ID
 * var scheme = new skos.ConceptScheme(activityListJsonObject);
 * return scheme.getConceptByID('oa:activity-list#9caeb442-2834-4859-b660-9172ed61ee71');
 *
 * @param {String} id  The id of the Concept
 * @return {Object} the Concept, or null if no matching concept exists
 */
ConceptScheme.prototype.getConceptByID = function getConceptByID(id) {
  // If the id is found, return the Concept
  if (this.index[id]) return this.index[id];
  // Otherwise return null
  return null;
};

/**
 * Get Concept by prefLabel / altLabel
 *
 * This will return a case-sensitive exact match based on the prefLabel and altLabel
 *
 * @example
 * // returns Concept for American Football
 * var scheme = new skos.ConceptScheme(activityListJsonObject);
 * return scheme.getConceptByLabel('American Football');
 *
 * @param {String} label  The label of the Concept
 * @return {Object} the Concept, or null if no matching concept exists
 */
ConceptScheme.prototype.getConceptByLabel = function getConceptByLabel(label) {
  // If the label is found, return the Concept
  return this.labelIndex[label] || null;
};

/**
 * Return an array of all concepts in the scheme.
 *
 * @return {Array} an array of Concept
 */
ConceptScheme.prototype.getAllConcepts = function getAllConcepts() {
  var index = this.index;
  // Equivalent of Object.values() with wider browser support
  return (Object.values ? Object.values(index) : Object.keys(index).map(function (key) { return index[key]; })).sort(Concept.compare);
};

/**
 * Return a map of all concepts in the scheme, keyed by ID. This can be useful to power autocomplete dropdowns.
 *
 * @return {Array} an map of Concept by ID
 */
ConceptScheme.prototype.getAllConceptsByID = function getAllConceptsByID() {
  return this.index;
};

/**
 * Return a map of all concepts in the scheme, keyed by altLabel and prefLabel. This can be useful to power autocomplete dropdowns.
 *
 * @return {Object} a map of Concept by altLabel / prefLabel
 */
ConceptScheme.prototype.getAllConceptsByLabel = function getAllConceptsByLabel() {
  return this.labelIndex;
};

/**
 * Return an array of the top concepts in a hierarchical scheme.
 *
 * @return {Array} an array of Concept
 */
ConceptScheme.prototype.getTopConcepts = function getTopConcepts() {
  return this.topConcepts;
};

/**
 * Return the original JSON object representing the ConceptScheme.
 *
 * @return {Object} a JSON object
 */
ConceptScheme.prototype.getJSON = function getJSON() {
  return this.scheme;
};

/**
 * Return a string rendering the ConceptScheme as Markdown.
 *
 * @return {String} a Markdown string
 */
ConceptScheme.prototype.toString = function toString() {
  function renderLines(thisConcept, tabWidth) {
    return thisConcept.getNarrower().reduce(function (lines, concept) {
      return lines.concat(renderLines(concept, tabWidth + 2));
    }, [Array(tabWidth).join(' ') + '- ' + thisConcept.toString()]);
  }

  return this.topConcepts.reduce(function (lines, concept) {
    return lines.concat(renderLines(concept, 1));
  }, []).join('\n');
};

/**
 * Concept class.
 *
 * A wrapper for the SKOS Concept JSON object
 *
 * @constructor
 * @param {Object} concept - A Concept JSON object
 */
function Concept(concept) {
  if (!(concept.prefLabel && concept.id && concept.type === 'Concept')) {
    throw new Error('Invalid concept: "' + concept.id + '"');
  }
  this.id = concept.id;
  this.prefLabel = concept.prefLabel;
  this.altLabel = concept.altLabel;
  this.hiddenLabel = concept.hiddenLabel;
  this.definition = concept.definition;
  this._partOfScheme = false;
  this._originalConcept = concept;
  this._broaderConcepts = [];
  this._narrowerConcepts = [];
  this._relatedConcepts = [];
}

/**
 * Get an array of immediately narrower concepts.
 *
 * @example
 * // returns only the types of Yoga that are one level below "Yoga"
 * var scheme = new skos.ConceptScheme(activityListJsonObject);
 * return scheme.getConceptByLabel('Yoga').getNarrower();
 *
 * @return {Array} an array of Concept
 */
Concept.prototype.getNarrower = function getNarrower() {
  if (!this._partOfScheme) throw new Error('Concept must have been generated by ConceptScheme to support getNarrower');
  return this._narrowerConcepts.sort(Concept.compare);
};

/**
 * Get an array of all narrower concepts following transitivity (all children).
 *
 * @example
 * // returns all type of Yoga
 * var scheme = new skos.ConceptScheme(activityListJsonObject);
 * return scheme.getConceptByLabel('Yoga').getNarrowerTransitive();
 *
 * @return {Array} an array of Concept
 */
Concept.prototype.getNarrowerTransitive = function getNarrowerTransitive() {
  if (!this._partOfScheme) throw new Error('Concept must have been generated by ConceptScheme to support getNarrowerTransitive');
  function setConceptsOnMap(concept, map) {
    for (var i = 0; i < concept._narrowerConcepts.length; i++) {
      var narrowerConcept = concept._narrowerConcepts[i];
      map[narrowerConcept.id] = narrowerConcept;
      setConceptsOnMap(narrowerConcept, map);
    }
    return map;
  }
  // Dedup results into a map
  var map = setConceptsOnMap(this, {});
  // Equivalent of Object.values() with wider browser support
  return (Object.values ? Object.values(map) : Object.keys(map).map(function (key) { return map[key]; })).sort(Concept.compare);
};

/**
 * Get an array of immediately broader concepts.
 *
 * @example
 * // returns only the next level up in the hierarchy
 * var scheme = new skos.ConceptScheme(activityListJsonObject);
 * return scheme.getConceptByLabel('Yoga')getBroader();
 *
 * @return {Array} an array of Concept
 */
Concept.prototype.getBroader = function getBroader() {
  if (!this._partOfScheme) throw new Error('Concept must have been generated by ConceptScheme to support getBroader');
  return this._broaderConcepts.sort(Concept.compare);
};

/**
 * Get an array of all broader concepts following transitivity (all parents).
 *
 * @example
 * // returns all the higher level categories above Yoga
 * var scheme = new skos.ConceptScheme(activityListJsonObject);
 * return scheme.getConceptByLabel('Yoga').getBroaderTransitive();
 *
 * @return {Array} an array of Concept
 */
Concept.prototype.getBroaderTransitive = function getBroaderTransitive() {
  if (!this._partOfScheme) throw new Error('Concept must have been generated by ConceptScheme to support getBroaderTransitive');
  function setConceptsOnMap(concept, map) {
    for (var i = 0; i < concept._broaderConcepts.length; i++) {
      var broaderConcept = concept._broaderConcepts[i];
      map[broaderConcept.id] = broaderConcept;
      setConceptsOnMap(broaderConcept, map);
    }
    return map;
  }
  // Dedup results into a map
  var map = setConceptsOnMap(this, {});
  // Equivalent of Object.values() with wider browser support
  return (Object.values ? Object.values(map) : Object.keys(map).map(function (key) { return map[key]; })).sort(Concept.compare);
};

/**
 * Get an array of related concepts.
 *
 * @return {Array} an array of Concept
 */
Concept.prototype.getRelated = function getRelated() {
  if (!this._partOfScheme) throw new Error('Concept must have been generated by ConceptScheme to support getRelated');
  return this._relatedConcepts.sort(Concept.compare);
};

/**
 * Return true if two Concepts are equal and of the same type.
 * If a raw JSON Concept is supplied it is coerced into a Concept object.
 *
 * @param {Object} concept  Concept to compare
 * @return {boolean} representing whether the two Concepts are equal
 */
Concept.prototype.equals = function equals(concept) {
  var conceptObj = concept === null || typeof concept.constructor === 'undefined' || concept.constructor.name !== 'Concept' ? new Concept(concept) : concept;
  return this.id === conceptObj.id;
};

/**
 * Compare two Concepts based on prefLabel, for use with native .sort()
 *
 * @example
 * var sortedConcepts = concepts.sort(skos.Concept.compare);
 *
 * @param {Object} a  Concept A
 * @param {Object} b  Concept B
 * @return {Integer} representing which should be sorted above the other
 */
Concept.compare = function compare(a, b) {
  if (a.prefLabel < b.prefLabel) return -1;
  if (a.prefLabel > b.prefLabel) return 1;
  return 0;
};

/**
 * Return the prefLabel of the Concept.
 *
 * @return {String} a JSON string
 */
Concept.prototype.toString = function toString() {
  return this._originalConcept.prefLabel;
};

/**
 * Return the original JSON object representing the Concept.
 *
 * @return {Object} a JSON object
 */
Concept.prototype.getJSON = function getJSON() {
  return this._originalConcept;
};

var skos = {
  ConceptScheme,
  Concept
};

(function () {
  // Establish the root object, `window` in the browser, or `global` on the server.
  var root = this;

  // Export the skos object for **CommonJS**, with backwards-compatibility
  // for the old `require()` API. If we're not in CommonJS, add `skos` to the
  // global object.
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = skos;
  } else {
    root.skos = skos;
  }
})();
