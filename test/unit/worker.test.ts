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

import WebWorker from 'web-worker';

import { VMWorkerImplementation } from '../../src/worker';
import { blobUriToText, stringToDataUri } from '../helpers';

describe('worker', (): void => {
  describe('VMWorkerImplementation', (): void => {
    const wrapCode: (code: string) => string = (code: string): string =>
      `"use strict";
addEventListener("unhandledrejection", (event) => {
  event.preventDefault();
  event.type = "error";
  dispatchEvent(event);
});
addEventListener("rejectionhandled", (event) => {
  event.preventDefault();
  event.type = "error";
  dispatchEvent(event);
});
(${code})(
  this,
  0,
  ((_addEventListener, _JSON_parse, _Event, _dispatchEvent) =>
    (listener) => {
      _addEventListener('message', ({ data }) => {
        try {
          listener(_JSON_parse(data));
        } catch (e) {
          const event = new _Event("error");
          event.reason = "string" === typeof e.message ? e.message : "unknown error";
          _dispatchEvent(event);
        }
      })
    }
  )(addEventListener, JSON.parse, Event, dispatchEvent),
  ((_postMessage, _JSON_stringify, _Event, _dispatchEvent) =>
    (message) => {
      try {
        _postMessage(_JSON_stringify(message));
      } catch (e) {
        const event = new _Event("error");
        event.reason = "string" === typeof e.message ? e.message : "unknown error";
        _dispatchEvent(event);
      }
    }
  )(postMessage, JSON.stringify, Event, dispatchEvent),
  ((_setTimeout, _Event, _dispatchEvent) =>
    (callback) => {
      _setTimeout(() => {
        try {
          callback();
        } catch (e) {
          const event = new _Event("error");
          event.reason = "string" === typeof e.message ? e.message : "unknown error";
          _dispatchEvent(event);
        }
      }, 0);
    }
  )(setTimeout, Event, dispatchEvent),
);`;

    test('should build a VMWorkerImplementation', async (): Promise<void> => {
      const workerCtor = jest.fn();

      expect(new VMWorkerImplementation('THE CODE GOES HERE', 0, 'THE NAME GOES HERE', workerCtor)).toBeInstanceOf(
        VMWorkerImplementation,
      );

      const [scriptUrl, options]: [URL | string, WorkerOptions | undefined] = workerCtor.mock.calls[0] as [
        URL | string,
        WorkerOptions | undefined,
      ];

      expect(await blobUriToText(scriptUrl)).toStrictEqual(wrapCode('THE CODE GOES HERE'));

      expect(options).toStrictEqual({ credentials: 'omit', name: 'THE NAME GOES HERE', type: 'classic' });
    });

    test('should build correctly', (): void => {
      const theWorkers: Worker[] = [];
      try {
        expect(
          new VMWorkerImplementation('', 0, 'THE NAME GOES HERE', (): Worker => {
            return theWorkers[
              theWorkers.push(
                new WebWorker(stringToDataUri(wrapCode((() => {}).toString())), {
                  credentials: 'omit',
                  name: 'THE NAME GOES HERE',
                  type: 'classic',
                }),
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
      const workerCtor = jest.fn()
      global.Worker = workerCtor;
      expect(new VMWorkerImplementation('THE CODE GOES HERE', 0, 'THE NAME')).toBeInstanceOf(VMWorkerImplementation);
      expect(workerCtor).toHaveBeenCalled();
      jest.restoreAllMocks();
    });

    test('should handle killing twice', (): void => {
      const theWorkers: Worker[] = [];
      try {
        const worker: VMWorkerImplementation = new VMWorkerImplementation('', 0, 'THE NAME GOES HERE', (): Worker => {
          return theWorkers[
            theWorkers.push(
              new WebWorker(stringToDataUri(wrapCode((() => {}).toString())), {
                credentials: 'omit',
                name: 'THE NAME GOES HERE',
                type: 'classic',
              }),
            ) - 1
          ] as Worker;
        });

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
        const worker: VMWorkerImplementation = new VMWorkerImplementation('', 0, 'THE NAME GOES HERE', (): Worker => {
          return theWorkers[
            theWorkers.push(
              new WebWorker(stringToDataUri(wrapCode((() => {}).toString())), {
                credentials: 'omit',
                name: 'THE NAME GOES HERE',
                type: 'classic',
              }),
            ) - 1
          ] as Worker;
        });

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

    test('should shout, listen, and schedule', async (): Promise<void> => {
      const theWorkers: Worker[] = [];
      try {
        const received: string[] = [];

        await new Promise<void>((done: () => void): void => {
          const worker: VMWorkerImplementation = new VMWorkerImplementation('', 0, 'THE NAME GOES HERE', (): Worker => {
            return theWorkers[
              theWorkers.push(
                new WebWorker(
                  stringToDataUri(
                    wrapCode(
                      ((
                        _this: unknown,
                        _tunnel: number,
                        addListener: (handler: (data: object) => void) => void,
                        shout: (data: object) => void,
                        schedule: (callback: () => void) => void,
                      ) => {
                        addListener((data: object): void => {
                          schedule(() => shout(data));
                        });
                      }).toString(),
                    ),
                  ),
                  {
                    credentials: 'omit',
                    name: 'THE NAME GOES HERE',
                    type: 'classic',
                  },
                ),
              ) - 1
            ] as Worker;
          });

          worker.listen(
            (data: string): void => {
              received.push(data);
              done();
            },
            (_error: Error): void => {},
          );
          worker.shout({ something: 'here' });
        });

        expect(received).toStrictEqual(['{"something":"here"}']);
      } finally {
        theWorkers.forEach((worker: Worker): void => {
          worker.terminate();
        });
      }
    });
  });
});
