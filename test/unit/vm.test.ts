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
        expect(new VMImplementation('test-VMImplementation-constructor-1').name).toStrictEqual(
          'test-VMImplementation-constructor-1',
        );
      });

      test('should throw if constructing with duplicate name', (): void => {
        new VMImplementation('test-VMImplementation-constructor-2');
        expect((): void => {
          new VMImplementation('test-VMImplementation-constructor-2');
        }).toThrow(new Error('duplicate name test-VMImplementation-constructor-2'));
      });
    });

    describe('start()', (): void => {
      test('should reject for negative timeout', async (): Promise<void> => {
        await expect(create('test-VMImplementation-start-1').start(undefined, -1)).rejects.toStrictEqual(
          new Error('expected datum to be non-negative'),
        );
      });

      test('should reject for non-integer timeout', async (): Promise<void> => {
        await expect(create('test-VMImplementation-start-2').start(undefined, 12.34)).rejects.toStrictEqual(
          new Error('expected datum to be a safe integer'),
        );
      });

      test('should reject for timeout too large', async (): Promise<void> => {
        await expect(create('test-VMImplementation-start-3').start(undefined, (1 << 30) + 1)).rejects.toStrictEqual(
          new Error('expected time delta to be at most 1073741824'),
        );
      });

      test('should reject for negative ping interval', async (): Promise<void> => {
        await expect(create('test-VMImplementation-start-4').start(undefined, undefined, -1)).rejects.toStrictEqual(
          new Error('expected datum to be non-negative'),
        );
      });

      test('should reject for non-integer ping interval', async (): Promise<void> => {
        await expect(create('test-VMImplementation-start-5').start(undefined, undefined, 12.34)).rejects.toStrictEqual(
          new Error('expected datum to be a safe integer'),
        );
      });

      test('should reject for ping interval too large', async (): Promise<void> => {
        await expect(
          create('test-VMImplementation-start-6').start(undefined, undefined, (1 << 30) + 1),
        ).rejects.toStrictEqual(new Error('expected time delta to be at most 1073741824'));
      });

      test('should reject for negative pong limit', async (): Promise<void> => {
        await expect(
          create('test-VMImplementation-start-7').start(undefined, undefined, undefined, -1),
        ).rejects.toStrictEqual(new Error('expected datum to be non-negative'));
      });

      test('should reject for non-integer pong limit', async (): Promise<void> => {
        await expect(
          create('test-VMImplementation-start-8').start(undefined, undefined, undefined, 12.34),
        ).rejects.toStrictEqual(new Error('expected datum to be a safe integer'));
      });

      test('should reject if worker constructor fails', async (): Promise<void> => {
        await expect(create('test-VMImplementation-start-9').start(errorWorkerCtor)).rejects.toStrictEqual(
          new Error('something'),
        );
      });

      test('should reject if no boot signal received', async (): Promise<void> => {
        const castEvents: [string, ...AnyArgs][] = [];
        const vm = create('test-VMImplementation-start-10');
        vm.on('**', (name: string, ...rest: AnyArgs): void => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          castEvents.push([name, ...rest]);
        });

        await expect(vm.start(emptyWorkerCtor, 0)).rejects.toStrictEqual(new Error('boot timed out'));

        expect(castEvents).toStrictEqual([['nomadvm:test-VMImplementation-start-10:start', vm]]);
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
            const vm = create('test-VMImplementation-start-11');
            vm.on('**', (name: string, ...rest: AnyArgs): void => {
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
              castEvents.push([name, ...rest]);
            });

            await expect(vm.start(errorWorkerCtor)).rejects.toStrictEqual(new Error('something'));

            jest.advanceTimersByTime(1);

            expect(castEvents).toStrictEqual([
              ['nomadvm:test-VMImplementation-start-11:start', vm],
              ['nomadvm:test-VMImplementation-start-11:start:error', vm, new Error('something')],
              ['nomadvm:test-VMImplementation-start-11:stop', vm],
              ['nomadvm:test-VMImplementation-start-11:stop:error', vm, new Error('else')],
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
          const vm = create('test-VMImplementation-start-12');
          vm.on('**', (name: string, ...rest: AnyArgs): void => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            castEvents.push([name, ...rest]);
          });

          await expect(vm.start(workerCtor)).rejects.toStrictEqual(new Error('boot timed out'));

          expect(castEvents).toStrictEqual([['nomadvm:test-VMImplementation-start-12:start', vm]]);
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
        const vm = create('test-VMImplementation-start-13');
        vm.on('**', (name: string, ...rest: AnyArgs): void => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          castEvents.push([name, ...rest]);
        });

        const { inside, outside } = await vm.start(dummyWorkerCtor);
        expect(inside).toStrictEqual(123456);
        expect(outside).toBeGreaterThanOrEqual(0);

        expect(castEvents).toStrictEqual([['nomadvm:test-VMImplementation-start-13:start', vm]]);

        await vm.stop();
      });

      test(
        'should stop vm upon failing to receive a pong',
        asyncWithFakeTimers(async (): Promise<void> => {
          const castEvents: [string, ...AnyArgs][] = [];
          const vm = create('test-VMImplementation-start-14');
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
            ['nomadvm:test-VMImplementation-start-14:start', vm],
            ['nomadvm:test-VMImplementation-start-14:start:ok', vm],
            ['nomadvm:test-VMImplementation-start-14:worker:unresponsive', vm, 2],
            ['nomadvm:test-VMImplementation-start-14:stop', vm],
            ['nomadvm:test-VMImplementation-start-14:stop:ok', vm],
          ]);
        }),
      );

      test('should reject if starting a stopped vm', async (): Promise<void> => {
        const castEvents: [string, ...AnyArgs][] = [];
        const vm = create('test-VMImplementation-start-15');
        vm.on('**', (name: string, ...rest: AnyArgs): void => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          castEvents.push([name, ...rest]);
        });

        await vm.start(dummyWorkerCtor);
        await vm.stop();
        await expect(vm.start(dummyWorkerCtor)).rejects.toStrictEqual(new Error("expected state to be 'created'"));

        expect(castEvents).toStrictEqual([['nomadvm:test-VMImplementation-start-15:start', vm]]);
      });

      test(
        'should transit states',
        asyncWithFakeTimers(async (): Promise<void> => {
          const castEvents: [string, ...AnyArgs][] = [];
          const vm = create('test-VMImplementation-start-17');
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

          expect(castEvents).toStrictEqual([['nomadvm:test-VMImplementation-start-17:start', vm]]);
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
          const vm = create('test-VMImplementation-stop-1');
          vm.on('**', (name: string, ...rest: AnyArgs): void => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            castEvents.push([name, ...rest]);
          });

          await vm.start(workerCtor);
          await expect(vm.stop()).rejects.toStrictEqual(new Error('something'));

          expect(castEvents).toStrictEqual([['nomadvm:test-VMImplementation-stop-1:start', vm]]);
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
        const vm = create('test-VMImplementation-stop-2');
        vm.on('**', (name: string, ...rest: AnyArgs): void => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          castEvents.push([name, ...rest]);
        });

        await vm.start(dummyWorkerCtor);
        await expect(vm.stop()).resolves.toBeUndefined();

        expect(castEvents).toStrictEqual([['nomadvm:test-VMImplementation-stop-2:start', vm]]);
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
          const vm = create('test-VMImplementation-get-isCreated');
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
          const vm = create('test-VMImplementation-get-isBooting');
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
          const vm = create('test-VMImplementation-get-isRunning');
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
          const vm = create('test-VMImplementation-get-isStopped');
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
          const vm: VM = create('test-VMImplementation-on-1');

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
          const vm: VM = create('test-VMImplementation-on-2');

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
          const vm: VM = create('test-VMImplementation-once-1');

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
          const vm: VM = create('test-VMImplementation-once-2');

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
          const vm: VM = create('test-VMImplementation-off-1');

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
          const vm = create('test-VMImplementation-createEnclosure-1');
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
                    _shout({ error: 'some error', name: 'reject', tunnel });
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

          await expect(vm.createEnclosure('something')).rejects.toStrictEqual(new Error('some error'));

          jest.advanceTimersByTime(10);

          expect(castEvents).toStrictEqual([
            ['nomadvm:test-VMImplementation-createEnclosure-1:something:create', vm],
            ['nomadvm:test-VMImplementation-createEnclosure-1:something:create:error', vm, new Error('some error')],
          ]);

          await vm.stop();
        }),
      );

      test(
        'should reject if not running',
        asyncWithFakeTimers(async (): Promise<void> => {
          const castEvents: [string, ...AnyArgs][] = [];
          const vm = create('test-VMImplementation-createEnclosure-2');
          vm.on('**', (name: string, ...rest: AnyArgs): void => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            castEvents.push([name, ...rest]);
          });

          await expect(vm.createEnclosure('something')).rejects.toStrictEqual(
            new Error("expected state to be 'running'"),
          );

          jest.advanceTimersByTime(10);

          expect(castEvents).toStrictEqual([
            ['nomadvm:test-VMImplementation-createEnclosure-2:something:create', vm],
            [
              'nomadvm:test-VMImplementation-createEnclosure-2:something:create:error',
              vm,
              new Error("expected state to be 'running'"),
            ],
          ]);

          await vm.stop();
        }),
      );

      test(
        'should create an enclosure and return a handler for it',
        asyncWithFakeTimers(async (): Promise<void> => {
          const castEvents: [string, ...AnyArgs][] = [];
          const vm = create('test-VMImplementation-createEnclosure-3');
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
            ['nomadvm:test-VMImplementation-createEnclosure-3:something:create', vm],
            ['nomadvm:test-VMImplementation-createEnclosure-3:something:create:ok', vm],
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
          const vm = create('test-VMImplementation-deleteEnclosure-1');
          await vm.start(
            makeWorkerCtor(
              (
                _this: object,
                _bootTunnel: number,
                _listen: (data: object) => void,
                _shout: (message: object) => void,
              ) => {
                _listen(({ name, tunnel }: { name: string; tunnel: number }) => {
                  if ('delete' === name) {
                    _shout({ error: 'some error', name: 'reject', tunnel });
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

          await expect(vm.deleteEnclosure('something')).rejects.toStrictEqual(new Error('some error'));

          jest.advanceTimersByTime(10);

          expect(castEvents).toStrictEqual([
            ['nomadvm:test-VMImplementation-deleteEnclosure-1:something:delete', vm],
            ['nomadvm:test-VMImplementation-deleteEnclosure-1:something:delete:error', vm, new Error('some error')],
          ]);

          await vm.stop();
        }),
      );

      test(
        'should reject if not running',
        asyncWithFakeTimers(async (): Promise<void> => {
          const castEvents: [string, ...AnyArgs][] = [];
          const vm = create('test-VMImplementation-deleteEnclosure-2');
          vm.on('**', (name: string, ...rest: AnyArgs): void => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            castEvents.push([name, ...rest]);
          });

          await expect(vm.deleteEnclosure('something')).rejects.toStrictEqual(
            new Error("expected state to be 'running'"),
          );

          jest.advanceTimersByTime(10);

          expect(castEvents).toStrictEqual([
            ['nomadvm:test-VMImplementation-deleteEnclosure-2:something:delete', vm],
            [
              'nomadvm:test-VMImplementation-deleteEnclosure-2:something:delete:error',
              vm,
              new Error("expected state to be 'running'"),
            ],
          ]);

          await vm.stop();
        }),
      );

      test(
        'should delete an enclosure and return an array',
        asyncWithFakeTimers(async (): Promise<void> => {
          const castEvents: [string, ...AnyArgs][] = [];
          const vm = create('test-VMImplementation-deleteEnclosure-3');
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
            ['nomadvm:test-VMImplementation-deleteEnclosure-3:something:delete', vm],
            ['nomadvm:test-VMImplementation-deleteEnclosure-3:something:delete:ok', vm, ['something']],
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
          const vm = create('test-VMImplementation-execute-1');
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
                    _shout({ error: 'some error', name: 'reject', tunnel });
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
          await expect(vm.execute('root', dep, args)).rejects.toStrictEqual(new Error('some error'));

          jest.advanceTimersByTime(10);

          expect(castEvents).toStrictEqual([
            ['nomadvm:test-VMImplementation-execute-1:root:execute', vm, dep, args],
            ['nomadvm:test-VMImplementation-execute-1:root:execute:error', vm, dep, args, new Error('some error')],
          ]);

          await vm.stop();
        }),
      );

      test(
        'should reject if not running',
        asyncWithFakeTimers(async (): Promise<void> => {
          const castEvents: [string, ...AnyArgs][] = [];
          const vm = create('test-VMImplementation-execute-2');
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
            ['nomadvm:test-VMImplementation-execute-2:root:execute', vm, dep, args],
            [
              'nomadvm:test-VMImplementation-execute-2:root:execute:error',
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
          const vm = create('test-VMImplementation-execute-3');
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
          const removed: unknown = await vm.execute('root', dep, args);

          jest.advanceTimersByTime(10);

          expect(removed).toStrictEqual([{ something: 'else' }]);

          expect(castEvents).toStrictEqual([
            ['nomadvm:test-VMImplementation-execute-3:root:execute', vm, dep, args],
            ['nomadvm:test-VMImplementation-execute-3:root:execute:ok', vm, dep, args, [{ something: 'else' }]],
          ]);

          await vm.stop();
        }),
      );
    });
  });
});
