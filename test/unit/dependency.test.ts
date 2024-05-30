// nomadvm: The Nomad Virtual Machine reference implementation
//
// MIT License
//
// Copyright (c) 2024 La Crypta
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

import { testAll } from '../helpers';

import {
  _removeComments,
  _getDependencyPrimitive,
  from,
  DependencyImplementation,
  create,
  sort,
} from "../../src/dependency";

describe("dependency", (): void => {
  testAll(it, _removeComments, {
    "should leave empty string alone": {
      input: [""],
      expected: "",
    },
    "should not change whitespace": {
      input: [" something   else "],
      expected: " something   else ",
    },
    "should not change inside double-quoted strings": {
      input: ['"/* something */"'],
      expected: '"/* something */"',
    },
    "should not change inside single-quoted strings": {
      input: ["'/* something */'"],
      expected: "'/* something */'",
    },
    "should not change inside backtick-quoted strings": {
      input: ["`/* something */`"],
      expected: "`/* something */`",
    },
    "should not change inside regular expressions": {
      input: ["/./* something */"],
      expected: "/./* something */",
    },
    "should strip multiline": {
      input: ["/* something */ else"],
      expected: " else",
    },
    "should strip eof": {
      input: ["// something\nelse"],
      expected: "\nelse",
    },
  });

  testAll(it, _getDependencyPrimitive, {
    "should deal with empty arrow function": {
      input: [() => {}],
      expected: { code: "", dependencies: {}, name: "" },
      error: null,
    },
    "should deal with empty function": {
      input: [function () {}],
      expected: { code: "", dependencies: {}, name: "" },
      error: null,
    },
    "should deal with empty named function": {
      input: [function something() {}],
      expected: { code: "", dependencies: {}, name: "something" },
      name: "should deal with empty named function",
      error: null,
    },
    "should deal with non-empty arrow function": {
      input: [() => null],
      expected: { code: "return null;", dependencies: {}, name: "" },
      error: null,
    },
    "should deal with non-empty function": {
      input: [
        function () {
          /* something */
          return null;
          // else
        },
      ],
      expected: { code: "return null;", dependencies: {}, name: "" },
      error: null,
    },
    "should deal with non-empty named function": {
      input: [
        function something() {
          /* something */
          return null;
          // else
        },
      ],
      expected: { code: "return null;", dependencies: {}, name: "something" },
      error: null,
    },
    "should deal with empty arrow function with a single parameter with no default":
      {
        input: [(_x: unknown) => {}],
        expected: { code: "", dependencies: { _x: "" }, name: "" },
        error: null,
      },
    "should deal with empty function with a single parameter with no default": {
      input: [function (_x: unknown) {}],
      expected: { code: "", dependencies: { _x: "" }, name: "" },
      error: null,
    },
    "should deal with empty named function with a single parameter with no default":
      {
        input: [function something(_x: unknown) {}],
        expected: { code: "", dependencies: { _x: "" }, name: "something" },
        error: null,
      },
    "should deal with non-empty arrow function with two parameters with a default":
      {
        input: [(_x: unknown, y: unknown = 123) => y],
        expected: {
          code: "return y;",
          dependencies: { _x: "", y: "123" },
          name: "",
        },
        error: null,
      },
    "should deal with non-empty function with two parameters with a default": {
      input: [
        function (_x: unknown, y: unknown = 123) {
          return y;
        },
      ],
      expected: {
        code: "return y;",
        dependencies: { _x: "", y: "123" },
        name: "",
      },
      error: null,
    },
    "should deal with non-empty named function with two parameters with a default":
      {
        input: [
          function something(_x: unknown, y: unknown = 123) {
            return y;
          },
        ],
        expected: {
          code: "return y;",
          dependencies: { _x: "", y: "123" },
          name: "something",
        },
        error: null,
      },
    "should throw on native function": {
      input: [isFinite],
      expected: null,
      error: new Error("could not determine function body"),
    },
  });

  testAll(it, from, {
    "should throw with empty arrow function and no name": {
      input: [() => {}],
      expected: null,
      error: new Error("identifier must adhere to '/^[a-z]\\w*$/i'"),
    },
    "should throw with empty function and no name": {
      input: [function () {}],
      expected: null,
      error: new Error("identifier must adhere to '/^[a-z]\\w*$/i'"),
    },
    "should deal with empty arrow function": {
      input: [() => {}, "name"],
      expected: new DependencyImplementation("name", "", {}),
      error: null,
    },
    "should deal with empty function": {
      input: [function () {}, "name"],
      expected: new DependencyImplementation("name", "", {}),
      error: null,
    },
    "should deal with empty named function": {
      input: [function something() {}],
      expected: new DependencyImplementation("something", "", {}),
      error: null,
    },
    "should deal with non-empty arrow function": {
      input: [() => null, "name"],
      expected: new DependencyImplementation("name", "return null;", {}),
      error: null,
    },
    "should deal with non-empty function": {
      input: [
        function () {
          /* something */
          return null;
          // else
        },
        "name",
      ],
      expected: new DependencyImplementation("name", "return null;", {}),
      error: null,
    },
    "should deal with non-empty named function": {
      input: [
        function something() {
          /* something */
          return null;
          // else
        },
      ],
      expected: new DependencyImplementation("something", "return null;", {}),
      error: null,
    },
    "should deal with empty arrow function with a single parameter": {
      // @ts-expect-error: 'x' is declared but its value is never read.
      input: [(x: unknown = x) => {}, "name"],
      expected: new DependencyImplementation("name", "", { x: "x" }),
      error: null,
    },
    "should deal with empty function with a single parameter": {
      // @ts-expect-error: 'x' is declared but its value is never read.
      input: [function (x: unknown = x) {}, "name"],
      expected: new DependencyImplementation("name", "", { x: "x" }),
      error: null,
    },
    "should deal with empty named function with a single parameter": {
      // @ts-expect-error: 'x' is declared but its value is never read.
      input: [function something(x: unknown = x) {}, "name"],
      expected: new DependencyImplementation("something", "", { x: "x" }),
      error: null,
    },
    "should deal with non-empty arrow function with two parameters with default":
      {
        // @ts-expect-error: 'x' is declared but its value is never read.
        input: [(x: unknown = x, y: unknown = y) => y, "name"],
        expected: new DependencyImplementation("name", "", { x: "x", y: "y" }),
        error: null,
      },
    "should deal with non-empty function with two parameters with default": {
      input: [
        // @ts-expect-error: Parameter 'x' cannot reference itself. Parameter 'y' cannot reference itself.
        function (x: unknown = x, y: unknown = y) {
          return y;
        },
        "name",
      ],
      expected: new DependencyImplementation("name", "return y;", {
        x: "x",
        y: "y",
      }),
      error: null,
    },
    "should deal with non-empty named function with two parameters with default":
      {
        input: [
        // @ts-expect-error: Parameter 'x' cannot reference itself. Parameter 'y' cannot reference itself.
        function something(x: unknown = x, y: unknown = y) {
            return y;
          },
        ],
        expected: new DependencyImplementation("something", "return y;", {
          x: "x",
          y: "y",
        }),
        error: null,
      },
    "should throw on native function": {
      input: [isFinite],
      expected: null,
      error: new Error("could not determine function body"),
    },
    "should throw on non-defined function": {
      input: [Atomics],
      expected: null,
      error: new Error("Expected defined function"),
    },
  });

  testAll(it, create, {
    "should deal with empty dependency": {
      input: ["name", "", {}],
      expected: new DependencyImplementation("name", "", {}),
      error: null,
    },
  });

  testAll(it, sort, {
    "should deal with empty input": {
      input: [[]],
      expected: [],
      error: null,
    },
    "should deal with only installed dependencies": {
      input: [
        [
          new DependencyImplementation("c", "", { x: "a" }),
          new DependencyImplementation("d", "", { x: "b", y: "c" }),
          new DependencyImplementation("e", "", { x: "a", y: "c", z: "d" }),
        ],
        ["a", "b"],
      ],
      expected: [
        new DependencyImplementation("c", "", { x: "a" }),
        new DependencyImplementation("d", "", { x: "b", y: "c" }),
        new DependencyImplementation("e", "", { x: "a", y: "c", z: "d" }),
      ],
      error: null,
    },
    "should throw with cycles": {
      input: [
        [
          new DependencyImplementation("a", "", { x: "b" }),
          new DependencyImplementation("b", "", { x: "a" }),
        ],
        [],
      ],
      expected: null,
      error: new Error('unresolved dependencies: [a, b]'),
    }
  });

  describe("DependencyImplementation", (): void => {
  });
});
