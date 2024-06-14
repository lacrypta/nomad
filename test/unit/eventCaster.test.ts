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

import type {
  EventCaster,
  EventCasterImplementation_Cast,
  EventCasterImplementation_ProtectedMethods,
} from '../../src/eventCaster';

import { _filterToRegExp, EventCasterImplementation } from '../../src/eventCaster';
import { testAll, withFakeTimers } from '../helpers';

const newEventCaster: () => [EventCaster, EventCasterImplementation_Cast] = (): [
  EventCaster,
  EventCasterImplementation_Cast,
] => {
  let cast: EventCasterImplementation_Cast;
  const eci: EventCaster = new EventCasterImplementation(
    (protectedMethods: EventCasterImplementation_ProtectedMethods): void => {
      cast = protectedMethods.cast;
    },
  );
  // @ts-expect-error: Variable 'cast' is used before being assigned.
  return [eci, cast];
};

describe('eventCaster', (): void => {
  testAll(it, _filterToRegExp, {
    'should deal with complex * filter': {
      expected: /^[\w/.-]+:something:[\w/.-]+$/,
      input: ['*:something:*'],
    },
    'should deal with complex * filter (again)': {
      expected: /^[\w/.-]+:[\w/.-]+:something:[\w/.-]+:[\w/.-]+$/,
      input: ['*:*:something:*:*'],
    },
    'should deal with complex ** filter': {
      expected: /^[\w/.-]+(?::[\w/.-]+)*:something:[\w/.-]+(?::[\w/.-]+)*$/,
      input: ['**:something:**'],
    },
    'should deal with complex constant filter': {
      expected: /^some:thing$/,
      input: ['some:thing'],
    },
    'should deal with simple * filter': {
      expected: /^[\w/.-]+$/,
      input: ['*'],
    },
    'should deal with simple * filter (again)': {
      expected: /^some:[\w/.-]+:thing$/,
      input: ['some:*:thing'],
    },
    'should deal with simple ** filter': {
      expected: /^[\w/.-]+(?::[\w/.-]+)*$/,
      input: ['**'],
    },
    'should deal with simple ** filter (again)': {
      expected: /^some:[\w/.-]+(?::[\w/.-]+)*:thing$/,
      input: ['some:**:thing'],
    },
    'should deal with simple constant filter': {
      expected: /^something$/,
      input: ['something'],
    },
    'should deal with simple constant filter (again)': {
      expected: /^some\.thing$/,
      input: ['some.thing'],
    },
  });

  describe('EventCasterImplementation', (): void => {
    describe('constructor', (): void => {
      test('should pass the "cast" method at least', (): void => {
        let theMethods: EventCasterImplementation_ProtectedMethods;
        new EventCasterImplementation((protectedMethods: EventCasterImplementation_ProtectedMethods): void => {
          theMethods = protectedMethods;
        });

        // @ts-expect-error: Variable 'theMethods' is used before being assigned.
        expect(theMethods.cast).not.toBeUndefined();
      });
    });

    describe('on()', (): void => {
      test(
        'should call listener on positive cast',
        withFakeTimers((): void => {
          const cb = jest.fn();

          const [eci, cast]: [EventCaster, EventCasterImplementation_Cast] = newEventCaster();

          eci.on('something', cb);
          cast('something', 1, 2, 3);
          jest.runAllTimers();

          expect(cb).toHaveBeenCalledWith('something', 1, 2, 3);
        }),
      );

      test(
        'should not call listener on negative cast',
        withFakeTimers((): void => {
          const cb = jest.fn();

          const [eci, cast]: [EventCaster, EventCasterImplementation_Cast] = newEventCaster();

          eci.on('something', cb);
          cast('else', 1, 2, 3);
          jest.runAllTimers();

          expect(cb).not.toHaveBeenCalled();
        }),
      );
    });

    describe('once()', (): void => {
      test(
        'should call listener once on positive cast',
        withFakeTimers((): void => {
          const cb = jest.fn();

          const [eci, cast]: [EventCaster, EventCasterImplementation_Cast] = newEventCaster();

          eci.once('something', cb);
          cast('something', 1, 2, 3);
          cast('something', 4, 5, 6);
          jest.runAllTimers();

          expect(cb).toHaveBeenCalledTimes(1);
          expect(cb).toHaveBeenCalledWith('something', 1, 2, 3);
        }),
      );

      test(
        'should not call listener on negative cast',
        withFakeTimers((): void => {
          const cb = jest.fn();

          const [eci, cast]: [EventCaster, EventCasterImplementation_Cast] = newEventCaster();

          eci.once('something', cb);
          cast('else', 1, 2, 3);
          cast('else', 4, 5, 6);
          jest.runAllTimers();

          expect(cb).not.toHaveBeenCalled();
        }),
      );
    });

    describe('off()', (): void => {
      test(
        'should not call listener on positive cast',
        withFakeTimers((): void => {
          const cb = jest.fn();

          const [eci, cast]: [EventCaster, EventCasterImplementation_Cast] = newEventCaster();

          eci.on('something', cb);
          cast('something', 1, 2, 3);
          jest.runAllTimers();

          eci.off(cb);
          cast('something', 4, 5, 6);
          jest.runAllTimers();

          expect(cb).toHaveBeenCalledTimes(1);
          expect(cb).toHaveBeenCalledWith('something', 1, 2, 3);
        }),
      );
    });

    describe('prototype', (): void => {
      test('should be null', (): void => {
        expect(Object.getPrototypeOf(EventCasterImplementation.prototype)).toBeNull();
      });
    });
  });
});
