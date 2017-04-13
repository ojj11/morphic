var crypto = require("crypto");
var userFunctionUID = 0;
var symbolUID = 0;
var knownSymbols = new Map();

function hash() {
  var hash = crypto.createHash("md5");
  var shallowCopy = Object.assign({}, this);
  shallowCopy.path = this.path.map(function(segment) {
    if (typeof segment == "symbol") {
      if (!knownSymbols.has(segment)) {
        knownSymbols.set(segment, symbolUID++);
      }
      return knownSymbols.get(segment);
    } else {
      return segment;
    }
  });
  // Don't hash the name:
  shallowCopy.name = "";
  hash.update(JSON.stringify(shallowCopy));
  return hash.digest("hex");
}

function withPath(newPath) {
  var newObj = Object.assign(Object.create(matcherPrototype), this);
  newObj.path = newPath;
  return newObj;
}

var matcherPrototype = {
  hash: hash,
  withPath: withPath,
  isMatcher: true
};

function matchType(type, name, path) {
  if (this == global) {
    return new matchType(type, name, path);
  }
  this.path = path;
  this.typeShortcut = 1;
  this.name = name;
  this.matcher = function(obj) {return global[type](obj) == obj;};
  this.type = type;
}

matchType.prototype = matcherPrototype;

function matchEither(options, name, path) {
  if (this == global) {
    return new matchEither(options, name, path);
  }
  this.path = path;
  this.typeShortcut = 2;
  this.name = name;
  this.matcher = function(obj) {
    return options.some(function(option) {
      return option.matcher(obj);
    });
  };
  this.options = options;
}

matchEither.prototype = matcherPrototype;

function matchLiteral(object, name, path) {
  if (this == global) {
    return new matchLiteral(object, name, path);
  }
  this.path = path;
  this.typeShortcut = 3;
  this.name = name;
  this.matcher = function(obj) {return obj == object;};
  this.object = object;
}

matchLiteral.prototype = matcherPrototype;

function matchUserFunction(func, uid, name, path) {
  if (this == global) {
    return new matchUserFunction(func, uid, name, path);
  }
  this.path = path;
  this.typeShortcut = 4;
  this.name = name;
  this.matcher = func;
  // Need to declare some form of UUID for hashing:
  this.funcUID = uid;
}

matchUserFunction.prototype = matcherPrototype;

function makeUserFunction(func) {
  return matchUserFunction.bind(undefined, func, userFunctionUID++);
}

function isMatcher(obj) {
  return obj && obj.isMatcher;
}

module.exports = {
  matchType: matchType,
  matchEither: matchEither,
  makeUserFunction: makeUserFunction,
  matchLiteral: matchLiteral,
  matchUserFunction: matchUserFunction,
  isMatcher: isMatcher
};
