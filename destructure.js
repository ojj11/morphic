/* @flow */

function flattenList(arg) {
  var out = [];
  arg.forEach(function(list) {Array.prototype.push.apply(out, list);});
  return out;
}

function generateMatchersInner(matchers, input, path) {
  if (typeof input == "object") {
    if (matchers.isMatcher(input)) {
      // this is already a matcher, just update paths and return:
      return [input.withPath(path)];
    }
    if (input.map) {
      // this is an iterable, iterate over it:
      return flattenList(input.map(function(val, key) {
        return generateMatchersInner(matchers, val, path.concat(key));
      }));
    }
    // this object will have keys, iterate over them instead:
    return flattenList([
      flattenList(Object.keys(input).map(function(key) {
        return generateMatchersInner(matchers, input[key], path.concat(key));
      })),
      flattenList(Object.getOwnPropertySymbols(input).map(function(symbol) {
        return generateMatchersInner(matchers, input[symbol], path.concat(symbol));
      }))
    ]);
  }

  // fallback to matching literally:
  return [new matchers.matchLiteral(input, undefined, path)];
}

function generateMatchers(matchers, input) {
  // this will flatten the input into a list of matchers, keeping existing
  // matchers, but updating the paths correctly
  return generateMatchersInner(matchers, input, []);
}

// this will flatten the input into a list of named field extractors, should
// be run over output of generateMatchers
function generateNamedFieldExtractors(input) {
  var names = input.filter(function(matcher, index, array) {
    // has a name?
    return matcher.name;
  });
  // has duplicates?
  names.forEach(function(matcher, index, array) {
    var isDuplicate = array.slice(0, index).some(function(previousMatcher) {
      return previousMatcher.name == matcher.name;
    });
    if (isDuplicate) {
      throw new Error("duplicate named field '" + matcher.name + "'");
    }
  });
  return names;
}

// extract out the named fields from an input
function extractNamedFields(fields, input) {
  var output = Object.create(null);
  fields.forEach(function(field) {
    var subObject = input;
    for (var i = 0; i < field.path.length; i += 1) {
      if (subObject == undefined) {
        throw new Error("Unreachable: matched input will always have fields");
      }
      subObject = subObject[field.path[i]];
    }
    switch (field.typeShortcut) {
      // type matcher:
      case 1:
        subObject = global[field.type](subObject);
      break;
      // literal matcher:
      case 3:
        subObject = field.object;
      break;
    }
    output[field.name] = subObject;
  });
  return output;
}

module.exports = {
  generateMatchers: generateMatchers,
  generateNamedFieldExtractors: generateNamedFieldExtractors,
  extractNamedFields: extractNamedFields
};
