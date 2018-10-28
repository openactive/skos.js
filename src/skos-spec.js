var ConceptScheme = require('./skos').ConceptScheme;

var activityList = {
  '@context': 'https://openactive.io/',
  id: 'https://openactive.io/activity-list',
  title: 'OpenActive Activity List',
  description: 'This document describes the OpenActive standard activity list.',
  type: 'ConceptScheme',
  license: 'https://creativecommons.org/licenses/by/4.0/',
  concept: [
    {
      id: 'https://openactive.io/activity-list#1',
      type: 'Concept',
      prefLabel: '#1',
      topConceptOf: 'https://openactive.io/activity-list'
    },
    {
      id: 'https://openactive.io/activity-list#2',
      type: 'Concept',
      prefLabel: '#2',
      topConceptOf: 'https://openactive.io/activity-list'
    },
    {
      id: 'https://openactive.io/activity-list#1.1',
      type: 'Concept',
      prefLabel: '#1.1',
      broader: ['https://openactive.io/activity-list#1']
    },
    {
      id: 'https://openactive.io/activity-list#1.2',
      type: 'Concept',
      prefLabel: '#1.2',
      broaderTransitive: ['https://openactive.io/activity-list#1'],
      related: ['https://openactive.io/activity-list#1']
    },
    {
      id: 'https://openactive.io/activity-list#1.2.1',
      type: 'Concept',
      prefLabel: '#1.2.1',
      broader: 'https://openactive.io/activity-list#1.2',
      altLabel: ['#42']
    },
    {
      id: 'https://openactive.io/activity-list#1.2.2',
      type: 'Concept',
      prefLabel: '#1.2.2',
      broaderTransitive: 'https://openactive.io/activity-list#1.2'
    }
  ]
};

var scheme = new ConceptScheme(activityList);

function oa(id) {
  return 'https://openactive.io/activity-list#' + id;
}

function getIds(concepts) {
  return concepts.map(concept => concept.id);
}

describe('The concept 1', function () {
  it('is in topConcepts', function () {
    var ids = getIds(scheme.getTopConcepts());
    expect(ids).toContain(oa('1'));
  });
  it('can be retrieved with prefix only', function () {
    var ids = getIds([scheme.getConceptByID('oa:activity-list#1')]);
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
  it('is in allConcepts', function () {
    var ids = getIds(scheme.getAllConcepts());
    expect(ids).toContain(oa('1'));
  });
});

describe('The concept 1.2', function () {
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
- #2`;

describe('The ConceptScheme', function () {
  it('has two topConcepts', function () {
    var ids = getIds(scheme.getTopConcepts());
    expect(ids.length).toEqual(2);
  });
  it('has the expected string output', function () {
    expect(scheme.toString()).toEqual(expectedString);
  });
});
