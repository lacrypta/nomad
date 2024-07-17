// nomad: The Nomad Virtual Machine reference implementation
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

import type { AnyFunction } from '../../src/dependency';

import {
  _getDependencyPrimitive,
  _removeComments,
  DependencyImplementation,
  asDependency,
  create,
  from,
  sort,
} from '../../src/dependency';
import { testAll, testAllConstructor, testAllMethod } from '../helpers';

describe('dependency', (): void => {
  testAll(it, _removeComments, {
    'should leave empty string alone': {
      expected: '',
      input: [''],
    },
    'should not change inside backtick-quoted strings': {
      expected: 'hi `/* something */` else',
      input: ['hi `/* something */` else'],
    },
    'should not change inside double-quoted strings': {
      expected: 'hi "/* something */" else',
      input: ['hi "/* something */" else'],
    },
    'should not change inside regular expressions': {
      expected: 'hi /./* something */ else',
      input: ['hi /./* something */ else'],
    },
    'should not change inside single-quoted strings': {
      expected: "hi '/* something */' else",
      input: ["hi '/* something */' else"],
    },
    'should not change whitespace': {
      expected: ' something   else ',
      input: [' something   else '],
    },
    'should strip eof': {
      expected: '\nelse',
      input: ['// something\nelse'],
    },
    'should strip multiline': {
      expected: ' else',
      input: ['/* something */ else'],
    },
  });

  testAll(
    it,
    (x: AnyFunction): string => JSON.stringify(_getDependencyPrimitive(x)),
    {
      'should deal with empty arrow function': {
        expected: JSON.stringify({ code: '', dependencies: {}, name: '' }),
        input: [() => {}],
      },
      'should deal with empty arrow function with a single parameter with no default': {
        expected: JSON.stringify({ code: '', dependencies: { _x: '' }, name: '' }),
        /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
        input: [(_x: unknown) => {}],
      },
      'should deal with empty function': {
        expected: JSON.stringify({ code: '', dependencies: {}, name: '' }),
        input: [function () {}],
      },
      'should deal with empty function with a single parameter with no default': {
        expected: JSON.stringify({ code: '', dependencies: { _x: '' }, name: '' }),
        /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
        input: [function (_x: unknown) {}],
      },
      'should deal with empty named function': {
        expected: JSON.stringify({ code: '', dependencies: {}, name: 'something' }),
        input: [function something() {}],
      },
      'should deal with empty named function with a single parameter with no default': {
        expected: JSON.stringify({ code: '', dependencies: { _x: '' }, name: 'something' }),
        /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
        input: [function something(_x: unknown) {}],
      },
      'should deal with non-empty arrow function': {
        expected: JSON.stringify({ code: 'return null;', dependencies: {}, name: '' }),
        input: [() => null],
      },
      'should deal with non-empty arrow function with two parameters with a default': {
        expected: JSON.stringify({
          code: 'return y;',
          dependencies: { _x: '', y: '123' },
          name: '',
        }),
        input: [(_x: unknown, y: unknown = 123) => y],
      },
      'should deal with non-empty function': {
        expected: JSON.stringify({ code: 'return null;', dependencies: {}, name: '' }),
        input: [
          function () {
            /* something */
            return null;
            // else
          },
        ],
      },
      'should deal with non-empty function with two parameters with a default': {
        expected: JSON.stringify({
          code: 'return y;',
          dependencies: { _x: '', y: '123' },
          name: '',
        }),
        input: [
          function (_x: unknown, y: unknown = 123) {
            return y;
          },
        ],
      },
      'should deal with non-empty named function': {
        expected: JSON.stringify({ code: 'return null;', dependencies: {}, name: 'something' }),
        input: [
          function something() {
            /* something */
            return null;
            // else
          },
        ],
      },
      'should deal with non-empty named function with two parameters with a default': {
        expected: JSON.stringify({
          code: 'return y;',
          dependencies: { _x: '', y: '123' },
          name: 'something',
        }),
        input: [
          function something(_x: unknown, y: unknown = 123) {
            return y;
          },
        ],
      },
      'should throw on native function': {
        error: new Error('could not determine function body'),
        input: [isFinite],
      },
    },
    '_getDependencyPrimitive',
  );

  testAll(it, from, {
    'should deal with empty arrow function': {
      expected: new DependencyImplementation('name', ''),
      input: [() => {}, 'name'],
    },
    'should deal with empty arrow function with a single parameter': {
      expected: new DependencyImplementation('name', '', new Map([['x', 'x']])),
      // @ts-expect-error: 'x' is declared but its value is never read.
      input: [(x: unknown = x) => {}, 'name'],
    },
    'should deal with empty function': {
      expected: new DependencyImplementation('name', ''),
      input: [function () {}, 'name'],
    },
    'should deal with empty function with a single parameter': {
      expected: new DependencyImplementation('name', '', new Map([['x', 'x']])),
      // @ts-expect-error: 'x' is declared but its value is never read.
      input: [function (x: unknown = x) {}, 'name'],
    },
    'should deal with empty named function': {
      expected: new DependencyImplementation('something', ''),
      input: [function something() {}],
    },
    'should deal with empty named function with a single parameter': {
      expected: new DependencyImplementation('something', '', new Map([['x', 'x']])),
      // @ts-expect-error: 'x' is declared but its value is never read.
      input: [function something(x: unknown = x) {}, 'name'],
    },
    'should deal with non-empty arrow function': {
      expected: new DependencyImplementation('name', 'return null;'),
      input: [() => null, 'name'],
    },
    'should deal with non-empty arrow function with two parameters with default': {
      expected: new DependencyImplementation(
        'name',
        '',
        new Map([
          ['x', 'x'],
          ['y', 'y'],
        ]),
      ),
      // @ts-expect-error: 'x' is declared but its value is never read.
      input: [(x: unknown = x, y: unknown = y) => y, 'name'],
    },
    'should deal with non-empty function': {
      expected: new DependencyImplementation('name', 'return null;'),
      input: [
        function () {
          /* something */
          return null;
          // else
        },
        'name',
      ],
    },
    'should deal with non-empty function with two parameters with default': {
      expected: new DependencyImplementation(
        'name',
        'return y;',
        new Map([
          ['x', 'x'],
          ['y', 'y'],
        ]),
      ),
      input: [
        // @ts-expect-error: Parameter 'x' cannot reference itself. Parameter 'y' cannot reference itself.
        function (x: unknown = x, y: unknown = y) {
          return y;
        },
        'name',
      ],
    },
    'should deal with non-empty named function': {
      expected: new DependencyImplementation('something', 'return null;'),
      input: [
        function something() {
          /* something */
          return null;
          // else
        },
      ],
    },
    'should deal with non-empty named function with two parameters with default': {
      expected: new DependencyImplementation(
        'something',
        'return y;',
        new Map([
          ['x', 'x'],
          ['y', 'y'],
        ]),
      ),
      input: [
        // @ts-expect-error: Parameter 'x' cannot reference itself. Parameter 'y' cannot reference itself.
        function something(x: unknown = x, y: unknown = y) {
          return y;
        },
      ],
    },
    'should throw on native function': {
      error: new Error('could not determine function body'),
      input: [isFinite],
    },
    'should throw on non-defined function': {
      error: new Error('Expected defined function'),
      input: [Atomics as any as AnyFunction], // eslint-disable-line @typescript-eslint/no-explicit-any
    },
    'should throw with empty arrow function and no name': {
      error: new Error("identifier must adhere to '/^[a-z]\\w*$/i'"),
      input: [() => {}],
    },
    'should throw with empty function and no name': {
      error: new Error("identifier must adhere to '/^[a-z]\\w*$/i'"),
      input: [function () {}],
    },
  });

  testAll(it, create, {
    'should deal with empty dependency': {
      expected: new DependencyImplementation('name', ''),
      input: ['name', '', {}],
    },
  });

  testAll(it, sort, {
    'should deal with empty input': {
      expected: [],
      input: [[]],
    },
    'should deal with only installed dependencies': {
      expected: [
        new DependencyImplementation('c', '', new Map([['x', 'a']])),
        new DependencyImplementation(
          'd',
          '',
          new Map([
            ['x', 'b'],
            ['y', 'c'],
          ]),
        ),
        new DependencyImplementation(
          'e',
          '',
          new Map([
            ['x', 'a'],
            ['y', 'c'],
            ['z', 'd'],
          ]),
        ),
      ],
      input: [
        [
          new DependencyImplementation('c', '', new Map([['x', 'a']])),
          new DependencyImplementation(
            'd',
            '',
            new Map([
              ['x', 'b'],
              ['y', 'c'],
            ]),
          ),
          new DependencyImplementation(
            'e',
            '',
            new Map([
              ['x', 'a'],
              ['y', 'c'],
              ['z', 'd'],
            ]),
          ),
        ],
        ['a', 'b'],
      ],
    },
    'should throw with cycles': {
      error: new Error('unresolved dependencies: [a, b]'),
      input: [
        [
          new DependencyImplementation('a', '', new Map([['x', 'b']])),
          new DependencyImplementation('b', '', new Map([['x', 'a']])),
        ],
        [],
      ],
    },
  });

  testAll(it, asDependency, {
    'should deal with dependencies': {
      expected: create('some', 'thing', { a: 'a' }),
      input: [{ code: 'thing', dependencies: { a: 'a' }, name: 'some' }],
    },
    'should deal with weird dependencies': {
      expected: create('some', 'thing', { some: 'some' }),
      input: [{ code: 'thing', dependencies: { some: 'some' }, name: 'some' }],
    },
    'should throw on forbidden dependency name': {
      error: new Error('identifier must not be a forbidden word'),
      input: [{ code: 'thing', dependencies: { foo: 'switch' }, name: 'some' }],
    },
    'should throw on forbidden import name': {
      error: new Error('identifier must not be a forbidden word'),
      input: [{ code: 'thing', dependencies: { switch: 'foo' }, name: 'some' }],
    },
    'should throw on forbidden name': {
      error: new Error('identifier must not be a forbidden word'),
      input: [{ code: 'thing', dependencies: {}, name: 'switch' }],
    },
    'should throw on invalid code': {
      error: new Error('function code must be a valid strict-mode Function body'),
      input: [{ code: '(', dependencies: {}, name: 'some' }],
    },
    'should throw on invalid dependency name': {
      error: new Error("identifier must adhere to '/^[a-z]\\w*$/i'"),
      input: [{ code: 'thing', dependencies: { foo: 'foo?' }, name: 'some' }],
    },
    'should throw on invalid import name': {
      error: new Error("identifier must adhere to '/^[a-z]\\w*$/i'"),
      input: [{ code: 'thing', dependencies: { 'foo?': 'foo' }, name: 'some' }],
    },
    'should throw on invalid name': {
      error: new Error("identifier must adhere to '/^[a-z]\\w*$/i'"),
      input: [{ code: 'thing', dependencies: {}, name: 'some?' }],
    },
  });

  describe('DependencyImplementation', (): void => {
    testAllConstructor(it, DependencyImplementation, {
      'should deal with dependencies': {
        expected: create('some', 'thing', { a: 'a' }) as DependencyImplementation,
        input: ['some', 'thing', new Map([['a', 'a']])],
      },
      'should deal with simple parameters': {
        expected: create('some', 'thing') as DependencyImplementation,
        input: ['some', 'thing'],
      },
      'should deal with simple parameters (no code)': {
        expected: create('some') as DependencyImplementation,
        input: ['some', ''],
      },
      'should deal with weird dependencies': {
        expected: create('some', 'thing', { some: 'some' }) as DependencyImplementation,
        input: ['some', 'thing', new Map([['some', 'some']])],
      },
      'should throw on forbidden dependency name': {
        error: new Error('identifier must not be a forbidden word'),
        input: ['some', 'thing', new Map([['foo', 'switch']])],
      },
      'should throw on forbidden import name': {
        error: new Error('identifier must not be a forbidden word'),
        input: ['some', 'thing', new Map([['switch', 'foo']])],
      },
      'should throw on forbidden name': {
        error: new Error('identifier must not be a forbidden word'),
        input: ['switch', 'thing'],
      },
      'should throw on invalid code': {
        error: new Error('function code must be a valid strict-mode Function body'),
        input: ['some', '('],
      },
      'should throw on invalid dependency name': {
        error: new Error("identifier must adhere to '/^[a-z]\\w*$/i'"),
        input: ['some', 'thing', new Map([['foo', 'foo?']])],
      },
      'should throw on invalid import name': {
        error: new Error("identifier must adhere to '/^[a-z]\\w*$/i'"),
        input: ['some', 'thing', new Map([['foo?', 'foo']])],
      },
      'should throw on invalid name': {
        error: new Error("identifier must adhere to '/^[a-z]\\w*$/i'"),
        input: ['some?', 'thing'],
      },
    });

    const dependency = new DependencyImplementation(
      'some',
      'thing',
      new Map([
        ['a', 'a'],
        ['y', 'b'],
        ['z', 'a'],
      ]),
    );

    testAllMethod(
      it,
      () => asDependency(dependency.asObject()),
      function (): string {
        return this.name;
      },
      {
        'should get name': {
          expected: 'some',
          input: [],
        },
      },
      '[get name]',
    );

    testAllMethod(
      it,
      () => asDependency(dependency.asObject()),
      function (): string {
        return this.code;
      },
      {
        'should get code': {
          expected: 'thing',
          input: [],
        },
      },
      '[get code]',
    );

    testAllMethod(
      it,
      () => asDependency(dependency.asObject()),
      function (): Map<string, string> {
        return this.dependencies;
      },
      {
        'should get dependencies': {
          expected: new Map<string, string>([
            ['a', 'a'],
            ['y', 'b'],
            ['z', 'a'],
          ]),
          input: [],
        },
      },
      '[get dependencies]',
    );

    testAllMethod(
      it,
      () => asDependency(dependency.asObject()),
      function (name: string): string {
        this.name = name;
        return this.name;
      },
      {
        'should set name': {
          expected: 'emos',
          input: ['emos'],
        },
        'should throw on forbidden name': {
          error: new Error('identifier must not be a forbidden word'),
          input: ['switch'],
        },
        'should throw on invalid name': {
          error: new Error("identifier must adhere to '/^[a-z]\\w*$/i'"),
          input: ['some?'],
        },
      },
      '[set name]',
    );

    testAllMethod(
      it,
      () => asDependency(dependency.asObject()),
      function (code: string): string {
        this.code = code;
        return this.code;
      },
      {
        'should set code': {
          expected: '"else"',
          input: ['"else"'],
        },
        'should throw on invalid code': {
          error: new Error('function code must be a valid strict-mode Function body'),
          input: ['('],
        },
      },
      '[set code]',
    );

    testAllMethod(
      it,
      () => asDependency(dependency.asObject()),
      function (dependencies: Map<string, string>): Map<string, string> {
        this.dependencies = dependencies;
        return this.dependencies;
      },
      {
        'should set dependencies': {
          expected: new Map<string, string>([
            ['b', 'b'],
            ['z', 'b'],
          ]),
          input: [
            new Map<string, string>([
              ['b', 'b'],
              ['z', 'b'],
            ]),
          ],
        },
        'should throw on forbidden dependency name': {
          error: new Error('identifier must not be a forbidden word'),
          input: [new Map([['foo', 'switch']])],
        },
        'should throw on forbidden import name': {
          error: new Error('identifier must not be a forbidden word'),
          input: [new Map([['switch', 'foo']])],
        },
        'should throw on invalid dependency name': {
          error: new Error("identifier must adhere to '/^[a-z]\\w*$/i'"),
          input: [new Map([['foo', 'foo?']])],
        },
        'should throw on invalid import name': {
          error: new Error("identifier must adhere to '/^[a-z]\\w*$/i'"),
          input: [new Map([['foo?', 'foo']])],
        },
      },
      '[set dependencies]',
    );

    testAllMethod(
      it,
      () => asDependency(dependency.asObject()),
      function (name: string): string {
        this.setName(name);
        return this.name;
      },
      {
        'should set name': {
          expected: 'emos',
          input: ['emos'],
        },
        'should throw on forbidden name': {
          error: new Error('identifier must not be a forbidden word'),
          input: ['switch'],
        },
        'should throw on invalid name': {
          error: new Error("identifier must adhere to '/^[a-z]\\w*$/i'"),
          input: ['some?'],
        },
      },
      'setName()',
    );

    testAllMethod(
      it,
      () => asDependency(dependency.asObject()),
      function (code: string): string {
        this.setCode(code);
        return this.code;
      },
      {
        'should set code': {
          expected: '"else"',
          input: ['"else"'],
        },
        'should throw on invalid code': {
          error: new Error('function code must be a valid strict-mode Function body'),
          input: ['('],
        },
      },
      'setCode()',
    );

    testAllMethod(
      it,
      () => asDependency(dependency.asObject()),
      function (dependencies: Map<string, string>): Map<string, string> {
        this.setDependencies(dependencies);
        return this.dependencies;
      },
      {
        'should set dependencies': {
          expected: new Map<string, string>([
            ['b', 'b'],
            ['z', 'b'],
          ]),
          input: [
            new Map<string, string>([
              ['b', 'b'],
              ['z', 'b'],
            ]),
          ],
        },
        'should throw on forbidden dependency name': {
          error: new Error('identifier must not be a forbidden word'),
          input: [new Map([['foo', 'switch']])],
        },
        'should throw on forbidden import name': {
          error: new Error('identifier must not be a forbidden word'),
          input: [new Map([['switch', 'foo']])],
        },
        'should throw on invalid dependency name': {
          error: new Error("identifier must adhere to '/^[a-z]\\w*$/i'"),
          input: [new Map([['foo', 'foo?']])],
        },
        'should throw on invalid import name': {
          error: new Error("identifier must adhere to '/^[a-z]\\w*$/i'"),
          input: [new Map([['foo?', 'foo']])],
        },
      },
      'setDependencies()',
    );

    testAllMethod(
      it,
      () => asDependency(dependency.asObject()),
      function (importedName: string, dependencyName: string): Map<string, string> {
        this.addDependency(importedName, dependencyName);
        return this.dependencies;
      },
      {
        'should add new dependency': {
          expected: new Map<string, string>([
            ['a', 'a'],
            ['b', 'b'],
            ['y', 'b'],
            ['z', 'a'],
          ]),
          input: ['b', 'b'],
        },
        'should overwrite with new dependency': {
          expected: new Map<string, string>([
            ['a', 'b'],
            ['y', 'b'],
            ['z', 'a'],
          ]),
          input: ['a', 'b'],
        },
        'should throw on forbidden dependency name': {
          error: new Error('identifier must not be a forbidden word'),
          input: ['foo', 'switch'],
        },
        'should throw on forbidden import name': {
          error: new Error('identifier must not be a forbidden word'),
          input: ['switch', 'foo'],
        },
        'should throw on invalid dependency name': {
          error: new Error("identifier must adhere to '/^[a-z]\\w*$/i'"),
          input: ['foo', 'foo?'],
        },
        'should throw on invalid import name': {
          error: new Error("identifier must adhere to '/^[a-z]\\w*$/i'"),
          input: ['foo?', 'foo'],
        },
      },
      'addDependency()',
    );

    testAllMethod(
      it,
      () => dependency,
      function (): string {
        return JSON.stringify(this.asObject());
      },
      {
        'should return the equivalent object': {
          expected: '{"code":"thing","dependencies":{"a":"a","y":"b","z":"a"},"name":"some"}',
          input: [],
        },
      },
      'asObject()',
    );

    testAllMethod(
      it,
      () => asDependency(dependency.asObject()),
      function (dependencyName: string): Map<string, string> {
        return this.removeDependency(dependencyName).dependencies;
      },
      {
        'should not remove non-existing dependency': {
          expected: new Map<string, string>([
            ['a', 'a'],
            ['y', 'b'],
            ['z', 'a'],
          ]),
          input: ['c'],
        },
        'should remove multiple dependency': {
          expected: new Map<string, string>([['y', 'b']]),
          input: ['a'],
        },
        'should remove simple dependency': {
          expected: new Map<string, string>([
            ['a', 'a'],
            ['z', 'a'],
          ]),
          input: ['b'],
        },
      },
      'removeDependency()',
    );

    testAllMethod(
      it,
      () => asDependency(dependency.asObject()),
      function (importName: string): Map<string, string> {
        return this.removeImport(importName).dependencies;
      },
      {
        'should not remove non-existing import': {
          expected: new Map<string, string>([
            ['a', 'a'],
            ['y', 'b'],
            ['z', 'a'],
          ]),
          input: ['b'],
        },
        'should remove simple import': {
          expected: new Map<string, string>([
            ['a', 'a'],
            ['z', 'a'],
          ]),
          input: ['y'],
        },
      },
      'removeImport()',
    );

    describe('prototype', (): void => {
      test('should be null', (): void => {
        expect(Object.getPrototypeOf(DependencyImplementation.prototype)).toBeNull();
      });
    });
  });
});
