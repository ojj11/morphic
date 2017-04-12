/* @flow */
var assert = require("assert");
var destructure = require("../destructure.js");

var matchers = {
  matchLiteral: function(literal, name, path) {
    return {
      id: "GENERATED",
      literal: literal,
      path: path,
      isMatcher: true
    };
  },
  isMatcher: function(obj) {
    return obj && obj.isMatcher;
  }
}

function matcher(id, name) {
  return {
    id: id,
    path: undefined,
    name: name,
    isMatcher: true,
    withPath: function(path) {
      var newObj = Object.create(this);
      newObj.path = path;
      return newObj;
    }
  }
}

function getEntry(objs, id) {
  return objs.find(function(obj) {
    return obj.id == id;
  });
}

describe("destructure: generateMatchers", function() {
  this.slow(5);

  it("should generate no matchers for empty input", function() {
    var output = destructure.generateMatchers(matchers, {});

    assert.equal(output.length, 0);
  });

  it("should generate a literal matcher for literal input", function() {
    var output = destructure.generateMatchers(matchers, "hi");

    assert.equal(output.length, 1);
    assert.equal(output[0].id, "GENERATED");
    assert.equal(output[0].literal, "hi");
    assert.deepEqual(output[0].path, []);
  });

  it("should generate a literal matcher for nested literal input", function() {
    var output = destructure.generateMatchers(matchers, {a: "hi"});

    assert.equal(output.length, 1);
    assert.equal(output[0].id, "GENERATED");
    assert.equal(output[0].literal, "hi");
    assert.deepEqual(output[0].path, ["a"]);
  });

  it("should generate literal matchers for nested literal inputs", function() {
    var output = destructure.generateMatchers(matchers, {
      a: "hi",
      b: "bye"
    });

    assert.equal(output.length, 2);
    assert.equal(output[0].id, "GENERATED");
    assert.equal(output[1].id, "GENERATED");
    assert.deepEqual(output.find(function(obj) {return obj.path[0] == "a"}).path, ["a"]);
    assert.deepEqual(output.find(function(obj) {return obj.path[0] == "b"}).path, ["b"]);
  });

  it("should update paths on existing matchers", function() {
    var output = destructure.generateMatchers(matchers, {
      a: matcher("a"),
      b: matcher("b")
    });

    assert.equal(output.length, 2);
    assert.deepEqual(getEntry(output, "a").path, ["a"]);
    assert.deepEqual(getEntry(output, "b").path, ["b"]);
  });

  it("should update paths on nested existing matchers", function() {
    var output = destructure.generateMatchers(matchers, {
      a: {
        b: matcher("ab")
      }
    });

    assert.equal(output.length, 1);
    assert.deepEqual(getEntry(output, "ab").path, ["a", "b"]);
  });

  it("should update path on non-nested existing matcher", function() {
    var output = destructure.generateMatchers(matchers, matcher(""));

    assert.equal(output.length, 1);
    assert.deepEqual(getEntry(output, "").path, []);
  });

  it("should work with arrays", function() {
    var output = destructure.generateMatchers(matchers, [
      matcher("1"),
      matcher("2"),
    ]);

    assert.equal(output.length, 2);
    assert.deepEqual(getEntry(output, "1").path, [0]);
    assert.deepEqual(getEntry(output, "2").path, [1]);
  });

  it("should work with mixed content", function() {
    var output = destructure.generateMatchers(matchers, {
      array: [
        matcher("1"),
        matcher("2"),
      ],
      literal: 123,
      matcher: matcher("matcher")
    });

    assert.equal(output.length, 4);
    assert.deepEqual(getEntry(output, "1").path, ["array",0]);
    assert.deepEqual(getEntry(output, "2").path, ["array",1]);
    assert.deepEqual(getEntry(output, "matcher").path, ["matcher"]);
    assert.deepEqual(getEntry(output, "GENERATED").path, ["literal"]);
  });

  it("should work with symbolic keys", function() {
    var input = {};
    var s1 = Symbol("s1");
    var s2 = Symbol("s2");
    input[s1] = matcher("a");
    input[s2] = matcher("b");
    var output = destructure.generateMatchers(matchers, input);

    assert.equal(output.length, 2);
    assert.deepEqual(getEntry(output, "a").path, [s1]);
    assert.deepEqual(getEntry(output, "b").path, [s2]);
  });

  it("should still work with duplicated matcher", function() {
    var sameMatcher = matcher("a");
    var output = destructure.generateMatchers(matchers, {
      a: sameMatcher,
      b: sameMatcher
    });

    assert.equal(output.length, 2);
    assert.deepEqual(output.find(function(obj) {return obj.path[0] == "a"}).path, ["a"]);
    assert.deepEqual(output.find(function(obj) {return obj.path[0] == "b"}).path, ["b"]);
  });

});

describe("destructure: generateNamedFieldExtractors", function() {
  this.slow(5);

  it("should generate no named fields for empty input", function() {
    var output = destructure.generateNamedFieldExtractors([]);

    assert.equal(output.length, 0);
  });

  it("should generate no named fields when there are none", function() {
    var output = destructure.generateNamedFieldExtractors([
      matcher("a"),
      matcher("b")
    ]);

    assert.equal(output.length, 0);
  });

  it("should generate named fields when present", function() {
    var output = destructure.generateNamedFieldExtractors([
      matcher("a", "name 1"),
      matcher("b", "name 2")
    ]);

    assert.equal(output.length, 2);
    assert.equal(getEntry(output, "a").name, "name 1");
    assert.equal(getEntry(output, "b").name, "name 2");
  });

  it("should throw on a duplicate named field", function() {
    assert.throws(function() {
      destructure.generateNamedFieldExtractors([
        matcher("a", "same name"),
        matcher("b", "same name")
      ]);
    });
  });

});

describe("destructure: extractNamedFields", function() {
  this.slow(5);

  it("should extract a field", function() {
    var complexObj = {
      "a": 1,
      "b": {
        "c": "complex"
      }
    };

    complexObj.b.d = complexObj;

    var output = destructure.extractNamedFields([
      matcher("a", "field1").withPath(["b", "d", "b", "c"])
    ], complexObj);

    assert(Object.keys(output).length, 1);
    assert.equal(output.field1, complexObj.b.c);

  });

  var mockedNumber5 = {
    valueOf: function() {return 5;},
    isMockedValue: true
  };

  it("should simplify typed field", function() {
    var output = destructure.extractNamedFields([
      {
        path: [],
        name: "field1",
        isMatcher: true,
        typeShortcut: 1,
        type: 'Number'
      }
    ], mockedNumber5);

    assert(Object.keys(output).length, 1);
    assert.equal(output.field1, 5);
    assert(!output.field1.isMockedValue);
  });

  it("should simplify literal field", function() {
    var output = destructure.extractNamedFields([
      {
        path: [],
        name: "field1",
        isMatcher: true,
        typeShortcut: 3,
        object: 5
      }
    ], mockedNumber5);

    assert(Object.keys(output).length, 1);
    assert.equal(output.field1, 5);
    assert(!output.field1.isMockedValue);
  });
});
