/* @flow */
var assert = require("assert");
var morphic = require("../morphic.js");

var options = {
  matcherCore: function() {
    return {
      getRecordFromInput: function(args) {
        // this mocked matcher will always match when a .with(...) option is set
        return this.record || this.fallback;
      },
      useFallback: function(fallback) {
        this.fallback = fallback;
      },
      addRecord: function(matchAgainst, record) {
        this.record = record;
      }
    };
  },
  generateMatchers: function() {},
  generateNamedFieldExtractors: function() {
    return [];
  },
  extractNamedFields: function() {
    return {
      namedField: "extractedNamedField"
    };
  }
};

describe("morphic", function() {
  this.slow(5);

  it("should return a function", function() {
    var morphicMethod1 = new morphic(options);
    var morphicMethod2 = morphic(options);

    assert.equal(typeof morphicMethod1, "function");
    assert.equal(typeof morphicMethod2, "function");
  });

  it("should respect a function fallback", function() {
    var morphicMethod = new morphic(options);

    morphicMethod.otherwise().then(function(extracted, first) {
      return first;
    });
    assert.equal(morphicMethod("works"), "works");
  });

  it("should respect a return argument fallback", function() {
    var morphicMethod = new morphic(options);

    morphicMethod.otherwise().returnArgument(0);
    assert.equal(morphicMethod("arg1"), "arg1");
  });

  it("should respect a throw fallback", function() {
    var morphicMethod = new morphic(options);

    morphicMethod.otherwise().throw(new Error("fallback"));
    assert.throws(function() {
      morphicMethod();
    });
  });

  it("should respect a return object fallback", function() {
    var morphicMethod = new morphic(options);

    morphicMethod.otherwise().return("hello");
    assert.equal(morphicMethod(), "hello");
  });

  it("should respect 'this'", function() {
    var morphicMethod = new morphic(options);

    morphicMethod.otherwise().then(function() {
      return this;
    });

    var obj = {
      morphicMethod: morphicMethod
    };

    assert.equal(obj.morphicMethod(), obj);
    assert.equal(morphicMethod(), global);
  });

  it("should call function on match", function() {
    var morphicMethod = new morphic(options);

    morphicMethod.with("hello").then(function(extracted, first, second) {
      // return the second argument passed:
      return second;
    });

    assert.equal(morphicMethod("hello", "goodbye"), "goodbye");
  });

  it("should return named matched input on match", function() {
    var morphicMethod = new morphic(options);

    morphicMethod.with("hello").then(function(extracted, first, second) {
      // return the second argument passed:
      return second;
    });

    assert.equal(morphicMethod("hello", "goodbye"), "goodbye");
  });

  it("should return a named match on match", function() {
    var morphicMethod = new morphic(options);

    morphicMethod.with("hello").returnNamedMatch("namedField");

    assert.equal(morphicMethod("hello"), "extractedNamedField");
  });

  it("should return argument on match", function() {
    var morphicMethod = new morphic(options);

    morphicMethod.with("0").returnArgument(2);

    assert.equal(morphicMethod("0", "1", "2"), "2");
  });

  it("should throw on match", function() {
    var morphicMethod = new morphic(options);

    morphicMethod.with("fail").throw(new Error("I am an error"));

    assert.throws(function() {
      morphicMethod("fail");
    });
  });

  it("should return object on match", function() {
    var morphicMethod = new morphic(options);

    morphicMethod.with("give me an object").return("I'm a string is that ok?");

    assert.equal(morphicMethod("give me an object"), "I'm a string is that ok?");
  });

  it("should expose matcher for null", function() {
    assert.equal(typeof morphic.null, "function");
  });

  it("should expose matcher for undefined", function() {
    assert.equal(typeof morphic.undefined, "function");
  });

  it("should expose matcher for Object", function() {
    assert.equal(typeof morphic.Object, "function");
  });

  it("should expose matcher for Boolean", function() {
    assert.equal(typeof morphic.Boolean, "function");
  });

  it("should expose matcher for Number", function() {
    assert.equal(typeof morphic.Number, "function");
  });

  it("should expose matcher for String", function() {
    assert.equal(typeof morphic.String, "function");
  });

  it("should expose either matcher", function() {
    assert.equal(typeof morphic.either, "function");
  });

  it("should expose literally matcher", function() {
    assert.equal(typeof morphic.literally, "function");
  });

  it("should let a user create a custom matcher", function() {
    assert.equal(typeof morphic.makeMatcher, "function");
  });

});
