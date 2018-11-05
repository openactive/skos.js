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
 * @param {Object | Array} [filter] Filter of ids to be included in the ConceptScheme. Values in the object literal must be true or contain an object of keys which can be assigned on each resulting Concept. Prefer generateSubset() for most use cases.
 */
function ConceptScheme(scheme, id, filter) {
  // Construct from scheme from array if needed
  if (Array.isArray(scheme)) {
    if (typeof id === 'undefined') throw new Error('ID must be supplied with Concept array');
    this._scheme = {
      'type': 'ConceptScheme',
      'id': id,
      'concept': scheme
    };
  } else if (typeof scheme === 'object' && scheme !== null && typeof scheme.concept !== 'undefined' && typeof scheme.id !== 'undefined' && scheme.type === 'ConceptScheme') {
    this._scheme = scheme;
  } else {
    throw new Error('Invalid scheme supplied to ConceptScheme');
  }

  var filterMap;
  if (Array.isArray(filter)) {
    filterMap = filter.reduce(function (map, entry) {
      map[entry] = true;
      return map;
    }, {});
  } else if (typeof filter === 'object') {
    filterMap = filter;
  } else {
    // Leave filterMap undefined
    filterMap = null;
  }

  // Create processing array for ConceptScheme
  var conceptArray = [];

  // Create master index for Concepts filtered out
  var masterConceptIndex = {};

  // Declaire once for the following loops
  var concept;

  // Create an index of all concepts by ID
  for (var i = 0; i < this._scheme.concept.length; i++) {
    concept = new Concept(this._scheme.concept[i]);
    concept._partOfScheme = true;

    // Add to master index
    masterConceptIndex[concept.id] = concept;
    if (filterMap === null || filterMap[concept.id]) {
      // Add to array for subsiquent loop
      conceptArray.push(concept);

      // Add any metadata provided to the filter to the Concept
      if (filterMap !== null && typeof filterMap[concept.id] === 'object') {
        var meta = filterMap[concept.id];
        for (var prop in meta) {
          if (meta.hasOwnProperty(prop)) {
            concept._originalConcept[prop] = meta[prop];
          }
        }
      }
    }
  }

  // Add ._broaderConcepts to all Concepts, throwing error for graph inconsistencies, adding to the filter for missing broader references
  for (var k = 0; k < conceptArray.length; k++) {
    concept = conceptArray[k];
    var conceptBroaderDupCheck = {};
    var broader = concept._originalConcept.broader || concept._originalConcept.broaderTransitive || [];
    if (!Array.isArray(broader)) broader = [broader];
    for (var l = 0; l < broader.length; l++) {
      var broaderConceptId = broader[l];

      if (!masterConceptIndex[broaderConceptId]) {
        throw new Error('Invalid scheme supplied to ConceptScheme: Concept "' + concept.id + '" has referenced broader Concept "' + broaderConceptId + '", which was not found in scheme');
      } else if (conceptBroaderDupCheck[broaderConceptId] === true) {
        throw new Error('Invalid scheme supplied to ConceptScheme: Concept "' + concept.id + '" has duplicated broader references to "' + broaderConceptId + '"');
      } else {
        // If the broader reference was not included in the filter, add it to the conceptArray for processing
        if (filterMap !== null && !filterMap[broaderConceptId]) conceptArray.push(masterConceptIndex[broaderConceptId]);
        // Include reference to broader Concept in this concept
        concept._broaderConcepts.push(masterConceptIndex[broaderConceptId]);
        conceptBroaderDupCheck[broaderConceptId] = true;
      }
    }
  }

  // Create lookups for ConceptScheme
  var topConcepts = [];
  var conceptIndex = {};
  var labelIndex = {};

  // Create all indexes based on complete conceptArray
  for (var r = 0; r < conceptArray.length; r++) {
    concept = conceptArray[r];

    // Add to indexes
    conceptIndex[concept.id] = concept;
    labelIndex[concept.prefLabel] = concept;

    // Add altLabels to prefLabel index. Ignore hidden labels,
    // as a good autocomplete will handle fuzzy matching.
    if (concept.altLabel && Array.isArray(concept.altLabel)) {
      for (var j = 0; j < concept.altLabel.length; j++) {
        labelIndex[concept.altLabel[j]] = concept;
      }
    }

    // If topConcept then also add to topConcepts
    if (concept._topConceptOf === this._scheme.id) {
      topConcepts.push(concept);
    }
  }

  // Add ._relatedConcepts and ._narrowerConcepts to all Concepts, throwing error for graph inconsistencies, and pruning related items that have not made it through the filter
  for (var q = 0; q < conceptArray.length; q++) {
    concept = conceptArray[q];

    // Add ._relatedConcepts to all Concepts
    if (concept._originalConcept.related && Array.isArray(concept._originalConcept.related)) {
      var conceptRelatedDupCheck = {};
      // Loop through array in reverse to allow for in-loop splicing to prune related
      var m = concept._originalConcept.related.length;
      while (m--) {
        var relatedConceptId = concept._originalConcept.related[m];
        if (!conceptIndex[relatedConceptId] && masterConceptIndex[relatedConceptId]) {
          // Prune the related reference from the concept, as it has been excluded by the filter
          concept._originalConcept.related.splice(m, 1);
        } else if (!conceptIndex[relatedConceptId]) {
          throw new Error('Invalid scheme supplied to ConceptScheme: Concept "' + concept.id + '" has referenced related Concept "' + relatedConceptId + '", which was not found in scheme');
        } else if (conceptRelatedDupCheck[relatedConceptId] === true) {
          throw new Error('Invalid scheme supplied to ConceptScheme: Concept "' + concept.id + '" has duplicated related references to "' + relatedConceptId + '"');
        } else {
          concept._relatedConcepts.push(conceptIndex[relatedConceptId]);
          conceptRelatedDupCheck[relatedConceptId] = true;
        }
      }
    }

    // Add ._narrowerConcepts to all Concepts
    for (var p = 0; p < concept._broaderConcepts.length; p++) {
      concept._broaderConcepts[p]._narrowerConcepts.push(concept);
    }
  }

  // If a filter has been applied, ensure that the scheme is up-to-date
  if (filterMap !== null) {
    this._scheme.concept = conceptArray.map(c => c._originalConcept);
  }

  this._topConcepts = topConcepts.sort(Concept.compare);
  this._index = conceptIndex;
  this._labelIndex = labelIndex;
}

/**
 * Get Concept by ID
 *
 * @example
 * // returns Concept for American Football
 * var scheme = new skos.ConceptScheme(activityListJsonObject);
 * return scheme.getConceptByID('https://openactive.io/activity-list#9caeb442-2834-4859-b660-9172ed61ee71');
 *
 * @param {String} id  The id of the Concept
 * @return {Concept} the Concept, or null if no matching concept exists
 */
ConceptScheme.prototype.getConceptByID = function getConceptByID(id) {
  // If the id is found, return the Concept
  if (this._index[id]) return this._index[id];
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
 * @return {Concept} the Concept, or null if no matching concept exists
 */
ConceptScheme.prototype.getConceptByLabel = function getConceptByLabel(label) {
  // If the label is found, return the Concept
  return this._labelIndex[label] || null;
};

/**
 * Return an array of all concepts in the scheme.
 *
 * @return {Array} an array of Concept
 */
ConceptScheme.prototype.getAllConcepts = function getAllConcepts() {
  var index = this._index;
  // Equivalent of Object.values() with wider browser support
  return (Object.values ? Object.values(index) : Object.keys(index).map(function (key) { return index[key]; })).sort(Concept.compare);
};

/**
 * Return a map of all concepts in the scheme, keyed by ID. This can be useful to power autocomplete dropdowns.
 *
 * @return {Array} an map of Concept by ID
 */
ConceptScheme.prototype.getAllConceptsByID = function getAllConceptsByID() {
  return this._index;
};

/**
 * Return a map of all concepts in the scheme, keyed by altLabel and prefLabel. This can be useful to power autocomplete dropdowns.
 *
 * @return {Object} a map of Concept by altLabel / prefLabel
 */
ConceptScheme.prototype.getAllConceptsByLabel = function getAllConceptsByLabel() {
  return this._labelIndex;
};

/**
 * Return an array of the top concepts in a hierarchical scheme.
 *
 * @return {Array} an array of Concept
 */
ConceptScheme.prototype.getTopConcepts = function getTopConcepts() {
  return this._topConcepts;
};

/**
 * Return the original JSON object representing the ConceptScheme.
 *
 * @return {Object} a JSON object
 */
ConceptScheme.prototype.getJSON = function getJSON() {
  return this._scheme;
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

  return this._topConcepts.reduce(function (lines, concept) {
    return lines.concat(renderLines(concept, 1));
  }, []).join('\n');
};

/**
 * Generate ConceptScheme subset
 *
 * The subset will be generated to include all broader Concepts of any of those included in the filter, and will have pruned any references to related Concepts that are not included in the resulting subset.
 *
 * @example
 * // returns ConceptScheme subset of just Pole Vault and its broader concepts (Athletics)
 * var scheme = new skos.ConceptScheme(activityListJsonObject);
 * return scheme.generateSubset(['https://openactive.io/activity-list#5df80216-2af8-4ad3-8120-a34c11ea1a87']);
 *
 * @example
 * // returns ConceptScheme subset of just Pole Vault and its broader concepts (Athletics), including metadata attached to Pole Vault.
 * var scheme = new skos.ConceptScheme(activityListJsonObject);
 * return scheme.generateSubset({'https://openactive.io/activity-list#5df80216-2af8-4ad3-8120-a34c11ea1a87': {'ext:metadata': 34}});
 *
 * @param {Object | Array} filter  Filter of ids to be included in the ConceptScheme. Values in the object literal must be true or contain an object of keys which can be assigned on each resulting Concept.
 * @return {ConceptScheme} the ConceptScheme subset
 */
ConceptScheme.prototype.generateSubset = function generateSubset(filter) {
  // Create a new ConceptScheme based on this one with the filter applied
  return new ConceptScheme(this._scheme, null, filter);
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
  this._topConceptOf = concept.topConceptOf;
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
 * @param {Concept} concept  Concept to compare
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
 * @param {Concept} a  Concept A
 * @param {Concept} b  Concept B
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
