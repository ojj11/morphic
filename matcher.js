var bitset = require("fast-bitset");
var util = require("util");

function matcher(config) {
  config = config || {
    defaultMatcher: function(record) {
      throw new Error("Unrecognised matcher " + record);
    }
  };
  this.defaultMatcher = config.defaultMatcher;
  this.stack = Object.create(null);
  this.stackHits = Object.create(null);
  this.calls = [];
  this.functionPositioning = [];
  this.alternative = undefined;
}

matcher.prototype = {
  bitsetSize: 32,
  addRecord: function(stack, call) {
    var index = this.calls.push(call) - 1;
    if (index >= this.bitsetSize) {
      this.bitsetSize += 32;
    }
    this.functionPositioning.push(new Error());
    var i = 0;
    var matcher;
    var identity;
    var hits;
    for (i = 0; i < stack.length; i += 1) {
      identity = stack[i].hash();
      matcher = this.stack[identity] || stack[i];
      this.stack[identity] = matcher;
      hits = this.stackHits[identity] || new bitset(this.bitsetSize);
      hits.set(index);
      this.stackHits[identity] = hits;
    }
  },
  useFallback: function(alternative) {
    this.alternative = alternative;
  },
  getRecordFromInput: function(object) {
    var j, isMatch, record, subObject, question;
    var currentGuess = new bitset(this.calls.length);
    if (this.calls.length > 0) {
      currentGuess.setRange(0, this.calls.length-1);
    }
    var questions = Object.keys(this.stack);
    while (questions.length > 0) {
      question = questions.pop();
      record = this.stack[question];
      // increase our existing stack size if necessary before applying `and` op:
      this.stackHits[question].MAX_BIT = this.bitsetSize;
      // check that doing this will reduce our search space:
      if (this.stackHits[question].and(currentGuess).isEmpty()) {
        // there set union is false
        continue;
      }
      isMatch = false;
      matching: {
        // destructure object:
        subObject = object;
        for (j = 0; j < record.path.length; j += 1) {
          if (subObject == undefined) {
            // cannot destructure
            break matching;
          }
          subObject = subObject[record.path[j]];
        }
        // try and match (these are inlined for a slight performance increase):
        switch(record.typeShortcut) {
          // matchType:
          case 1:
            isMatch = global[record.type](subObject) == subObject;
          break;
          // matchEither:
          case 2:
            isMatch = record.options.some(function(option) {
              return option.matcher(subObject);
            });
          break;
          // matchLiteral:
          case 3:
            isMatch = record.object == subObject;
          break;
          // matchUserFunction:
          case 4:
            isMatch = record.matcher(subObject);
          break;
          // constant result (used in tests)
          case 5:
            isMatch = this.defaultMatcher(record);
          break;
          // matchTypeExactly:
          case 6:
            isMatch = typeof subObject == record.type;
          break;
          // matchAnything:
          case 7:
            isMatch = true;
          break;
        }
      }
      if (!isMatch) {
        // eliminate this -
        // make a negative bitset first, then unset the bits with xor, that way
        // we're not falling into the issue where we're "and"ing with different
        // sized bitsets
        var cantBeBitSet = new bitset(this.calls.length);
        cantBeBitSet.setRange(0, this.calls.length - 1)
        cantBeBitSet = cantBeBitSet.xor(this.stackHits[question]);
        currentGuess = currentGuess.and(cantBeBitSet);
      }
      if (currentGuess.isEmpty()) {
        // nothing matches:
        break;
      }
    }
    if (currentGuess.getCardinality() == 1) {
      // one method matches:
      return this.calls[currentGuess.nextSetBit(0)];
    }
    if (currentGuess.getCardinality() == 0) {
      // nothing matches:
      return this.alternative;
    }
    throw new HelpfulError(
      currentGuess.getCardinality() + " methods match on the input\n" + util.inspect(object),
      currentGuess,
      this.functionPositioning);
  }
};

function HelpfulError(message, guess, functionPositions) {
  var buildStack = "";
  functionPositions.forEach(function(position, index) {
    if (guess.get(index)) {
      var stack = position.stack.split("\n").slice(2).join("\n").trim();
      buildStack += "\nMatching method " + (index + 1) + " added " + stack;
    }
  });
  var error = new Error(message);
  error.stack += buildStack;
  return error;
}

module.exports = matcher;
