var defaultMatcher = require("./matcher.js");
var defaultGenerateMatchers = require("./destructure.js").generateMatchers;
var defaultGenerateNamedFieldExtractors = require("./destructure.js").generateNamedFieldExtractors;
var defaultExtractNamedFields = require("./destructure.js").extractNamedFields;
var matchers = require("./matchers.js");

function putRecord(sink, namedFields, action) {
  sink({
    namedFields: namedFields,
    action: action
  });
}

function builder(sink) {
  return {
    "returnNamedMatch": function(name) {
      sink(function(args) {
        return args[name];
      });
    },
    "returnArgument": function(n) {
      sink(function() {
        return arguments[n+1];
      });
    },
    "throw": function(error) {
      sink(function() {
        throw error;
      });
    },
    "return": function(value) {
      sink(function() {
        return value;
      });
    },
    "then": sink
  };
}

// This class is essentially syntactic sugar around the core matcher found in
// matcher.js
function morphic(options) {
  var optionsIn = options || {};
  var Matcher = optionsIn.matcherCore || defaultMatcher
  var matcher = new Matcher(optionsIn);
  var generateMatchers = optionsIn.generateMatchers || defaultGenerateMatchers;
  var generateNamedFieldExtractors = optionsIn.generateNamedFieldExtractors || defaultGenerateNamedFieldExtractors;
  var extractNamedFields = optionsIn.extractNamedFields || defaultExtractNamedFields;

  var morphicFunction = function morphicFunction() {
    var match = matcher.getRecordFromInput(arguments);
    var extractedFields = extractNamedFields(match.namedFields, arguments);
    var args = [extractedFields].concat(Array.from(arguments));
    var action = match.action;
    return action.apply(this, args);
  };

  morphicFunction.with = function() {
    var generatedMatchers = generateMatchers(matchers, arguments);
    var namedFields = generateNamedFieldExtractors(generatedMatchers);

    return builder(
      putRecord.bind(
        undefined, matcher.addRecord.bind(matcher, generatedMatchers), namedFields));
  };

  morphicFunction.otherwise = function() {
    return builder(
      putRecord.bind(
        undefined, matcher.useFallback.bind(matcher), []));
  };

  return morphicFunction;
}

morphic.null = matchers.matchLiteral.bind(undefined, null);
morphic.undefined = matchers.matchLiteral.bind(undefined, undefined);

var types = ["Object", "Boolean", "Number", "String"];
types.forEach(function(type) {
  morphic[type] = matchers.matchType.bind(undefined, type);
});

morphic.either = matchers.matchEither;
morphic.literally = matchers.matchLiteral;
morphic.makeMatcher = matchers.makeUserFunction;

module.exports = morphic;
