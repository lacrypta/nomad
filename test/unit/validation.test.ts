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

import {
  argumentsMap,
  dependencyMap,
  enclosure,
  event,
  filter,
  functionCode,
  identifier,
  nonNegativeInteger,
  timeDelta,
} from '../../src/validation';
import { testAll } from '../helpers';

describe('validation', (): void => {
  testAll(it, identifier, {
    'should deal with normal identifiers': {
      expected: 'x',
      input: ['x'],
    },
    'should deal with normal identifiers (again)': {
      expected: 'a_very_long_identifier_with_underscores',
      input: ['a_very_long_identifier_with_underscores'],
    },
    'should deal with normal identifiers (again, again)': {
      expected: 'SomeThingInPascalCase',
      input: ['SomeThingInPascalCase'],
    },
    'should throw for empty string': {
      error: new Error("identifier must adhere to '/^[a-z]\\w*$/i'"),
      input: [''],
    },
    'should throw for forbidden identifier': {
      error: new Error('identifier must not be a forbidden word'),
      input: ['while'],
    },
    'should throw for forbidden identifier (again)': {
      error: new Error('identifier must not be a forbidden word'),
      input: ['eval'],
    },
    'should throw for forbidden identifier (again, again)': {
      error: new Error('identifier must not be a forbidden word'),
      input: ['Array'],
    },
    'should throw for invalid identifier': {
      error: new Error("identifier must adhere to '/^[a-z]\\w*$/i'"),
      input: ['_something'],
    },
    'should throw for invalid identifier (again)': {
      error: new Error("identifier must adhere to '/^[a-z]\\w*$/i'"),
      input: ['some thing'],
    },
  });

  testAll(it, functionCode, {
    'should pass with Function body': {
      expected: 'return Math.PI',
      input: ['return Math.PI'],
    },
    'should pass with empty string': {
      expected: '',
      input: [''],
    },
    'should throw with non-ASCII characters': {
      error: new Error('expected function code to only contain printable ASCII characters, HT, LF, FF, or CR'),
      input: ['\x00'],
    },
    'should throw with non-ASCII characters (again)': {
      error: new Error('expected function code to only contain printable ASCII characters, HT, LF, FF, or CR'),
      input: ['\x88'],
    },
    'should throw with non-Function body': {
      error: new Error('function code must be a valid strict-mode Function body'),
      input: ['('],
    },
    'should throw with non-Function body (again)': {
      error: new Error('function code must be a valid strict-mode Function body'),
      input: ['>='],
    },
  });

  testAll(it, dependencyMap, {
    'should fail with invalid dependency name': {
      error: new Error("identifier must adhere to '/^[a-z]\\w*$/i'"),
      input: [new Map<string, string>([['_', 'a']])],
    },
    'should fail with invalid import name': {
      error: new Error("identifier must adhere to '/^[a-z]\\w*$/i'"),
      input: [new Map<string, string>([['a', '_']])],
    },
    'should pass with valid dependency map': {
      expected: new Map<string, string>([['a', 'z']]),
      input: [new Map<string, string>([['a', 'z']])],
    },
  });

  testAll(it, event, {
    'should fail with empty head segment': {
      error: new Error('event name must adhere to /^[\\w/.-]+(?::[\\w/.-]+)*$/'),
      input: [':some:thing'],
    },
    'should fail with empty middle segment': {
      error: new Error('event name must adhere to /^[\\w/.-]+(?::[\\w/.-]+)*$/'),
      input: ['some::thing'],
    },
    'should fail with empty tail segment': {
      error: new Error('event name must adhere to /^[\\w/.-]+(?::[\\w/.-]+)*$/'),
      input: ['some:thing:'],
    },
    'should fail with invalid event name': {
      error: new Error('event name must adhere to /^[\\w/.-]+(?::[\\w/.-]+)*$/'),
      input: ['some thing'],
    },
    'should fail with invalid event name (again)': {
      error: new Error('event name must adhere to /^[\\w/.-]+(?::[\\w/.-]+)*$/'),
      input: ['some:thing else'],
    },
    'should pass with valid event name': {
      expected: 'some:thing',
      input: ['some:thing'],
    },
    'should pass with weird event name': {
      expected: '.-_/:/_-.',
      input: ['.-_/:/_-.'],
    },
  });

  testAll(it, filter, {
    'should fail with consecutive ** wildcards': {
      error: new Error('event name filter must not contain consecutive ** wildcards'),
      input: ['some:thing:**:**:else'],
    },
    'should fail with empty head segment': {
      error: new Error('event name filter must adhere to /^(?:\\*\\*?|[\\w/.-]+)(?::(?:\\*\\*?|[\\w/.-]+))*$/'),
      input: [':some:thing'],
    },
    'should fail with empty middle segment': {
      error: new Error('event name filter must adhere to /^(?:\\*\\*?|[\\w/.-]+)(?::(?:\\*\\*?|[\\w/.-]+))*$/'),
      input: ['some::thing'],
    },
    'should fail with empty tail segment': {
      error: new Error('event name filter must adhere to /^(?:\\*\\*?|[\\w/.-]+)(?::(?:\\*\\*?|[\\w/.-]+))*$/'),
      input: ['some:thing:'],
    },
    'should fail with invalid event name filter': {
      error: new Error('event name filter must adhere to /^(?:\\*\\*?|[\\w/.-]+)(?::(?:\\*\\*?|[\\w/.-]+))*$/'),
      input: ['some thing'],
    },
    'should fail with invalid event name filter (again)': {
      error: new Error('event name filter must adhere to /^(?:\\*\\*?|[\\w/.-]+)(?::(?:\\*\\*?|[\\w/.-]+))*$/'),
      input: ['some:thing else'],
    },
    'should pass with valid event name filter': {
      expected: 'some:thing',
      input: ['some:thing'],
    },
    'should pass with weird event name filter': {
      expected: '.-_/:/_-.',
      input: ['.-_/:/_-.'],
    },
    'should pass with weird event name filter (again)': {
      expected: '*:**:*:**:*',
      input: ['*:**:*:**:*'],
    },
  });

  testAll(it, nonNegativeInteger, {
    'should fail with negative integer': {
      error: new Error('expected datum to be non-negative'),
      input: [-42],
    },
    'should fail with non-integers': {
      error: new Error('expected datum to be a safe integer'),
      input: [12.34],
    },
    'should fail with unsafe integers': {
      error: new Error('expected datum to be a safe integer'),
      input: [Number.MAX_SAFE_INTEGER + 1],
    },
    'should pass with 0': {
      expected: 0,
      input: [0],
    },
    'should pass with positive': {
      expected: 42,
      input: [42],
    },
  });

  testAll(it, timeDelta, {
    'should fail with negative integer': {
      error: new Error('expected datum to be non-negative'),
      input: [-42],
    },
    'should fail with non-integers': {
      error: new Error('expected datum to be a safe integer'),
      input: [12.34],
    },
    'should fail with too high a number': {
      error: new Error('expected time delta to be at most 1073741824'),
      input: [2 ** 31],
    },
    'should pass with 0': {
      expected: 0,
      input: [0],
    },
    'should pass with positive': {
      expected: 42,
      input: [42],
    },
  });

  testAll(it, argumentsMap, {
    'should deal with normal identifiers': {
      expected: new Map<string, unknown>([['x', null]]),
      input: [new Map<string, unknown>([['x', null]])],
    },
    'should deal with normal identifiers (again)': {
      expected: new Map<string, unknown>([['a_very_long_identifier_with_underscores', null]]),
      input: [new Map<string, unknown>([['a_very_long_identifier_with_underscores', null]])],
    },
    'should deal with normal identifiers (again, again)': {
      expected: new Map<string, unknown>([['SomeThingInPascalCase', null]]),
      input: [new Map<string, unknown>([['SomeThingInPascalCase', null]])],
    },
    'should throw for empty string': {
      error: new Error("identifier must adhere to '/^[a-z]\\w*$/i'"),
      input: [new Map<string, unknown>([['', null]])],
    },
    'should throw for forbidden identifier': {
      error: new Error('identifier must not be a forbidden word'),
      input: [new Map<string, unknown>([['while', null]])],
    },
    'should throw for forbidden identifier (again)': {
      error: new Error('identifier must not be a forbidden word'),
      input: [new Map<string, unknown>([['eval', null]])],
    },
    'should throw for forbidden identifier (again, again)': {
      error: new Error('identifier must not be a forbidden word'),
      input: [new Map<string, unknown>([['Array', null]])],
    },
    'should throw for invalid identifier': {
      error: new Error("identifier must adhere to '/^[a-z]\\w*$/i'"),
      input: [new Map<string, unknown>([['_something', null]])],
    },
    'should throw for invalid identifier (again)': {
      error: new Error("identifier must adhere to '/^[a-z]\\w*$/i'"),
      input: [new Map<string, unknown>([['some thing', null]])],
    },
  });

  testAll(it, enclosure, {
    'should fail with empty head segment': {
      error: new Error("identifier must adhere to '/^[a-z]\\w*$/i'"),
      input: ['.some.thing'],
    },
    'should fail with empty middle segment': {
      error: new Error("identifier must adhere to '/^[a-z]\\w*$/i'"),
      input: ['some..thing'],
    },
    'should fail with empty tail segment': {
      error: new Error("identifier must adhere to '/^[a-z]\\w*$/i'"),
      input: ['some.thing:'],
    },
    'should fail with invalid enclosure name': {
      error: new Error("identifier must adhere to '/^[a-z]\\w*$/i'"),
      input: ['some thing'],
    },
    'should fail with invalid enclosure name (again)': {
      error: new Error("identifier must adhere to '/^[a-z]\\w*$/i'"),
      input: ['some.thing else'],
    },
    'should pass with valid enclosure name': {
      expected: 'some.thing',
      input: ['some.thing'],
    },
  });
});
