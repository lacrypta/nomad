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

import { _wrapCode, VMWorkerImplementation } from '../../src/worker';
import { blobUriToText, stringToDataUri } from '../helpers';

describe('worker', (): void => {
  describe('_wrapCode()', (): void => {
    test('wraps the code appropriately', (): void => {
      expect(_wrapCode('THE CODE GOES HERE', 123456, 'root')).toStrictEqual(
        `"use strict";
addEventListener("unhandledrejection", (event) => {
  if (undefined !== event.preventDefault) {
    event.preventDefault();
  }
  throw event.reason;
});
addEventListener("rejectionhandled", (event) => {
  if (undefined !== event.preventDefault) {
    event.preventDefault();
  }
  throw event.reason;
});
(THE CODE GOES HERE)(
  123456,
  "root",
  ((_addEventListener, _JSON_parse, _ErrorEvent, _dispatchEvent) =>
    (listener) => {
      _addEventListener('message', ({ data }) => {
        try {
          listener(_JSON_parse(data));
        } catch (e) {
          _dispatchEvent(
            new _ErrorEvent('error', {
              message:
                'object' === typeof e && null !== e && 'message' in e && 'string' === typeof e.message
                  ? e.message
                  : 'unknown error',
            }),
          );
        }
      })
    }
  )(addEventListener, JSON.parse, ErrorEvent, dispatchEvent),
  ((_postMessage, _JSON_stringify, _ErrorEvent, _dispatchEvent) =>
    (message) => {
      try {
        _postMessage(_JSON_stringify(message));
      } catch (e) {
        _dispatchEvent(
          new _ErrorEvent('error', {
            message:
              'object' === typeof e && null !== e && 'message' in e && 'string' === typeof e.message
                ? e.message
                : 'unknown error',
          }),
        );
      }
    }
  )(postMessage, JSON.stringify, ErrorEvent, dispatchEvent),
);`,
      );
    });
  });

  describe('VMWorkerImplementation', (): void => {
    test('should build a VMWorkerImplementation', async (): Promise<void> => {
      const workerCtor = jest.fn();

      expect(
        new VMWorkerImplementation('THE CODE GOES HERE', 0, 'root', 'THE NAME GOES HERE', workerCtor),
      ).toBeInstanceOf(VMWorkerImplementation);

      const [scriptUrl, options]: [URL | string, WorkerOptions | undefined] = workerCtor.mock.calls[0] as [
        URL | string,
        WorkerOptions | undefined,
      ];

      expect(await blobUriToText(scriptUrl)).toStrictEqual(_wrapCode('THE CODE GOES HERE', 0, 'root'));

      expect(options).toStrictEqual({ credentials: 'omit', name: 'THE NAME GOES HERE', type: 'classic' });
    });

    test('should build correctly', (): void => {
      const theWorkers: Worker[] = [];
      try {
        expect(
          new VMWorkerImplementation('', 0, 'root', 'THE NAME GOES HERE', (): Worker => {
            return theWorkers[
              theWorkers.push(
                new WebWorker(
                  stringToDataUri(_wrapCode((() => {}).toString(), 0, 'root').replaceAll('ErrorEvent', 'Event')),
                  {
                    credentials: 'omit',
                    name: 'THE NAME GOES HERE',
                    type: 'classic',
                  },
                ),
              ) - 1
            ] as Worker;
          }),
        ).toBeInstanceOf(VMWorkerImplementation);
      } finally {
        theWorkers.forEach((worker: Worker): void => {
          worker.terminate();
        });
      }
    });

    test('should build with default constructor', (): void => {
      const workerCtor = jest.fn();
      global.Worker = workerCtor;
      expect(new VMWorkerImplementation('THE CODE GOES HERE', 0, 'root', 'THE NAME GOES HERE')).toBeInstanceOf(
        VMWorkerImplementation,
      );
      expect(workerCtor).toHaveBeenCalledTimes(1);
      expect(Array.isArray(workerCtor.mock.calls[0])).toStrictEqual(true);
      expect((workerCtor.mock.calls[0] as Array<unknown>).length).toStrictEqual(2);
      const [url, options] = workerCtor.mock.calls[0] as Array<unknown>;
      expect(url).toMatch(/^blob:nodedata:.+$/);
      expect(options).toStrictEqual({ credentials: 'omit', name: 'THE NAME GOES HERE', type: 'classic' });
      jest.restoreAllMocks();
    });

    test('should handle killing twice', (): void => {
      const theWorkers: Worker[] = [];
      try {
        const worker: VMWorkerImplementation = new VMWorkerImplementation(
          '',
          0,
          'root',
          'THE NAME GOES HERE',
          (): Worker => {
            return theWorkers[
              theWorkers.push(
                new WebWorker(
                  stringToDataUri(_wrapCode((() => {}).toString(), 0, 'root').replaceAll('ErrorEvent', 'Event')),
                  {
                    credentials: 'omit',
                    name: 'THE NAME GOES HERE',
                    type: 'classic',
                  },
                ),
              ) - 1
            ] as Worker;
          },
        );

        expect(worker.kill().kill()).toStrictEqual(worker);
      } finally {
        theWorkers.forEach((worker: Worker): void => {
          worker.terminate();
        });
      }
    });

    test('should throw if listening after killing', (): void => {
      const theWorkers: Worker[] = [];
      try {
        const worker: VMWorkerImplementation = new VMWorkerImplementation(
          '',
          0,
          'root',
          'THE NAME GOES HERE',
          (): Worker => {
            return theWorkers[
              theWorkers.push(
                new WebWorker(
                  stringToDataUri(_wrapCode((() => {}).toString(), 0, 'root').replaceAll('ErrorEvent', 'Event')),
                  {
                    credentials: 'omit',
                    name: 'THE NAME GOES HERE',
                    type: 'classic',
                  },
                ),
              ) - 1
            ] as Worker;
          },
        );

        worker.kill();
        expect(() => {
          worker.listen(
            () => {},
            () => {},
          );
        }).toThrow(new Error('worker terminated'));
      } finally {
        theWorkers.forEach((worker: Worker): void => {
          worker.terminate();
        });
      }
    });

    test('should send error message if not a JSON shout', async (): Promise<void> => {
      const theWorkers: Worker[] = [];
      try {
        const received: Error[] = [];

        await new Promise<void>((done: () => void): void => {
          const worker: VMWorkerImplementation = new VMWorkerImplementation(
            '',
            0,
            'root',
            'THE NAME GOES HERE',
            (): Worker => {
              return theWorkers[
                theWorkers.push(
                  new WebWorker(
                    stringToDataUri(
                      _wrapCode(
                        ((
                          _tunnel: number,
                          _defaultEnclosure: string,
                          addListener: (handler: (data: object) => void) => void,
                        ) => {
                          addListener((): void => {
                            postMessage({});
                          });
                        }).toString(),
                        0,
                        'root',
                      ).replaceAll('ErrorEvent', 'Event'),
                    ),
                    {
                      credentials: 'omit',
                      name: 'THE NAME GOES HERE',
                      type: 'classic',
                    },
                  ),
                ) - 1
              ] as Worker;
            },
          );

          worker.listen(
            (data: Record<string, unknown>): void => {
              throw new Error(`unexpected ${JSON.stringify(data)}`);
            },
            (error: Error): void => {
              received.push(error);
              done();
            },
          );
          worker.shout({});
        });

        expect(received).toStrictEqual([new Error('malformed message [object Object]')]);
      } finally {
        theWorkers.forEach((worker: Worker): void => {
          worker.terminate();
        });
      }
    });

    test('should shout and listen', async (): Promise<void> => {
      const theWorkers: Worker[] = [];
      try {
        const received: Record<string, unknown>[] = [];

        await new Promise<void>((done: () => void): void => {
          const worker: VMWorkerImplementation = new VMWorkerImplementation(
            '',
            0,
            'root',
            'THE NAME GOES HERE',
            (): Worker => {
              return theWorkers[
                theWorkers.push(
                  new WebWorker(
                    stringToDataUri(
                      _wrapCode(
                        ((
                          _tunnel: number,
                          _defaultEnclosure: string,
                          addListener: (handler: (data: object) => void) => void,
                          shout: (data: object) => void,
                        ) => {
                          addListener((data: object): void => {
                            shout(data);
                          });
                        }).toString(),
                        0,
                        'root',
                      ).replaceAll('ErrorEvent', 'Event'),
                    ),
                    {
                      credentials: 'omit',
                      name: 'THE NAME GOES HERE',
                      type: 'classic',
                    },
                  ),
                ) - 1
              ] as Worker;
            },
          );

          worker.listen(
            (data: Record<string, unknown>): void => {
              received.push(data);
              done();
            },
            (_error: Error): void => {
              throw _error;
            },
          );
          worker.shout({ something: 'here' });
        });

        expect(received).toStrictEqual([{ something: 'here' }]);
      } finally {
        theWorkers.forEach((worker: Worker): void => {
          worker.terminate();
        });
      }
    });

    describe('prototype', (): void => {
      test('should be null', (): void => {
        expect(Object.getPrototypeOf(VMWorkerImplementation.prototype)).toBeNull();
      });
    });
  });
});
