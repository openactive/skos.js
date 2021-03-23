var skos = require('./skos');

var activityList = {
  '@context': 'https://openactive.io/',
  id: 'https://openactive.io/activity-list',
  title: 'OpenActive Activity List',
  description: 'This document describes the OpenActive standard activity list.',
  type: 'ConceptScheme',
  license: 'https://creativecommons.org/licenses/by/4.0/',
  concept: [
    {
      id: 'https://openactive.io/activity-list#1.2.2',
      type: 'Concept',
      prefLabel: '#1.2.2',
      broader: 'https://openactive.io/activity-list#1.2'
    },
    {
      id: 'https://openactive.io/activity-list#2',
      type: 'Concept',
      prefLabel: '#2',
      topConceptOf: 'https://openactive.io/activity-list'
    },
    {
      id: 'https://openactive.io/activity-list#1',
      type: 'Concept',
      prefLabel: '#1',
      topConceptOf: 'https://openactive.io/activity-list'
    },
    {
      id: 'https://openactive.io/activity-list#1.1',
      type: 'Concept',
      prefLabel: '#1.1',
      broaderTransitive: ['https://openactive.io/activity-list#1']
    },
    {
      id: 'https://openactive.io/activity-list#1.2',
      type: 'Concept',
      prefLabel: '#1.2',
      broaderTransitive: ['https://openactive.io/activity-list#1'],
      related: ['https://openactive.io/activity-list#1', 'https://openactive.io/activity-list#2']
    },
    {
      id: 'https://openactive.io/activity-list#1.2.1',
      type: 'Concept',
      prefLabel: '#1.2.1',
      broader: ['https://openactive.io/activity-list#1.2', 'https://openactive.io/activity-list#1'],
      altLabel: ['#42']
    }
  ]
};

describe('A new ConceptScheme', function () {
  it('can be created from ConceptScheme JSON', function () {
    var scheme = new skos.ConceptScheme(activityList);
    expect(scheme.getAllConcepts().length).toEqual(activityList.concept.length);
  });
  it('can be created from Concept array', function () {
    var scheme = new skos.ConceptScheme(activityList.concept, 'https://openactive.io/activity-list');
    expect(scheme.getAllConcepts().length).toEqual(activityList.concept.length);
  });
  it('throws error for Concept array without ID', function () {
    expect( function () {
      var scheme = new skos.ConceptScheme(activityList.concept);
      scheme.getNarrowerTransitive('');
    } ).toThrow(new Error('ID must be supplied with Concept array'));
  });
});

describe('An invalid ConceptScheme', function () {
  it('throws error for duplicate broader references', function () {
    expect( function () {
      var scheme = new skos.ConceptScheme(activityList.concept.concat([{
        id: 'https://openactive.io/activity-list#1.3',
        type: 'Concept',
        prefLabel: '#1.3',
        broaderTransitive: ['https://openactive.io/activity-list#1', 'https://openactive.io/activity-list#1']
      }]), 'https://openactive.io/activity-list');
      scheme.getNarrowerTransitive('');
    } ).toThrow(new Error('Invalid scheme supplied to ConceptScheme: Concept "https://openactive.io/activity-list#1.3" has duplicated broader references to "https://openactive.io/activity-list#1"'));
  });
  it('throws error for duplicate related references', function () {
    expect( function () {
      var scheme = new skos.ConceptScheme(activityList.concept.concat([{
        id: 'https://openactive.io/activity-list#1.3',
        type: 'Concept',
        prefLabel: '#1.3',
        related: ['https://openactive.io/activity-list#1', 'https://openactive.io/activity-list#1']
      }]), 'https://openactive.io/activity-list');
      scheme.getNarrowerTransitive('');
    } ).toThrow(new Error('Invalid scheme supplied to ConceptScheme: Concept "https://openactive.io/activity-list#1.3" has duplicated related references to "https://openactive.io/activity-list#1"'));
  });
  it('throws error for bad inputs', function () {
    expect( function () {
      var scheme = new skos.ConceptScheme(null, '?');
      scheme.getNarrowerTransitive('');
    } ).toThrow(new Error('Invalid scheme supplied to ConceptScheme'));
  });
  it('throws error for bad broader references', function () {
    expect( function () {
      var scheme = new skos.ConceptScheme(activityList.concept.concat([{
        id: 'https://openactive.io/activity-list#3',
        type: 'Concept',
        prefLabel: '#3',
        broaderTransitive: ['i-dont-exist']
      }]), 'https://openactive.io/activity-list');
      scheme.getNarrowerTransitive('');
    } ).toThrow(new Error('Invalid scheme supplied to ConceptScheme: Concept "https://openactive.io/activity-list#3" has referenced broader Concept "i-dont-exist", which was not found in scheme'));
  });
  it('throws error for bad related references', function () {
    expect( function () {
      var scheme = new skos.ConceptScheme(activityList.concept.concat([{
        id: 'https://openactive.io/activity-list#3',
        type: 'Concept',
        prefLabel: '#3',
        related: ['i-dont-exist']
      }]), 'https://openactive.io/activity-list');
      scheme.getNarrowerTransitive('');
    } ).toThrow(new Error('Invalid scheme supplied to ConceptScheme: Concept "https://openactive.io/activity-list#3" has referenced related Concept "i-dont-exist", which was not found in scheme'));
  });
  it('throws error for invalid concept', function () {
    expect( function () {
      var scheme = new skos.ConceptScheme(activityList.concept.concat([{
        id: 'https://openactive.io/activity-list#bad-concept',
        type: 'Concept'
      }]), 'https://openactive.io/activity-list');
      scheme.getNarrowerTransitive('');
    } ).toThrow(new Error('Invalid concept: "https://openactive.io/activity-list#bad-concept"'));
  });
});

function oa(id) {
  return 'https://openactive.io/activity-list#' + id;
}

function getIds(concepts) {
  return concepts.map(concept => concept === null ? null : concept.id);
}

describe('The concept 1', function () {
  var scheme;
  beforeEach(function setupScheme() {
    scheme = new skos.ConceptScheme(activityList);
  });
  it('is in topConcepts', function () {
    var ids = getIds(scheme.getTopConcepts());
    expect(ids).toContain(oa('1'));
  });
  it('can be retrieved with prefLabel only', function () {
    var ids = getIds([scheme.getConceptByLabel('#1')]);
    expect(ids).toContain(oa('1'));
  });
  it('has a narrower of 1.2', function () {
    var ids = getIds(scheme.getConceptByID(oa('1')).getNarrower());
    expect(ids).toContain(oa('1.2'));
  });
  it('has a narrowerTransitive of 1.2.1', function () {
    var ids = getIds(scheme.getConceptByID(oa('1')).getNarrowerTransitive());
    expect(ids).toContain(oa('1.2.1'));
  });
  it('has a narrowerTransitive deduped so of length 4', function () {
    expect(scheme.getConceptByID(oa('1')).getNarrowerTransitive().length).toEqual(4);
  });
  it('has a narrower deduped so of length 2', function () {
    expect(scheme.getConceptByID(oa('1')).getNarrower().length).toEqual(3);
  });
  it('is in allConcepts', function () {
    var ids = getIds(scheme.getAllConcepts());
    expect(ids).toContain(oa('1'));
  });
});

describe('The concept 1.2', function () {
  var scheme;
  beforeEach(function setupScheme() {
    scheme = new skos.ConceptScheme(activityList);
  });
  it('has a narrower of 1.2.1', function () {
    var ids = getIds(scheme.getConceptByID(oa('1.2')).getNarrower());
    expect(ids).toContain(oa('1.2.1'));
  });
  it('has a broader of 1', function () {
    var ids = getIds(scheme.getConceptByID(oa('1.2')).getBroader());
    expect(ids).toContain(oa('1'));
  });
  it('is in allConcepts', function () {
    var ids = getIds(scheme.getAllConcepts());
    expect(ids).toContain(oa('1.2'));
  });
  it('is related to 1', function () {
    var ids = getIds(scheme.getConceptByID(oa('1.2')).getRelated());
    expect(ids).toContain(oa('1'));
  });
});

describe('The concept 1.2.1', function () {
  var scheme;
  beforeEach(function setupScheme() {
    scheme = new skos.ConceptScheme(activityList);
  });
  it('has a broaderTransitive of 1', function () {
    var ids = getIds(scheme.getConceptByID(oa('1.2.1')).getBroaderTransitive());
    expect(ids).toContain(oa('1'));
  });
  it('has a broader of 1.2', function () {
    var ids = getIds(scheme.getConceptByID(oa('1.2.1')).getBroader());
    expect(ids).toContain(oa('1.2'));
  });
  it('is in allConcepts', function () {
    var ids = getIds(scheme.getAllConcepts());
    expect(ids).toContain(oa('1.2.1'));
  });
  it('can be retrieved with altLabel only', function () {
    var ids = getIds([scheme.getConceptByLabel('#42')]);
    expect(ids).toContain(oa('1.2.1'));
  });
});

var expectedString = `- #1
  - #1.1
  - #1.2
    - #1.2.1
    - #1.2.2
  - #1.2.1
- #2`;

describe('The ConceptScheme', function () {
  var scheme;
  beforeEach(function setupScheme() {
    scheme = new skos.ConceptScheme(activityList);
  });
  it('has two topConcepts', function () {
    var ids = getIds(scheme.getTopConcepts());
    expect(ids.length).toEqual(2);
  });
  it('has the expected string output', function () {
    expect(scheme.toString()).toEqual(expectedString);
  });
  it('returns null for concept not found by label', function () {
    expect(scheme.getConceptByLabel('NOT FOUND')).toEqual(null);
  });
  it('returns null for concept not found by ID', function () {
    expect(scheme.getConceptByID('NOT FOUND')).toEqual(null);
  });
  it('returns all concepts by label', function () {
    // length + 1 due to altLabel being added to the byLabel list
    expect(Object.keys(scheme.getAllConceptsByLabel()).length).toEqual(activityList.concept.length + 1);
  });
  it('returns all concepts by ID', function () {
    expect(Object.keys(scheme.getAllConceptsByID()).length).toEqual(activityList.concept.length);
  });
  it('returns JSON containing the same concept array', function () {
    expect(scheme.getJSON().concept).toEqual(activityList.concept);
  });
});

describe('Checking for equality of concepts ', function () {
  var conceptA1;
  var conceptA2;
  var conceptB;
  var rawConceptA1;
  var rawConceptA2;
  var rawConceptB;
  beforeEach(function setupConcept() {
    rawConceptA1 = {
      id: 'https://openactive.io/activity-list#A',
      type: 'Concept',
      prefLabel: 'A'
    };
    rawConceptA2 = {
      id: 'https://openactive.io/activity-list#A',
      type: 'Concept',
      prefLabel: 'A'
    };
    rawConceptB = {
      id: 'https://openactive.io/activity-list#B',
      type: 'Concept',
      prefLabel: 'B'
    };
    conceptA1 = new skos.Concept(rawConceptA1);
    conceptA2 = new skos.Concept(rawConceptA2);
    conceptB = new skos.Concept(rawConceptB);
  });
  it('A1.equals(A1) == true', function () {
    expect(conceptA1.equals(conceptA1)).toEqual(true);
  });
  it('A1.equals(A2) == true', function () {
    expect(conceptA1.equals(conceptA2)).toEqual(true);
  });
  it('A.equals(rawA) == true', function () {
    expect(conceptA1.equals(rawConceptA1)).toEqual(true);
  });
  it('A.equals(B) == false', function () {
    expect(conceptA1.equals(conceptB)).toEqual(false);
  });
  it('A.equals(notConcept) throws error', function () {
    expect( function () {
      var rawNotConcept = {
        id: 'https://openactive.io/activity-list#B'
      };
      conceptA1.equals(rawNotConcept);
    } ).toThrow(new Error('Invalid concept: "https://openactive.io/activity-list#B"'));
  });
});

describe('Externally created Concept', function () {
  var concept;
  beforeEach(function setupConcept() {
    concept = new skos.Concept({
      id: 'https://openactive.io/activity-list#1.3',
      type: 'Concept',
      prefLabel: '#1.3',
      related: ['https://openactive.io/activity-list#1', 'https://openactive.io/activity-list#1']
    });
  });
  it('throws error for getBroader', function () {
    expect( function () {
      concept.getBroader();
    } ).toThrow(new Error('Concept must have been generated by ConceptScheme to support getBroader'));
  });
  it('throws error for getBroaderTransitive', function () {
    expect( function () {
      concept.getBroaderTransitive();
    } ).toThrow(new Error('Concept must have been generated by ConceptScheme to support getBroaderTransitive'));
  });
  it('throws error for getNarrower', function () {
    expect( function () {
      concept.getNarrower();
    } ).toThrow(new Error('Concept must have been generated by ConceptScheme to support getNarrower'));
  });
  it('throws error for getNarrowerTransitive', function () {
    expect( function () {
      concept.getNarrowerTransitive();
    } ).toThrow(new Error('Concept must have been generated by ConceptScheme to support getNarrowerTransitive'));
  });
  it('throws error for getRelated', function () {
    expect( function () {
      concept.getRelated();
    } ).toThrow(new Error('Concept must have been generated by ConceptScheme to support getRelated'));
  });
});

describe('The filtered scheme', function () {
  function executeFilterTests(createConceptScheme) {
    describe('when tested', function () {
      var scheme;
      beforeEach(function setupScheme() {
        scheme = createConceptScheme();
      });
      it('includes 1 in getTopConcepts', function () {
        var ids = getIds(scheme.getTopConcepts());
        expect(ids).toContain(oa('1'));
      });
      it('includes 1 in getConceptByLabel', function () {
        var ids = getIds([scheme.getConceptByLabel('#1')]);
        expect(ids).toContain(oa('1'));
      });
      it('includes 1 in getConceptByID', function () {
        var ids = getIds([scheme.getConceptByID(oa('1'))]);
        expect(ids).toContain(oa('1'));
      });
      it('includes 1 in getAllConcepts', function () {
        var ids = getIds(scheme.getAllConcepts());
        expect(ids).toContain(oa('1'));
      });
      it('includes 1 in getJSON()', function () {
        var ids = scheme.getJSON().concept.filter(concept => concept.id === oa('1'));
        expect(ids.length).toEqual(1);
      });
      it('does not include 1.2 in getTopConcepts', function () {
        var ids = getIds(scheme.getTopConcepts());
        expect(ids).not.toContain(oa('1.2'));
      });
      it('includes 1.2 in getConceptByLabel', function () {
        var ids = getIds([scheme.getConceptByLabel('#1.2')]);
        expect(ids).toContain(oa('1.2'));
      });
      it('includes 1.2 in getConceptByID', function () {
        var ids = getIds([scheme.getConceptByID(oa('1.2'))]);
        expect(ids).toContain(oa('1.2'));
      });
      it('includes 1.2 in getAllConcepts', function () {
        var ids = getIds(scheme.getAllConcepts());
        expect(ids).toContain(oa('1.2'));
      });
      it('includes 1.2 in getJSON()', function () {
        var ids = scheme.getJSON().concept.filter(concept => concept.id === oa('1.2'));
        expect(ids.length).toEqual(1);
      });
      it('does not include 1.2.1 in getTopConcepts', function () {
        var ids = getIds(scheme.getTopConcepts());
        expect(ids).not.toContain(oa('1.2.1'));
      });
      it('does not include 1.2.1 in getConceptByLabel', function () {
        var ids = getIds([scheme.getConceptByLabel('#1.2.1')]);
        expect(ids).not.toContain(oa('1.2.1'));
      });
      it('does not include 1.2.1 in getConceptByID', function () {
        var ids = getIds([scheme.getConceptByID(oa('1.2.1'))]);
        expect(ids).not.toContain(oa('1.2.1'));
      });
      it('does not include 1.2.1 in getAllConcepts', function () {
        var ids = getIds(scheme.getAllConcepts());
        expect(ids).not.toContain(oa('1.2.1'));
      });
      it('does not include 1.2.1 in getJSON()', function () {
        var ids = scheme.getJSON().concept.filter(concept => concept.id === oa('1.2.1'));
        expect(ids.length).toEqual(0);
      });
      it('has 1.2 related to 1', function () {
        var ids = getIds(scheme.getConceptByID(oa('1.2')).getRelated());
        expect(ids).toContain(oa('1'));
      });
      it('has 1.2 related to 1 in getJSON()', function () {
        var ids = scheme.getConceptByID(oa('1.2')).getJSON().related;
        expect(ids).toContain(oa('1'));
      });
      it('has 1.2 not related to 2', function () {
        var ids = getIds(scheme.getConceptByID(oa('1.2')).getRelated());
        expect(ids).not.toContain(oa('2'));
      });
      it('has 1.2 not related to 2 in getJSON()', function () {
        var ids = scheme.getConceptByID(oa('1.2')).getJSON().related;
        expect(ids).not.toContain(oa('2'));
      });
      it('has 1.2 in getJSON()', function () {
        var ids = scheme.getJSON().concept.filter(concept => concept.id === oa('1.2'));
        expect(ids.length).toEqual(1);
      });
      it('does not include 2 in getTopConcepts', function () {
        var ids = getIds(scheme.getTopConcepts());
        expect(ids).not.toContain(oa('2'));
      });
      it('does not include 2 in getConceptByLabel', function () {
        var ids = getIds([scheme.getConceptByLabel('#2')]);
        expect(ids).not.toContain(oa('2'));
      });
      it('does not include 2 in getConceptByID', function () {
        var ids = getIds([scheme.getConceptByID(oa('2'))]);
        expect(ids).not.toContain(oa('2'));
      });
      it('does not include 2 in getAllConcepts', function () {
        var ids = getIds(scheme.getAllConcepts());
        expect(ids).not.toContain(oa('2'));
      });
      it('does not include 2 in getJSON()', function () {
        var ids = scheme.getJSON().concept.filter(concept => concept.id === oa('2'));
        expect(ids.length).toEqual(0);
      });
    });
  }
  function executeMetaTests(createConceptScheme, metadata) {
    describe('when tested', function () {
      it('includes meta data', function () {
        var concept = createConceptScheme().getConceptByID(oa('1.2'));
        expect(concept.getJSON()).toEqual(jasmine.objectContaining(metadata));
      });
    });
  }

  describe('using a filter array', function () {
    function createInstance() {
      return new skos.ConceptScheme(activityList, null, ['https://openactive.io/activity-list#1.2']);
    }
    executeFilterTests(createInstance);
  });

  describe('using a filter map of boolean', function () {
    function createInstance() {
      return new skos.ConceptScheme(activityList, null, {'https://openactive.io/activity-list#1.2': true, 'https://openactive.io/activity-list#1': false});
    }
    executeFilterTests(createInstance);
  });

  describe('using a filter map including objects', function () {
    var metadata = { 'metadata': 'woke' };
    function createInstance() {
      return new skos.ConceptScheme(activityList, null, {'https://openactive.io/activity-list#1.2': metadata, 'https://openactive.io/activity-list#1': true});
    }
    executeFilterTests(createInstance);
    executeMetaTests(createInstance, metadata);
  });

  describe('using a filter array via generateSubset', function () {
    var scheme = new skos.ConceptScheme(activityList);
    scheme.generateSubset(['https://openactive.io/activity-list#2']);
    function createInstance() {
      return scheme.generateSubset(['https://openactive.io/activity-list#1.2', 'unknown']);
    }
    executeFilterTests(createInstance);
  });

  describe('using a filter map of boolean via generateSubset', function () {
    var scheme = new skos.ConceptScheme(activityList);
    scheme.generateSubset(['https://openactive.io/activity-list#2']);
    function createInstance() {
      return scheme.generateSubset({'https://openactive.io/activity-list#1.2': true, 'https://openactive.io/activity-list#1': false, 'unknown1': true, 'unknown2': false});
    }
    executeFilterTests(createInstance);
  });

  describe('using a filter map including objects via generateSubset', function () {
    var scheme = new skos.ConceptScheme(activityList);
    scheme.generateSubset(['https://openactive.io/activity-list#2']);
    var metadata = { 'metadata': 'woke' };
    function createInstance() {
      return scheme.generateSubset({'https://openactive.io/activity-list#1.2': metadata, 'https://openactive.io/activity-list#1': true, 'unknown': true});
    }
    executeFilterTests(createInstance);
    executeMetaTests(createInstance, metadata);
  });
});
