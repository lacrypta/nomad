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

/* eslint-disable sonarjs/no-duplicate-string */

import WebWorker from 'web-worker';

import type { AnyArgs } from '../../src/dependency';
import type { Enclosure, VM } from '../../src/vm';
import type { WorkerConstructor } from '../../src/worker';

import { Dependency, DependencyImplementation } from '../../src/dependency';
import { EventCasterImplementation } from '../../src/eventCaster';
import {
  _cast,
  _errorMessage,
  _eventPrefix,
  _makeError,
  _pseudoRandomString,
  EnclosureImplementation,
  VMImplementation,
  create,
  events,
  get,
} from '../../src/vm';
import { _wrapCode } from '../../src/worker';
import { asyncWithFakeTimers, stringToDataUri, testAll, withFakeTimers } from '../helpers';

describe('vm', (): void => {
  describe('_pseudoRandomString()', (): void => {
    test('should generate 8 hex chars', (): void => {
      expect(
        new Array(20)
          .map((): string => _pseudoRandomString())
          .every((prs: string): boolean => /^[a-f0-9]{8}$/i.test(prs)),
      );
    });
  });

  testAll(it, _errorMessage, {
    'should return correct message on Error': {
      expected: 'something',
      input: [new Error('something')],
    },
    'should return unknown on anything other than Error': {
      expected: 'unknown error',
      input: [NaN],
    },
  });

  testAll(it, _makeError, {
    'should return correct message on Error': {
      expected: new Error('something'),
      input: [new Error('something')],
    },
    'should return unknown on anything other than Error': {
      expected: new Error('unknown error'),
      input: [NaN],
    },
  });

  describe('events', (): void => {
    test('events is an EventCaster', (): void => {
      expect(events).toBeInstanceOf(EventCasterImplementation);
    });
    test('events is frozen', (): void => {
      expect(Object.isFrozen(events));
    });
  });

  describe('create()', (): void => {
    test('should create an instance with no arguments', (): void => {
      expect(create()).toBeInstanceOf(VMImplementation);
    });

    test('should create an instance with given name', (): void => {
      expect(create('test-create').name).toStrictEqual('test-create');
    });
  });

  describe('get()', (): void => {
    test('should retrieve created VM', (): void => {
      create('test-get-1');
      const gotten: VM | undefined = get('test-get-1');
      expect(gotten).toBeInstanceOf(VMImplementation);
      expect(gotten?.name).toStrictEqual('test-get-1');
    });

    test('not retrieve non-existing name', (): void => {
      expect(get('test-get-2')).toBeUndefined();
    });
  });

  describe('VMImplementation', (): void => {
    const makeWorkerCtor: (body: (...args: AnyArgs) => void) => WorkerConstructor =
      (body: (...args: AnyArgs) => void): WorkerConstructor =>
      (_scriptURL: URL | string, options?: WorkerOptions): Worker =>
        new WebWorker(stringToDataUri(_wrapCode(body.toString().toString(), 0)), options);

    const errorWorkerCtor: WorkerConstructor = (): Worker => {
      throw new Error('something');
    };

    const emptyWorkerCtor: WorkerConstructor = makeWorkerCtor(() => {});

    const dummyWorkerCtor: WorkerConstructor = makeWorkerCtor(
      (
        _this: object,
        _bootTunnel: number,
        _listen: (data: object) => void,
        _shout: (message: object) => void,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _schedule: (callback: () => void) => void,
      ) => {
        setTimeout(() => {
          _shout({ name: 'resolve', payload: 123456, tunnel: _bootTunnel });
        }, 10);
      },
    );

    describe('constructor', (): void => {
      test('should construct an instance with no arguments', (): void => {
        expect(new VMImplementation()).toBeInstanceOf(VMImplementation);
      });

      test('should construct an instance with given name', (): void => {
        expect(new VMImplementation('test-VMImplementation-constructor').name).toStrictEqual(
          'test-VMImplementation-constructor',
        );
      });

      test('should throw if constructing with duplicate name', (): void => {
        new VMImplementation('test-VMImplementation-constructor-dup');
        expect((): void => {
          new VMImplementation('test-VMImplementation-constructor-dup');
        }).toThrow(new Error('duplicate name test-VMImplementation-constructor-dup'));
      });
    });

    describe('start()', (): void => {
      test('should reject for negative timeout', async (): Promise<void> => {
        await expect(create().start(undefined, -1)).rejects.toStrictEqual(
          new Error('expected datum to be non-negative'),
        );
      });

      test('should reject for non-integer timeout', async (): Promise<void> => {
        await expect(create().start(undefined, 12.34)).rejects.toStrictEqual(
          new Error('expected datum to be a safe integer'),
        );
      });

      test('should reject for timeout too large', async (): Promise<void> => {
        await expect(create().start(undefined, (1 << 30) + 1)).rejects.toStrictEqual(
          new Error('expected time delta to be at most 1073741824'),
        );
      });

      test('should reject for negative ping interval', async (): Promise<void> => {
        await expect(create().start(undefined, undefined, -1)).rejects.toStrictEqual(
          new Error('expected datum to be non-negative'),
        );
      });

      test('should reject for non-integer ping interval', async (): Promise<void> => {
        await expect(create().start(undefined, undefined, 12.34)).rejects.toStrictEqual(
          new Error('expected datum to be a safe integer'),
        );
      });

      test('should reject for ping interval too large', async (): Promise<void> => {
        await expect(create().start(undefined, undefined, (1 << 30) + 1)).rejects.toStrictEqual(
          new Error('expected time delta to be at most 1073741824'),
        );
      });

      test('should reject for negative pong limit', async (): Promise<void> => {
        await expect(create().start(undefined, undefined, undefined, -1)).rejects.toStrictEqual(
          new Error('expected datum to be non-negative'),
        );
      });

      test('should reject for non-integer pong limit', async (): Promise<void> => {
        await expect(create().start(undefined, undefined, undefined, 12.34)).rejects.toStrictEqual(
          new Error('expected datum to be a safe integer'),
        );
      });

      test('should reject if worker constructor fails', async (): Promise<void> => {
        await expect(create().start(errorWorkerCtor)).rejects.toStrictEqual(new Error('something'));
      });

      test('should reject if no boot signal received', async (): Promise<void> => {
        const castEvents: [string, ...AnyArgs][] = [];
        const vm = create();
        vm.on('**', (name: string, ...rest: AnyArgs): void => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          castEvents.push([name, ...rest]);
        });

        await expect(vm.start(emptyWorkerCtor, 0)).rejects.toStrictEqual(new Error('boot timed out'));

        expect(castEvents).toStrictEqual([[`${_eventPrefix}:${vm.name}:start`, vm]]);
      });

      test(
        'stop() errors should not shadow boot rejection on worker constructor failure',
        asyncWithFakeTimers(async (): Promise<void> => {
          const intervalsToClear: (number | undefined)[] = [];
          const originalClearInterval = global.clearInterval;
          global.clearInterval = ((id: number | undefined) => {
            intervalsToClear.push(id);
            throw new Error('else');
          }) as typeof global.clearInterval;
          try {
            const castEvents: [string, ...AnyArgs][] = [];
            const vm = create();
            vm.on('**', (name: string, ...rest: AnyArgs): void => {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              castEvents.push([name, ...rest]);
            });

            await expect(vm.start(errorWorkerCtor)).rejects.toStrictEqual(new Error('something'));

            jest.advanceTimersByTime(1);

            expect(castEvents).toStrictEqual([
              [`${_eventPrefix}:${vm.name}:start`, vm],
              [`${_eventPrefix}:${vm.name}:start:error`, vm, new Error('something')],
              [`${_eventPrefix}:${vm.name}:stop`, vm],
              [`${_eventPrefix}:${vm.name}:stop:error`, vm, new Error('else')],
            ]);
          } finally {
            global.clearInterval = originalClearInterval;
            intervalsToClear.forEach((id: number | undefined): void => {
              clearInterval(id);
            });
          }
        }),
      );

      test('stop() errors should not shadow boot rejection on boot timeout', async (): Promise<void> => {
        const theWorkers: Worker[] = [];
        const intervalsToClear: (number | undefined)[] = [];
        const originalClearInterval = global.clearInterval;
        global.clearInterval = ((id: number | undefined) => {
          intervalsToClear.push(id);
          throw new Error('something');
        }) as typeof global.clearInterval;
        try {
          const workerCtor: WorkerConstructor = (scriptURL: URL | string, options?: WorkerOptions): Worker => {
            const theWorker = emptyWorkerCtor(scriptURL, options);
            theWorkers.push(theWorker);
            return theWorker;
          };

          const castEvents: [string, ...AnyArgs][] = [];
          const vm = create();
          vm.on('**', (name: string, ...rest: AnyArgs): void => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            castEvents.push([name, ...rest]);
          });

          await expect(vm.start(workerCtor)).rejects.toStrictEqual(new Error('boot timed out'));

          expect(castEvents).toStrictEqual([[`${_eventPrefix}:${vm.name}:start`, vm]]);
        } finally {
          theWorkers.forEach((worker: Worker): void => {
            worker.terminate();
          });
          global.clearInterval = originalClearInterval;
          intervalsToClear.forEach((id: number | undefined): void => {
            clearInterval(id);
          });
        }
      });

      test('should start correctly', async (): Promise<void> => {
        const castEvents: [string, ...AnyArgs][] = [];
        const vm = create();
        vm.on('**', (name: string, ...rest: AnyArgs): void => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          castEvents.push([name, ...rest]);
        });

        const { inside, outside } = await vm.start(dummyWorkerCtor);
        expect(inside).toStrictEqual(123456);
        expect(outside).toBeGreaterThanOrEqual(0);

        expect(castEvents).toStrictEqual([[`${_eventPrefix}:${vm.name}:start`, vm]]);

        await vm.stop();
      });

      test(
        'should stop vm upon failing to receive a pong',
        asyncWithFakeTimers(async (): Promise<void> => {
          const castEvents: [string, ...AnyArgs][] = [];
          const vm = create();
          vm.on('**', (name: string, ...rest: AnyArgs): void => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            castEvents.push([name, ...rest]);
          });

          const { inside, outside } = await vm.start(dummyWorkerCtor, undefined, 1, 1);
          expect(inside).toStrictEqual(123456);
          expect(outside).toBeGreaterThanOrEqual(0);

          jest.advanceTimersByTime(15);

          expect(vm.isStopped).toStrictEqual(true);

          expect(castEvents).toStrictEqual([
            [`${_eventPrefix}:${vm.name}:start`, vm],
            [`${_eventPrefix}:${vm.name}:start:ok`, vm],
            [`${_eventPrefix}:${vm.name}:worker:unresponsive`, vm, 2],
            [`${_eventPrefix}:${vm.name}:stop`, vm],
            [`${_eventPrefix}:${vm.name}:stop:ok`, vm],
          ]);
        }),
      );

      test('should reject if starting a stopped vm', async (): Promise<void> => {
        const castEvents: [string, ...AnyArgs][] = [];
        const vm = create();
        vm.on('**', (name: string, ...rest: AnyArgs): void => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          castEvents.push([name, ...rest]);
        });

        await vm.start(dummyWorkerCtor);
        await vm.stop();
        await expect(vm.start(dummyWorkerCtor)).rejects.toStrictEqual(new Error("expected state to be 'created'"));

        expect(castEvents).toStrictEqual([[`${_eventPrefix}:${vm.name}:start`, vm]]);
      });

      test(
        'should transit states',
        asyncWithFakeTimers(async (): Promise<void> => {
          const castEvents: [string, ...AnyArgs][] = [];
          const vm = create();
          vm.on('**', (name: string, ...rest: AnyArgs): void => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            castEvents.push([name, ...rest]);
          });

          expect([vm.isCreated, vm.isBooting, vm.isRunning, vm.isStopped]).toStrictEqual([true, false, false, false]);

          const start = vm.start(dummyWorkerCtor);
          jest.advanceTimersByTime(5);
          expect([vm.isCreated, vm.isBooting, vm.isRunning, vm.isStopped]).toStrictEqual([false, true, false, false]);

          await start;
          expect([vm.isCreated, vm.isBooting, vm.isRunning, vm.isStopped]).toStrictEqual([false, false, true, false]);

          await vm.stop();
          expect([vm.isCreated, vm.isBooting, vm.isRunning, vm.isStopped]).toStrictEqual([false, false, false, true]);

          expect(castEvents).toStrictEqual([[`${_eventPrefix}:${vm.name}:start`, vm]]);
        }),
      );
    });

    describe('stop()', (): void => {
      test('should reject on errors', async (): Promise<void> => {
        const theWorkers: Worker[] = [];
        const intervalsToClear: (number | undefined)[] = [];
        const originalClearInterval = global.clearInterval;
        global.clearInterval = ((id: number | undefined) => {
          intervalsToClear.push(id);
          throw new Error('something');
        }) as typeof global.clearInterval;
        try {
          const workerCtor: WorkerConstructor = (_scriptURL: URL | string, options?: WorkerOptions): Worker => {
            const theWorker = dummyWorkerCtor(_scriptURL, options);
            theWorkers.push(theWorker);
            return theWorker;
          };
          const castEvents: [string, ...AnyArgs][] = [];
          const vm = create();
          vm.on('**', (name: string, ...rest: AnyArgs): void => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            castEvents.push([name, ...rest]);
          });

          await vm.start(workerCtor);
          await expect(vm.stop()).rejects.toStrictEqual(new Error('something'));

          expect(castEvents).toStrictEqual([[`${_eventPrefix}:${vm.name}:start`, vm]]);
        } finally {
          theWorkers.forEach((worker: Worker): void => {
            worker.terminate();
          });
          global.clearInterval = originalClearInterval;
          intervalsToClear.forEach((id: number | undefined): void => {
            clearInterval(id);
          });
        }
      });

      test('should resolve correctly', async (): Promise<void> => {
        const castEvents: [string, ...AnyArgs][] = [];
        const vm = create();
        vm.on('**', (name: string, ...rest: AnyArgs): void => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          castEvents.push([name, ...rest]);
        });

        await vm.start(dummyWorkerCtor);
        await expect(vm.stop()).resolves.toBeUndefined();

        expect(castEvents).toStrictEqual([[`${_eventPrefix}:${vm.name}:start`, vm]]);
      });
    });

    describe('[get name]', (): void => {
      test('should retrieve the given name', (): void => {
        expect(new VMImplementation('test-VMImplementation-get-name').name).toStrictEqual(
          'test-VMImplementation-get-name',
        );
      });
    });

    describe('[get isCreated]', (): void => {
      test(
        'should retrieve correctly',
        asyncWithFakeTimers(async (): Promise<void> => {
          const vm = create();
          expect(vm.isCreated).toStrictEqual(true);

          const start = vm.start(dummyWorkerCtor);
          jest.advanceTimersByTime(5);
          expect(vm.isCreated).toStrictEqual(false);

          await start;
          expect(vm.isCreated).toStrictEqual(false);

          await vm.stop();
          expect(vm.isCreated).toStrictEqual(false);
        }),
      );
    });

    describe('[get isBooting]', (): void => {
      test(
        'should retrieve correctly',
        asyncWithFakeTimers(async (): Promise<void> => {
          const vm = create();
          expect(vm.isBooting).toStrictEqual(false);

          const start = vm.start(dummyWorkerCtor);
          jest.advanceTimersByTime(5);
          expect(vm.isBooting).toStrictEqual(true);

          await start;
          expect(vm.isBooting).toStrictEqual(false);

          await vm.stop();
          expect(vm.isBooting).toStrictEqual(false);
        }),
      );
    });

    describe('[get isRunning]', (): void => {
      test(
        'should retrieve correctly',
        asyncWithFakeTimers(async (): Promise<void> => {
          const vm = create();
          expect(vm.isRunning).toStrictEqual(false);

          const start = vm.start(dummyWorkerCtor);
          jest.advanceTimersByTime(5);
          expect(vm.isRunning).toStrictEqual(false);

          await start;
          expect(vm.isRunning).toStrictEqual(true);

          await vm.stop();
          expect(vm.isRunning).toStrictEqual(false);
        }),
      );
    });

    describe('[get isStopped]', (): void => {
      test(
        'should retrieve correctly',
        asyncWithFakeTimers(async (): Promise<void> => {
          const vm = create();
          expect(vm.isStopped).toStrictEqual(false);

          const start = vm.start(dummyWorkerCtor);
          jest.advanceTimersByTime(5);
          expect(vm.isStopped).toStrictEqual(false);

          await start;
          expect(vm.isStopped).toStrictEqual(false);

          await vm.stop();
          expect(vm.isStopped).toStrictEqual(true);
        }),
      );
    });

    describe('on()', (): void => {
      test(
        'should call listener on positive cast',
        withFakeTimers((): void => {
          const cb = jest.fn();
          const vm: VM = create();

          vm.on('something', cb);
          _cast(`${_eventPrefix}:${vm.name}:something`, 1, 2, 3);
          jest.runAllTimers();

          expect(cb).toHaveBeenCalledWith(`${_eventPrefix}:${vm.name}:something`, 1, 2, 3);
        }),
      );

      test(
        'should not call listener on negative cast',
        withFakeTimers((): void => {
          const cb = jest.fn();
          const vm: VM = create();

          vm.on('something', cb);
          _cast(`${_eventPrefix}:${vm.name}:else`, 1, 2, 3);
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
          const vm: VM = create();

          vm.once('something', cb);
          _cast(`${_eventPrefix}:${vm.name}:something`, 1, 2, 3);
          _cast(`${_eventPrefix}:${vm.name}:something`, 4, 5, 6);
          jest.runAllTimers();

          expect(cb).toHaveBeenCalledTimes(1);
          expect(cb).toHaveBeenCalledWith(`${_eventPrefix}:${vm.name}:something`, 1, 2, 3);
        }),
      );

      test(
        'should not call listener on negative cast',
        withFakeTimers((): void => {
          const cb = jest.fn();
          const vm: VM = create();

          vm.once('something', cb);
          _cast(`${_eventPrefix}:${vm.name}:else`, 1, 2, 3);
          _cast(`${_eventPrefix}:${vm.name}:else`, 4, 5, 6);
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
          const vm: VM = create();

          vm.on('something', cb);
          _cast(`${_eventPrefix}:${vm.name}:something`, 1, 2, 3);
          jest.runAllTimers();

          vm.off(cb);
          _cast(`${_eventPrefix}:${vm.name}:something`, 4, 5, 6);
          jest.runAllTimers();

          expect(cb).toHaveBeenCalledTimes(1);
          expect(cb).toHaveBeenCalledWith(`${_eventPrefix}:${vm.name}:something`, 1, 2, 3);
        }),
      );
    });

    describe('createEnclosure()', (): void => {
      test(
        'should reject on errors',
        asyncWithFakeTimers(async (): Promise<void> => {
          const castEvents: [string, ...AnyArgs][] = [];
          const vm = create();
          await vm.start(
            makeWorkerCtor(
              (
                _this: object,
                _bootTunnel: number,
                _listen: (data: object) => void,
                _shout: (message: object) => void,
              ) => {
                _listen(({ tunnel }: { tunnel: number }) => {
                  _shout({ error: 'some error', name: 'reject', tunnel });
                });
                setTimeout(() => {
                  _shout({ name: 'resolve', payload: 123456, tunnel: _bootTunnel });
                }, 10);
              },
            ),
          );

          jest.advanceTimersByTime(20);

          vm.on('**', (name: string, ...rest: AnyArgs): void => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            castEvents.push([name, ...rest]);
          });

          await expect(vm.createEnclosure('something')).rejects.toStrictEqual(new Error('some error'));

          jest.advanceTimersByTime(10);

          expect(castEvents).toStrictEqual([
            [`${_eventPrefix}:${vm.name}:something:create`, vm],
            [`${_eventPrefix}:${vm.name}:something:create:error`, vm, new Error('some error')],
          ]);

          await vm.stop();
        }),
      );

      test(
        'should reject on invalid enclosure name',
        asyncWithFakeTimers(async (): Promise<void> => {
          const vm = create();
          await vm.start(dummyWorkerCtor);

          jest.advanceTimersByTime(20);

          await expect(vm.createEnclosure('_something')).rejects.toStrictEqual(
            new Error("identifier must adhere to '/^[a-z]\\w*$/i'"),
          );

          await vm.stop();
        }),
      );

      test(
        'should reject if not running',
        asyncWithFakeTimers(async (): Promise<void> => {
          const castEvents: [string, ...AnyArgs][] = [];
          const vm = create();
          vm.on('**', (name: string, ...rest: AnyArgs): void => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            castEvents.push([name, ...rest]);
          });

          await expect(vm.createEnclosure('something')).rejects.toStrictEqual(
            new Error("expected state to be 'running'"),
          );

          jest.advanceTimersByTime(10);

          expect(castEvents).toStrictEqual([
            [`${_eventPrefix}:${vm.name}:something:create`, vm],
            [`${_eventPrefix}:${vm.name}:something:create:error`, vm, new Error("expected state to be 'running'")],
          ]);

          await vm.stop();
        }),
      );

      test(
        'should create an enclosure and return a handler for it',
        asyncWithFakeTimers(async (): Promise<void> => {
          const castEvents: [string, ...AnyArgs][] = [];
          const vm = create();
          await vm.start(
            makeWorkerCtor(
              (
                _this: object,
                _bootTunnel: number,
                _listen: (data: object) => void,
                _shout: (message: object) => void,
              ) => {
                _listen(({ name, tunnel }: { name: string; tunnel: number }) => {
                  if ('create' === name) {
                    _shout({ name: 'resolve', tunnel });
                  } else {
                    _shout({ error: 'not supported', name: 'reject', tunnel });
                  }
                });
                setTimeout(() => {
                  _shout({ name: 'resolve', payload: 123456, tunnel: _bootTunnel });
                }, 10);
              },
            ),
          );

          jest.advanceTimersByTime(20);

          vm.on('**', (name: string, ...rest: AnyArgs): void => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            castEvents.push([name, ...rest]);
          });

          const enclosure: Enclosure = await vm.createEnclosure('something');

          jest.advanceTimersByTime(10);

          expect(enclosure).toBeInstanceOf(EnclosureImplementation);
          expect(enclosure.enclosure).toStrictEqual('something');
          expect(enclosure.vm).toStrictEqual(vm);

          expect(castEvents).toStrictEqual([
            [`${_eventPrefix}:${vm.name}:something:create`, vm],
            [`${_eventPrefix}:${vm.name}:something:create:ok`, vm],
          ]);

          await vm.stop();
        }),
      );
    });

    describe('deleteEnclosure()', (): void => {
      test(
        'should reject on errors',
        asyncWithFakeTimers(async (): Promise<void> => {
          const castEvents: [string, ...AnyArgs][] = [];
          const vm = create();
          await vm.start(
            makeWorkerCtor(
              (
                _this: object,
                _bootTunnel: number,
                _listen: (data: object) => void,
                _shout: (message: object) => void,
              ) => {
                _listen(({ tunnel }: { tunnel: number }) => {
                  _shout({ error: 'some error', name: 'reject', tunnel });
                });
                setTimeout(() => {
                  _shout({ name: 'resolve', payload: 123456, tunnel: _bootTunnel });
                }, 10);
              },
            ),
          );

          jest.advanceTimersByTime(20);

          vm.on('**', (name: string, ...rest: AnyArgs): void => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            castEvents.push([name, ...rest]);
          });

          await expect(vm.deleteEnclosure('something')).rejects.toStrictEqual(new Error('some error'));

          jest.advanceTimersByTime(10);

          expect(castEvents).toStrictEqual([
            [`${_eventPrefix}:${vm.name}:something:delete`, vm],
            [`${_eventPrefix}:${vm.name}:something:delete:error`, vm, new Error('some error')],
          ]);

          await vm.stop();
        }),
      );

      test(
        'should reject on invalid enclosure name',
        asyncWithFakeTimers(async (): Promise<void> => {
          const vm = create();
          await vm.start(dummyWorkerCtor);

          jest.advanceTimersByTime(20);

          await expect(vm.deleteEnclosure('_something')).rejects.toStrictEqual(
            new Error("identifier must adhere to '/^[a-z]\\w*$/i'"),
          );

          await vm.stop();
        }),
      );

      test(
        'should reject if not running',
        asyncWithFakeTimers(async (): Promise<void> => {
          const castEvents: [string, ...AnyArgs][] = [];
          const vm = create();
          vm.on('**', (name: string, ...rest: AnyArgs): void => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            castEvents.push([name, ...rest]);
          });

          await expect(vm.deleteEnclosure('something')).rejects.toStrictEqual(
            new Error("expected state to be 'running'"),
          );

          jest.advanceTimersByTime(10);

          expect(castEvents).toStrictEqual([
            [`${_eventPrefix}:${vm.name}:something:delete`, vm],
            [`${_eventPrefix}:${vm.name}:something:delete:error`, vm, new Error("expected state to be 'running'")],
          ]);

          await vm.stop();
        }),
      );

      test(
        'should delete an enclosure and return an array',
        asyncWithFakeTimers(async (): Promise<void> => {
          const castEvents: [string, ...AnyArgs][] = [];
          const vm = create();
          await vm.start(
            makeWorkerCtor(
              (
                _this: object,
                _bootTunnel: number,
                _listen: (data: object) => void,
                _shout: (message: object) => void,
              ) => {
                _listen(({ enclosure, name, tunnel }: { enclosure: string; name: string; tunnel: number }) => {
                  if ('delete' === name) {
                    _shout({ name: 'resolve', payload: [enclosure], tunnel });
                  } else {
                    _shout({ error: 'not supported', name: 'reject', tunnel });
                  }
                });
                setTimeout(() => {
                  _shout({ name: 'resolve', payload: 123456, tunnel: _bootTunnel });
                }, 10);
              },
            ),
          );

          jest.advanceTimersByTime(20);

          vm.on('**', (name: string, ...rest: AnyArgs): void => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            castEvents.push([name, ...rest]);
          });

          const removed: string[] = await vm.deleteEnclosure('something');

          jest.advanceTimersByTime(10);

          expect(removed).toStrictEqual(['something']);

          expect(castEvents).toStrictEqual([
            [`${_eventPrefix}:${vm.name}:something:delete`, vm],
            [`${_eventPrefix}:${vm.name}:something:delete:ok`, vm, ['something']],
          ]);

          await vm.stop();
        }),
      );
    });

    describe('execute()', (): void => {
      test(
        'should reject on errors',
        asyncWithFakeTimers(async (): Promise<void> => {
          const castEvents: [string, ...AnyArgs][] = [];
          const vm = create();
          await vm.start(
            makeWorkerCtor(
              (
                _this: object,
                _bootTunnel: number,
                _listen: (data: object) => void,
                _shout: (message: object) => void,
              ) => {
                _listen(({ tunnel }: { tunnel: number }) => {
                  _shout({ error: 'some error', name: 'reject', tunnel });
                });
                setTimeout(() => {
                  _shout({ name: 'resolve', payload: 123456, tunnel: _bootTunnel });
                }, 10);
              },
            ),
          );

          jest.advanceTimersByTime(20);

          vm.on('**', (name: string, ...rest: AnyArgs): void => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            castEvents.push([name, ...rest]);
          });

          const dep: Dependency = new DependencyImplementation('whatever', '', new Map<string, string>());
          const args: Map<string, string> = new Map<string, string>();
          await expect(vm.execute('root', dep, args)).rejects.toStrictEqual(new Error('some error'));

          jest.advanceTimersByTime(10);

          expect(castEvents).toStrictEqual([
            [`${_eventPrefix}:${vm.name}:root:execute`, vm, dep, args],
            [`${_eventPrefix}:${vm.name}:root:execute:error`, vm, dep, args, new Error('some error')],
          ]);

          await vm.stop();
        }),
      );

      test(
        'should reject on invalid enclosure name',
        asyncWithFakeTimers(async (): Promise<void> => {
          const vm = create();
          await vm.start(dummyWorkerCtor);

          jest.advanceTimersByTime(20);

          await expect(
            vm.execute('_something', new DependencyImplementation('whatever', '', new Map<string, string>())),
          ).rejects.toStrictEqual(new Error("identifier must adhere to '/^[a-z]\\w*$/i'"));

          await vm.stop();
        }),
      );

      test(
        'should reject if not running',
        asyncWithFakeTimers(async (): Promise<void> => {
          const castEvents: [string, ...AnyArgs][] = [];
          const vm = create();
          vm.on('**', (name: string, ...rest: AnyArgs): void => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            castEvents.push([name, ...rest]);
          });

          const dep: Dependency = new DependencyImplementation('whatever', '', new Map<string, string>());
          const args: Map<string, string> = new Map<string, string>();
          await expect(vm.execute('root', dep, args)).rejects.toStrictEqual(
            new Error("expected state to be 'running'"),
          );

          jest.advanceTimersByTime(10);

          expect(castEvents).toStrictEqual([
            [`${_eventPrefix}:${vm.name}:root:execute`, vm, dep, args],
            [
              `${_eventPrefix}:${vm.name}:root:execute:error`,
              vm,
              dep,
              args,
              new Error("expected state to be 'running'"),
            ],
          ]);

          await vm.stop();
        }),
      );

      test(
        'should execute a dependency and return its result',
        asyncWithFakeTimers(async (): Promise<void> => {
          const castEvents: [string, ...AnyArgs][] = [];
          const vm = create();
          await vm.start(
            makeWorkerCtor(
              (
                _this: object,
                _bootTunnel: number,
                _listen: (data: object) => void,
                _shout: (message: object) => void,
              ) => {
                _listen(({ name, tunnel }: { name: string; tunnel: number }) => {
                  if ('execute' === name) {
                    _shout({ name: 'resolve', payload: [{ something: 'else' }], tunnel });
                  } else {
                    _shout({ error: 'not supported', name: 'reject', tunnel });
                  }
                });
                setTimeout(() => {
                  _shout({ name: 'resolve', payload: 123456, tunnel: _bootTunnel });
                }, 10);
              },
            ),
          );

          jest.advanceTimersByTime(20);

          vm.on('**', (name: string, ...rest: AnyArgs): void => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            castEvents.push([name, ...rest]);
          });

          const dep: Dependency = new DependencyImplementation('whatever', '', new Map<string, string>());
          const args: Map<string, string> = new Map<string, string>();
          const results: unknown = await vm.execute('root', dep, args);

          jest.advanceTimersByTime(10);

          expect(results).toStrictEqual([{ something: 'else' }]);

          expect(castEvents).toStrictEqual([
            [`${_eventPrefix}:${vm.name}:root:execute`, vm, dep, args],
            [`${_eventPrefix}:${vm.name}:root:execute:ok`, vm, dep, args, [{ something: 'else' }]],
          ]);

          await vm.stop();
        }),
      );
    });

    describe('getSubEnclosures()', (): void => {
      test(
        'should reject on errors',
        asyncWithFakeTimers(async (): Promise<void> => {
          const vm = create();
          await vm.start(
            makeWorkerCtor(
              (
                _this: object,
                _bootTunnel: number,
                _listen: (data: object) => void,
                _shout: (message: object) => void,
              ) => {
                _listen(({ tunnel }: { tunnel: number }) => {
                  _shout({ error: 'some error', name: 'reject', tunnel });
                });
                setTimeout(() => {
                  _shout({ name: 'resolve', payload: 123456, tunnel: _bootTunnel });
                }, 10);
              },
            ),
          );

          jest.advanceTimersByTime(20);

          await expect(vm.getSubEnclosures('root')).rejects.toStrictEqual(new Error('some error'));

          await vm.stop();
        }),
      );

      test(
        'should reject on invalid enclosure name',
        asyncWithFakeTimers(async (): Promise<void> => {
          const vm = create();
          await vm.start(dummyWorkerCtor);

          jest.advanceTimersByTime(20);

          await expect(vm.getSubEnclosures('_something')).rejects.toStrictEqual(
            new Error("identifier must adhere to '/^[a-z]\\w*$/i'"),
          );

          await vm.stop();
        }),
      );

      test(
        'should reject on non-integer depth',
        asyncWithFakeTimers(async (): Promise<void> => {
          const vm = create();
          await vm.start(dummyWorkerCtor);

          jest.advanceTimersByTime(20);

          await expect(vm.getSubEnclosures('root', 12.34)).rejects.toStrictEqual(
            new Error('expected datum to be a safe integer'),
          );

          await vm.stop();
        }),
      );

      test(
        'should reject on negative depth',
        asyncWithFakeTimers(async (): Promise<void> => {
          const vm = create();
          await vm.start(dummyWorkerCtor);

          jest.advanceTimersByTime(20);

          await expect(vm.getSubEnclosures('root', -12)).rejects.toStrictEqual(
            new Error('expected datum to be non-negative'),
          );

          await vm.stop();
        }),
      );

      test(
        'should reject if not running',
        asyncWithFakeTimers(async (): Promise<void> => {
          const vm = create();

          await expect(vm.getSubEnclosures('root')).rejects.toStrictEqual(new Error("expected state to be 'running'"));

          await vm.stop();
        }),
      );

      test(
        'should get sub-enclosures',
        asyncWithFakeTimers(async (): Promise<void> => {
          const vm = create();
          await vm.start(
            makeWorkerCtor(
              (
                _this: object,
                _bootTunnel: number,
                _listen: (data: object) => void,
                _shout: (message: object) => void,
              ) => {
                _listen(({ name, tunnel }: { name: string; tunnel: number }) => {
                  if ('getSubEnclosures' === name) {
                    _shout({ name: 'resolve', payload: [{ something: 'else' }], tunnel });
                  } else {
                    _shout({ error: 'not supported', name: 'reject', tunnel });
                  }
                });
                setTimeout(() => {
                  _shout({ name: 'resolve', payload: 123456, tunnel: _bootTunnel });
                }, 10);
              },
            ),
          );

          jest.advanceTimersByTime(20);

          await expect(vm.getSubEnclosures('root')).resolves.toStrictEqual([{ something: 'else' }]);

          await vm.stop();
        }),
      );
    });

    describe('install()', (): void => {
      test(
        'should reject on errors',
        asyncWithFakeTimers(async (): Promise<void> => {
          const castEvents: [string, ...AnyArgs][] = [];
          const vm = create();
          await vm.start(
            makeWorkerCtor(
              (
                _this: object,
                _bootTunnel: number,
                _listen: (data: object) => void,
                _shout: (message: object) => void,
              ) => {
                _listen(({ tunnel }: { tunnel: number }) => {
                  _shout({ error: 'some error', name: 'reject', tunnel });
                });
                setTimeout(() => {
                  _shout({ name: 'resolve', payload: 123456, tunnel: _bootTunnel });
                }, 10);
              },
            ),
          );

          jest.advanceTimersByTime(20);

          vm.on('**', (name: string, ...rest: AnyArgs): void => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            castEvents.push([name, ...rest]);
          });

          const dep: Dependency = new DependencyImplementation('whatever', '', new Map<string, string>());
          await expect(vm.install('root', dep)).rejects.toStrictEqual(new Error('some error'));

          jest.advanceTimersByTime(10);

          expect(castEvents).toStrictEqual([
            [`${_eventPrefix}:${vm.name}:root:install`, vm, dep],
            [`${_eventPrefix}:${vm.name}:root:install:error`, vm, dep, new Error('some error')],
          ]);

          await vm.stop();
        }),
      );

      test(
        'should reject on invalid enclosure name',
        asyncWithFakeTimers(async (): Promise<void> => {
          const vm = create();
          await vm.start(dummyWorkerCtor);

          jest.advanceTimersByTime(20);

          await expect(
            vm.install('_something', new DependencyImplementation('whatever', '', new Map<string, string>())),
          ).rejects.toStrictEqual(new Error("identifier must adhere to '/^[a-z]\\w*$/i'"));

          await vm.stop();
        }),
      );

      test(
        'should reject if not running',
        asyncWithFakeTimers(async (): Promise<void> => {
          const castEvents: [string, ...AnyArgs][] = [];
          const vm = create();
          vm.on('**', (name: string, ...rest: AnyArgs): void => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            castEvents.push([name, ...rest]);
          });

          const dep: Dependency = new DependencyImplementation('whatever', '', new Map<string, string>());
          await expect(vm.install('root', dep)).rejects.toStrictEqual(new Error("expected state to be 'running'"));

          jest.advanceTimersByTime(10);

          expect(castEvents).toStrictEqual([
            [`${_eventPrefix}:${vm.name}:root:install`, vm, dep],
            [`${_eventPrefix}:${vm.name}:root:install:error`, vm, dep, new Error("expected state to be 'running'")],
          ]);

          await vm.stop();
        }),
      );

      test(
        'should install a dependency',
        asyncWithFakeTimers(async (): Promise<void> => {
          const castEvents: [string, ...AnyArgs][] = [];
          const vm = create();
          await vm.start(
            makeWorkerCtor(
              (
                _this: object,
                _bootTunnel: number,
                _listen: (data: object) => void,
                _shout: (message: object) => void,
              ) => {
                _listen(({ name, tunnel }: { name: string; tunnel: number }) => {
                  if ('install' === name) {
                    _shout({ name: 'resolve', tunnel });
                  } else {
                    _shout({ error: 'not supported', name: 'reject', tunnel });
                  }
                });
                setTimeout(() => {
                  _shout({ name: 'resolve', payload: 123456, tunnel: _bootTunnel });
                }, 10);
              },
            ),
          );

          jest.advanceTimersByTime(20);

          vm.on('**', (name: string, ...rest: AnyArgs): void => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            castEvents.push([name, ...rest]);
          });

          const dep: Dependency = new DependencyImplementation('whatever', '', new Map<string, string>());

          await expect(vm.install('root', dep)).resolves.toBeUndefined();

          jest.advanceTimersByTime(10);

          expect(castEvents).toStrictEqual([
            [`${_eventPrefix}:${vm.name}:root:install`, vm, dep],
            [`${_eventPrefix}:${vm.name}:root:install:ok`, vm, dep],
          ]);

          await vm.stop();
        }),
      );
    });
  });
});
