/* @flow */
var assert = require("assert");
var morphic = require("../matcher.js");

// helper function for generating a matcher with a constant value:
function constantly(constant, path) {
  return {
    path: path,
    always: constant,
    name: "none",
    typeShortcut: 5,
    hash: function() {return constant + " : " + path.join(".");}
  };
}

describe("matcher", function() {
  this.slow(10);
  var method;

  beforeEach(function() {
    // Set default matcher to understand our "constantly" matcher:
    method = new morphic({
      defaultMatcher: function(record) {
        return record.always;
      }
    });
  });

  it("should match simple type", function() {
    method.addRecord([constantly(true, [])], "match1");

    var result = method.getRecordFromInput(123);
    assert.equal(result, "match1");
  });

  it("should match destructured type", function() {
    method.addRecord([constantly(true, ["a", "b", "c"])], "match1");

    var result = method.getRecordFromInput({a: {b: {c: 123}}});
    assert.equal(result, "match1");
  });

  it("should select correct function", function() {
    method.addRecord([constantly(true, ["a"])], "match1");

    method.addRecord([constantly(true, ["b"])], "match2");

    var result = method.getRecordFromInput({b: 2});
    assert.equal(result, "match2");
  });

  it("should not incorrectly match", function() {
    method.addRecord([constantly(false, [])], "match2");

    var result = method.getRecordFromInput("hi");
    assert.notEqual(result, "match1");
  });

  it("should return fallback when no methods provides", function() {
    method.useFallback("fallback");

    var result = method.getRecordFromInput("won't work");
    assert.equal(result, "fallback");
  });

  it("should return fallback when no methods match", function() {
    method.useFallback("fallback");
    method.addRecord([constantly(false, [])], "match1");

    var result = method.getRecordFromInput("won't work");
    assert.equal(result, "fallback");
  });

  it("should not throw on destructuring error", function() {
    method.addRecord([constantly(true, ["a", "b"])], "match1");

    method.addRecord([constantly(true, ["b", "a"])], "match2");

    method.addRecord([constantly(true, [])], "match3");

    var result = method.getRecordFromInput(1);
    assert.equal(result, "match3");
  });

  it("should throw on ambiguity", function() {
    method.addRecord([constantly(true, [])], "match1");

    method.addRecord([constantly(true, [])], "match2");

    assert.throws(function() {
      var result = method.getRecordFromInput(123);
    });
  });
});
