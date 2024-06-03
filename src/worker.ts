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

/**
 * ...
 *
 * @packageDocumentation
 * @module
 */

/**
 * The type of a normal message handler to attach to a {@link VMWorker}.
 *
 * @param data - The data object transmitted _from_ the {@link VMWorker}.
 */
export type MessageCallback = (data: Record<string, unknown>) => void;

/**
 * The type of an error handler to attach to a {@link VMWorker}.
 *
 * @param error - The {@link !Error} being thrown _from within_ the {@link VMWorker}.
 */
export type ErrorCallback = (error: Error) => void;

/**
 * The type of a function that will construct a {@link !Worker} instance.
 *
 * @param scriptURL - The URL to retrieve the {@link !Worker} code from.
 * @param options - Any {@link !Worker} options to pass on.
 */
export type WorkerConstructor = (scriptURL: URL | string, options?: WorkerOptions) => Worker;

/**
 * An instance of an environment-agnostic worker.
 *
 */
export interface VMWorker {
  /**
   * Stop the worker instance immediately.
   *
   * @returns `this`, for chaining.
   */
  kill(): this;

  /**
   * Set the given callbacks as handlers for message / error.
   *
   * @param messageCallback - Callback to use for message handling.
   * @param errorCallback - Callback to use for message errors.
   * @returns `this`, for chaining.
   */
  listen(messageCallback: MessageCallback, errorCallback: ErrorCallback): this;

  /**
   * Send the given data to the {@link VMWorker}.
   *
   * > [!warning]
   * > The given `data` object **MUST** be serializable via `JSON.serialize`.
   *
   * @param data - object to send to the {@link VMWorker}.
   * @returns `this`, for chaining.
   */
  shout(data: object): this;
}

/**
 * An wrapper for a {@link !Worker}.
 *
 */
export class VMWorkerImplementation implements VMWorker {
  /**
   * A [`blob:`-URL](https://en.wikipedia.org/wiki/Blob_URI_scheme) containing the worker code (or `null` if killed).
   *
   */
  #blobURL?: string | undefined;

  /**
   * The {@link !Worker} instance (or `null` if killed).
   *
   */
  #worker?: Worker | undefined;

  /**
   * Construct a new {@link VMWorkerImplementation} with the given parameters.
   *
   * @param code - The code the {@link !Worker} will, eventually, run.
   * @param tunnel - Tunnel id tell the {@link !Worker} to announce boot-up on.
   * @param name - The name to give to the {@link !Worker}.
   * @param workerCtor - The {@link Worker} constructor to use in order to build the worker instance (will default to one constructing a {@link !Worker} if not given).
   */
  constructor(
    code: string,
    tunnel: number,
    name: string,
    workerCtor?: (scriptURL: URL | string, options?: WorkerOptions) => Worker,
  ) {
    this.#blobURL = URL.createObjectURL(
      new Blob(
        [
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
  ${tunnel.toString()},
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
);`,
        ],
        {
          type: 'application/javascript',
        },
      ),
    );

    this.#worker = (
      workerCtor ?? ((scriptURL: URL | string, options?: WorkerOptions): Worker => new Worker(scriptURL, options))
    )(this.#blobURL, {
      credentials: 'omit',
      name,
      type: 'classic',
    });
  }

  /**
   * Stop the worker instance immediately.
   *
   * @returns `this`, for chaining.
   */
  kill(): this {
    this.#worker?.terminate();
    if (undefined !== this.#blobURL) {
      URL.revokeObjectURL(this.#blobURL);
    }
    this.#worker = undefined;
    this.#blobURL = undefined;
    return this;
  }

  /**
   * Set the given callbacks as handlers for message / error.
   *
   * @param messageCallback - Callback to use for message handling.
   * @param errorCallback - Callback to use for message errors.
   * @returns `this`, for chaining.
   */
  listen(messageCallback: MessageCallback, errorCallback: ErrorCallback): this {
    if (undefined === this.#worker) {
      throw new Error('worker terminated');
    }
    this.#worker.addEventListener('message', ({ data }: MessageEvent<string>): void => {
      let parsedData: Record<string, unknown>;
      try {
        parsedData = JSON.parse(data) as Record<string, unknown>;
      } catch {
        errorCallback(new Error(`malformed message ${data}`));
        return;
      }
      messageCallback(parsedData);
    });
    this.#worker.addEventListener(
      'error',
      /* istanbul ignore next */ // TODO: find a way to test this
      (event: ErrorEvent): void => {
        event.preventDefault();
        errorCallback(new Error(event.type));
      },
    );
    this.#worker.addEventListener(
      'messageerror',
      /* istanbul ignore next */ // TODO: find a way to test this
      (message: MessageEvent<unknown>): void => {
        errorCallback(new Error('string' === typeof message.data ? message.data : 'unknown error'));
      },
    );
    return this;
  }

  /**
   * Send the given data to the {@link VMWorkerImplementation}.
   *
   * > [!warning]
   * > The given `data` object **MUST** be serializable via `JSON.serialize`.
   *
   * @param data - object to send to the {@link VMWorkerImplementation}.
   * @returns `this`, for chaining.
   */
  shout(data: object): this {
    this.#worker?.postMessage(JSON.stringify(data));
    return this;
  }

  static {
    // ref: https://stackoverflow.com/a/77741904
    Object.setPrototypeOf(this.prototype, null);
  }
}
