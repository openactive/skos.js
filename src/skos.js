// ==ClosureCompiler==
// @output_file_name skos.min.js
// @compilation_level SIMPLE_OPTIMIZATIONS
// ==/ClosureCompiler==

'use strict';

/**
 * Note this library is written in ES5 to provide client-side compatibility
 * without requiring transpiling. It will work from IE9 upwards.
 * @module skos
 */

/**
 * ConceptScheme constructor.
 * @public
 * @example
 * // returns Concept for American Football
 * var activityListJsonObject = JSON.parse(response.getBody('utf8'));
 * var scheme = new ConceptScheme(activityListJsonObject);
 * return scheme.getConceptByID('https://openactive.io/activity-list#9caeb442-2834-4859-b660-9172ed61ee71');
 *
 * @example
 * // returns ConceptScheme for a provided custom subset of the Activity List
 * var activityListConceptArray = myApiResult.items;
 * var scheme = new ConceptScheme(activityListConceptArray, 'https://openactive.io/activity-list');
 * return scheme;
 *
 * @constructor
 * @param {Object | Array} scheme  Either a JSON ConceptScheme object *OR* Array of Concepts
 * @param {String} [id] The scheme id, only required if an array is provided for scheme
 */
function ConceptScheme(scheme, id) {
  function validateConcepts(concepts) {
    for (var i = 0; i < concepts.length; i++) {
      if (!validateConcept(concepts[i])) return false;
    }
    return true;
  }

  function validateConcept(concept) {
    return concept.prefLabel && concept.id && concept.type === 'Concept';
  }

  // Construct from scheme from array if needed
  if (Array.isArray(scheme) && validateConcepts(scheme)) {
    if (typeof schemeId === 'undefined') throw new Error('ID must be supplied with Concept array');
    this.scheme = {
      'type': 'ConceptScheme',
      'id': id,
      'concept': scheme
    };
  } else if (scheme.concept && scheme.id && scheme.type === 'ConceptScheme' && validateConcepts(scheme.concept)) {
    this.scheme = scheme;
  } else {
    throw new Error('Invalid scheme supplied to ConceptScheme');
  }

  // Create list of parent ConceptScheme
  var topConcepts = [];
  var conceptIndex = {};
  var labelIndex = {};

  // Create an index of all concepts by ID
  var localSchemeId = this.scheme.id;
  this.scheme.concept.forEach(function setIndex(concept) {
    var conceptObj = new Concept(concept);

    // Add to indexes
    conceptIndex[concept.id] = conceptObj;
    labelIndex[concept.prefLabel] = conceptObj;

    // Add altLabels to prefLabel index. Ignore hidden labels,
    // as a good autocomplete will handle fuzzy matching.
    if (concept.altLabel && Array.isArray(concept.altLabel)) {
      concept.altLabel.forEach(function (label) {
        labelIndex[label] = conceptObj;
      });
    }

    // If topConcept then also add to topConcepts
    if (concept.topConceptOf === localSchemeId) {
      topConcepts.push(conceptObj);
    }
  });

  // Add ._broaderConcepts to all Concepts, throwing error for graph inconsistencies
  Object.keys(conceptIndex).forEach(function (key) {
    var concept = conceptIndex[key];
    var conceptRaw = concept.getJSON();
    var broader = conceptRaw.broader || conceptRaw.broaderTransitive || [];
    if (conceptRaw.broader && !Array.isArray(conceptRaw.broader)) broader = [conceptRaw.broader];
    if (conceptRaw.broaderTransitive && !Array.isArray(conceptRaw.broaderTransitive)) broader = [conceptRaw.broaderTransitive];
    broader.forEach(function (broaderConceptId) {
      if (conceptIndex[broaderConceptId]) {
        concept._broaderConcepts.push(conceptIndex[broaderConceptId]);
      } else {
        throw new Error('Invalid scheme supplied to ConceptScheme: referenced Concept ' + broaderConceptId + 'not found in scheme');
      }
    });
    if (conceptRaw.related && Array.isArray(conceptRaw.related)) {
      conceptRaw.related.forEach(function (relatedConceptId) {
        if (conceptIndex[relatedConceptId]) {
          concept._relatedConcepts.push(conceptIndex[relatedConceptId]);
        } else {
          throw new Error('Invalid scheme supplied to ConceptScheme: referenced Concept ' + relatedConceptId + 'not found in scheme');
        }
      });
    }
  });

  // Add ._narrowerConcepts to all Concepts
  Object.keys(conceptIndex).forEach(function (key) {
    var concept = conceptIndex[key];
    concept._broaderConcepts.forEach(function (broaderConcept) {
      broaderConcept._narrowerConcepts.push(concept);
    });
  });

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
 * var scheme = new ConceptScheme(activityListJsonObject);
 * return scheme.getConceptByID('https://openactive.io/activity-list#9caeb442-2834-4859-b660-9172ed61ee71');
 *
 * @example
 * // returns Concept for American Football using a prefixed ID
 * var scheme = new ConceptScheme(activityListJsonObject);
 * return scheme.getConceptByID('oa:activity-list#9caeb442-2834-4859-b660-9172ed61ee71');
 *
 * @param {String} id  The id of the Concept
 * @return {Object} the Concept, or null if no matching concept exists
 */
ConceptScheme.prototype.getConceptByID = function getConceptByID(id) {
  // If the id is found, return the Concept
  if (this.index[id]) return this.index[id];
  // Otherwise try replacing the prefix
  var OPENACTIVE_PREFIX = 'oa:';
  var fqId = id.substring(0, OPENACTIVE_PREFIX.length) === OPENACTIVE_PREFIX ?
    id.replace('oa:', 'https://openactive.io/') : id;
  if (this.index[fqId]) return this.index[fqId];
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
 * var scheme = new ConceptScheme(activityListJsonObject);
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
  return Object.keys(index).map(function (key) { return index[key]; }).sort(Concept.compare);
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
 * This is designed to be used within a ConceptScheme.
 *
 * @constructor
 * @param {Object} concept - A JSON Concept object
 */
function Concept(concept) {
  this.id = concept.id;
  this.prefLabel = concept.prefLabel;
  this.altLabel = concept.altLabel;
  this.hiddenLabel = concept.hiddenLabel;
  this.definition = concept.definition;
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
 * var scheme = new ConceptScheme(activityListJsonObject);
 * return scheme.getConceptByLabel('Yoga').getNarrower();
 *
 * @return {Array} an array of Concept
 */
Concept.prototype.getNarrower = function getNarrower() {
  return this._narrowerConcepts.sort(Concept.compare);
};

/**
 * Get an array of all narrower concepts following transitivity (all children).
 *
 * @example
 * // returns all type of Yoga
 * var scheme = new ConceptScheme(activityListJsonObject);
 * return scheme.getConceptByLabel('Yoga').getNarrowerTransitive();
 *
 * @return {Array} an array of Concept
 */
Concept.prototype.getNarrowerTransitive = function getNarrowerTransitive() {
  function setConceptsOnMap(concept, map) {
    concept._narrowerConcepts.forEach(function (narrowerConcept) {
      map[narrowerConcept.id] = narrowerConcept;
      setConceptsOnMap(narrowerConcept, map);
    });
    return map;
  }
  // Dedup results into a map
  var map = setConceptsOnMap(this, {});
  // Equivalent of Object.values() with wider browser support
  return Object.keys(map).map(function (key) { return map[key]; }).sort(Concept.compare);
};

/**
 * Get an array of immediately broader concepts.
 *
 * @example
 * // returns only the next level up in the hierarchy
 * var scheme = new ConceptScheme(activityListJsonObject);
 * return scheme.getConceptByLabel('Yoga')getBroader();
 *
 * @return {Array} an array of Concept
 */
Concept.prototype.getBroader = function getBroader() {
  return this._broaderConcepts.sort(Concept.compare);
};

/**
 * Get an array of all broader concepts following transitivity (all parents).
 *
 * @example
 * // returns all the higher level categories above Yoga
 * var scheme = new ConceptScheme(activityListJsonObject);
 * return scheme.getConceptByLabel('Yoga').getBroaderTransitive();
 *
 * @return {Array} an array of Concept
 */
Concept.prototype.getBroaderTransitive = function getBroaderTransitive() {
  function setConceptsOnMap(concept, map) {
    concept._broaderConcepts.forEach(function (broaderConcept) {
      map[broaderConcept.id] = broaderConcept;
      setConceptsOnMap(broaderConcept, map);
    });
    return map;
  }
  // Dedup results into a map
  var map = setConceptsOnMap(this, {});
  // Equivalent of Object.values() with wider browser support
  return Object.keys(map).map(function (key) { return map[key]; }).sort(Concept.compare);
};

/**
 * Get an array of related concepts.
 *
 * @return {Array} an array of Concept
 */
Concept.prototype.getRelated = function getRelated() {
  return this._relatedConcepts.sort(Concept.compare);
};

/**
 * Compare two Concepts based on prefLabel, for use with native .sort()
 *
 * @example
 * var sortedConcepts = concepts.sort(Concept.compare);
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

  // Export the Underscore object for **CommonJS**, with backwards-compatibility
  // for the old `require()` API. If we're not in CommonJS, add `skos` to the
  // global object.
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = skos;
  } else {
    root.skos = skos;
  }
})();
