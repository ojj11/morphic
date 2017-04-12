/* @flow */
var assert = require("assert");
var matchers = require("../matchers.js");

var testData = {
  "matchType": {
    numberOfArguments: 1,
    arguments: [
      'Number',
      'String'
    ]
  },
  "matchEither": {
    numberOfArguments: 1,
    arguments: [
      [{}, {}],
      [{a:1}, {b: 2}]
    ]
  },
  "matchLiteral": {
    numberOfArguments: 1,
    arguments: [
      "hi",
      "bye"
    ]
  },
  "matchUserFunction": {
    numberOfArguments: 2,
    arguments: [
      [function() {return true;}, 0],
      [function() {return false;}, 1]
    ]
  }
};

var symbolicPath = Symbol("same path");

var testPaths = {
  "same paths": [
    [],
    []
  ],
  "same symbolic paths": [
    [symbolicPath],
    [symbolicPath]
  ],
  "different paths": [
    ["a"],
    ["b"]
  ],
  "different symbolic paths": [
    [Symbol("path a")],
    [Symbol("path b")]
  ]
};

var testNames = {
  "same names": ["name", "name"],
  "different names": ["name A", "name B"]
};

var testAssertions = {
  "same hash": assert.equal,
  "different hash": assert.notEqual
};

var testInputs = {
  "same inputs": [0, 0],
  "different inputs": [0, 1],
};

function makeMatcher(method, index, argClass, nameClass, pathClass) {
  var constructor = matchers[method];
  var args = testData[method].arguments[testInputs[argClass][index]];
  var name = testNames[nameClass][index];
  var path = testPaths[pathClass][index];
  if (testData[method].numberOfArguments == 1) {
    return new (constructor.bind(undefined, args[0], name, path));
  }
  if (testData[method].numberOfArguments == 2) {
    return new (constructor.bind(undefined, args[0], args[1], name, path));
  }
}

Object.keys(testData).forEach(function(matcher) {
  describe("matchers: " + matcher, function() {
    this.slow(5);

    it("should be a matcher", function() {
      var m = makeMatcher(matcher, 0, "same inputs", "same names", "same paths");
      assert(matchers.isMatcher(m));
    });

    var tests = [
      ["same hash", "same inputs", "same names", "same paths"],
      ["same hash", "same inputs", "different names", "same paths"],
      ["same hash", "same inputs", "same names", "same symbolic paths"],
      ["different hash", "different inputs", "same names", "same paths"],
      ["different hash", "same inputs", "same names", "different paths"],
      ["different hash", "same inputs", "same names", "different symbolic paths"],
    ];

    tests.forEach(function(test) {
      var desc = [
        "should hash to ",
        test[0],
        " for ",
        test[1],
        ", ",
        test[2],
        " and ",
        test[3]].join("");

      it(desc, function() {
        var m1 = makeMatcher(matcher, 0, test[1], test[2], test[3]);
        var m2 = makeMatcher(matcher, 1, test[1], test[2], test[3]);

        testAssertions[test[0]](m1.hash(), m2.hash());
      });
    });

  });
});

describe("matchers: makeUserFunction", function() {
  this.slow(5);

  it("should return a function", function() {
    var userMatcher = new matchers.makeUserFunction(function() {return true;});

    assert.equal("function", typeof userMatcher)
  });

  it("should return a matcher on call", function() {
    var userMatcher = new matchers.makeUserFunction(function() {return true;});

    assert(matchers.isMatcher(new userMatcher([])));
  });

});
