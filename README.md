Morphic [![Build Status](https://travis-ci.org/ojj11/morphic.svg?branch=master)](https://travis-ci.org/ojj11/morphic)
=======

[![Greenkeeper badge](https://badges.greenkeeper.io/ojj11/morphic.svg)](https://greenkeeper.io/)

**Support for writing ad-hoc polymorphic functions.**
These are functions that will accept different types of arguments. They can
execute different sets of code depending on the shape of the information
represented in the arguments

    Author: Olli Jones
    License: MIT
    Version: 1.0.0

```
npm install morphic --save
```

## Example usage

  > Look in [./test/implementations.js](./test/implementations.js) for more examples

```javascript
var morphic = require("morphic");
var assert = require("assert");

// We can define a function "getName":
var getName = new morphic();

// To understand book authors:
getName.with({
  author: morphic.String("name")
}).returnNamedMatch("name");

// and website owners:
getName.with({
  owner: morphic.String("name")
}).returnNamedMatch("name");

// and to fallback gracefully:
getName.otherwise().return("unknown");

// We can see our function working with books:
assert.equal(
  getName({
    title: "1984",
    author: "George Orwell"
  }),
  "George Orwell");

// and websites:
assert.equal(
  getName({
    url: "www.github.com",
    owner: "GitHub, Inc"
  }),
  "GitHub, Inc");

// and see it falling back gracefully:
assert.equal(
  getName(123),
  "unknown");
```

## API documentation

A quick guide to the language used in this documentation:

  * **instance**
    an instance of a morphic function, created through `new morphic()`
  * **shape/structure/type**
    people tend to use this language interchangeably to describe the format
    of the arguments to the function
  * **matchers**
    a way of defining the shape input will form
  * **implementation**
    the way a particular type will be processed, roughly the lambda in
    `...then((named_matchers) => ...)`
  * **named matchers**
    naming a matcher will make the matching input available through the first
    argument of an implementation

#### A Morphic Function

  1. Create a morphic *instance* with `var myMethod = new morphic()` or `var
     myMethod = morphic()`
  2. Add the *implementations* using *matchers* and the `myMethod.with(...)`
     and `myMethod.otherwise()`
  3. Call the method as a normal function, like `var result = myMethod(...)`

#### Matchers

To help define the sorts of *shapes/structures/types* an *implementation* is
able to process we need matchers, these allow us to algorithmically express
these types.

Each matcher can have an associated name to turn it into a *named matcher*
which will make its matched value explicitly available through the first
argument to an *implementation*

##### `morphic.null([name])`

Returns a matcher that matches `x == null`

##### `morphic.undefined([name])`

Returns a matcher that matches `x == undefined`

##### `morphic.Object([name])`

Returns a matcher that matches something that can be coerced to an Object

##### `morphic.Boolean([name])`

Returns a matcher that matches something that can be coerced to a Boolean

##### `morphic.Number([name])`

Returns a matcher that matches something that can be coerced to a Number

##### `morphic.String([name])`

Returns a matcher that matches something that can be coerced to a String

##### `morphic.either(options, [name])`

Returns a matcher that will match on any matcher expressed in the array of
option

##### `morphic.literally(value, [name])`

Returns a matcher that matches `x == value` this should be used in the
either matcher - it is implicitly used elsewhere

#### Interacting with a Morphic Function

There are different methods of interacting with a morphic *instance*. Firstly
adding *implementations*. These are essentially the body of the method. The
order in which you add *implementations* doesn't matter, morphic will call the
*implementation* with the shape most similar to the inputs given

Assuming `myMethod` is an *instance* such as `var myMethod = new morphic()`:

##### `myMethod.with(shape1, [shape2, [shape3...]])...`

Define the shape of each argument using matchers, objects and literals, ie:
`myMethod.with("string", 123, morphic.Boolean())...` would match both
`myMethod("string", 123, true)` and `myMethod("string", 123, false)`

##### `myMethod.with(...).then(implementation)`

Calling with...then will execute the implementation when the inputs match
the shapes given in the with call. The implementation will be called as
`implementation(named_matchers_map, original_argument0, ...)` where the
`named_matchers_map` will be an Object where each key in the name of the
matcher and the value is the matched input

##### `myMethod.with(...).throw(error)`

Calling with...throw will throw the given error when the input matches. The
error must be given as an instance, such as `new Error("error message")`

##### `myMethod.with(...).return(value)`

Calling with...return will return the given value when the input matches

##### `myMethod.with(...).returnArgument(n)`

Calling with..returnArgument will return the specified input argument when
the input matches. Arguments are zero indexed, so `returnArgument(0)` would
return the first argument

##### `myMethod.with(...).returnNamedMatch(name)`

Calling with...returnNamedMatch will return the value of the named matcher
when the input matches

##### `myMethod.otherwise()...`

Otherwise will let you provide a fallback implementation that will be called
in the case that no existing implementations are suitable. Note that when
the input matches multiple implementations and all are similarly specific
then an exception will still be thrown, this otherwise clause will not be
activated

#### User defined matchers

Where the above matchers aren't enough a new one can be defined using:

`var myMatcher = morphic.makeMatcher((input) => return wasMatched)`

`myMatcher` is now similar to the above matchers, use it in the same way with
`myMatcher([name])`

## Running tests

    npm install
    npm test

## Known issues

 - Although rare, hash collisions may cause morphic to use the same matcher
   instead of two unique matchers on an input

## Future work

 - The existing stack can be organized into a binary search tree where each
   node expresses the matcher and it has a truthy and falsey leaf. Arranging to
   create a more balanced tree will improve performance
 - The matchers can be used as part of a code generation step to produce more
   efficient code - even `eval`ing the output will result in a more performant
   matcher
