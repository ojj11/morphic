/* @flow */
var assert = require("assert");
var morphic = require("../morphic.js");

describe("implementations", function() {
  this.slow(5);

  it("should be able to match authors", function() {

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
  });

  it("should be able to match AST nodes", function() {

    var getIfs = new morphic();

    var AST = {
      "body": [
        {
          "statement": "var result = false;"
        },
        {
          "condition": "result == false",
          "option1": [
            {
              "statement": "return false;"
            }
          ],
          "option2": [
            {
              "statement": "return true;"
            }
          ]
        }
      ]
    };

    getIfs.with({
      body: morphic.Object("body")
    }).then(function(r) {
      return Array.prototype.concat.apply([], r.body.map(getIfs));
    });

    getIfs.with({
      condition: morphic.String("if")
    }).returnNamedMatch("if")

    // and to fallback gracefully:
    getIfs.otherwise().return([]);

    assert.deepEqual(
      getIfs(AST),
      ["result == false"]);
  });

  it("should be able to count using custom matchers", function() {

    var isIterable = morphic.makeMatcher(function(input) {
      return input.forEach instanceof Function;
    });

    var count = new morphic();

    count.with(isIterable("iterable")).then(function(r) {
      return r.iterable.length;
    });

    count.otherwise().throw(new Error("not iterable"));

    assert.equal(
      count([1,2,3]),
      3);

    assert.throws(function() {
      count(undefined);
    });

    assert.throws(function() {
      count({
        forEach: "I am not a list"
      });
    });
  });

  it("should be able to check certificates", function() {

    var connection1 = {
      "remoteAddress": "https://www.example.com",
      "connection": false,
      "remoteFamily": "IPv4",
      "remotePort": 80,
      "destroyed": false,
      "certificate": "example.com"
    };

    var connection2 = {
      "remoteAddress": "https://www.example.com",
      "connection": false,
      "remoteFamily": "IPv4",
      "remotePort": 80,
      "destroyed": false,
      "certificate": "hacked.com"
    };

    var checkCertificate = new morphic();

    checkCertificate.with({
      "certificate": morphic.String("actualCertificate"),
      "remoteAddress": morphic.String("actualURL")
    },
    {
      "certificate": morphic.String("expectedCertificate"),
      "remoteAddress": morphic.String("expectedURL")
    }).then(function(r) {
      return r.actualURL == r.expectedURL
        && r.actualCertificate == r.expectedCertificate;
    });

    checkCertificate.with({
      "remoteAddress": morphic.String("url")
    },
    {}).then(function(r) {
      throw new Error(r.url + " is not secure");
    });

    assert.ok(
      checkCertificate(connection1, {
        "remoteAddress": "https://www.example.com",
        "certificate": "example.com"
      }));

    assert.equal(
      checkCertificate(connection2, {
        "remoteAddress": "https://www.example.com",
        "certificate": "example.com"
      }),
    false);

    assert.throws(function() {
      checkCertificate({
        "remoteAddress": "http://example.com"
      });
    }, /example.com is not secure/);

  });

  it("should be able to work as methods on objects", function() {

    function Person(name) {
      this.name = name;
    }
    Person.prototype.isCheckedIn = new morphic();

    Person.prototype.isCheckedIn.with({
      "passengers": morphic.Object("names")
    }).then(function(r) {
      return r.names.indexOf(this.name) != -1;
    });

    var me = new Person("Barry");

    var flight1 = {
      "flight": "DJ293",
      "passengers": ["Anna", "Barry", "Charlotte"]
    };

    var flight2 = {
      "flight": "VJ293",
      "passengers": ["Dan", "Emily", "Fred"]
    };

    assert.ok(me.isCheckedIn(flight1));
    assert.equal(me.isCheckedIn(flight2), false);

  });
});
