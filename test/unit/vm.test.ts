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

import WebWorker from 'web-worker';

import type { AnyArgs, Dependency } from '../../src/dependency';
import type { ArgumentsMap } from '../../src/validation';
import type { Enclosure, VM } from '../../src/vm';
import type { WorkerConstructor } from '../../src/worker';

import { DependencyImplementation } from '../../src/dependency';
import { EventCasterImplementation } from '../../src/eventCaster';
import {
  _cast,
  _errorMessage,
  _eventPrefix,
  _makeError,
  _pseudoRandomString,
  create,
  EnclosureImplementation,
  events,
  get,
  VMImplementation,
} from '../../src/vm';
import { _wrapCode } from '../../src/worker';
import { asyncRestoringMocks, delay, restoringMocks, stringToDataUri, testAll, withFakeTimers } from '../helpers';

describe('vm', (): void => {
  describe('_pseudoRandomString()', (): void => {
    test('should generate 8 hex chars', (): void => {
      expect(
        new Array(20)
          .map((): string => _pseudoRandomString())
          .every((prs: string): boolean => /^[a-f0-9]{8}$/i.test(prs)),
      ).toStrictEqual(true);
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
      expect(Object.isFrozen(events)).toStrictEqual(true);
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
      const gotten: undefined | VM = get('test-get-1');
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
      (_scriptURL: string | URL, options?: WorkerOptions): Worker =>
        new WebWorker(
          stringToDataUri(_wrapCode(body.toString().toString(), 0, 'root').replaceAll('ErrorEvent', 'Event')),
          options,
        );

    const errorWorkerCtor: WorkerConstructor = (): Worker => {
      throw new Error('something');
    };

    const emptyWorkerCtor: WorkerConstructor = makeWorkerCtor(() => {});

    const dummyWorkerCtor: WorkerConstructor = makeWorkerCtor(
      (
        _bootTunnel: number,
        _defaultEnclosureName: string,
        _listen: (data: object) => void,
        _shout: (message: object) => void,
      ) => {
        _listen((data: Record<string, unknown>) => {
          const name: string = data.name as string;
          switch (name) {
            case 'create':
              _shout({ name: 'resolve', tunnel: data.tunnel });
              break;
            case 'delete':
              _shout({ name: 'resolve', payload: [data.enclosure], tunnel: data.tunnel });
              break;
            case 'emit':
              // NOP
              break;
            case 'execute':
              _shout({ name: 'resolve', tunnel: data.tunnel });
              break;
            case 'getSubEnclosures':
              _shout({ name: 'resolve', payload: [], tunnel: data.tunnel });
              break;
            case 'install':
              _shout({ name: 'resolve', tunnel: data.tunnel });
              break;
            case 'isMuted':
              _shout({ name: 'resolve', payload: false, tunnel: data.tunnel });
              break;
            case 'link':
              _shout({ name: 'resolve', payload: false, tunnel: data.tunnel });
              break;
            case 'listInstalled':
              _shout({ name: 'resolve', payload: [], tunnel: data.tunnel });
              break;
            case 'listLinkedFrom':
              _shout({ name: 'resolve', payload: [], tunnel: data.tunnel });
              break;
            case 'listLinksTo':
              _shout({ name: 'resolve', payload: [], tunnel: data.tunnel });
              break;
            case 'listRootEnclosures':
              _shout({ name: 'resolve', payload: ['root'], tunnel: data.tunnel });
              break;
            case 'merge':
              _shout({ name: 'resolve', tunnel: data.tunnel });
              break;
            case 'mute':
              _shout({ name: 'resolve', payload: false, tunnel: data.tunnel });
              break;
            case 'ping':
              _shout({ name: 'pong' });
              break;
            case 'predefine':
              _shout({ name: 'resolve', tunnel: data.tunnel });
              break;
            case 'reject':
              // NOP
              break;
            case 'resolve':
              // NOP
              break;
            case 'unlink':
              _shout({ name: 'resolve', payload: false, tunnel: data.tunnel });
              break;
            case 'unmute':
              _shout({ name: 'resolve', payload: false, tunnel: data.tunnel });
              break;
            default: {
              _shout({ error: `unknown event name ${name}`, name: 'reject', tunnel: data.tunnel });
            }
          }
        });
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

      test('should reject for invalid root enclosure name', async (): Promise<void> => {
        await expect(create().start(undefined, undefined, '_something')).rejects.toStrictEqual(
          new Error("identifier must adhere to '/^[a-z]\\w*$/i'"),
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

      test('stop() errors should not shadow boot rejection on worker constructor failure', async (): Promise<void> => {
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

          await delay(10);

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
      });

      test('stop() errors should not shadow boot rejection on boot timeout', async (): Promise<void> => {
        const theWorkers: Worker[] = [];
        const intervalsToClear: (number | undefined)[] = [];
        const originalClearInterval = global.clearInterval;
        global.clearInterval = ((id: number | undefined) => {
          intervalsToClear.push(id);
          throw new Error('something');
        }) as typeof global.clearInterval;
        try {
          const workerCtor: WorkerConstructor = (scriptURL: string | URL, options?: WorkerOptions): Worker => {
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

        await expect(vm.start(dummyWorkerCtor)).resolves.toBeInstanceOf(EnclosureImplementation);

        await delay(25);

        expect(castEvents).toHaveLength(2);
        expect(castEvents[0]).toStrictEqual([`${_eventPrefix}:${vm.name}:start`, vm]);

        const [name, evm, enclosure, inside, outside]: [string, VM, string, number, number] = castEvents[1] as [
          string,
          VM,
          string,
          number,
          number,
        ];
        expect(name).toStrictEqual(`${_eventPrefix}:${vm.name}:start:ok`);
        expect(evm).toStrictEqual(vm);
        expect(enclosure).toStrictEqual('root');
        expect(inside).toStrictEqual(123456);
        expect(outside).toBeGreaterThanOrEqual(0);

        await vm.stop();
      });

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

      test('should transit states', async (): Promise<void> => {
        const vm = create();
        expect([vm.isCreated, vm.isBooting, vm.isRunning, vm.isStopping, vm.isStopped]).toStrictEqual([
          true,
          false,
          false,
          false,
          false,
        ]);

        const start = vm.start(
          makeWorkerCtor(
            (
              _bootTunnel: number,
              _defaultEnclosureName: string,
              _listen: (data: object) => void,
              _shout: (message: object) => void,
            ) => {
              _listen((data: Record<string, unknown>) => {
                const name: string = data.name as string;
                if ('emit' === name) {
                  // NOP
                } else if ('delete' === name) {
                  _shout({ name: 'resolve', payload: [data.enclosure], tunnel: data.tunnel });
                } else if ('listRootEnclosures' === name) {
                  _shout({ name: 'resolve', payload: ['root'], tunnel: data.tunnel });
                } else {
                  _shout({ error: `not supported ${name}`, name: 'reject', tunnel: data.tunnel });
                }
              });
              setTimeout(() => {
                _shout({ name: 'resolve', payload: 123456, tunnel: _bootTunnel });
              }, 10);
            },
          ),
        );
        expect([vm.isCreated, vm.isBooting, vm.isRunning, vm.isStopping, vm.isStopped]).toStrictEqual([
          false,
          true,
          false,
          false,
          false,
        ]);

        await start;
        expect([vm.isCreated, vm.isBooting, vm.isRunning, vm.isStopping, vm.isStopped]).toStrictEqual([
          false,
          false,
          true,
          false,
          false,
        ]);

        const shutdown = vm.shutdown();
        expect([vm.isCreated, vm.isBooting, vm.isRunning, vm.isStopping, vm.isStopped]).toStrictEqual([
          false,
          false,
          false,
          true,
          false,
        ]);

        await shutdown;
        expect([vm.isCreated, vm.isBooting, vm.isRunning, vm.isStopping, vm.isStopped]).toStrictEqual([
          false,
          false,
          false,
          false,
          true,
        ]);
      });

      test('should handle worker emit', async (): Promise<void> => {
        const castEvents: [string, ...AnyArgs][] = [];
        const vm = create();
        vm.on('**', (name: string, ...rest: AnyArgs): void => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          castEvents.push([name, ...rest]);
        });

        await vm.start(
          makeWorkerCtor(
            (
              _bootTunnel: number,
              _defaultEnclosureName: string,
              _listen: (data: object) => void,
              _shout: (message: object) => void,
            ) => {
              setTimeout(() => {
                _shout({ name: 'resolve', payload: 123456, tunnel: _bootTunnel });
                setTimeout(() => {
                  _shout({ args: [], event: 'foobar', name: 'emit' });
                }, 10);
              }, 10);
            },
          ),
        );

        await delay(25);

        expect(castEvents).toHaveLength(3);
        expect(castEvents[0]).toStrictEqual([`${_eventPrefix}:${vm.name}:start`, vm]);
        expect([castEvents[1]?.[0], castEvents[1]?.[1], castEvents[1]?.[2], castEvents[1]?.[3]]).toStrictEqual([
          `${_eventPrefix}:${vm.name}:start:ok`,
          vm,
          'root',
          123456,
        ]);
        expect(castEvents[2]).toStrictEqual([`${_eventPrefix}:${vm.name}:user:foobar`, vm]);

        await vm.stop();
      });

      test('should deal with malformed event', async (): Promise<void> => {
        const castEvents: [string, ...AnyArgs][] = [];
        const vm = create();
        vm.on('**', (name: string, ...rest: AnyArgs): void => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          castEvents.push([name, ...rest]);
        });

        await vm.start(
          makeWorkerCtor(
            (
              _bootTunnel: number,
              _defaultEnclosureName: string,
              _listen: (data: object) => void,
              _shout: (message: object) => void,
            ) => {
              setTimeout(() => {
                _shout({ name: 'resolve', payload: 123456, tunnel: _bootTunnel });
                setTimeout(() => {
                  _shout({ name: 123 });
                }, 10);
              }, 10);
            },
          ),
        );

        await delay(25);

        expect(castEvents).toHaveLength(3);
        expect(castEvents[0]).toStrictEqual([`${_eventPrefix}:${vm.name}:start`, vm]);
        expect([castEvents[1]?.[0], castEvents[1]?.[1], castEvents[1]?.[2], castEvents[1]?.[3]]).toStrictEqual([
          `${_eventPrefix}:${vm.name}:start:ok`,
          vm,
          'root',
          123456,
        ]);
        expect(castEvents[2]).toStrictEqual([
          `${_eventPrefix}:${vm.name}:worker:error`,
          vm,
          new Error('malformed event {"name":123}'),
        ]);

        await vm.stop();
      });

      test('should deal with unknown event', async (): Promise<void> => {
        const castEvents: [string, ...AnyArgs][] = [];
        const vm = create();
        vm.on('**', (name: string, ...rest: AnyArgs): void => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          castEvents.push([name, ...rest]);
        });

        await vm.start(
          makeWorkerCtor(
            (
              _bootTunnel: number,
              _defaultEnclosureName: string,
              _listen: (data: object) => void,
              _shout: (message: object) => void,
            ) => {
              _listen((data: Record<string, unknown>) => {
                const name: string = data.name as string;
                if ('reject' === name) {
                  _shout({ args: [data.tunnel], event: 'foobar', name: 'emit' });
                } else {
                  _shout({ error: 'not supported', name: 'reject', tunnel: data.tunnel });
                }
              });
              setTimeout(() => {
                _shout({ name: 'resolve', payload: 123456, tunnel: _bootTunnel });
                setTimeout(() => {
                  _shout({ name: 'foobar', tunnel: 123 });
                }, 10);
              }, 10);
            },
          ),
        );

        await delay(25);

        expect(castEvents).toHaveLength(4);
        expect(castEvents[0]).toStrictEqual([`${_eventPrefix}:${vm.name}:start`, vm]);
        expect([castEvents[1]?.[0], castEvents[1]?.[1], castEvents[1]?.[2], castEvents[1]?.[3]]).toStrictEqual([
          `${_eventPrefix}:${vm.name}:start:ok`,
          vm,
          'root',
          123456,
        ]);
        expect([castEvents[2], castEvents[3]]).toStrictEqual([
          [`${_eventPrefix}:${vm.name}:worker:error`, vm, new Error('unknown event name foobar')],
          [`${_eventPrefix}:${vm.name}:user:foobar`, vm, 123],
        ]);

        await vm.stop();
      });

      test('should deal with unknown event with no tunnel', async (): Promise<void> => {
        const castEvents: [string, ...AnyArgs][] = [];
        const vm = create();
        vm.on('**', (name: string, ...rest: AnyArgs): void => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          castEvents.push([name, ...rest]);
        });

        await vm.start(
          makeWorkerCtor(
            (
              _bootTunnel: number,
              _defaultEnclosureName: string,
              _listen: (data: object) => void,
              _shout: (message: object) => void,
            ) => {
              setTimeout(() => {
                _shout({ name: 'resolve', payload: 123456, tunnel: _bootTunnel });
                setTimeout(() => {
                  _shout({ name: 'foobar' });
                }, 10);
              }, 10);
            },
          ),
        );

        await delay(25);

        expect(castEvents).toHaveLength(3);
        expect(castEvents[0]).toStrictEqual([`${_eventPrefix}:${vm.name}:start`, vm]);
        expect([castEvents[1]?.[0], castEvents[1]?.[1], castEvents[1]?.[2], castEvents[1]?.[3]]).toStrictEqual([
          `${_eventPrefix}:${vm.name}:start:ok`,
          vm,
          'root',
          123456,
        ]);
        expect(castEvents[2]).toStrictEqual([
          `${_eventPrefix}:${vm.name}:worker:error`,
          vm,
          new Error('unknown event name foobar'),
        ]);

        await vm.stop();
      });

      test('should deal with non-existing tunnel', async (): Promise<void> => {
        const castEvents: [string, ...AnyArgs][] = [];
        const vm = create();
        vm.on('**', (name: string, ...rest: AnyArgs): void => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          castEvents.push([name, ...rest]);
        });

        await vm.start(
          makeWorkerCtor(
            (
              _bootTunnel: number,
              _defaultEnclosureName: string,
              _listen: (data: object) => void,
              _shout: (message: object) => void,
            ) => {
              setTimeout(() => {
                _shout({ name: 'resolve', payload: 123456, tunnel: _bootTunnel });
                setTimeout(() => {
                  _shout({ name: 'resolve', payload: 789, tunnel: _bootTunnel });
                }, 10);
              }, 10);
            },
          ),
        );

        await delay(25);

        expect(castEvents).toHaveLength(3);
        expect(castEvents[0]).toStrictEqual([`${_eventPrefix}:${vm.name}:start`, vm]);
        expect([castEvents[1]?.[0], castEvents[1]?.[1], castEvents[1]?.[2], castEvents[1]?.[3]]).toStrictEqual([
          `${_eventPrefix}:${vm.name}:start:ok`,
          vm,
          'root',
          123456,
        ]);
        expect(castEvents[2]).toStrictEqual([
          `${_eventPrefix}:${vm.name}:worker:error`,
          vm,
          new Error('tunnel 0 does not exist'),
        ]);

        await vm.stop();
      });
    });

    describe('shutdown()', (): void => {
      test('should reject for negative timeout', async (): Promise<void> => {
        const vm = create();
        await vm.start(dummyWorkerCtor);

        await expect(vm.shutdown(-1)).rejects.toStrictEqual(new Error('expected datum to be non-negative'));

        await vm.stop();
      });

      test('should reject for non-integer timeout', async (): Promise<void> => {
        const vm = create();
        await vm.start(dummyWorkerCtor);

        await expect(vm.shutdown(12.34)).rejects.toStrictEqual(new Error('expected datum to be a safe integer'));

        await vm.stop();
      });

      test('should reject for timeout too large', async (): Promise<void> => {
        const vm = create();
        await vm.start(dummyWorkerCtor);

        await expect(vm.shutdown((1 << 30) + 1)).rejects.toStrictEqual(
          new Error('expected time delta to be at most 1073741824'),
        );

        await vm.stop();
      });

      test('should shut down', async (): Promise<void> => {
        const castEvents: [string, ...AnyArgs][] = [];
        const vm = create();
        vm.on('**', (name: string, ...rest: AnyArgs): void => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          castEvents.push([name, ...rest]);
        });

        await vm.start(
          makeWorkerCtor(
            (
              _bootTunnel: number,
              _defaultEnclosureName: string,
              _listen: (data: object) => void,
              _shout: (message: object) => void,
            ) => {
              _listen((data: Record<string, unknown>) => {
                const name: string = data.name as string;
                if ('emit' === name) {
                  _shout({ args: [data], event: 'host-emit', name: 'emit' });
                } else if ('delete' === name) {
                  _shout({ name: 'resolve', payload: [data.enclosure], tunnel: data.tunnel });
                } else if ('listRootEnclosures' === name) {
                  _shout({ name: 'resolve', payload: ['enclosure1', 'enclosure2', 'enclosure3'], tunnel: data.tunnel });
                } else {
                  _shout({ error: 'not supported', name: 'reject', tunnel: data.tunnel });
                }
              });
              setTimeout(() => {
                _shout({ name: 'resolve', payload: 123456, tunnel: _bootTunnel });
              }, 10);
            },
          ),
        );

        await delay(25);

        await vm.shutdown();

        await delay(20);

        expect(castEvents).toHaveLength(14);
        expect(castEvents[0]).toStrictEqual([`${_eventPrefix}:${vm.name}:start`, vm]);
        expect([castEvents[1]?.[0], castEvents[1]?.[1], castEvents[1]?.[2], castEvents[1]?.[3]]).toStrictEqual([
          `${_eventPrefix}:${vm.name}:start:ok`,
          vm,
          'root',
          123456,
        ]);
        expect([
          castEvents[2],
          castEvents[3],
          castEvents[4],
          castEvents[5],
          castEvents[6],
          castEvents[7],
          castEvents[8],
          castEvents[9],
          castEvents[10],
          castEvents[11],
          castEvents[12],
        ]).toStrictEqual([
          [`${_eventPrefix}:${vm.name}:shutdown`, vm],
          [
            `${_eventPrefix}:${vm.name}:user:host-emit`,
            vm,
            { args: [], enclosure: 'enclosure1', event: 'shutdown', name: 'emit' },
          ],
          [
            `${_eventPrefix}:${vm.name}:user:host-emit`,
            vm,
            { args: [], enclosure: 'enclosure2', event: 'shutdown', name: 'emit' },
          ],
          [
            `${_eventPrefix}:${vm.name}:user:host-emit`,
            vm,
            { args: [], enclosure: 'enclosure3', event: 'shutdown', name: 'emit' },
          ],
          [`${_eventPrefix}:${vm.name}:enclosure1:delete`, vm],
          [`${_eventPrefix}:${vm.name}:enclosure2:delete`, vm],
          [`${_eventPrefix}:${vm.name}:enclosure3:delete`, vm],
          [`${_eventPrefix}:${vm.name}:enclosure1:delete:ok`, vm, ['enclosure1']],
          [`${_eventPrefix}:${vm.name}:enclosure2:delete:ok`, vm, ['enclosure2']],
          [`${_eventPrefix}:${vm.name}:enclosure3:delete:ok`, vm, ['enclosure3']],
          [`${_eventPrefix}:${vm.name}:stop`, vm],
        ]);
      });
    });

    describe('installAll()', (): void => {
      test('should reject on invalid enclosure name', async (): Promise<void> => {
        const vm = create();
        await vm.start(dummyWorkerCtor);

        await delay(20);

        await expect(vm.installAll('_something', [])).rejects.toStrictEqual(
          new Error("identifier must adhere to '/^[a-z]\\w*$/i'"),
        );

        await vm.stop();
      });

      test('should handle enclosure creation failure', async (): Promise<void> => {
        const vm = create();

        await vm.start(
          makeWorkerCtor(
            (
              _bootTunnel: number,
              _defaultEnclosureName: string,
              _listen: (data: object) => void,
              _shout: (message: object) => void,
            ) => {
              _listen((data: Record<string, unknown>): void => {
                const name: string = data.name as string;
                if ('create' === name) {
                  _shout({ error: 'foobar', name: 'reject', tunnel: data.tunnel as number });
                } else {
                  _shout({ error: 'not supported', name: 'reject', tunnel: data.tunnel });
                }
              });
              setTimeout(() => {
                _shout({ name: 'resolve', payload: 123456, tunnel: _bootTunnel });
              }, 10);
            },
          ),
        );

        await expect(vm.installAll('something', [])).rejects.toStrictEqual(new Error('foobar'));

        await delay(25);

        await vm.stop();
      });

      test('should handle enclosure listing installed dependencies failure when failing to delete', async (): Promise<void> => {
        const vm = create();

        await vm.start(
          makeWorkerCtor(
            (
              _bootTunnel: number,
              _defaultEnclosureName: string,
              _listen: (data: object) => void,
              _shout: (message: object) => void,
            ) => {
              _listen((data: Record<string, unknown>): void => {
                const name: string = data.name as string;
                if ('create' === name) {
                  _shout({ name: 'resolve', tunnel: data.tunnel as number });
                } else if ('delete' === name) {
                  _shout({ error: 'foobar', name: 'reject', tunnel: data.tunnel as number });
                } else if ('listInstalled' === name) {
                  _shout({ error: 'foobaz', name: 'reject', tunnel: data.tunnel as number });
                } else {
                  _shout({ error: 'not supported', name: 'reject', tunnel: data.tunnel });
                }
              });
              setTimeout(() => {
                _shout({ name: 'resolve', payload: 123456, tunnel: _bootTunnel });
              }, 10);
            },
          ),
        );

        await expect(vm.installAll('something', [])).rejects.toStrictEqual(new Error('foobaz'));

        await delay(25);

        await vm.stop();
      });

      test('should handle enclosure listing installed dependencies failure', async (): Promise<void> => {
        const vm = create();

        await vm.start(
          makeWorkerCtor(
            (
              _bootTunnel: number,
              _defaultEnclosureName: string,
              _listen: (data: object) => void,
              _shout: (message: object) => void,
            ) => {
              _listen((data: Record<string, unknown>): void => {
                const name: string = data.name as string;
                if ('create' === name) {
                  _shout({ name: 'resolve', tunnel: data.tunnel as number });
                } else if ('delete' === name) {
                  _shout({ name: 'resolve', payload: [data.enclosure], tunnel: data.tunnel as number });
                } else if ('listInstalled' === name) {
                  _shout({ error: 'foobaz', name: 'reject', tunnel: data.tunnel as number });
                } else {
                  _shout({ error: 'not supported', name: 'reject', tunnel: data.tunnel });
                }
              });
              setTimeout(() => {
                _shout({ name: 'resolve', payload: 123456, tunnel: _bootTunnel });
              }, 10);
            },
          ),
        );

        await expect(vm.installAll('something', [])).rejects.toStrictEqual(new Error('foobaz'));

        await delay(25);

        await vm.stop();
      });

      test('should handle dependency install failure when failing to delete', async (): Promise<void> => {
        const vm = create();

        await vm.start(
          makeWorkerCtor(
            (
              _bootTunnel: number,
              _defaultEnclosureName: string,
              _listen: (data: object) => void,
              _shout: (message: object) => void,
            ) => {
              _listen((data: Record<string, unknown>): void => {
                const name: string = data.name as string;
                if ('create' === name) {
                  _shout({ name: 'resolve', tunnel: data.tunnel as number });
                } else if ('delete' === name) {
                  _shout({ error: 'foobar', name: 'reject', tunnel: data.tunnel as number });
                } else if ('listInstalled' === name) {
                  _shout({ name: 'resolve', payload: ['stuff'], tunnel: data.tunnel as number });
                } else if ('install' === name) {
                  _shout({ error: 'foobaz', name: 'reject', tunnel: data.tunnel as number });
                } else {
                  _shout({ error: 'not supported', name: 'reject', tunnel: data.tunnel });
                }
              });
              setTimeout(() => {
                _shout({ name: 'resolve', payload: 123456, tunnel: _bootTunnel });
              }, 10);
            },
          ),
        );

        await expect(
          vm.installAll('something', [new DependencyImplementation('bar', '', new Map<string, string>())]),
        ).rejects.toStrictEqual(new Error('foobaz'));

        await delay(25);

        await vm.stop();
      });

      test('should handle dependency install failure', async (): Promise<void> => {
        const vm = create();

        await vm.start(
          makeWorkerCtor(
            (
              _bootTunnel: number,
              _defaultEnclosureName: string,
              _listen: (data: object) => void,
              _shout: (message: object) => void,
            ) => {
              _listen((data: Record<string, unknown>): void => {
                const name: string = data.name as string;
                if ('create' === name) {
                  _shout({ name: 'resolve', tunnel: data.tunnel as number });
                } else if ('delete' === name) {
                  _shout({ name: 'resolve', payload: [data.enclosure], tunnel: data.tunnel as number });
                } else if ('listInstalled' === name) {
                  _shout({ name: 'resolve', payload: ['stuff'], tunnel: data.tunnel as number });
                } else if ('install' === name) {
                  _shout({ error: 'foobaz', name: 'reject', tunnel: data.tunnel as number });
                } else {
                  _shout({ error: 'not supported', name: 'reject', tunnel: data.tunnel });
                }
              });
              setTimeout(() => {
                _shout({ name: 'resolve', payload: 123456, tunnel: _bootTunnel });
              }, 10);
            },
          ),
        );

        await expect(
          vm.installAll('something', [new DependencyImplementation('bar', '', new Map<string, string>())]),
        ).rejects.toStrictEqual(new Error('foobaz'));

        await delay(25);

        await vm.stop();
      });

      test('should handle merging failure when failing to delete', async (): Promise<void> => {
        const vm = create();

        await vm.start(
          makeWorkerCtor(
            (
              _bootTunnel: number,
              _defaultEnclosureName: string,
              _listen: (data: object) => void,
              _shout: (message: object) => void,
            ) => {
              _listen((data: Record<string, unknown>): void => {
                const name: string = data.name as string;
                if ('create' === name) {
                  _shout({ name: 'resolve', tunnel: data.tunnel as number });
                } else if ('delete' === name) {
                  _shout({ error: 'foobar', name: 'reject', tunnel: data.tunnel as number });
                } else if ('listInstalled' === name) {
                  _shout({ name: 'resolve', payload: ['stuff'], tunnel: data.tunnel as number });
                } else if ('install' === name) {
                  _shout({ name: 'resolve', tunnel: data.tunnel as number });
                } else if ('merge' === name) {
                  _shout({ error: 'foobaz', name: 'reject', tunnel: data.tunnel as number });
                } else {
                  _shout({ error: 'not supported', name: 'reject', tunnel: data.tunnel });
                }
              });
              setTimeout(() => {
                _shout({ name: 'resolve', payload: 123456, tunnel: _bootTunnel });
              }, 10);
            },
          ),
        );

        await expect(
          vm.installAll('something', [new DependencyImplementation('bar', '', new Map<string, string>())]),
        ).rejects.toStrictEqual(new Error('foobaz'));

        await delay(25);

        await vm.stop();
      });

      test('should handle merging failure', async (): Promise<void> => {
        const vm = create();

        await vm.start(
          makeWorkerCtor(
            (
              _bootTunnel: number,
              _defaultEnclosureName: string,
              _listen: (data: object) => void,
              _shout: (message: object) => void,
            ) => {
              _listen((data: Record<string, unknown>): void => {
                const name: string = data.name as string;
                if ('create' === name) {
                  _shout({ name: 'resolve', tunnel: data.tunnel as number });
                } else if ('delete' === name) {
                  _shout({ name: 'resolve', payload: [data.enclosure], tunnel: data.tunnel as number });
                } else if ('listInstalled' === name) {
                  _shout({ name: 'resolve', payload: ['stuff'], tunnel: data.tunnel as number });
                } else if ('install' === name) {
                  _shout({ name: 'resolve', tunnel: data.tunnel as number });
                } else if ('merge' === name) {
                  _shout({ error: 'foobaz', name: 'reject', tunnel: data.tunnel as number });
                } else {
                  _shout({ error: 'not supported', name: 'reject', tunnel: data.tunnel });
                }
              });
              setTimeout(() => {
                _shout({ name: 'resolve', payload: 123456, tunnel: _bootTunnel });
              }, 10);
            },
          ),
        );

        await expect(
          vm.installAll('something', [new DependencyImplementation('bar', '', new Map<string, string>())]),
        ).rejects.toStrictEqual(new Error('foobaz'));

        await delay(25);

        await vm.stop();
      });

      test('should install all', async (): Promise<void> => {
        const vm = create();

        await vm.start(
          makeWorkerCtor(
            (
              _bootTunnel: number,
              _defaultEnclosureName: string,
              _listen: (data: object) => void,
              _shout: (message: object) => void,
            ) => {
              _listen((data: Record<string, unknown>): void => {
                const name: string = data.name as string;
                if ('create' === name) {
                  _shout({ name: 'resolve', tunnel: data.tunnel as number });
                } else if ('delete' === name) {
                  _shout({ name: 'resolve', payload: [data.enclosure], tunnel: data.tunnel as number });
                } else if ('listInstalled' === name) {
                  _shout({ name: 'resolve', payload: ['stuff'], tunnel: data.tunnel as number });
                } else if ('install' === name) {
                  _shout({ name: 'resolve', tunnel: data.tunnel as number });
                } else if ('merge' === name) {
                  _shout({ name: 'resolve', tunnel: data.tunnel as number });
                } else {
                  _shout({ error: 'not supported', name: 'reject', tunnel: data.tunnel });
                }
              });
              setTimeout(() => {
                _shout({ name: 'resolve', payload: 123456, tunnel: _bootTunnel });
              }, 10);
            },
          ),
        );

        await expect(
          vm.installAll('something', [new DependencyImplementation('bar', '', new Map<string, string>())]),
        ).resolves.toBeUndefined();

        await delay(25);

        await vm.stop();
      });

      test('should handle stray errors', async (): Promise<void> => {
        const vm = create();
        jest.spyOn(vm, 'createEnclosure').mockImplementation(() => {
          throw new Error('foobar');
        });

        await vm.start(
          makeWorkerCtor(
            (
              _bootTunnel: number,
              _defaultEnclosureName: string,
              _listen: (data: object) => void,
              _shout: (message: object) => void,
            ) => {
              setTimeout(() => {
                _shout({ name: 'resolve', payload: 123456, tunnel: _bootTunnel });
              }, 10);
            },
          ),
        );

        await expect(vm.installAll('something', [])).rejects.toStrictEqual(new Error('foobar'));

        await delay(25);

        await vm.stop();
      });
    });

    describe('startPinger()', (): void => {
      test('should throw for negative ping interval', async (): Promise<void> => {
        const vm = create();
        await vm.start(dummyWorkerCtor);
        expect(() => vm.startPinger(-1)).toThrow(new Error('expected datum to be non-negative'));
        await vm.stop();
      });

      test('should throw for non-integer ping interval', async (): Promise<void> => {
        const vm = create();
        await vm.start(dummyWorkerCtor);
        expect(() => vm.startPinger(12.34)).toThrow(new Error('expected datum to be a safe integer'));
        await vm.stop();
      });

      test('should throw for ping interval too large', async (): Promise<void> => {
        const vm = create();
        await vm.start(dummyWorkerCtor);
        expect(() => vm.startPinger((1 << 30) + 1)).toThrow(new Error('expected time delta to be at most 1073741824'));
        await vm.stop();
      });

      test('should throw for negative pong limit', async (): Promise<void> => {
        const vm = create();
        await vm.start(dummyWorkerCtor);
        expect(() => vm.startPinger(undefined, -1)).toThrow(new Error('expected datum to be non-negative'));
        await vm.stop();
      });

      test('should throw for non-integer pong limit', async (): Promise<void> => {
        const vm = create();
        await vm.start(dummyWorkerCtor);
        expect(() => vm.startPinger(undefined, 12.34)).toThrow(new Error('expected datum to be a safe integer'));
        await vm.stop();
      });

      test('should throw for non-running VM', (): void => {
        expect(() => {
          create().startPinger();
        }).toThrow(new Error("expected state to be 'running'"));
      });

      test('should stop vm upon failing to receive a pong', async (): Promise<void> => {
        const castEvents: [string, ...AnyArgs][] = [];
        const vm = create();
        vm.on('**', (name: string, ...rest: AnyArgs): void => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          castEvents.push([name, ...rest]);
        });

        await vm.start(
          makeWorkerCtor(
            (
              _bootTunnel: number,
              _defaultEnclosureName: string,
              _listen: (data: object) => void,
              _shout: (message: object) => void,
            ) => {
              setTimeout(() => {
                _shout({ name: 'resolve', payload: 123456, tunnel: _bootTunnel });
              }, 10);
            },
          ),
          undefined,
        );

        vm.startPinger(1, 1);

        await delay(15);

        expect(vm.isStopped).toStrictEqual(true);

        expect(castEvents).toHaveLength(5);
        expect(castEvents[0]).toStrictEqual([`${_eventPrefix}:${vm.name}:start`, vm]);
        expect([castEvents[1]?.[0], castEvents[1]?.[1], castEvents[1]?.[2], castEvents[1]?.[3]]).toStrictEqual([
          `${_eventPrefix}:${vm.name}:start:ok`,
          vm,
          'root',
          123456,
        ]);
        expect([castEvents[2]?.[0], castEvents[2]?.[1]]).toStrictEqual([
          `${_eventPrefix}:${vm.name}:worker:unresponsive`,
          vm,
        ]);
        expect([castEvents[3], castEvents[4]]).toStrictEqual([
          [`${_eventPrefix}:${vm.name}:stop`, vm],
          [`${_eventPrefix}:${vm.name}:stop:ok`, vm],
        ]);
      });

      test('should handle worker pongs', async (): Promise<void> => {
        const vm = create();
        await vm.start(
          makeWorkerCtor(
            (
              _bootTunnel: number,
              _defaultEnclosureName: string,
              _listen: (data: object) => void,
              _shout: (message: object) => void,
            ) => {
              let pongs: number = 0;
              _listen((data: Record<string, unknown>) => {
                const name: string = data.name as string;
                if ('ping' === name) {
                  _shout({ name: 'pong' });
                  pongs++;
                } else if ('execute' === name) {
                  _shout({ name: 'resolve', payload: pongs, tunnel: data.tunnel as number });
                } else {
                  _shout({ error: 'not supported', name: 'reject', tunnel: data.tunnel });
                }
              });
              setTimeout(() => {
                _shout({ name: 'resolve', payload: 123456, tunnel: _bootTunnel });
              }, 10);
            },
          ),
          undefined,
        );
        vm.startPinger(10, 20);

        await delay(25);

        await expect(
          vm.execute('root', new DependencyImplementation('something', '', new Map<string, string>())),
        ).resolves.toStrictEqual(2);

        await vm.stop();
      });
    });

    describe('stopPinger()', (): void => {
      test('should work even if not running', (): void => {
        const vm = create();
        expect(vm.stopPinger()).toStrictEqual(vm);
      });

      test('should stop twice', (): void => {
        const vm = create();
        expect(vm.stopPinger().stopPinger()).toStrictEqual(vm);
      });

      test('should stop then restart and not mark the worker as unresponsive', async (): Promise<void> => {
        const castEvents: [string, ...AnyArgs][] = [];
        const vm = create();
        vm.on('**', (name: string, ...rest: AnyArgs): void => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          castEvents.push([name, ...rest]);
        });

        await vm.start(dummyWorkerCtor, undefined);
        vm.startPinger(20, 1);

        await delay(15);

        expect(vm.stopPinger()).toStrictEqual(vm);

        await delay(100);

        expect(vm.startPinger()).toStrictEqual(vm);

        await delay(10);

        await vm.stop();

        await delay(10);

        expect(castEvents).toHaveLength(4);
        expect(castEvents[0]).toStrictEqual([`${_eventPrefix}:${vm.name}:start`, vm]);
        expect([castEvents[1]?.[0], castEvents[1]?.[1], castEvents[1]?.[2], castEvents[1]?.[3]]).toStrictEqual([
          `${_eventPrefix}:${vm.name}:start:ok`,
          vm,
          'root',
          123456,
        ]);
        expect([castEvents[2], castEvents[3]]).toStrictEqual([
          [`${_eventPrefix}:${vm.name}:stop`, vm],
          [`${_eventPrefix}:${vm.name}:stop:ok`, vm],
        ]);
      });
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
          const workerCtor: WorkerConstructor = (_scriptURL: string | URL, options?: WorkerOptions): Worker => {
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

      test('should deal with errors during final rejection', async (): Promise<void> => {
        const vm = create();

        await vm.start(
          makeWorkerCtor(
            (
              _bootTunnel: number,
              _defaultEnclosureName: string,
              _listen: (data: object) => void,
              _shout: (message: object) => void,
            ) => {
              _listen((data: Record<string, unknown>): void => {
                const name: string = data.name as string;
                if ('listInstalled' === name) {
                  // NOP
                }
              });
              setTimeout(() => {
                _shout({ name: 'resolve', payload: 123456, tunnel: _bootTunnel });
              }, 10);
            },
          ),
        );

        let rejectError: Error | undefined = undefined;
        void vm.listInstalled('whatever').then(
          (): void => {
            throw new Error('RESOLVED');
          },
          (error: unknown): void => {
            rejectError = _makeError(error);
          },
        );

        await expect(vm.stop()).resolves.toBeUndefined();

        expect(rejectError).toStrictEqual(new Error('stopped'));
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
      test('should retrieve correctly', async (): Promise<void> => {
        const vm = create();
        expect(vm.isCreated).toStrictEqual(true);

        const start = vm.start(dummyWorkerCtor);
        await delay(5);
        expect(vm.isCreated).toStrictEqual(false);

        await start;
        expect(vm.isCreated).toStrictEqual(false);

        const shutdown = vm.shutdown(10);
        await delay(5);
        expect(vm.isCreated).toStrictEqual(false);

        await shutdown;
        expect(vm.isCreated).toStrictEqual(false);
      });
    });

    describe('[get isBooting]', (): void => {
      test('should retrieve correctly', async (): Promise<void> => {
        const vm = create();
        expect(vm.isBooting).toStrictEqual(false);

        const start = vm.start(dummyWorkerCtor);
        await delay(5);
        expect(vm.isBooting).toStrictEqual(true);

        await start;
        expect(vm.isBooting).toStrictEqual(false);

        const shutdown = vm.shutdown(10);
        await delay(5);
        expect(vm.isBooting).toStrictEqual(false);

        await shutdown;
        expect(vm.isBooting).toStrictEqual(false);
      });
    });

    describe('[get isRunning]', (): void => {
      test('should retrieve correctly', async (): Promise<void> => {
        const vm = create();
        expect(vm.isRunning).toStrictEqual(false);

        const start = vm.start(dummyWorkerCtor);
        await delay(5);
        expect(vm.isRunning).toStrictEqual(false);

        await start;
        expect(vm.isRunning).toStrictEqual(true);

        const shutdown = vm.shutdown(10);
        await delay(5);
        expect(vm.isRunning).toStrictEqual(false);

        await shutdown;
        expect(vm.isRunning).toStrictEqual(false);
      });
    });

    describe('[get isStopping]', (): void => {
      test('should retrieve correctly', async (): Promise<void> => {
        const vm = create();
        expect(vm.isStopping).toStrictEqual(false);

        const start = vm.start(dummyWorkerCtor);
        await delay(5);
        expect(vm.isStopping).toStrictEqual(false);

        await start;
        expect(vm.isStopping).toStrictEqual(false);

        const shutdown = vm.shutdown(10);
        await delay(5);
        expect(vm.isStopping).toStrictEqual(true);

        await shutdown;
        expect(vm.isStopping).toStrictEqual(false);
      });
    });

    describe('[get isStopped]', (): void => {
      test('should retrieve correctly', async (): Promise<void> => {
        const vm = create();
        expect(vm.isStopped).toStrictEqual(false);

        const start = vm.start(dummyWorkerCtor);
        await delay(5);
        expect(vm.isStopped).toStrictEqual(false);

        await start;
        expect(vm.isStopped).toStrictEqual(false);

        const shutdown = vm.shutdown(10);
        await delay(5);
        expect(vm.isStopped).toStrictEqual(false);

        await shutdown;
        expect(vm.isStopped).toStrictEqual(true);
      });
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
      test('should reject on errors', async (): Promise<void> => {
        const castEvents: [string, ...AnyArgs][] = [];
        const vm = create();
        await vm.start(
          makeWorkerCtor(
            (
              _bootTunnel: number,
              _defaultEnclosureName: string,
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

        await delay(20);

        vm.on('**', (name: string, ...rest: AnyArgs): void => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          castEvents.push([name, ...rest]);
        });

        await expect(vm.createEnclosure('something')).rejects.toStrictEqual(new Error('some error'));

        await delay(10);

        expect(castEvents).toStrictEqual([
          [`${_eventPrefix}:${vm.name}:something:create`, vm],
          [`${_eventPrefix}:${vm.name}:something:create:error`, vm, new Error('some error')],
        ]);

        await vm.stop();
      });

      test('should reject on invalid enclosure name', async (): Promise<void> => {
        const vm = create();
        await vm.start(dummyWorkerCtor);

        await delay(20);

        await expect(vm.createEnclosure('_something')).rejects.toStrictEqual(
          new Error("identifier must adhere to '/^[a-z]\\w*$/i'"),
        );

        await vm.stop();
      });

      test('should reject if not running', async (): Promise<void> => {
        const castEvents: [string, ...AnyArgs][] = [];
        const vm = create();
        vm.on('**', (name: string, ...rest: AnyArgs): void => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          castEvents.push([name, ...rest]);
        });

        await expect(vm.createEnclosure('something')).rejects.toStrictEqual(
          new Error("expected state to be 'running'"),
        );

        await delay(10);

        expect(castEvents).toStrictEqual([
          [`${_eventPrefix}:${vm.name}:something:create`, vm],
          [`${_eventPrefix}:${vm.name}:something:create:error`, vm, new Error("expected state to be 'running'")],
        ]);

        await vm.stop();
      });

      test('should create an enclosure and return a handler for it', async (): Promise<void> => {
        const castEvents: [string, ...AnyArgs][] = [];
        const vm = create();
        await vm.start(
          makeWorkerCtor(
            (
              _bootTunnel: number,
              _defaultEnclosureName: string,
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

        await delay(20);

        vm.on('**', (name: string, ...rest: AnyArgs): void => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          castEvents.push([name, ...rest]);
        });

        const enclosure: Enclosure = await vm.createEnclosure('something');

        await delay(10);

        expect(enclosure).toBeInstanceOf(EnclosureImplementation);
        expect(enclosure.enclosure).toStrictEqual('something');
        expect(enclosure.vm).toStrictEqual(vm);

        expect(castEvents).toStrictEqual([
          [`${_eventPrefix}:${vm.name}:something:create`, vm],
          [`${_eventPrefix}:${vm.name}:something:create:ok`, vm],
        ]);

        await vm.stop();
      });
    });

    describe('deleteEnclosure()', (): void => {
      test('should reject on errors', async (): Promise<void> => {
        const castEvents: [string, ...AnyArgs][] = [];
        const vm = create();
        await vm.start(
          makeWorkerCtor(
            (
              _bootTunnel: number,
              _defaultEnclosureName: string,
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

        await delay(20);

        vm.on('**', (name: string, ...rest: AnyArgs): void => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          castEvents.push([name, ...rest]);
        });

        await expect(vm.deleteEnclosure('something')).rejects.toStrictEqual(new Error('some error'));

        await delay(10);

        expect(castEvents).toStrictEqual([
          [`${_eventPrefix}:${vm.name}:something:delete`, vm],
          [`${_eventPrefix}:${vm.name}:something:delete:error`, vm, new Error('some error')],
        ]);

        await vm.stop();
      });

      test('should reject on invalid enclosure name', async (): Promise<void> => {
        const vm = create();
        await vm.start(dummyWorkerCtor);

        await delay(20);

        await expect(vm.deleteEnclosure('_something')).rejects.toStrictEqual(
          new Error("identifier must adhere to '/^[a-z]\\w*$/i'"),
        );

        await vm.stop();
      });

      test('should reject if not running', async (): Promise<void> => {
        const castEvents: [string, ...AnyArgs][] = [];
        const vm = create();
        vm.on('**', (name: string, ...rest: AnyArgs): void => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          castEvents.push([name, ...rest]);
        });

        await expect(vm.deleteEnclosure('something')).rejects.toStrictEqual(
          new Error("expected state to be 'running' or 'stopping'"),
        );

        await delay(10);

        expect(castEvents).toStrictEqual([
          [`${_eventPrefix}:${vm.name}:something:delete`, vm],
          [
            `${_eventPrefix}:${vm.name}:something:delete:error`,
            vm,
            new Error("expected state to be 'running' or 'stopping'"),
          ],
        ]);

        await vm.stop();
      });

      test('should delete an enclosure and return an array', async (): Promise<void> => {
        const castEvents: [string, ...AnyArgs][] = [];
        const vm = create();
        await vm.start(
          makeWorkerCtor(
            (
              _bootTunnel: number,
              _defaultEnclosureName: string,
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

        await delay(20);

        vm.on('**', (name: string, ...rest: AnyArgs): void => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          castEvents.push([name, ...rest]);
        });

        const removed: string[] = await vm.deleteEnclosure('something');

        await delay(10);

        expect(removed).toStrictEqual(['something']);

        expect(castEvents).toStrictEqual([
          [`${_eventPrefix}:${vm.name}:something:delete`, vm],
          [`${_eventPrefix}:${vm.name}:something:delete:ok`, vm, ['something']],
        ]);

        await vm.stop();
      });
    });

    describe('execute()', (): void => {
      test('should reject on errors', async (): Promise<void> => {
        const castEvents: [string, ...AnyArgs][] = [];
        const vm = create();
        await vm.start(
          makeWorkerCtor(
            (
              _bootTunnel: number,
              _defaultEnclosureName: string,
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

        await delay(20);

        vm.on('**', (name: string, ...rest: AnyArgs): void => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          castEvents.push([name, ...rest]);
        });

        const dep: Dependency = new DependencyImplementation('whatever', '', new Map<string, string>());
        const args: Map<string, string> = new Map<string, string>();
        await expect(vm.execute('root', dep, args)).rejects.toStrictEqual(new Error('some error'));

        await delay(10);

        expect(castEvents).toStrictEqual([
          [`${_eventPrefix}:${vm.name}:root:execute`, vm, dep, args],
          [`${_eventPrefix}:${vm.name}:root:execute:error`, vm, dep, args, new Error('some error')],
        ]);

        await vm.stop();
      });

      test('should reject on invalid enclosure name', async (): Promise<void> => {
        const vm = create();
        await vm.start(dummyWorkerCtor);

        await delay(20);

        await expect(
          vm.execute('_something', new DependencyImplementation('whatever', '', new Map<string, string>())),
        ).rejects.toStrictEqual(new Error("identifier must adhere to '/^[a-z]\\w*$/i'"));

        await vm.stop();
      });

      test('should reject if not running', async (): Promise<void> => {
        const castEvents: [string, ...AnyArgs][] = [];
        const vm = create();
        vm.on('**', (name: string, ...rest: AnyArgs): void => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          castEvents.push([name, ...rest]);
        });

        const dep: Dependency = new DependencyImplementation('whatever', '', new Map<string, string>());
        const args: Map<string, string> = new Map<string, string>();
        await expect(vm.execute('root', dep, args)).rejects.toStrictEqual(new Error("expected state to be 'running'"));

        await delay(10);

        expect(castEvents).toStrictEqual([
          [`${_eventPrefix}:${vm.name}:root:execute`, vm, dep, args],
          [`${_eventPrefix}:${vm.name}:root:execute:error`, vm, dep, args, new Error("expected state to be 'running'")],
        ]);

        await vm.stop();
      });

      test('should execute a dependency and return its result', async (): Promise<void> => {
        const castEvents: [string, ...AnyArgs][] = [];
        const vm = create();
        await vm.start(
          makeWorkerCtor(
            (
              _bootTunnel: number,
              _defaultEnclosureName: string,
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

        await delay(20);

        vm.on('**', (name: string, ...rest: AnyArgs): void => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          castEvents.push([name, ...rest]);
        });

        const dep: Dependency = new DependencyImplementation('whatever', '', new Map<string, string>());
        const args: Map<string, string> = new Map<string, string>();
        const results: unknown = await vm.execute('root', dep, args);

        await delay(10);

        expect(results).toStrictEqual([{ something: 'else' }]);

        expect(castEvents).toStrictEqual([
          [`${_eventPrefix}:${vm.name}:root:execute`, vm, dep, args],
          [`${_eventPrefix}:${vm.name}:root:execute:ok`, vm, dep, args, [{ something: 'else' }]],
        ]);

        await vm.stop();
      });
    });

    describe('getSubEnclosures()', (): void => {
      test('should reject on errors', async (): Promise<void> => {
        const vm = create();
        await vm.start(
          makeWorkerCtor(
            (
              _bootTunnel: number,
              _defaultEnclosureName: string,
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

        await delay(20);

        await expect(vm.getSubEnclosures('root')).rejects.toStrictEqual(new Error('some error'));

        await vm.stop();
      });

      test('should reject on invalid enclosure name', async (): Promise<void> => {
        const vm = create();
        await vm.start(dummyWorkerCtor);

        await delay(20);

        await expect(vm.getSubEnclosures('_something')).rejects.toStrictEqual(
          new Error("identifier must adhere to '/^[a-z]\\w*$/i'"),
        );

        await vm.stop();
      });

      test('should reject on non-integer depth', async (): Promise<void> => {
        const vm = create();
        await vm.start(dummyWorkerCtor);

        await delay(20);

        await expect(vm.getSubEnclosures('root', 12.34)).rejects.toStrictEqual(
          new Error('expected datum to be a safe integer'),
        );

        await vm.stop();
      });

      test('should reject on negative depth', async (): Promise<void> => {
        const vm = create();
        await vm.start(dummyWorkerCtor);

        await delay(20);

        await expect(vm.getSubEnclosures('root', -12)).rejects.toStrictEqual(
          new Error('expected datum to be non-negative'),
        );

        await vm.stop();
      });

      test('should reject if not running', async (): Promise<void> => {
        const vm = create();

        await expect(vm.getSubEnclosures('root')).rejects.toStrictEqual(new Error("expected state to be 'running'"));

        await vm.stop();
      });

      test('should get sub-enclosures', async (): Promise<void> => {
        const vm = create();
        await vm.start(
          makeWorkerCtor(
            (
              _bootTunnel: number,
              _defaultEnclosureName: string,
              _listen: (data: object) => void,
              _shout: (message: object) => void,
            ) => {
              _listen(({ name, tunnel }: { name: string; tunnel: number }) => {
                if ('getSubEnclosures' === name) {
                  _shout({ name: 'resolve', payload: ['one', 'two', 'three'], tunnel });
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

        await delay(20);

        await expect(vm.getSubEnclosures('root')).resolves.toStrictEqual(['one', 'two', 'three']);

        await vm.stop();
      });
    });

    describe('install()', (): void => {
      test('should reject on errors', async (): Promise<void> => {
        const castEvents: [string, ...AnyArgs][] = [];
        const vm = create();
        await vm.start(
          makeWorkerCtor(
            (
              _bootTunnel: number,
              _defaultEnclosureName: string,
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

        await delay(20);

        vm.on('**', (name: string, ...rest: AnyArgs): void => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          castEvents.push([name, ...rest]);
        });

        const dep: Dependency = new DependencyImplementation('whatever', '', new Map<string, string>());
        await expect(vm.install('root', dep)).rejects.toStrictEqual(new Error('some error'));

        await delay(10);

        expect(castEvents).toStrictEqual([
          [`${_eventPrefix}:${vm.name}:root:install`, vm, dep],
          [`${_eventPrefix}:${vm.name}:root:install:error`, vm, dep, new Error('some error')],
        ]);

        await vm.stop();
      });

      test('should reject on invalid enclosure name', async (): Promise<void> => {
        const vm = create();
        await vm.start(dummyWorkerCtor);

        await delay(20);

        await expect(
          vm.install('_something', new DependencyImplementation('whatever', '', new Map<string, string>())),
        ).rejects.toStrictEqual(new Error("identifier must adhere to '/^[a-z]\\w*$/i'"));

        await vm.stop();
      });

      test('should reject if not running', async (): Promise<void> => {
        const castEvents: [string, ...AnyArgs][] = [];
        const vm = create();
        vm.on('**', (name: string, ...rest: AnyArgs): void => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          castEvents.push([name, ...rest]);
        });

        const dep: Dependency = new DependencyImplementation('whatever', '', new Map<string, string>());
        await expect(vm.install('root', dep)).rejects.toStrictEqual(new Error("expected state to be 'running'"));

        await delay(10);

        expect(castEvents).toStrictEqual([
          [`${_eventPrefix}:${vm.name}:root:install`, vm, dep],
          [`${_eventPrefix}:${vm.name}:root:install:error`, vm, dep, new Error("expected state to be 'running'")],
        ]);

        await vm.stop();
      });

      test('should install a dependency', async (): Promise<void> => {
        const castEvents: [string, ...AnyArgs][] = [];
        const vm = create();
        await vm.start(
          makeWorkerCtor(
            (
              _bootTunnel: number,
              _defaultEnclosureName: string,
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

        await delay(20);

        vm.on('**', (name: string, ...rest: AnyArgs): void => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          castEvents.push([name, ...rest]);
        });

        const dep: Dependency = new DependencyImplementation('whatever', '', new Map<string, string>());

        await expect(vm.install('root', dep)).resolves.toBeUndefined();

        await delay(10);

        expect(castEvents).toStrictEqual([
          [`${_eventPrefix}:${vm.name}:root:install`, vm, dep],
          [`${_eventPrefix}:${vm.name}:root:install:ok`, vm, dep],
        ]);

        await vm.stop();
      });
    });

    describe('isMuted()', (): void => {
      test('should reject on errors', async (): Promise<void> => {
        const vm = create();
        await vm.start(
          makeWorkerCtor(
            (
              _bootTunnel: number,
              _defaultEnclosureName: string,
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

        await delay(20);

        await expect(vm.isMuted('root')).rejects.toStrictEqual(new Error('some error'));

        await vm.stop();
      });

      test('should reject on invalid enclosure name', async (): Promise<void> => {
        const vm = create();
        await vm.start(dummyWorkerCtor);

        await delay(20);

        await expect(vm.isMuted('_something')).rejects.toStrictEqual(
          new Error("identifier must adhere to '/^[a-z]\\w*$/i'"),
        );

        await vm.stop();
      });

      test('should reject if not running', async (): Promise<void> => {
        const vm = create();

        await expect(vm.isMuted('root')).rejects.toStrictEqual(new Error("expected state to be 'running'"));

        await vm.stop();
      });

      test('should get muting status', async (): Promise<void> => {
        const vm = create();
        await vm.start(
          makeWorkerCtor(
            (
              _bootTunnel: number,
              _defaultEnclosureName: string,
              _listen: (data: object) => void,
              _shout: (message: object) => void,
            ) => {
              _listen(({ name, tunnel }: { name: string; tunnel: number }) => {
                if ('isMuted' === name) {
                  _shout({ name: 'resolve', payload: true, tunnel });
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

        await delay(20);

        await expect(vm.isMuted('root')).resolves.toStrictEqual(true);

        await vm.stop();
      });
    });

    describe('linkEnclosures()', (): void => {
      test('should reject on errors', async (): Promise<void> => {
        const castEvents: [string, ...AnyArgs][] = [];
        const vm = create();
        await vm.start(
          makeWorkerCtor(
            (
              _bootTunnel: number,
              _defaultEnclosureName: string,
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

        await delay(20);

        vm.on('**', (name: string, ...rest: AnyArgs): void => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          castEvents.push([name, ...rest]);
        });

        await expect(vm.linkEnclosures('root', 'leaf')).rejects.toStrictEqual(new Error('some error'));

        await delay(10);

        expect(castEvents).toStrictEqual([
          [`${_eventPrefix}:${vm.name}:root:link`, vm, 'leaf'],
          [`${_eventPrefix}:${vm.name}:root:link:error`, vm, 'leaf', new Error('some error')],
        ]);

        await vm.stop();
      });

      test('should reject on invalid enclosure name', async (): Promise<void> => {
        const vm = create();
        await vm.start(dummyWorkerCtor);

        await delay(20);

        await expect(vm.linkEnclosures('_something', 'else')).rejects.toStrictEqual(
          new Error("identifier must adhere to '/^[a-z]\\w*$/i'"),
        );

        await vm.stop();
      });

      test('should reject on invalid (target) enclosure name', async (): Promise<void> => {
        const vm = create();
        await vm.start(dummyWorkerCtor);

        await delay(20);

        await expect(vm.linkEnclosures('something', '_else')).rejects.toStrictEqual(
          new Error("identifier must adhere to '/^[a-z]\\w*$/i'"),
        );

        await vm.stop();
      });

      test('should reject if not running', async (): Promise<void> => {
        const castEvents: [string, ...AnyArgs][] = [];
        const vm = create();
        vm.on('**', (name: string, ...rest: AnyArgs): void => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          castEvents.push([name, ...rest]);
        });

        await expect(vm.linkEnclosures('root', 'leaf')).rejects.toStrictEqual(
          new Error("expected state to be 'running'"),
        );

        await delay(10);

        expect(castEvents).toStrictEqual([
          [`${_eventPrefix}:${vm.name}:root:link`, vm, 'leaf'],
          [`${_eventPrefix}:${vm.name}:root:link:error`, vm, 'leaf', new Error("expected state to be 'running'")],
        ]);

        await vm.stop();
      });

      test('should link enclosures and return true / false', async (): Promise<void> => {
        const castEvents: [string, ...AnyArgs][] = [];
        const vm = create();
        await vm.start(
          makeWorkerCtor(
            (
              _bootTunnel: number,
              _defaultEnclosureName: string,
              _listen: (data: object) => void,
              _shout: (message: object) => void,
            ) => {
              _listen(({ name, tunnel }: { name: string; tunnel: number }) => {
                if ('link' === name) {
                  _shout({ name: 'resolve', payload: true, tunnel });
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

        await delay(20);

        vm.on('**', (name: string, ...rest: AnyArgs): void => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          castEvents.push([name, ...rest]);
        });

        await expect(vm.linkEnclosures('root', 'leaf')).resolves.toStrictEqual(true);

        await delay(10);

        expect(castEvents).toStrictEqual([
          [`${_eventPrefix}:${vm.name}:root:link`, vm, 'leaf'],
          [`${_eventPrefix}:${vm.name}:root:link:ok`, vm, 'leaf', true],
        ]);

        await vm.stop();
      });
    });

    describe('listInstalled()', (): void => {
      test('should reject on errors', async (): Promise<void> => {
        const vm = create();
        await vm.start(
          makeWorkerCtor(
            (
              _bootTunnel: number,
              _defaultEnclosureName: string,
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

        await delay(20);

        await expect(vm.listInstalled('root')).rejects.toStrictEqual(new Error('some error'));

        await vm.stop();
      });

      test('should reject on invalid enclosure name', async (): Promise<void> => {
        const vm = create();
        await vm.start(dummyWorkerCtor);

        await delay(20);

        await expect(vm.listInstalled('_something')).rejects.toStrictEqual(
          new Error("identifier must adhere to '/^[a-z]\\w*$/i'"),
        );

        await vm.stop();
      });

      test('should reject if not running', async (): Promise<void> => {
        const vm = create();

        await expect(vm.listInstalled('root')).rejects.toStrictEqual(new Error("expected state to be 'running'"));

        await vm.stop();
      });

      test('should list installed dependencies', async (): Promise<void> => {
        const vm = create();
        await vm.start(
          makeWorkerCtor(
            (
              _bootTunnel: number,
              _defaultEnclosureName: string,
              _listen: (data: object) => void,
              _shout: (message: object) => void,
            ) => {
              _listen(({ name, tunnel }: { name: string; tunnel: number }) => {
                if ('listInstalled' === name) {
                  _shout({ name: 'resolve', payload: ['one', 'two', 'three'], tunnel });
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

        await delay(20);

        await expect(vm.listInstalled('root')).resolves.toStrictEqual(['one', 'two', 'three']);

        await vm.stop();
      });
    });

    describe('listLinkedFrom()', (): void => {
      test('should reject on errors', async (): Promise<void> => {
        const vm = create();
        await vm.start(
          makeWorkerCtor(
            (
              _bootTunnel: number,
              _defaultEnclosureName: string,
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

        await delay(20);

        await expect(vm.listLinkedFrom('root')).rejects.toStrictEqual(new Error('some error'));

        await vm.stop();
      });

      test('should reject on invalid enclosure name', async (): Promise<void> => {
        const vm = create();
        await vm.start(dummyWorkerCtor);

        await delay(20);

        await expect(vm.listLinkedFrom('_something')).rejects.toStrictEqual(
          new Error("identifier must adhere to '/^[a-z]\\w*$/i'"),
        );

        await vm.stop();
      });

      test('should reject if not running', async (): Promise<void> => {
        const vm = create();

        await expect(vm.listLinkedFrom('root')).rejects.toStrictEqual(new Error("expected state to be 'running'"));

        await vm.stop();
      });

      test('should list enclosures linking here', async (): Promise<void> => {
        const vm = create();
        await vm.start(
          makeWorkerCtor(
            (
              _bootTunnel: number,
              _defaultEnclosureName: string,
              _listen: (data: object) => void,
              _shout: (message: object) => void,
            ) => {
              _listen(({ name, tunnel }: { name: string; tunnel: number }) => {
                if ('listLinkedFrom' === name) {
                  _shout({ name: 'resolve', payload: ['one', 'two', 'three'], tunnel });
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

        await delay(20);

        await expect(vm.listLinkedFrom('root')).resolves.toStrictEqual(['one', 'two', 'three']);

        await vm.stop();
      });
    });

    describe('listLinksTo()', (): void => {
      test('should reject on errors', async (): Promise<void> => {
        const vm = create();
        await vm.start(
          makeWorkerCtor(
            (
              _bootTunnel: number,
              _defaultEnclosureName: string,
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

        await delay(20);

        await expect(vm.listLinksTo('root')).rejects.toStrictEqual(new Error('some error'));

        await vm.stop();
      });

      test('should reject on invalid enclosure name', async (): Promise<void> => {
        const vm = create();
        await vm.start(dummyWorkerCtor);

        await delay(20);

        await expect(vm.listLinksTo('_something')).rejects.toStrictEqual(
          new Error("identifier must adhere to '/^[a-z]\\w*$/i'"),
        );

        await vm.stop();
      });

      test('should reject if not running', async (): Promise<void> => {
        const vm = create();

        await expect(vm.listLinksTo('root')).rejects.toStrictEqual(new Error("expected state to be 'running'"));

        await vm.stop();
      });

      test('should list enclosures linked from here', async (): Promise<void> => {
        const vm = create();
        await vm.start(
          makeWorkerCtor(
            (
              _bootTunnel: number,
              _defaultEnclosureName: string,
              _listen: (data: object) => void,
              _shout: (message: object) => void,
            ) => {
              _listen(({ name, tunnel }: { name: string; tunnel: number }) => {
                if ('listLinksTo' === name) {
                  _shout({ name: 'resolve', payload: ['one', 'two', 'three'], tunnel });
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

        await delay(20);

        await expect(vm.listLinksTo('root')).resolves.toStrictEqual(['one', 'two', 'three']);

        await vm.stop();
      });
    });

    describe('listRootEnclosures()', (): void => {
      test('should reject on errors', async (): Promise<void> => {
        const vm = create();
        await vm.start(
          makeWorkerCtor(
            (
              _bootTunnel: number,
              _defaultEnclosureName: string,
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

        await delay(20);

        await expect(vm.listRootEnclosures()).rejects.toStrictEqual(new Error('some error'));

        await vm.stop();
      });

      test('should reject if not running', async (): Promise<void> => {
        const vm = create();

        await expect(vm.listRootEnclosures()).rejects.toStrictEqual(
          new Error("expected state to be 'running' or 'stopping'"),
        );

        await vm.stop();
      });

      test('should list root enclosures', async (): Promise<void> => {
        const vm = create();
        await vm.start(
          makeWorkerCtor(
            (
              _bootTunnel: number,
              _defaultEnclosureName: string,
              _listen: (data: object) => void,
              _shout: (message: object) => void,
            ) => {
              _listen(({ name, tunnel }: { name: string; tunnel: number }) => {
                if ('listRootEnclosures' === name) {
                  _shout({ name: 'resolve', payload: ['one', 'two', 'three'], tunnel });
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

        await delay(20);

        await expect(vm.listRootEnclosures()).resolves.toStrictEqual(['one', 'two', 'three']);

        await vm.stop();
      });
    });

    describe('mergeEnclosure()', (): void => {
      test('should reject on errors', async (): Promise<void> => {
        const castEvents: [string, ...AnyArgs][] = [];
        const vm = create();
        await vm.start(
          makeWorkerCtor(
            (
              _bootTunnel: number,
              _defaultEnclosureName: string,
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

        await delay(20);

        vm.on('**', (name: string, ...rest: AnyArgs): void => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          castEvents.push([name, ...rest]);
        });

        await expect(vm.mergeEnclosure('leaf')).rejects.toStrictEqual(new Error('some error'));

        await delay(10);

        expect(castEvents).toStrictEqual([
          [`${_eventPrefix}:${vm.name}:leaf:merge`, vm],
          [`${_eventPrefix}:${vm.name}:leaf:merge:error`, vm, new Error('some error')],
        ]);

        await vm.stop();
      });

      test('should reject on invalid enclosure name', async (): Promise<void> => {
        const vm = create();
        await vm.start(dummyWorkerCtor);

        await delay(20);

        await expect(vm.mergeEnclosure('_something')).rejects.toStrictEqual(
          new Error("identifier must adhere to '/^[a-z]\\w*$/i'"),
        );

        await vm.stop();
      });

      test('should reject if not running', async (): Promise<void> => {
        const castEvents: [string, ...AnyArgs][] = [];
        const vm = create();
        vm.on('**', (name: string, ...rest: AnyArgs): void => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          castEvents.push([name, ...rest]);
        });

        await expect(vm.mergeEnclosure('leaf')).rejects.toStrictEqual(new Error("expected state to be 'running'"));

        await delay(10);

        expect(castEvents).toStrictEqual([
          [`${_eventPrefix}:${vm.name}:leaf:merge`, vm],
          [`${_eventPrefix}:${vm.name}:leaf:merge:error`, vm, new Error("expected state to be 'running'")],
        ]);

        await vm.stop();
      });

      test('should merge enclosure to parent', async (): Promise<void> => {
        const castEvents: [string, ...AnyArgs][] = [];
        const vm = create();
        await vm.start(
          makeWorkerCtor(
            (
              _bootTunnel: number,
              _defaultEnclosureName: string,
              _listen: (data: object) => void,
              _shout: (message: object) => void,
            ) => {
              _listen(({ name, tunnel }: { name: string; tunnel: number }) => {
                if ('merge' === name) {
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

        await delay(20);

        vm.on('**', (name: string, ...rest: AnyArgs): void => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          castEvents.push([name, ...rest]);
        });

        await expect(vm.mergeEnclosure('leaf')).resolves.toBeUndefined();

        await delay(10);

        expect(castEvents).toStrictEqual([
          [`${_eventPrefix}:${vm.name}:leaf:merge`, vm],
          [`${_eventPrefix}:${vm.name}:leaf:merge:ok`, vm],
        ]);

        await vm.stop();
      });
    });

    describe('muteEnclosure()', (): void => {
      test('should reject on errors', async (): Promise<void> => {
        const castEvents: [string, ...AnyArgs][] = [];
        const vm = create();
        await vm.start(
          makeWorkerCtor(
            (
              _bootTunnel: number,
              _defaultEnclosureName: string,
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

        await delay(20);

        vm.on('**', (name: string, ...rest: AnyArgs): void => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          castEvents.push([name, ...rest]);
        });

        await expect(vm.muteEnclosure('leaf')).rejects.toStrictEqual(new Error('some error'));

        await delay(10);

        expect(castEvents).toStrictEqual([
          [`${_eventPrefix}:${vm.name}:leaf:mute`, vm],
          [`${_eventPrefix}:${vm.name}:leaf:mute:error`, vm, new Error('some error')],
        ]);

        await vm.stop();
      });

      test('should reject on invalid enclosure name', async (): Promise<void> => {
        const vm = create();
        await vm.start(dummyWorkerCtor);

        await delay(20);

        await expect(vm.muteEnclosure('_something')).rejects.toStrictEqual(
          new Error("identifier must adhere to '/^[a-z]\\w*$/i'"),
        );

        await vm.stop();
      });

      test('should reject if not running', async (): Promise<void> => {
        const castEvents: [string, ...AnyArgs][] = [];
        const vm = create();
        vm.on('**', (name: string, ...rest: AnyArgs): void => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          castEvents.push([name, ...rest]);
        });

        await expect(vm.muteEnclosure('leaf')).rejects.toStrictEqual(new Error("expected state to be 'running'"));

        await delay(10);

        expect(castEvents).toStrictEqual([
          [`${_eventPrefix}:${vm.name}:leaf:mute`, vm],
          [`${_eventPrefix}:${vm.name}:leaf:mute:error`, vm, new Error("expected state to be 'running'")],
        ]);

        await vm.stop();
      });

      test('should mute enclosure', async (): Promise<void> => {
        const castEvents: [string, ...AnyArgs][] = [];
        const vm = create();
        await vm.start(
          makeWorkerCtor(
            (
              _bootTunnel: number,
              _defaultEnclosureName: string,
              _listen: (data: object) => void,
              _shout: (message: object) => void,
            ) => {
              _listen(({ name, tunnel }: { name: string; tunnel: number }) => {
                if ('mute' === name) {
                  _shout({ name: 'resolve', payload: true, tunnel });
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

        await delay(20);

        vm.on('**', (name: string, ...rest: AnyArgs): void => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          castEvents.push([name, ...rest]);
        });

        await expect(vm.muteEnclosure('leaf')).resolves.toStrictEqual(true);

        await delay(10);

        expect(castEvents).toStrictEqual([
          [`${_eventPrefix}:${vm.name}:leaf:mute`, vm],
          [`${_eventPrefix}:${vm.name}:leaf:mute:ok`, vm, true],
        ]);

        await vm.stop();
      });
    });

    describe('unlinkEnclosures()', (): void => {
      test('should reject on errors', async (): Promise<void> => {
        const castEvents: [string, ...AnyArgs][] = [];
        const vm = create();
        await vm.start(
          makeWorkerCtor(
            (
              _bootTunnel: number,
              _defaultEnclosureName: string,
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

        await delay(20);

        vm.on('**', (name: string, ...rest: AnyArgs): void => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          castEvents.push([name, ...rest]);
        });

        await expect(vm.unlinkEnclosures('root', 'leaf')).rejects.toStrictEqual(new Error('some error'));

        await delay(10);

        expect(castEvents).toStrictEqual([
          [`${_eventPrefix}:${vm.name}:root:unlink`, vm, 'leaf'],
          [`${_eventPrefix}:${vm.name}:root:unlink:error`, vm, 'leaf', new Error('some error')],
        ]);

        await vm.stop();
      });

      test('should reject on invalid enclosure name', async (): Promise<void> => {
        const vm = create();
        await vm.start(dummyWorkerCtor);

        await delay(20);

        await expect(vm.unlinkEnclosures('_something', 'else')).rejects.toStrictEqual(
          new Error("identifier must adhere to '/^[a-z]\\w*$/i'"),
        );

        await vm.stop();
      });

      test('should reject on invalid (target) enclosure name', async (): Promise<void> => {
        const vm = create();
        await vm.start(dummyWorkerCtor);

        await delay(20);

        await expect(vm.unlinkEnclosures('something', '_else')).rejects.toStrictEqual(
          new Error("identifier must adhere to '/^[a-z]\\w*$/i'"),
        );

        await vm.stop();
      });

      test('should reject if not running', async (): Promise<void> => {
        const castEvents: [string, ...AnyArgs][] = [];
        const vm = create();
        vm.on('**', (name: string, ...rest: AnyArgs): void => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          castEvents.push([name, ...rest]);
        });

        await expect(vm.unlinkEnclosures('root', 'leaf')).rejects.toStrictEqual(
          new Error("expected state to be 'running'"),
        );

        await delay(10);

        expect(castEvents).toStrictEqual([
          [`${_eventPrefix}:${vm.name}:root:unlink`, vm, 'leaf'],
          [`${_eventPrefix}:${vm.name}:root:unlink:error`, vm, 'leaf', new Error("expected state to be 'running'")],
        ]);

        await vm.stop();
      });

      test('should unlink enclosures and return true / false', async (): Promise<void> => {
        const castEvents: [string, ...AnyArgs][] = [];
        const vm = create();
        await vm.start(
          makeWorkerCtor(
            (
              _bootTunnel: number,
              _defaultEnclosureName: string,
              _listen: (data: object) => void,
              _shout: (message: object) => void,
            ) => {
              _listen(({ name, tunnel }: { name: string; tunnel: number }) => {
                if ('unlink' === name) {
                  _shout({ name: 'resolve', payload: true, tunnel });
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

        await delay(20);

        vm.on('**', (name: string, ...rest: AnyArgs): void => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          castEvents.push([name, ...rest]);
        });

        await expect(vm.unlinkEnclosures('root', 'leaf')).resolves.toStrictEqual(true);

        await delay(10);

        expect(castEvents).toStrictEqual([
          [`${_eventPrefix}:${vm.name}:root:unlink`, vm, 'leaf'],
          [`${_eventPrefix}:${vm.name}:root:unlink:ok`, vm, 'leaf', true],
        ]);

        await vm.stop();
      });
    });

    describe('unmuteEnclosure()', (): void => {
      test('should reject on errors', async (): Promise<void> => {
        const castEvents: [string, ...AnyArgs][] = [];
        const vm = create();
        await vm.start(
          makeWorkerCtor(
            (
              _bootTunnel: number,
              _defaultEnclosureName: string,
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

        await delay(20);

        vm.on('**', (name: string, ...rest: AnyArgs): void => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          castEvents.push([name, ...rest]);
        });

        await expect(vm.unmuteEnclosure('leaf')).rejects.toStrictEqual(new Error('some error'));

        await delay(10);

        expect(castEvents).toStrictEqual([
          [`${_eventPrefix}:${vm.name}:leaf:unmute`, vm],
          [`${_eventPrefix}:${vm.name}:leaf:unmute:error`, vm, new Error('some error')],
        ]);

        await vm.stop();
      });

      test('should reject on invalid enclosure name', async (): Promise<void> => {
        const vm = create();
        await vm.start(dummyWorkerCtor);

        await delay(20);

        await expect(vm.unmuteEnclosure('_something')).rejects.toStrictEqual(
          new Error("identifier must adhere to '/^[a-z]\\w*$/i'"),
        );

        await vm.stop();
      });

      test('should reject if not running', async (): Promise<void> => {
        const castEvents: [string, ...AnyArgs][] = [];
        const vm = create();
        vm.on('**', (name: string, ...rest: AnyArgs): void => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          castEvents.push([name, ...rest]);
        });

        await expect(vm.unmuteEnclosure('leaf')).rejects.toStrictEqual(new Error("expected state to be 'running'"));

        await delay(10);

        expect(castEvents).toStrictEqual([
          [`${_eventPrefix}:${vm.name}:leaf:unmute`, vm],
          [`${_eventPrefix}:${vm.name}:leaf:unmute:error`, vm, new Error("expected state to be 'running'")],
        ]);

        await vm.stop();
      });

      test('should unmute enclosure', async (): Promise<void> => {
        const castEvents: [string, ...AnyArgs][] = [];
        const vm = create();
        await vm.start(
          makeWorkerCtor(
            (
              _bootTunnel: number,
              _defaultEnclosureName: string,
              _listen: (data: object) => void,
              _shout: (message: object) => void,
            ) => {
              _listen(({ name, tunnel }: { name: string; tunnel: number }) => {
                if ('unmute' === name) {
                  _shout({ name: 'resolve', payload: true, tunnel });
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

        await delay(20);

        vm.on('**', (name: string, ...rest: AnyArgs): void => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          castEvents.push([name, ...rest]);
        });

        await expect(vm.unmuteEnclosure('leaf')).resolves.toStrictEqual(true);

        await delay(10);

        expect(castEvents).toStrictEqual([
          [`${_eventPrefix}:${vm.name}:leaf:unmute`, vm],
          [`${_eventPrefix}:${vm.name}:leaf:unmute:ok`, vm, true],
        ]);

        await vm.stop();
      });
    });

    describe('predefine()', (): void => {
      test('should reject on errors', async (): Promise<void> => {
        const castEvents: [string, ...AnyArgs][] = [];
        const vm = create();
        await vm.start(
          makeWorkerCtor(
            (
              _bootTunnel: number,
              _defaultEnclosureName: string,
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

        await delay(20);

        vm.on('**', (name: string, ...rest: AnyArgs): void => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          castEvents.push([name, ...rest]);
        });

        const callback = (): void => {};
        await expect(vm.predefine('root', 'something', callback)).rejects.toStrictEqual(new Error('some error'));

        await delay(10);

        expect(castEvents).toStrictEqual([
          [`${_eventPrefix}:${vm.name}:root:predefined:add`, vm, 'something', callback, 0],
          [
            `${_eventPrefix}:${vm.name}:root:predefined:add:error`,
            vm,
            'something',
            callback,
            0,
            new Error('some error'),
          ],
        ]);

        await vm.stop();
      });

      test('should reject on invalid enclosure name', async (): Promise<void> => {
        const vm = create();
        await vm.start(dummyWorkerCtor);

        await delay(20);

        await expect(vm.predefine('_something', 'something', (): void => {})).rejects.toStrictEqual(
          new Error("identifier must adhere to '/^[a-z]\\w*$/i'"),
        );

        await vm.stop();
      });

      test('should reject on invalid function name', async (): Promise<void> => {
        const vm = create();
        await vm.start(dummyWorkerCtor);

        await delay(20);

        await expect(vm.predefine('something', '_something', (): void => {})).rejects.toStrictEqual(
          new Error("identifier must adhere to '/^[a-z]\\w*$/i'"),
        );

        await vm.stop();
      });

      test('should reject if not running', async (): Promise<void> => {
        const castEvents: [string, ...AnyArgs][] = [];
        const vm = create();
        vm.on('**', (name: string, ...rest: AnyArgs): void => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          castEvents.push([name, ...rest]);
        });

        const callback = (): void => {};
        await expect(vm.predefine('root', 'something', callback)).rejects.toStrictEqual(
          new Error("expected state to be 'running'"),
        );

        await delay(10);

        expect(castEvents).toStrictEqual([
          [`${_eventPrefix}:${vm.name}:root:predefined:add`, vm, 'something', callback, 0],
          [
            `${_eventPrefix}:${vm.name}:root:predefined:add:error`,
            vm,
            'something',
            callback,
            0,
            new Error("expected state to be 'running'"),
          ],
        ]);

        await vm.stop();
      });

      test('should predefine a function', async (): Promise<void> => {
        const castEvents: [string, ...AnyArgs][] = [];
        const vm = create();
        await vm.start(
          makeWorkerCtor(
            (
              _bootTunnel: number,
              _defaultEnclosureName: string,
              _listen: (data: object) => void,
              _shout: (message: object) => void,
            ) => {
              _listen(({ name, tunnel }: { name: string; tunnel: number }) => {
                if ('predefine' === name) {
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

        await delay(20);

        vm.on('**', (name: string, ...rest: AnyArgs): void => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          castEvents.push([name, ...rest]);
        });

        const callback = (): void => {};
        await expect(vm.predefine('root', 'something', callback)).resolves.toBeUndefined();

        await delay(10);

        expect(castEvents).toStrictEqual([
          [`${_eventPrefix}:${vm.name}:root:predefined:add`, vm, 'something', callback, 0],
          [`${_eventPrefix}:${vm.name}:root:predefined:add:ok`, vm, 'something', callback, 0],
        ]);

        await vm.stop();
      });

      test('predefined function should resolve for worker', async (): Promise<void> => {
        const vm = create();
        await vm.start(
          makeWorkerCtor(
            (
              _bootTunnel: number,
              _defaultEnclosureName: string,
              _listen: (data: object) => void,
              _shout: (message: object) => void,
            ) => {
              let idx: number = 0;
              let funcName: string = '';
              let arg: string = '';
              let tunnel: number = 0;

              _listen((data: Record<string, unknown>) => {
                const name: string = data.name as string;
                if ('predefine' === name) {
                  idx = data.idx as number;
                  funcName = data.function as string;
                  _shout({ name: 'resolve', tunnel: data.tunnel });
                } else if ('execute' === name) {
                  arg = (data.args as Record<string, string>)['theArg'] ?? '';
                  tunnel = data.tunnel as number;
                  _shout({ args: [`(${arg})`], enclosure: 'root', idx, name: 'call', tunnel: 123 });
                } else if ('resolve' === name) {
                  _shout({ name: 'resolve', payload: `${funcName}(${arg}) = ${data.payload as string}`, tunnel });
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

        await delay(20);

        const callback = (x: string): string => `${x}---${x}`;
        await vm.predefine('root', 'something', callback);

        expect(
          await vm.execute(
            'root',
            new DependencyImplementation('x', '', new Map<string, string>()),
            new Map<string, unknown>([['theArg', 'abc']]),
          ),
        ).toStrictEqual('something(abc) = (abc)---(abc)');

        await vm.stop();
      });

      test('predefined function should reject for worker', async (): Promise<void> => {
        const vm = create();
        await vm.start(
          makeWorkerCtor(
            (
              _bootTunnel: number,
              _defaultEnclosureName: string,
              _listen: (data: object) => void,
              _shout: (message: object) => void,
            ) => {
              let idx: number = 0;
              let funcName: string = '';
              let arg: string = '';
              let tunnel: number = 0;

              _listen((data: Record<string, unknown>) => {
                const name: string = data.name as string;
                if ('predefine' === name) {
                  idx = data.idx as number;
                  funcName = data.function as string;
                  _shout({ name: 'resolve', tunnel: data.tunnel });
                } else if ('execute' === name) {
                  arg = (data.args as Record<string, string>)['theArg'] ?? '';
                  tunnel = data.tunnel as number;
                  _shout({ args: [`(${arg})`], enclosure: 'root', idx, name: 'call', tunnel: 123 });
                } else if ('reject' === name) {
                  _shout({ name: 'resolve', payload: `${funcName}(${arg}) = <${data.error as string}>`, tunnel });
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

        await delay(20);

        const callback = (): void => {
          throw new Error('foo');
        };
        await vm.predefine('root', 'something', callback);

        expect(
          await vm.execute(
            'root',
            new DependencyImplementation('x', '', new Map<string, string>()),
            new Map<string, unknown>([['theArg', 'abc']]),
          ),
        ).toStrictEqual('something(abc) = <foo>');

        await vm.stop();
      });

      test('unknown predefined function index should reject for worker', async (): Promise<void> => {
        const vm = create();
        await vm.start(
          makeWorkerCtor(
            (
              _bootTunnel: number,
              _defaultEnclosureName: string,
              _listen: (data: object) => void,
              _shout: (message: object) => void,
            ) => {
              let idx: number = 0;
              let funcName: string = '';
              let arg: string = '';
              let tunnel: number = 0;

              _listen((data: Record<string, unknown>) => {
                const name: string = data.name as string;
                if ('predefine' === name) {
                  idx = data.idx as number;
                  funcName = data.function as string;
                  _shout({ name: 'resolve', tunnel: data.tunnel });
                } else if ('execute' === name) {
                  arg = (data.args as Record<string, string>)['theArg'] ?? '';
                  tunnel = data.tunnel as number;
                  _shout({ args: [`(${arg})`], enclosure: 'root', idx: idx + 1, name: 'call', tunnel: 123 });
                } else if ('reject' === name) {
                  _shout({ name: 'resolve', payload: `${funcName}(${arg}) = <${data.error as string}>`, tunnel });
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

        await delay(20);

        const callback = (): void => {
          throw new Error('foo');
        };
        await vm.predefine('root', 'something', callback);

        expect(
          await vm.execute(
            'root',
            new DependencyImplementation('x', '', new Map<string, string>()),
            new Map<string, unknown>([['theArg', 'abc']]),
          ),
        ).toStrictEqual('something(abc) = <unknown function index 1>');

        await vm.stop();
      });
    });

    describe('emit()', (): void => {
      test('should throw on invalid enclosure name', async (): Promise<void> => {
        const vm = create();
        await vm.start(dummyWorkerCtor);

        await delay(20);

        expect((): void => {
          vm.emit('_something', 'something');
        }).toThrow(new Error("identifier must adhere to '/^[a-z]\\w*$/i'"));

        await vm.stop();
      });

      test('should throw on invalid event name', async (): Promise<void> => {
        const vm = create();
        await vm.start(dummyWorkerCtor);

        await delay(20);

        expect((): void => {
          vm.emit('something', 'some thing');
        }).toThrow(new Error('event name must adhere to /^[\\w/.-]+(?::[\\w/.-]+)*$/'));

        await vm.stop();
      });

      test('should throw if not running', async (): Promise<void> => {
        const vm = create();

        expect((): void => {
          vm.emit('root', 'something');
        }).toThrow(new Error("expected state to be 'running' or 'stopping'"));

        await vm.stop();
      });

      test('should emit correctly', async (): Promise<void> => {
        const vm = create();
        await vm.start(
          makeWorkerCtor(
            (
              _bootTunnel: number,
              _defaultEnclosureName: string,
              _listen: (data: object) => void,
              _shout: (message: object) => void,
            ) => {
              const receivedEvents: [string, string, unknown[]][] = [];
              _listen((data: Record<string, unknown>) => {
                const { name, tunnel }: { name: string; tunnel: number } = data as { name: string; tunnel: number };
                if ('emit' === name) {
                  const { args, enclosure, event }: { args: unknown[]; enclosure: string; event: string } = data as {
                    args: unknown[];
                    enclosure: string;
                    event: string;
                  };
                  receivedEvents.push([enclosure, event, args]);
                } else if ('execute' === name) {
                  _shout({ name: 'resolve', payload: receivedEvents, tunnel });
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

        await delay(20);

        vm.emit('root', 'event1', 1);
        vm.emit('root', 'event2', 1, 2);
        vm.emit('root', 'event3', 1, 2, 3);

        await expect(
          vm.execute('root', new DependencyImplementation('none', '', new Map<string, string>())),
        ).resolves.toStrictEqual([
          ['root', 'event1', [1]],
          ['root', 'event2', [1, 2]],
          ['root', 'event3', [1, 2, 3]],
        ]);

        await vm.stop();
      });
    });
  });

  describe('EnclosureImplementation', (): void => {
    describe('constructor', (): void => {
      test('should throw for invalid enclosure name', (): void => {
        const vm: VMImplementation = new VMImplementation();
        expect((): void => {
          new EnclosureImplementation(vm, '_something');
        }).toThrow(new Error("identifier must adhere to '/^[a-z]\\w*$/i'"));
      });

      test('should correctly construct', (): void => {
        expect(new EnclosureImplementation(new VMImplementation(), 'something')).toBeInstanceOf(
          EnclosureImplementation,
        );
      });
    });

    describe('[get vm]', (): void => {
      test('should retrieve correctly', (): void => {
        const vm: VMImplementation = new VMImplementation();
        expect(new EnclosureImplementation(vm, 'something').vm).toStrictEqual(vm);
      });
    });

    describe('[get enclosure]', (): void => {
      test('should retrieve correctly', (): void => {
        const vm: VMImplementation = new VMImplementation();
        expect(new EnclosureImplementation(vm, 'something').enclosure).toStrictEqual('something');
      });
    });

    describe('execute()', (): void => {
      test(
        'should forward correctly',
        asyncRestoringMocks(async (): Promise<void> => {
          const dep: DependencyImplementation = new DependencyImplementation('foo', '', new Map<string, string>());
          const args: ArgumentsMap = new Map<string, unknown>();

          const vm: VMImplementation = new VMImplementation();
          jest.spyOn(vm, 'execute').mockImplementation(() => Promise.resolve(null));

          const enc: EnclosureImplementation = new EnclosureImplementation(vm, 'something');

          await enc.execute(dep, args);

          expect(vm['execute']).toHaveBeenCalledTimes(1);
          expect(vm['execute']).toHaveBeenCalledWith('something', dep, args);
        }),
      );
    });

    describe('getSubEnclosures()', (): void => {
      test(
        'should forward correctly',
        asyncRestoringMocks(async (): Promise<void> => {
          const depth: number = 123;

          const vm: VMImplementation = new VMImplementation();
          jest.spyOn(vm, 'getSubEnclosures').mockImplementation(() => Promise.resolve([]));

          const enc: EnclosureImplementation = new EnclosureImplementation(vm, 'something');

          await enc.getSubEnclosures(depth);

          expect(vm['getSubEnclosures']).toHaveBeenCalledTimes(1);
          expect(vm['getSubEnclosures']).toHaveBeenCalledWith('something', depth);
        }),
      );
    });

    describe('install()', (): void => {
      test(
        'should forward correctly',
        asyncRestoringMocks(async (): Promise<void> => {
          const dep: DependencyImplementation = new DependencyImplementation('foo', '', new Map<string, string>());

          const vm: VMImplementation = new VMImplementation();
          jest.spyOn(vm, 'install').mockImplementation(() => Promise.resolve());

          const enc: EnclosureImplementation = new EnclosureImplementation(vm, 'something');

          await enc.install(dep);

          expect(vm['install']).toHaveBeenCalledTimes(1);
          expect(vm['install']).toHaveBeenCalledWith('something', dep);
        }),
      );
    });

    describe('installAll()', (): void => {
      test(
        'should forward correctly',
        asyncRestoringMocks(async (): Promise<void> => {
          const deps: DependencyImplementation[] = [
            new DependencyImplementation('foo', '', new Map<string, string>()),
            new DependencyImplementation('bar', '', new Map<string, string>()),
            new DependencyImplementation('baz', '', new Map<string, string>()),
          ];

          const vm: VMImplementation = new VMImplementation();
          jest.spyOn(vm, 'installAll').mockImplementation(() => Promise.resolve());

          const enc: EnclosureImplementation = new EnclosureImplementation(vm, 'something');

          await enc.installAll(deps);

          expect(vm['installAll']).toHaveBeenCalledTimes(1);
          expect(vm['installAll']).toHaveBeenCalledWith('something', deps);
        }),
      );
    });

    describe('isMuted()', (): void => {
      test(
        'should forward correctly',
        asyncRestoringMocks(async (): Promise<void> => {
          const vm: VMImplementation = new VMImplementation();
          jest.spyOn(vm, 'isMuted').mockImplementation(() => Promise.resolve(true));

          const enc: EnclosureImplementation = new EnclosureImplementation(vm, 'something');

          await enc.isMuted();

          expect(vm['isMuted']).toHaveBeenCalledTimes(1);
          expect(vm['isMuted']).toHaveBeenCalledWith('something');
        }),
      );
    });

    describe('link()', (): void => {
      test(
        'should forward correctly',
        asyncRestoringMocks(async (): Promise<void> => {
          const vm: VMImplementation = new VMImplementation();
          jest.spyOn(vm, 'linkEnclosures').mockImplementation(() => Promise.resolve(true));

          const enc: EnclosureImplementation = new EnclosureImplementation(vm, 'something');

          await enc.link('target');

          expect(vm['linkEnclosures']).toHaveBeenCalledTimes(1);
          expect(vm['linkEnclosures']).toHaveBeenCalledWith('something', 'target');
        }),
      );
    });

    describe('listInstalled()', (): void => {
      test(
        'should forward correctly',
        asyncRestoringMocks(async (): Promise<void> => {
          const vm: VMImplementation = new VMImplementation();
          jest.spyOn(vm, 'listInstalled').mockImplementation(() => Promise.resolve([]));

          const enc: EnclosureImplementation = new EnclosureImplementation(vm, 'something');

          await enc.listInstalled();

          expect(vm['listInstalled']).toHaveBeenCalledTimes(1);
          expect(vm['listInstalled']).toHaveBeenCalledWith('something');
        }),
      );
    });

    describe('listLinkedFrom()', (): void => {
      test(
        'should forward correctly',
        asyncRestoringMocks(async (): Promise<void> => {
          const vm: VMImplementation = new VMImplementation();
          jest.spyOn(vm, 'listLinkedFrom').mockImplementation(() => Promise.resolve([]));

          const enc: EnclosureImplementation = new EnclosureImplementation(vm, 'something');

          await enc.listLinkedFrom();

          expect(vm['listLinkedFrom']).toHaveBeenCalledTimes(1);
          expect(vm['listLinkedFrom']).toHaveBeenCalledWith('something');
        }),
      );
    });

    describe('listLinksTo()', (): void => {
      test(
        'should forward correctly',
        asyncRestoringMocks(async (): Promise<void> => {
          const vm: VMImplementation = new VMImplementation();
          jest.spyOn(vm, 'listLinksTo').mockImplementation(() => Promise.resolve([]));

          const enc: EnclosureImplementation = new EnclosureImplementation(vm, 'something');

          await enc.listLinksTo();

          expect(vm['listLinksTo']).toHaveBeenCalledTimes(1);
          expect(vm['listLinksTo']).toHaveBeenCalledWith('something');
        }),
      );
    });

    describe('mute()', (): void => {
      test(
        'should forward correctly',
        asyncRestoringMocks(async (): Promise<void> => {
          const vm: VMImplementation = new VMImplementation();
          jest.spyOn(vm, 'muteEnclosure').mockImplementation(() => Promise.resolve(true));

          const enc: EnclosureImplementation = new EnclosureImplementation(vm, 'something');

          await enc.mute();

          expect(vm['muteEnclosure']).toHaveBeenCalledTimes(1);
          expect(vm['muteEnclosure']).toHaveBeenCalledWith('something');
        }),
      );
    });

    describe('off()', (): void => {
      test(
        'should forward correctly',
        restoringMocks((): void => {
          const vm: VMImplementation = new VMImplementation();
          jest.spyOn(vm, 'off').mockImplementation(() => vm);

          const enc: EnclosureImplementation = new EnclosureImplementation(vm, 'something');

          const callback = () => {};

          enc.off(callback);

          expect(vm['off']).toHaveBeenCalledTimes(1);
          expect(vm['off']).toHaveBeenCalledWith(callback);
        }),
      );
    });

    describe('on()', (): void => {
      test(
        'should forward correctly',
        restoringMocks((): void => {
          const vm: VMImplementation = new VMImplementation();
          jest.spyOn(vm, 'on').mockImplementation(() => vm);

          const enc: EnclosureImplementation = new EnclosureImplementation(vm, 'something');

          const callback = () => {};

          enc.on('filter', callback);

          expect(vm['on']).toHaveBeenCalledTimes(1);
          expect(vm['on']).toHaveBeenCalledWith('something:filter', callback);
        }),
      );
    });

    describe('once()', (): void => {
      test(
        'should forward correctly',
        restoringMocks((): void => {
          const vm: VMImplementation = new VMImplementation();
          jest.spyOn(vm, 'once').mockImplementation(() => vm);

          const enc: EnclosureImplementation = new EnclosureImplementation(vm, 'something');

          const callback = () => {};

          enc.once('filter', callback);

          expect(vm['once']).toHaveBeenCalledTimes(1);
          expect(vm['once']).toHaveBeenCalledWith('something:filter', callback);
        }),
      );
    });

    describe('predefine()', (): void => {
      test(
        'should forward correctly',
        asyncRestoringMocks(async (): Promise<void> => {
          const vm: VMImplementation = new VMImplementation();
          jest.spyOn(vm, 'predefine').mockImplementation(() => Promise.resolve());

          const enc: EnclosureImplementation = new EnclosureImplementation(vm, 'something');

          const callback = () => {};

          await enc.predefine('func', callback);

          expect(vm['predefine']).toHaveBeenCalledTimes(1);
          expect(vm['predefine']).toHaveBeenCalledWith('something', 'func', callback);
        }),
      );
    });

    describe('unlink()', (): void => {
      test(
        'should forward correctly',
        asyncRestoringMocks(async (): Promise<void> => {
          const vm: VMImplementation = new VMImplementation();
          jest.spyOn(vm, 'unlinkEnclosures').mockImplementation(() => Promise.resolve(true));

          const enc: EnclosureImplementation = new EnclosureImplementation(vm, 'something');

          await enc.unlink('target');

          expect(vm['unlinkEnclosures']).toHaveBeenCalledTimes(1);
          expect(vm['unlinkEnclosures']).toHaveBeenCalledWith('something', 'target');
        }),
      );
    });

    describe('unmute()', (): void => {
      test(
        'should forward correctly',
        asyncRestoringMocks(async (): Promise<void> => {
          const vm: VMImplementation = new VMImplementation();
          jest.spyOn(vm, 'unmuteEnclosure').mockImplementation(() => Promise.resolve(true));

          const enc: EnclosureImplementation = new EnclosureImplementation(vm, 'something');

          await enc.unmute();

          expect(vm['unmuteEnclosure']).toHaveBeenCalledTimes(1);
          expect(vm['unmuteEnclosure']).toHaveBeenCalledWith('something');
        }),
      );
    });
  });
});
